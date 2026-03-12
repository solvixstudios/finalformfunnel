/**
 * Subscription Service
 * Firestore CRUD for subscriptions and subscription requests.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { getPlanById } from '@/data/plans';
import type {
  Subscription,
  SubscriptionRequest,
  SubscriptionStatus,
  BillingCycle,
  PaymentMethod,
  PaymentProof,
} from '@/types/subscription';

// ── Helpers ─────────────────────────────────────────────────────

function nowISO(): string {
  return new Date().toISOString();
}

function isExpired(endDate: string | null): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

// ── User-Side Functions ─────────────────────────────────────────

/**
 * Get the user's current active (or pending) subscription.
 * Returns null if no subscription exists (user is on Free plan).
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const subsRef = collection(db, 'users', userId, 'subscriptions');
  // Query for active or pending subscriptions, ordered by creation date
  const q = query(
    subsRef,
    where('status', 'in', ['active', 'pending'])
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  // Sort locally to avoid needing a Firestore composite index
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subscription));
  docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return docs[0];
}

/**
 * Check if a subscription is expired and update its status lazily.
 * Returns the updated subscription status.
 */
export async function checkAndExpireSubscription(
  userId: string,
  sub: Subscription
): Promise<Subscription> {
  if (sub.status === 'active' && sub.endDate && isExpired(sub.endDate)) {
    const subRef = doc(db, 'users', userId, 'subscriptions', sub.id);
    await updateDoc(subRef, {
      status: 'expired' as SubscriptionStatus,
      updatedAt: nowISO(),
    });
    return { ...sub, status: 'expired' };
  }
  return sub;
}

/**
 * Submit a plan activation request. Creates both a subscription_request
 * and a pending subscription document.
 */
export async function submitPlanRequest(
  userId: string,
  userEmail: string,
  userDisplayName: string,
  planId: string,
  billingCycle: BillingCycle,
  currency: 'USD' | 'DZD',
  paymentMethod?: PaymentMethod,
  paymentProof?: PaymentProof
): Promise<{ requestId: string; subscriptionId: string }> {
  const plan = getPlanById(planId);
  const price = currency === 'USD' ? plan.price.usd : plan.price.dzd;
  const amount = billingCycle === 'monthly' ? price.monthly : price.annual;
  const now = nowISO();

  // Create the pending subscription under the user's subcollection
  const subRef = doc(collection(db, 'users', userId, 'subscriptions'));
  const subscriptionData: Omit<Subscription, 'id'> = {
    userId,
    planId,
    status: 'pending',
    billingCycle,
    startDate: null,
    endDate: null,
    amountPaid: null,
    currency,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(subRef, subscriptionData);

  // Create the request in the root collection for admin to query
  const requestData: Omit<SubscriptionRequest, 'id'> = {
    userId,
    userEmail,
    userDisplayName,
    planId,
    billingCycle,
    requestedAmount: amount,
    currency,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    subscriptionId: subRef.id,
    ...(paymentMethod && { paymentMethod }),
    ...(paymentProof && { paymentProof }),
  };
  const requestRef = await addDoc(collection(db, 'subscription_requests'), requestData);

  return { requestId: requestRef.id, subscriptionId: subRef.id };
}

/**
 * Get the user's subscription history (all subscriptions).
 */
export async function getUserSubscriptionHistory(userId: string): Promise<Subscription[]> {
  const subsRef = collection(db, 'users', userId, 'subscriptions');
  const q = query(subsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription));
}

/**
 * Get the user's pending request (if any).
 */
export async function getUserPendingRequest(userId: string): Promise<SubscriptionRequest | null> {
  const reqRef = collection(db, 'subscription_requests');
  const q = query(
    reqRef,
    where('userId', '==', userId),
    where('status', '==', 'pending')
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  // Sort locally to avoid needing a Firestore composite index
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionRequest));
  docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return docs[0];
}

/**
 * Cancel subscription (user-initiated).
 * Sets status to cancelled with metadata.
 */
export async function cancelSubscription(
  userId: string,
  subscriptionId: string,
  reason?: string
): Promise<void> {
  const now = nowISO();
  const subRef = doc(db, 'users', userId, 'subscriptions', subscriptionId);
  await updateDoc(subRef, {
    status: 'cancelled' as SubscriptionStatus,
    cancelledAt: now,
    cancelledBy: 'user',
    ...(reason && { cancelReason: reason }),
    updatedAt: now,
  });
}

/**
 * Cancel subscription (admin-initiated).
 */
export async function adminCancelSubscription(
  userId: string,
  subscriptionId: string,
  adminEmail: string,
  reason?: string
): Promise<void> {
  const now = nowISO();
  const subRef = doc(db, 'users', userId, 'subscriptions', subscriptionId);
  await updateDoc(subRef, {
    status: 'cancelled' as SubscriptionStatus,
    cancelledAt: now,
    cancelledBy: adminEmail,
    ...(reason && { cancelReason: reason }),
    updatedAt: now,
  });
}

// ── Admin-Side Functions ────────────────────────────────────────

/**
 * Get all subscription requests (for admin dashboard).
 * Optionally filter by status.
 */
export async function getAllRequests(
  statusFilter?: 'pending' | 'approved' | 'rejected'
): Promise<SubscriptionRequest[]> {
  const reqRef = collection(db, 'subscription_requests');
  let q;
  if (statusFilter) {
    q = query(reqRef, where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
  } else {
    q = query(reqRef, orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => {
    const data = d.data() as Omit<SubscriptionRequest, 'id'>;
    return { id: d.id, ...data } as SubscriptionRequest;
  });
}

/**
 * Approve a subscription request.
 * Updates both the request and the user's subscription.
 */
export async function approveRequest(
  request: SubscriptionRequest,
  adminEmail: string,
  overrides?: {
    endDate?: string;
    featureOverrides?: Record<string, any>;
    orderLimitOverride?: number;
    adminNotes?: string;
  }
): Promise<void> {
  const now = nowISO();
  const billingMonths = request.billingCycle === 'annual' ? 12 : 1;

  // Calculate dates
  const startDate = now;
  const endDateObj = new Date();
  endDateObj.setMonth(endDateObj.getMonth() + billingMonths);
  const endDate = overrides?.endDate || endDateObj.toISOString();

  // Update the subscription document
  const subRef = doc(db, 'users', request.userId, 'subscriptions', request.subscriptionId!);
  await updateDoc(subRef, {
    status: 'active' as SubscriptionStatus,
    startDate,
    endDate,
    amountPaid: request.requestedAmount,
    updatedAt: now,
    ...(overrides?.featureOverrides && { featureOverrides: overrides.featureOverrides }),
    ...(overrides?.orderLimitOverride && { orderLimitOverride: overrides.orderLimitOverride }),
    ...(overrides?.adminNotes && { adminNotes: overrides.adminNotes }),
  });

  // Update the request document
  const reqRef = doc(db, 'subscription_requests', request.id);
  await updateDoc(reqRef, {
    status: 'approved',
    reviewedAt: now,
    reviewedBy: adminEmail,
    updatedAt: now,
    ...(overrides?.adminNotes && { adminNotes: overrides.adminNotes }),
  });
}

/**
 * Reject a subscription request.
 */
export async function rejectRequest(
  request: SubscriptionRequest,
  adminEmail: string,
  reason?: string
): Promise<void> {
  const now = nowISO();

  // Update the subscription to cancelled
  if (request.subscriptionId) {
    const subRef = doc(db, 'users', request.userId, 'subscriptions', request.subscriptionId);
    await updateDoc(subRef, {
      status: 'cancelled' as SubscriptionStatus,
      updatedAt: now,
    });
  }

  // Update the request
  const reqRef = doc(db, 'subscription_requests', request.id);
  await updateDoc(reqRef, {
    status: 'rejected',
    reviewedAt: now,
    reviewedBy: adminEmail,
    updatedAt: now,
    ...(reason && { adminNotes: reason }),
  });
}

/**
 * Count the user's orders for the current month.
 * Used for plan limit enforcement.
 */
export async function countOrdersThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const ordersRef = collection(db, 'users', userId, 'orders');
  const q = query(
    ordersRef,
    where('createdAt', '>=', startOfMonth.toISOString()),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

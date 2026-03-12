/**
 * Subscription Service (Server-Side)
 * Handles plan limit checks using Firebase Admin SDK.
 */

import { db } from '../config/firebase';

// Plan definitions (mirrored from client-side for server enforcement)
const PLAN_ORDER_LIMITS: Record<string, number> = {
  free: 30,
  starter: 300,
  pro: 750,
  business: 3000,
  enterprise: -1, // unlimited
};

interface SubscriptionDoc {
  planId: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  orderLimitOverride?: number;
}

/**
 * Get the user's active subscription.
 * Returns null if no active subscription (user is on free plan).
 * Also performs lazy expiry check.
 */
export async function getActiveSubscription(userId: string): Promise<SubscriptionDoc | null> {
  const subsRef = db.collection('users').doc(userId).collection('subscriptions');
  const snapshot = await subsRef
    .where('status', 'in', ['active', 'pending'])
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data() as SubscriptionDoc;

  // Lazy expiry check
  if (data.status === 'active' && data.endDate && new Date(data.endDate) < new Date()) {
    await doc.ref.update({
      status: 'expired',
      updatedAt: new Date().toISOString(),
    });
    return null; // Expired, treat as free
  }

  return data;
}

/**
 * Count the user's orders for the current month.
 */
export async function countOrdersThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const ordersRef = db.collection('users').doc(userId).collection('orders');
  const snapshot = await ordersRef
    .where('createdAt', '>=', startOfMonth.toISOString())
    .get();

  return snapshot.size;
}

/**
 * Check if the user can create a new order based on their plan limits.
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export async function checkOrderLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const subscription = await getActiveSubscription(userId);
    const planId = subscription?.status === 'active' ? subscription.planId : 'free';
    const baseLimit = PLAN_ORDER_LIMITS[planId] ?? 30;
    const effectiveLimit = subscription?.orderLimitOverride || baseLimit;

    // Unlimited
    if (effectiveLimit === -1) {
      return { allowed: true };
    }

    const currentCount = await countOrdersThisMonth(userId);

    if (currentCount >= effectiveLimit) {
      return {
        allowed: false,
        reason: `Monthly order limit reached (${currentCount}/${effectiveLimit}). Please upgrade your plan to continue creating orders.`,
      };
    }

    return { allowed: true };
  } catch (error) {
    // On error, allow the order (fail-open for better UX)
    console.error('Failed to check order limit:', error);
    return { allowed: true };
  }
}

/**
 * useSubscription Hook
 * Provides the user's active plan, subscription status, and limit enforcement helpers.
 * Performs lazy expiry check on mount.
 */

import { useCallback, useEffect, useState } from 'react';
import { getPlanById, PRICING_PLANS } from '@/data/plans';
import {
  getActiveSubscription,
  checkAndExpireSubscription,
  submitPlanRequest as submitPlanRequestService,
  getUserSubscriptionHistory,
  getUserPendingRequest,
  countOrdersThisMonth,
  cancelSubscription as cancelSubscriptionService,
} from '@/lib/subscriptionService';
import type {
  Subscription,
  SubscriptionRequest,
  PricingPlan,
  BillingCycle,
  PaymentMethod,
  PaymentProof,
} from '@/types/subscription';

interface UseSubscriptionReturn {
  /** The resolved plan object. Defaults to Free if no active subscription. */
  currentPlan: PricingPlan;
  /** Raw subscription document (null if on free plan) */
  subscription: Subscription | null;
  /** Pending request if any */
  pendingRequest: SubscriptionRequest | null;
  /** Transaction history */
  history: Subscription[];
  /** Loading state */
  isLoading: boolean;
  /** Orders used this month */
  ordersThisMonth: number;
  /** Check if user can create a new funnel */
  canCreateFunnel: (currentCount: number) => boolean;
  /** Check if user can add a meta pixel */
  canAddMetaPixel: (currentCount: number) => boolean;
  /** Check if user can add a tiktok pixel */
  canAddTiktokPixel: (currentCount: number) => boolean;
  /** Check if user can add a google sheet */
  canAddGoogleSheet: (currentCount: number) => boolean;
  /** Check if user can add a store */
  canAddStore: (currentCount: number) => boolean;
  /** Check if user has orders remaining this month */
  hasOrdersRemaining: () => boolean;
  /** Whether branding is removed */
  isBrandingRemoved: boolean;
  /** Submit a plan activation request */
  submitPlanRequest: (
    planId: string,
    billingCycle: BillingCycle,
    currency: 'USD' | 'DZD',
    paymentMethod?: PaymentMethod,
    paymentProof?: PaymentProof
  ) => Promise<void>;
  /** Cancel active subscription */
  cancelSubscription: (reason?: string) => Promise<void>;
  /** Refresh subscription data */
  refresh: () => Promise<void>;
}

export function useSubscription(
  userId: string,
  userEmail: string,
  userDisplayName: string
): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [pendingRequest, setPendingRequest] = useState<SubscriptionRequest | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ordersThisMonth, setOrdersThisMonth] = useState(0);

  const freePlan = PRICING_PLANS[0]; // Always the first plan

  const currentPlan: PricingPlan =
    subscription && subscription.status === 'active'
      ? getPlanById(subscription.planId)
      : freePlan;

  // Resolve feature limits (accounting for admin overrides)
  const getEffectiveLimit = useCallback(
    (featureKey: keyof PricingPlan['features']): number | boolean => {
      const baseValue = currentPlan.features[featureKey];
      if (subscription?.featureOverrides && featureKey in subscription.featureOverrides) {
        return subscription.featureOverrides[featureKey as keyof typeof subscription.featureOverrides] as number | boolean;
      }
      return baseValue;
    },
    [currentPlan, subscription]
  );

  const getEffectiveOrderLimit = useCallback((): number => {
    if (subscription?.orderLimitOverride) return subscription.orderLimitOverride;
    return currentPlan.monthlyOrders;
  }, [currentPlan, subscription]);

  // Limit check helpers
  const canCreateFunnel = useCallback(
    (currentCount: number) => {
      const limit = getEffectiveLimit('activeFunnels') as number;
      return limit === -1 || currentCount < limit;
    },
    [getEffectiveLimit]
  );

  const canAddMetaPixel = useCallback(
    (currentCount: number) => {
      const limit = getEffectiveLimit('metaPixels') as number;
      return limit === -1 || currentCount < limit;
    },
    [getEffectiveLimit]
  );

  const canAddTiktokPixel = useCallback(
    (currentCount: number) => {
      const limit = getEffectiveLimit('tiktokPixels') as number;
      return limit === -1 || currentCount < limit;
    },
    [getEffectiveLimit]
  );

  const canAddGoogleSheet = useCallback(
    (currentCount: number) => {
      const limit = getEffectiveLimit('googleSheets') as number;
      return limit === -1 || currentCount < limit;
    },
    [getEffectiveLimit]
  );

  const canAddStore = useCallback(
    (currentCount: number) => {
      const limit = getEffectiveLimit('storeConnections') as number;
      return limit === -1 || currentCount < limit;
    },
    [getEffectiveLimit]
  );

  const hasOrdersRemaining = useCallback(() => {
    const limit = getEffectiveOrderLimit();
    return limit === -1 || ordersThisMonth < limit;
  }, [getEffectiveOrderLimit, ordersThisMonth]);

  const isBrandingRemoved = (getEffectiveLimit('brandingRemoved') as boolean) || false;

  // Fetch all subscription data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch active subscription
      let activeSub = await getActiveSubscription(userId);

      // Lazy expiry check
      if (activeSub && activeSub.status === 'active') {
        activeSub = await checkAndExpireSubscription(userId, activeSub);
      }

      setSubscription(activeSub);

      // Fetch pending request
      const pending = await getUserPendingRequest(userId);
      setPendingRequest(pending);

      // Fetch history
      const hist = await getUserSubscriptionHistory(userId);
      setHistory(hist);

      // Count orders this month
      const orderCount = await countOrdersThisMonth(userId);
      setOrdersThisMonth(orderCount);
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Submit plan request
  const submitPlanRequest = useCallback(
    async (
      planId: string,
      billingCycle: BillingCycle,
      currency: 'USD' | 'DZD',
      paymentMethod?: PaymentMethod,
      paymentProof?: PaymentProof
    ) => {
      await submitPlanRequestService(
        userId,
        userEmail,
        userDisplayName,
        planId,
        billingCycle,
        currency,
        paymentMethod,
        paymentProof
      );
      // Refresh to pick up the new pending state
      await refresh();
    },
    [userId, userEmail, userDisplayName, refresh]
  );

  // Cancel subscription
  const cancelSubscription = useCallback(
    async (reason?: string) => {
      if (!subscription) throw new Error('No active subscription to cancel');
      await cancelSubscriptionService(userId, subscription.id, reason);
      await refresh();
    },
    [userId, subscription, refresh]
  );

  return {
    currentPlan,
    subscription,
    pendingRequest,
    history,
    isLoading,
    ordersThisMonth,
    canCreateFunnel,
    canAddMetaPixel,
    canAddTiktokPixel,
    canAddGoogleSheet,
    canAddStore,
    hasOrdersRemaining,
    isBrandingRemoved,
    submitPlanRequest,
    cancelSubscription,
    refresh,
  };
}

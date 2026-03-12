/**
 * Pricing Plan Definitions
 * Hardcoded defaults — used as fallback when Firestore plans aren't loaded yet.
 * The usePlans() hook loads plans from Firestore first, falls back to these.
 * -1 means unlimited.
 */

import type { PricingPlan } from '@/types/subscription';

export const DEFAULT_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyOrders: 30,
    price: {
      usd: { monthly: 0, annual: 0 },
      dzd: { monthly: 0, annual: 0 },
    },
    features: {
      activeFunnels: 1,
      metaPixels: 1,
      tiktokPixels: 1,
      googleSheets: 1,
      storeConnections: 1,
      brandingRemoved: false,
      integrationSupport: false,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyOrders: 300,
    price: {
      usd: { monthly: 14, annual: 10 },
      dzd: { monthly: 3600, annual: 2600 },
    },
    features: {
      activeFunnels: 3,
      metaPixels: 2,
      tiktokPixels: 2,
      googleSheets: 2,
      storeConnections: 3,
      brandingRemoved: true,
      integrationSupport: true,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyOrders: 750,
    price: {
      usd: { monthly: 24, annual: 19 },
      dzd: { monthly: 6200, annual: 4900 },
    },
    features: {
      activeFunnels: 10,
      metaPixels: 5,
      tiktokPixels: 5,
      googleSheets: 3,
      storeConnections: 5,
      brandingRemoved: true,
      integrationSupport: true,
    },
  },
  {
    id: 'business',
    name: 'Business',
    monthlyOrders: 3000,
    price: {
      usd: { monthly: 39, annual: 29 },
      dzd: { monthly: 10000, annual: 7500 },
    },
    features: {
      activeFunnels: 50,
      metaPixels: 10,
      tiktokPixels: 10,
      googleSheets: 10,
      storeConnections: 10,
      brandingRemoved: true,
      integrationSupport: true,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyOrders: -1, // Unlimited
    price: {
      usd: { monthly: 79, annual: 59 },
      dzd: { monthly: 20000, annual: 15000 },
    },
    features: {
      activeFunnels: -1,
      metaPixels: -1,
      tiktokPixels: -1,
      googleSheets: -1,
      storeConnections: -1,
      brandingRemoved: true,
      integrationSupport: true,
    },
  },
];

/**
 * @deprecated Use DEFAULT_PLANS instead. Kept for backward compatibility.
 */
export const PRICING_PLANS = DEFAULT_PLANS;

/** Get a plan by its ID, defaults to 'free' if not found */
export function getPlanById(planId: string, plans: PricingPlan[] = DEFAULT_PLANS): PricingPlan {
  return plans.find((p) => p.id === planId) || plans[0];
}

/** The admin email that has access to the admin dashboard */
export const ADMIN_EMAIL = 'solvixalgerie@gmail.com';

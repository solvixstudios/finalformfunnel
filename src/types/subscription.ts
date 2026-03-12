/**
 * Subscription & Pricing Types
 */

// ── Plan Definitions ────────────────────────────────────────────

export interface PlanPricing {
  monthly: number;
  annual: number;
}

export interface PlanFeatures {
  activeFunnels: number;   // -1 = unlimited
  metaPixels: number;
  tiktokPixels: number;
  googleSheets: number;
  storeConnections: number;
  brandingRemoved: boolean;
  integrationSupport: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  monthlyOrders: number;  // -1 = unlimited
  price: {
    usd: PlanPricing;
    dzd: PlanPricing;
  };
  features: PlanFeatures;
}

// ── Subscription ────────────────────────────────────────────────

export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';
export type BillingCycle = 'monthly' | 'annual';
export type PaymentMethod = 'ccp' | 'baridi_pay' | 'redotpay' | 'usdt' | 'whatsapp';

export interface PaymentProof {
  transactionId?: string;
  screenshotUrl?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  startDate: string | null;       // ISO string, null if pending
  endDate: string | null;         // ISO string, null if pending
  amountPaid: number | null;
  currency: 'USD' | 'DZD';
  createdAt: string;              // ISO string
  updatedAt: string;              // ISO string
  /** Optional admin-overridden features */
  featureOverrides?: Partial<PlanFeatures>;
  /** Optional admin-overridden monthly order limit */
  orderLimitOverride?: number;
  /** Admin notes */
  adminNotes?: string;
  /** Cancellation metadata */
  cancelledAt?: string;
  cancelledBy?: string;           // 'user' | admin email
  cancelReason?: string;
}

// ── Subscription Request ────────────────────────────────────────

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface SubscriptionRequest {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  planId: string;
  billingCycle: BillingCycle;
  requestedAmount: number;
  currency: 'USD' | 'DZD';
  status: RequestStatus;
  paymentMethod?: PaymentMethod;
  paymentProof?: PaymentProof;
  createdAt: string;             // ISO string
  updatedAt: string;             // ISO string
  /** Set when admin approves/rejects */
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes?: string;
  /** Reference to the subscription doc created upon approval */
  subscriptionId?: string;
}

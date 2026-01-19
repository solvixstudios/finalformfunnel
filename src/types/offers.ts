/**
 * Offer and Promo Code Types
 */

import type { TranslationMap } from "./form";

// Discount types
export type DiscountType = "perc" | "fixed";

// Offer configuration
export interface Offer {
  id: string;
  qty: number;
  discount: number;
  _type: DiscountType;
  _idManuallyEdited?: boolean;
  title: TranslationMap;
  desc: TranslationMap;
}

// Promo code types
export type PromoApplyTo = "subtotal" | "shipping" | "total";
export type PromoDiscountMode = "free" | "percentage" | "fixed";
export type PromoLimitType = "unlimited" | "date_range" | "use_count";

export interface PromoCode {
  id: string;
  code: string;
  applyTo: PromoApplyTo;
  discountMode: PromoDiscountMode;
  discountValue: number;
  limitType: PromoLimitType;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  currentUses?: number;
  isActive: boolean;
}

// Applied promo code (subset for runtime use)
export interface AppliedPromoCode {
  code: string;
  applyTo: PromoApplyTo;
  discountMode: PromoDiscountMode;
  discountValue: number;
}

// Promo code section configuration
export interface PromoCodeConfig {
  enabled: boolean;
  required: boolean;
  placeholder: TranslationMap;
  buttonText: TranslationMap;
  successText: TranslationMap;
  errorText: TranslationMap;
  codes: PromoCode[];
}

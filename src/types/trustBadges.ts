/**
 * Trust Badge Types
 */

import type { TranslationMap } from "./form";

// Trust badge style
export type TrustBadgeStyle = "cards" | "pills" | "minimal" | "banner";

// Individual badge configuration
export interface TrustBadgeItem {
  enabled: boolean;
  label: TranslationMap;
  customText: TranslationMap;
}

// All trust badges configuration
export interface TrustBadgesConfig {
  cod: TrustBadgeItem;
  guarantee: TrustBadgeItem;
  return: TrustBadgeItem;
  support: TrustBadgeItem;
  fastDelivery: TrustBadgeItem;
}

// Badge types
export type TrustBadgeType = keyof TrustBadgesConfig;

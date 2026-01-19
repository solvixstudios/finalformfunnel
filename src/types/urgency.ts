/**
 * Urgency Section Types
 */

import type { TranslationMap } from "./form";

// Urgency text styles
export type UrgencyTextStyle = "banner" | "pill" | "glow" | "minimal";

// Urgency quantity styles
export type UrgencyQuantityStyle = "progress" | "counter" | "badge" | "flame";

// Urgency timer styles
export type UrgencyTimerStyle = "digital" | "flip" | "minimal" | "bar";

// Color presets
export type UrgencyColorPreset =
  | "red"
  | "amber"
  | "indigo"
  | "emerald"
  | "violet"
  | "dynamic"
  | "custom";

// Urgency text configuration
export interface UrgencyTextConfig {
  enabled: boolean;
  style: UrgencyTextStyle;
  colorPreset: UrgencyColorPreset;
  customColor: string;
  text: TranslationMap;
}

// Urgency quantity (stock counter) configuration
export interface UrgencyQuantityConfig {
  enabled: boolean;
  style: UrgencyQuantityStyle;
  colorPreset: UrgencyColorPreset;
  customColor: string;
  stockCount: number;
  showIcon: boolean;
  animate: boolean;
  customText: TranslationMap;
}

// Urgency timer (countdown) configuration
export interface UrgencyTimerConfig {
  enabled: boolean;
  style: UrgencyTimerStyle;
  colorPreset: UrgencyColorPreset;
  customColor: string;
  hours: number;
  minutes: number;
  seconds: number;
  showLabel: boolean;
  customText: TranslationMap;
}

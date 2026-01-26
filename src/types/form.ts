/**
 * Form Configuration Types
 * Central type definitions for form builder configuration
 */

// Language types
export type Language = "fr" | "ar";

export interface TranslationMap {
  fr: string;
  ar: string;
}

// Header configuration
export type HeaderStyle =
  | "classic"
  | "centered"
  | "minimal"
  | "banner"
  | "compact"
  | "hidden";

export interface HeaderConfig {
  enabled: boolean;
  style: HeaderStyle;
  showLanguageSwitcher: boolean;
  defaultLanguage: Language;
  showProductImage: boolean;
  showProductPrice: boolean;
}

// Input/Field configuration
export type LocationInputMode = "double_dropdown" | "single_dropdown" | "free_text";
export type LocationLayout = "sideBySide" | "stacked";
export type InputVariant = "filled" | "outlined";
export type VariantStyle = "buttons" | "cards" | "pills" | "dropdown";

export interface FieldConfig {
  visible: boolean;
  required: boolean;
  order: number;
  placeholder: TranslationMap;
}

export interface FieldsConfig {
  name: FieldConfig;
  phone: FieldConfig;
  wilaya: FieldConfig;
  commune: FieldConfig;
  address: FieldConfig;
  note: FieldConfig;
  [key: string]: FieldConfig;
}

// Stickers/Badges
export interface StickerConfig {
  enabled: boolean;
  text: TranslationMap;
  color: string;
  textColor?: string;
}

export interface StickersConfig {
  product: StickerConfig;
  shipping: StickerConfig;
}

// Section settings
export interface SectionSetting {
  showTitle: boolean;
}

export interface SectionSettingsConfig {
  variants: SectionSetting;
  shipping: SectionSetting;
  delivery: SectionSetting;
  offers: SectionSetting;
  promoCode: SectionSetting;
  summary: SectionSetting;
  cta: SectionSetting;
  urgencyText: SectionSetting;
  urgencyQuantity: SectionSetting;
  urgencyTimer: SectionSetting;
  trustBadges: SectionSetting;
}

// Font configuration
export interface FontFamilyConfig {
  fr: string;
  ar: string;
}

// CTA configuration
export type CtaVariant = "solid" | "outline" | "gradient" | "ghost";
export type CtaAnimation =
  | "shake"
  | "pulse"
  | "bounce"
  | "glow"
  | "slide"
  | "scale"
  | "float"
  | "spin"
  | "none";
export type CtaStickyVariant = "simple" | "product" | "compact" | "card" | "badge";

// Thank You popup configuration
export interface ThankYouConfig {
  title: TranslationMap;
  message: TranslationMap;
  button: TranslationMap;
  summaryButton: TranslationMap;
  whatsappButton: TranslationMap;
}

// Section ordering
export type SectionId =
  | "variants"
  | "shipping"
  | "delivery"
  | "offers"
  | "promoCode"
  | "summary"
  | "cta"
  | "urgencyText"
  | "urgencyQuantity"
  | "urgencyTimer"
  | "trustBadges";

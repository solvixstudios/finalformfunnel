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
export type InputVariant = "filled" | "outline";
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
  variants?: SectionSetting;
  shipping?: SectionSetting;
  delivery?: SectionSetting;
  offers?: SectionSetting;
  promoCode?: SectionSetting;
  summary?: SectionSetting;
  cta?: SectionSetting;
  urgencyText?: SectionSetting;
  urgencyQuantity?: SectionSetting;
  urgencyTimer?: SectionSetting;
  trustBadges?: SectionSetting;
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
  title?: TranslationMap;
  message?: TranslationMap;
  button?: TranslationMap;
  summaryButton?: TranslationMap;
  whatsappButton?: TranslationMap;
  modifyButton?: TranslationMap;
  backButton?: TranslationMap;
  confirmationNote?: TranslationMap;
  enableWhatsApp?: boolean;
  whatsappNumber?: string;
  enableSound?: boolean;
  enableConfetti?: boolean;
  priceInLetters?: {
    enabled?: boolean;
    mode?: 'dinars' | 'centimes';
  };
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
  | "trustBadges";

// Addons configuration
export interface MetaPixelProfile {
  pixelId: string;
  capiToken?: string;
  testCode?: string;
}

export interface TikTokPixelProfile {
  pixelId: string;
  accessToken?: string;
  testCode?: string;
}

export interface GoogleSheetColumn {
  id: string;
  label: string;
  enabled: boolean;
}

export interface GoogleSheetIntegration {
  webhookUrl: string;
  sheetName?: string;
  abandonedSheetName?: string;
  columns?: GoogleSheetColumn[];
  pinnedCount?: number;
}

export interface FormAddons {
  pixelData?: MetaPixelProfile[];
  tiktokPixelData?: TikTokPixelProfile[];
  sheets?: GoogleSheetIntegration[];
  sheetWebhookUrl?: string; // Legacy fallback
  metaPixelIds?: string[]; // Legacy arrays
  tiktokPixelId?: string; // Legacy simple string
}

export interface FormShippingMode {
  home: number;
  desk: number;
}

export interface FormShipping {
  standard?: FormShippingMode;
  express?: FormShippingMode;
  [key: string]: FormShippingMode | undefined;
}

import type { PromoCode } from '../components/FormTab/preview/hooks/usePromoCode';

// Master Form Configuration
export interface FormConfig {
  header?: HeaderConfig;
  fields?: FieldsConfig;
  stickers?: StickersConfig;
  sectionSettings?: SectionSettingsConfig;
  fontFamily?: FontFamilyConfig;
  thankYou?: ThankYouConfig;

  // Render modes
  inputVariant?: InputVariant;
  inputSpacing?: number;
  locationInputMode?: LocationInputMode;
  locationLayout?: LocationLayout;
  autoHideThemeElements?: boolean;

  // Theme & Styling
  accentColor?: string;
  ctaColor?: string;
  borderRadius?: string;
  inputBackground?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
  inputPlaceholderColor?: string;
  formBackground?: string;
  textColor?: string;
  headingColor?: string;
  ctaVariant?: "outline" | "solid" | "gradient" | "ghost";
  ctaAnimation?: "shake" | "pulse" | "bounce" | "glow" | "none";
  ctaShake?: boolean;
  ctaSticky?: boolean;
  ctaStickyVariant?: string;

  // Toggle sections
  enableOffersSection?: boolean;
  enableSummarySection?: boolean;
  hideDeliveryOption?: boolean;
  enableHomeDelivery?: boolean;
  enableDeskDelivery?: boolean;
  hideShippingInSummary?: boolean;
  enableTrustBadges?: boolean;

  // Custom Modules
  promoCode?: {
    enabled?: boolean;
    codes?: PromoCode[];
    placeholder?: Record<'fr' | 'ar', string>;
    buttonText?: Record<string, string>;
    successText?: Record<string, string>;
    errorText?: Record<string, string>;
  };
  urgencyTimer?: {
    enabled?: boolean;
    hours?: number;
    minutes?: number;
    seconds?: number;
    style?: "minimal" | "banner" | "compact" | "digital" | "flip" | "bar";
    colorPreset?: string;
    customColor?: string;
    showLabel?: boolean;
    customText?: Record<string, string>;
  };
  urgencyText?: {
    enabled?: boolean;
    style?: "minimal" | "banner" | "glow" | "pill";
    colorPreset?: string;
    customColor?: string;
    text?: Record<string, string>;
  };
  urgencyQuantity?: {
    enabled?: boolean;
    style?: "minimal" | "banner" | "pill" | "progress" | "counter" | "badge" | "flame";
    colorPreset?: string;
    animate?: boolean;
    [key: string]: unknown;
  };
  trustBadges?: Record<string, any>;
  trustBadgeStyle?: "minimal" | "banner" | "cards" | "pills" | "lines" | "compactLines";

  // System
  settings?: Record<string, unknown>;
  translations?: Record<string, Record<string, string>>;
  sectionOrder?: string[];
  type?: "product" | "store";

  // Contextual store properties usually injected via backend
  storeName?: string;
  shopifyDomain?: string;

  // Extensions
  addons?: FormAddons;
  pixels?: MetaPixelProfile[]; // Root pixel fallback

  // Included relational data
  offers?: Record<string, unknown>[];
  shipping?: FormShipping;
  offerRuleId?: string | null;
  shippingRuleId?: string | null;
  couponRuleId?: string | null;
  // Legacy fields (kept for backwards compatibility during migration)
  selectedGlobalOffers?: string[];
  selectedGlobalCoupons?: string[];
  _offersInitialized?: boolean;
  _couponsInitialized?: boolean;
}

// Runtime Form State
export interface OrderFormData {
  name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address: string;
  note: string;
  offerId: string;
  variant: string;
  quantity: number;
  shippingType: "home" | "desk";
  // Allow arbitrary additional field tracking but tightly couple core schema
  [key: string]: string | number | undefined;
}

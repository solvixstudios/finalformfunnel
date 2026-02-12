/**
 * Default Form Configuration
 * Central source of truth for form config defaults
 */

// Form Configuration Schema Version
export const FORM_CONFIG_SCHEMA_VERSION = "1.0.0";

// Initial/default offer
export const INITIAL_OFFER = {
  id: "offre-standard",
  qty: 1,
  discount: 0,
  _type: "perc" as const,
  _idManuallyEdited: true,
  title: { fr: "Offre Standard", ar: "العرض القياسي" },
  desc: { fr: "Prix normal", ar: "السعر العادي" },
};

// Default offers
export const DEFAULT_OFFERS = [
  {
    id: "offre-1",
    qty: 1,
    discount: 0,
    _type: "perc" as const,
    _idManuallyEdited: false,
    title: { fr: "1 Pièce", ar: "قطعة واحدة" },
    desc: { fr: "Prix standard", ar: "السعر العادي" },
  },
  {
    id: "offre-2",
    qty: 2,
    discount: 10,
    _type: "perc" as const,
    _idManuallyEdited: false,
    title: { fr: "2 Pièces", ar: "قطعتين" },
    desc: { fr: "Remise de 10%", ar: "تخفيض 10٪" },
  },
  {
    id: "offre-3",
    qty: 3,
    discount: 20,
    _type: "perc" as const,
    _idManuallyEdited: false,
    title: { fr: "3 Pièces", ar: "3 قطع" },
    desc: { fr: "Remise de 20%", ar: "تخفيض 20٪" },
  },
];

// Default form configuration
export const DEFAULT_FORM_CONFIG = {
  version: FORM_CONFIG_SCHEMA_VERSION,
  accentColor: "#6366f1",
  ctaColor: "#4f46e5",
  ctaShake: true,
  borderRadius: "12px",

  // Input Styling
  inputBackground: "#f8fafc",
  inputBorderColor: "#e2e8f0",
  inputTextColor: "#1e293b",
  inputPlaceholderColor: "#94a3b8",

  // Card Styling
  cardBackground: "#ffffff",
  cardBorderColor: "#e2e8f0",

  inputVariant: "filled" as "filled" | "outlined",
  locationMode: "grouped" as "single" | "grouped",
  locationLayout: "sideBySide" as "sideBySide" | "stacked",
  locationInputMode: "double_dropdown" as
    | "double_dropdown"
    | "single_dropdown"
    | "free_text",

  // Variant style
  variantStyle: "cards" as "buttons" | "cards" | "pills" | "dropdown",

  // Header
  header: {
    enabled: true,
    style: "classic" as
      | "classic"
      | "centered"
      | "minimal"
      | "banner"
      | "compact"
      | "hidden",
    showLanguageSwitcher: true,
    defaultLanguage: "fr" as "fr" | "ar",
    showProductImage: true,
    showProductPrice: true,
    priceInLetters: {
      enabled: false,
      mode: "dinars" as "dinars" | "centimes",
    },
  },

  // Section Visibility
  enableShippingSection: true,
  enableSummarySection: true,
  enableOffersSection: true,
  enableTrustBadges: true,
  showTotalInCTA: false,

  // Delivery Options
  enableHomeDelivery: true,
  enableDeskDelivery: true,

  // Section Styling
  sectionSpacing: 20,
  sectionPadding: 20,
  inputSpacing: 12,
  sectionMarginTop: 0,
  sectionMarginBottom: 0,

  // Shipping visibility
  hideShippingInSummary: false,
  hideDeliveryOption: false,

  // Section ordering
  sectionOrder: [
    "variants",
    "shipping",
    "delivery",
    "offers",
    "promoCode",
    "summary",
    "cta",
    "urgencyText",
    "urgencyQuantity",
    "urgencyTimer",
    "trustBadges",
  ],

  // Embedded offers
  offers: DEFAULT_OFFERS,

  // Embedded shipping
  shipping: {
    standard: { home: 600, desk: 400 },
    exceptions: [] as { id: string; home: number; desk: number }[],
  },

  // Stickers
  stickers: {
    product: {
      enabled: false,
      text: { fr: "Meilleure Vente", ar: "الأكثر مبيعاً" },
      color: "#ef4444",
      textColor: "#ffffff",
    },
    shipping: {
      enabled: false,
      text: { fr: "Livraison Rapide", ar: "توصيل سريع" },
      color: "#10b981",
    },
  },

  // Urgency Text
  urgencyText: {
    enabled: false,
    style: "banner" as "banner" | "pill" | "glow" | "minimal",
    colorPreset: "amber",
    customColor: "#f59e0b",
    text: {
      fr: "⚡ Offre limitée - Commandez maintenant!",
      ar: "⚡ عرض محدود - اطلب الآن!",
    },
  },

  // Urgency Quantity
  urgencyQuantity: {
    enabled: false,
    style: "progress" as "progress" | "counter" | "badge" | "flame",
    colorPreset: "dynamic",
    customColor: "#ef4444",
    stockCount: 7,
    showIcon: true,
    animate: true,
    customText: { fr: "", ar: "" },
  },

  // Urgency Timer
  urgencyTimer: {
    enabled: false,
    style: "digital" as "digital" | "flip" | "minimal" | "bar",
    colorPreset: "red",
    customColor: "#ef4444",
    hours: 2,
    minutes: 30,
    seconds: 0,
    showLabel: true,
    customText: { fr: "", ar: "" },
  },

  // Promo Code
  promoCode: {
    enabled: false,
    required: false,
    placeholder: { fr: "Code promo", ar: "كود الخصم" },
    buttonText: { fr: "Appliquer", ar: "تطبيق" },
    successText: { fr: "Code appliqué!", ar: "تم تطبيق الكود!" },
    errorText: { fr: "Code invalide", ar: "كود غير صالح" },
    codes: [] as {
      id: string;
      code: string;
      applyTo: "subtotal" | "shipping" | "total";
      discountMode: "free" | "percentage" | "fixed";
      discountValue: number;
      limitType: "unlimited" | "date_range" | "use_count";
      startDate?: string;
      endDate?: string;
      maxUses?: number;
      currentUses?: number;
      isActive: boolean;
    }[],
  },

  // Trust Badges
  trustBadgeStyle: "cards" as
    | "cards"
    | "pills"
    | "minimal"
    | "banner"
    | "lines"
    | "compactLines",
  trustBadges: {
    cod: {
      enabled: true,
      label: { fr: "Paiement à la livraison", ar: "الدفع عند الاستلام" },
      customText: { fr: "", ar: "" },
    },
    guarantee: {
      enabled: true,
      label: { fr: "Garantie qualité", ar: "ضمان الجودة" },
      customText: { fr: "", ar: "" },
    },
    return: {
      enabled: false,
      label: { fr: "Retour facile", ar: "إرجاع سهل" },
      customText: { fr: "", ar: "" },
    },
    support: {
      enabled: false,
      label: { fr: "Support 24/7", ar: "دعم 24/7" },
      customText: { fr: "", ar: "" },
    },
    fastDelivery: {
      enabled: true,
      label: { fr: "Livraison rapide", ar: "توصيل سريع" },
      customText: { fr: "", ar: "" },
    },
  },

  // Typography
  fontFamily: {
    fr: "Inter",
    ar: "Cairo",
  },
  formBackground: "#ffffff",
  textColor: "#1e293b",
  headingColor: "#0f172a",

  // CTA Button
  ctaVariant: "solid" as "solid" | "outline" | "gradient" | "ghost",
  ctaAnimation: "shake" as "shake" | "pulse" | "bounce" | "glow" | "none",
  ctaSticky: false,
  ctaStickyVariant: "simple" as "simple" | "product" | "compact" | "card" | "badge",

  // Section Settings
  sectionSettings: {
    variants: { showTitle: true },
    shipping: { showTitle: true },
    delivery: { showTitle: true, layout: "sideBySide", showPrices: true }, // Added defaults for TS
    offers: { showTitle: true },
    promoCode: { showTitle: true },
    summary: {
      showTitle: true,
      priceInLetters: {
        enabled: false,
        mode: "dinars" as "dinars" | "centimes",
      },
    },
    cta: { showTitle: false },
    urgencyText: { showTitle: false },
    urgencyQuantity: { showTitle: false },
    urgencyTimer: { showTitle: false },
    trustBadges: { showTitle: true },
  },

  // Fields
  fields: {
    name: {
      visible: true,
      required: true,
      order: 0,
      placeholder: { fr: "Nom et Prénom", ar: "الاسم واللقب" },
    },
    phone: {
      visible: true,
      required: true,
      order: 1,
      placeholder: { fr: "Numéro de téléphone", ar: "رقم الهاتف" },
    },
    wilaya: {
      visible: true,
      required: true,
      order: 2,
      placeholder: { fr: "Wilaya", ar: "الولاية" },
    },
    commune: {
      visible: true,
      required: true,
      order: 3,
      placeholder: { fr: "Commune", ar: "البلدية" },
    },
    address: {
      visible: false,
      required: false,
      order: 4,
      placeholder: { fr: "Adresse complète", ar: "العنوان الكامل" },
    },
    note: {
      visible: false,
      required: false,
      order: 5,
      placeholder: { fr: "Note / Observation", ar: "ملاحظة" },
    },
  },

  // Translations
  translations: {
    variants: { fr: "Sélectionnez le modèle", ar: "اختر الموديل" },
    shipping: { fr: "Informations de livraison", ar: "معلومات التوصيل" },
    delivery: { fr: "Type de livraison", ar: "نوع التوصيل" },
    offers: { fr: "Choisissez votre offre", ar: "اختر عرضك" },
    promoCode: { fr: "Code promo", ar: "كود الخصم" },
    home: { fr: "À Domicile", ar: "المنزل" },
    desk: { fr: "En Bureau", ar: "المكتب" },
    unavailable: { fr: "Non disponible", ar: "غير متاح" },
    subtotal: { fr: "Sous-total", ar: "المجموع" },
    shippingLabel: { fr: "Livraison", ar: "التوصيل" },
    free: { fr: "GRATUIT", ar: "مجاني" },
    total: { fr: "Total", ar: "الإجمالي" },
    cta: { fr: "Commander Maintenant", ar: "اطلب الآن" },
    stickyLabel: { fr: "", ar: "" },
    trustTitle: { fr: "Garanties", ar: "الضمانات" },
  },

  // Thank You Popup
  thankYou: {
    title: { fr: "Merci !", ar: "شكرا !" },
    message: {
      fr: "Votre commande a été reçue avec succès.",
      ar: "تم استلام طلبك بنجاح.",
    },
    button: { fr: "Fermer", ar: "غلق" },
    summaryButton: { fr: "Voir le résumé", ar: "عرض ملخص الطلب" },
    whatsappButton: { fr: "Confirmer via WhatsApp", ar: "تأكيد عبر واتساب" },
    modifyButton: { fr: "Modifier la commande", ar: "تعديل الطلب" },
    backButton: { fr: "Retour", ar: "رجوع" },

    enableWhatsApp: false,
    selectedWhatsappProfileId: "", // ID of the selected global profile
    whatsappNumber: "", // Resolved at runtime/export for the loader
    // Note: Profiles are managed globally in Integrations, but we can store local overrides if needed.
    // For now, we rely on the global 'integrations' object or local embedded config if we decide to ship profiles with the form.
    // We will stick to the plan: Form selects a profile ID. Loader resolves it from global context or form's embedded copy.
    confirmationNote: {
      fr: "Veuillez garder votre téléphone ouvert, nous vous appelerons pour confirmer la commande. La livraison prend généralement 24 à 48 heures.",
      ar: "يرجى إبقاء هاتفك مفتوحًا، سنتصل بك لتأكيد الطلب. يستغرق التوصيل عادةً من 24 إلى 48 ساعة.",
    },
    priceInLetters: {
      enabled: false,
      mode: "dinars" as "dinars" | "centimes",
    },
    enableConfetti: true,
    enableSound: true,
  },

  // Addons - Form-level integration settings
  addons: {
    enableSheets: false,
    selectedSheetIds: [] as string[], // IDs of selected Google Sheet configs (multi-select)
    selectedWhatsappProfileId: null as string | null, // ID of selected WhatsApp profile (single-select)
    // Ordered columns for Google Sheets
    sheetColumns: [
      { id: 'orderId', label: 'Order ID', enabled: true },
      { id: 'date', label: 'Date', enabled: true },
      { id: 'status', label: 'Status', enabled: true },
      { id: 'name', label: 'Nom', enabled: true },
      { id: 'phone', label: 'Téléphone', enabled: true },
      { id: 'wilaya', label: 'Wilaya', enabled: true },
      { id: 'commune', label: 'Commune', enabled: true },
      { id: 'address', label: 'Adresse', enabled: true },
      { id: 'product', label: 'Produit', enabled: true },
      { id: 'variant', label: 'Variante', enabled: true },
      { id: 'quantity', label: 'Quantité', enabled: true },
      { id: 'totalPrice', label: 'Prix Total', enabled: true },
      { id: 'shippingPrice', label: 'Livraison', enabled: false },
      { id: 'note', label: 'Note', enabled: false },
      { id: 'source', label: 'Source', enabled: true },
    ] as { id: string; label: string; enabled: boolean }[],
  },

  // Embedding Settings
  // Automatically hide default Shopify theme elements (Title, Price, Variants, Buttons)
  autoHideThemeElements: true,
};

// Type for form config
export type FormConfig = typeof DEFAULT_FORM_CONFIG;

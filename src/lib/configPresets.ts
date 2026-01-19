import { DEFAULT_FORM_CONFIG } from "./constants";

export interface ConfigPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<typeof DEFAULT_FORM_CONFIG>;
}

// Helper to deep merge configs
const mergeConfig = (base: any, override: any): any => {
  if (!override || typeof override !== "object") {
    return override !== undefined ? override : base;
  }

  if (Array.isArray(override)) {
    // For arrays, replace entirely (sectionOrder, offers, etc.)
    return override;
  }

  const result = base ? { ...base } : {};
  for (const key in override) {
    if (override[key] !== null && override[key] !== undefined) {
      if (typeof override[key] === "object" && !Array.isArray(override[key])) {
        // Recursively merge nested objects
        result[key] = mergeConfig(result[key] || {}, override[key]);
      } else {
        // Replace primitives and arrays
        result[key] = override[key];
      }
    }
  }
  return result;
};

// Standard section order - presets should keep all sections and use enabled flags to hide them
const FULL_SECTION_ORDER = [
  "variants",
  "shipping",
  "delivery",
  "offers",
  "promoCode",
  "urgencyText",
  "urgencyQuantity",
  "urgencyTimer",
  "trustBadges",
  "summary",
  "cta",
];

export const CONFIG_PRESETS: ConfigPreset[] = [
  {
    id: "minimal",
    name: "Minimal Product",
    description: "Champs essentiels uniquement. Parfait pour débuter.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: false,
      enableTrustBadges: false,
      stickers: { product: { enabled: false } },
      urgencyText: { enabled: false },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      fields: {
        name: { visible: true, required: true, order: 0 },
        phone: { visible: true, required: true, order: 1 },
        wilaya: { visible: true, required: true, order: 2 },
        commune: { visible: true, required: true, order: 3 },
        address: { visible: false, required: false, order: 4 },
        note: { visible: false, required: false, order: 5 },
      },
      borderRadius: "8px",
      accentColor: "#6366f1",
      ctaColor: "#4f46e5",
    }),
  },
  {
    id: "urgent-sale",
    name: "Urgent Sale",
    description: "Tous les éléments d'urgence pour maximiser les ventes.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: { product: { enabled: false } },
      urgencyText: {
        enabled: true,
        style: "banner",
        colorPreset: "red",
        customColor: "#ef4444",
        text: {
          fr: "⚡ Offre limitée - Commandez maintenant!",
          ar: "⚡ عرض محدود - اطلب الآن!",
        },
      },
      urgencyQuantity: {
        enabled: true,
        style: "progress",
        colorPreset: "dynamic",
        stockCount: 7,
        showIcon: true,
        animate: true,
      },
      urgencyTimer: {
        enabled: true,
        style: "digital",
        colorPreset: "red",
        hours: 2,
        minutes: 30,
        seconds: 0,
        showLabel: true,
      },
      accentColor: "#ef4444",
      ctaColor: "#dc2626",
      borderRadius: "12px",
    }),
  },
  {
    id: "premium-plus",
    name: "Premium Plus",
    description: "Design luxe avec tous les éléments. Apparence haut de gamme.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: { product: { enabled: false } },
      urgencyText: { enabled: false },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      accentColor: "#8b5cf6",
      ctaColor: "#7c3aed",
      formBackground: "#ffffff",
      textColor: "#1e293b",
      headingColor: "#0f172a",
      borderRadius: "16px",
      trustBadgeStyle: "cards",
      fields: {
        name: { visible: true, required: true, order: 0 },
        phone: { visible: true, required: true, order: 1 },
        wilaya: { visible: true, required: true, order: 2 },
        commune: { visible: true, required: true, order: 3 },
        address: { visible: true, required: true, order: 4 },
        note: { visible: true, required: false, order: 5 },
      },
    }),
  },
  {
    id: "quick-checkout",
    name: "Quick Checkout",
    description: "Champs minimaux pour checkout rapide et efficace.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: false,
      stickers: { product: { enabled: false } },
      urgencyText: { enabled: false },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      fields: {
        name: { visible: true, required: true, order: 0 },
        phone: { visible: true, required: true, order: 1 },
        wilaya: { visible: true, required: true, order: 2 },
        commune: { visible: true, required: true, order: 3 },
        address: { visible: false, required: false, order: 4 },
        note: { visible: false, required: false, order: 5 },
      },
      borderRadius: "8px",
      accentColor: "#3b82f6",
      ctaColor: "#2563eb",
      sectionSpacing: 12,
      sectionPadding: 12,
    }),
  },
  {
    id: "eco-conscious",
    name: "Eco-Conscious",
    description: "Design vert avec accent sur les valeurs durables.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: { product: { enabled: false } },
      urgencyText: {
        enabled: true,
        style: "minimal",
        colorPreset: "emerald",
        text: {
          fr: "🌿 Produit éco-responsable - Commandez avec confiance",
          ar: "🌿 منتج صديق للبيئة - اطلب بثقة",
        },
      },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      accentColor: "#10b981",
      ctaColor: "#059669",
      formBackground: "#f0fdf4",
      textColor: "#064e3b",
      headingColor: "#065f46",
      borderRadius: "12px",
    }),
  },
  {
    id: "tech-forward",
    name: "Tech Forward",
    description: "Moderne et épuré avec design minimaliste.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: false,
      stickers: { product: { enabled: false } },
      urgencyText: { enabled: false },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      accentColor: "#0ea5e9",
      ctaColor: "#0284c7",
      formBackground: "#f8fafc",
      borderRadius: "4px",
      fields: {
        name: { visible: true, required: true, order: 0 },
        phone: { visible: true, required: true, order: 1 },
        wilaya: { visible: true, required: true, order: 2 },
        commune: { visible: true, required: true, order: 3 },
        address: { visible: false, required: false, order: 4 },
        note: { visible: false, required: false, order: 5 },
      },
      inputVariant: "outlined",
    }),
  },
  {
    id: "luxury-dark",
    name: "Luxury Brand",
    description: "Thème noir élégant pour marques premium.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: { product: { enabled: false } },
      urgencyText: { enabled: false },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      accentColor: "#fbbf24",
      ctaColor: "#f59e0b",
      formBackground: "#1f2937",
      textColor: "#f3f4f6",
      headingColor: "#ffffff",
      borderRadius: "16px",
      fields: {
        name: { visible: true, required: true, order: 0 },
        phone: { visible: true, required: true, order: 1 },
        wilaya: { visible: true, required: true, order: 2 },
        commune: { visible: true, required: true, order: 3 },
        address: { visible: true, required: true, order: 4 },
        note: { visible: false, required: false, order: 5 },
      },
    }),
  },
  {
    id: "b2b-professional",
    name: "B2B Professional",
    description: "Design sobreamag corporate pour business-to-business.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: { product: { enabled: false } },
      urgencyText: { enabled: false },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      trustBadgeStyle: "pills",
      accentColor: "#1e40af",
      ctaColor: "#1e3a8a",
      formBackground: "#ffffff",
      borderRadius: "8px",
      fields: {
        name: { visible: true, required: true, order: 0 },
        phone: { visible: true, required: true, order: 1 },
        wilaya: { visible: true, required: true, order: 2 },
        commune: { visible: true, required: true, order: 3 },
        address: { visible: true, required: true, order: 4 },
        note: { visible: true, required: false, order: 5 },
      },
      inputVariant: "outlined",
    }),
  },
  {
    id: "urgency-heavy",
    name: "Urgency Heavy",
    description: "Tous les éléments d'urgence pour conversions maximales.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: false,
      stickers: { product: { enabled: false } },
      urgencyText: {
        enabled: true,
        style: "glow",
        colorPreset: "red",
        text: {
          fr: "🔥 URGENT! Plus que quelques heures!",
          ar: "🔥 عاجل! بضع ساعات فقط متبقية!",
        },
      },
      urgencyQuantity: {
        enabled: true,
        style: "flame",
        colorPreset: "red",
        stockCount: 3,
        showIcon: true,
        animate: true,
      },
      urgencyTimer: {
        enabled: true,
        style: "flip",
        colorPreset: "red",
        hours: 1,
        minutes: 30,
        seconds: 0,
        showLabel: true,
      },
      accentColor: "#ef4444",
      ctaColor: "#dc2626",
      borderRadius: "12px",
    }),
  },
  {
    id: "trust-focused",
    name: "Trust Focused",
    description: "Mise en avant maximale des badges de confiance.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: { product: { enabled: false } },
      urgencyText: { enabled: false },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      trustBadgeStyle: "cards",
      trustBadges: {
        cod: {
          enabled: true,
          label: { fr: "Paiement à la livraison", ar: "الدفع عند الاستلام" },
          customText: {
            fr: "Payez seulement à la réception",
            ar: "ادفع فقط عند الاستلام",
          },
        },
        guarantee: {
          enabled: true,
          label: { fr: "Garantie qualité", ar: "ضمان الجودة" },
          customText: {
            fr: "100% satisfait ou remboursé",
            ar: "100% راضٍ أو استرداد",
          },
        },
        return: {
          enabled: true,
          label: { fr: "Retour facile", ar: "إرجاع سهل" },
          customText: {
            fr: "Retours gratuits sous 30 jours",
            ar: "إرجاع مجاني خلال 30 يومًا",
          },
        },
        support: {
          enabled: true,
          label: { fr: "Support 24/7", ar: "دعم 24/7" },
          customText: {
            fr: "Assistance disponible à tout moment",
            ar: "مساعدة متاحة في أي وقت",
          },
        },
        fastDelivery: {
          enabled: true,
          label: { fr: "Livraison rapide", ar: "توصيل سريع" },
          customText: { fr: "Livraison express garantie", ar: "توصيل سريع مضمون" },
        },
      },
      accentColor: "#10b981",
      ctaColor: "#059669",
      borderRadius: "12px",
    }),
  },
  {
    id: "full-featured",
    name: "Full Featured",
    description: "Toutes les sections et options activées.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: { product: { enabled: false } },
      urgencyText: {
        enabled: true,
        style: "banner",
        colorPreset: "amber",
        text: {
          fr: "⚡ Offre flash - Stocks limités!",
          ar: "⚡ عرض فلاش - مخزون محدود!",
        },
      },
      urgencyQuantity: {
        enabled: true,
        style: "progress",
        colorPreset: "dynamic",
        stockCount: 7,
        showIcon: true,
        animate: true,
      },
      urgencyTimer: {
        enabled: true,
        style: "digital",
        colorPreset: "red",
        hours: 2,
        minutes: 30,
        showLabel: true,
      },
      fields: {
        name: { visible: true, required: true, order: 0 },
        phone: { visible: true, required: true, order: 1 },
        wilaya: { visible: true, required: true, order: 2 },
        commune: { visible: true, required: true, order: 3 },
        address: { visible: true, required: true, order: 4 },
        note: { visible: true, required: false, order: 5 },
      },
    }),
  },
];

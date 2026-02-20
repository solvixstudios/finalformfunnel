import { DEFAULT_FORM_CONFIG } from "./constants";

export interface ConfigPreset {
  id: string;
  name: string;
  description: string;
  config: Partial<typeof DEFAULT_FORM_CONFIG>;
}

// Helper to deep merge configs
const mergeConfig = (base: unknown, override: unknown): unknown => {
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
    name: "Minimalist",
    description: "Design épuré et essentiel. Idéal pour maximiser la clarté.",
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
      inputVariant: "outlined",
      formBackground: "#ffffff",
    }),
  },
  {
    id: "urgent-sale",
    name: "Urgent Sale",
    description: "Tout pour créer l'urgence et pousser à l'achat immédiat.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: {
        product: {
          enabled: true,
          text: { fr: "🔥 Offre Limitée", ar: "عرض محدود" },
          color: "#ef4444",
        },
      },
      urgencyText: {
        enabled: true,
        style: "banner",
        colorPreset: "red",
        customColor: "#ef4444",
        text: {
          fr: "⚡ Plus que quelques pièces en stock !",
          ar: "⚡ بقي بضع قطع فقط في المخزون!",
        },
      },
      urgencyQuantity: {
        enabled: true,
        style: "progress",
        colorPreset: "dynamic",
        stockCount: 5,
        showIcon: true,
        animate: true,
      },
      urgencyTimer: {
        enabled: true,
        style: "digital",
        colorPreset: "red",
        hours: 0,
        minutes: 45,
        seconds: 0,
        showLabel: true,
      },
      accentColor: "#ef4444",
      ctaColor: "#dc2626",
      ctaAnimation: "shake",
      borderRadius: "12px",
      showTotalInCTA: true,
    }),
  },
  {
    id: "premium-plus",
    name: "Premium Plus",
    description:
      "Design luxueux, confiance et élégance pour produits haut de gamme.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: {
        product: {
          enabled: true,
          text: { fr: "💎 Best Seller", ar: "الأكثر مبيعاً" },
          color: "#8b5cf6",
        },
      },
      urgencyText: { enabled: false },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      accentColor: "#7c3aed",
      ctaColor: "#6d28d9",
      formBackground: "#ffffff",
      textColor: "#1e293b",
      headingColor: "#0f172a",
      borderRadius: "16px",
      trustBadgeStyle: "cards",
      inputVariant: "filled",
      ctaVariant: "gradient",
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
    name: "Express Checkout",
    description: "Optimisé pour la vitesse. Pas de distraction.",
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
      ctaVariant: "solid",
      sectionSpacing: 16,
      sectionPadding: 16,
      inputSpacing: 12,
    }),
  },
  {
    id: "eco-conscious",
    name: "Eco Bio",
    description: "Tons naturels et rassurants pour produits bio ou écologiques.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: {
        product: {
          enabled: true,
          text: { fr: "🌱 100% Naturel", ar: "100٪ طبيعي" },
          color: "#10b981",
        },
      },
      urgencyText: {
        enabled: true,
        style: "minimal",
        colorPreset: "emerald",
        text: {
          fr: "🌿 Livraison écologique disponible",
          ar: "🌿 شحن صديق للبيئة متاح",
        },
      },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      accentColor: "#10b981",
      ctaColor: "#059669",
      formBackground: "#f0fdf4",
      textColor: "#064e3b",
      headingColor: "#065f46",
      inputBackground: "#dcfce7",
      inputBorderColor: "#86efac",
      borderRadius: "12px",
      trustBadgeStyle: "pills",
    }),
  },
  {
    id: "tech-forward",
    name: "Tech Modern",
    description: "Style angulaire et technique, parfait pour l'électronique.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: { product: { enabled: false } },
      urgencyText: { enabled: false },
      urgencyQuantity: {
        enabled: true,
        style: "badge",
        stockCount: 15,
        showIcon: true,
      },
      urgencyTimer: { enabled: false },
      accentColor: "#0ea5e9",
      ctaColor: "#0284c7",
      formBackground: "#f8fafc",
      borderRadius: "0px", // Sharp corners
      fields: {
        name: { visible: true, required: true, order: 0 },
        phone: { visible: true, required: true, order: 1 },
        wilaya: { visible: true, required: true, order: 2 },
        commune: { visible: true, required: true, order: 3 },
        address: { visible: false, required: false, order: 4 },
        note: { visible: false, required: false, order: 5 },
      },
      inputVariant: "outlined",
      fontFamily: { fr: "Roboto", ar: "Cairo" }, // Use more techy font if available
      trustBadgeStyle: "lines",
    }),
  },
  {
    id: "luxury-dark",
    name: "Dark Mode Elite",
    description: "L'élégance du noir pour une valeur perçue maximale.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: { product: { enabled: false } },
      urgencyText: { enabled: false },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      accentColor: "#fbbf24",
      ctaColor: "#d97706",
      ctaVariant: "gradient",
      formBackground: "#111827",
      textColor: "#f9fafb",
      headingColor: "#ffffff",
      inputBackground: "#1f2937",
      inputBorderColor: "#374151",
      inputTextColor: "#ffffff",
      inputPlaceholderColor: "#9ca3af",
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
    id: "clean-white",
    name: "Clean White",
    description: "Blanc sur blanc, shadows subtiles. Le standard modern.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: true,
      stickers: { product: { enabled: false } },
      urgencyText: { enabled: false },
      urgencyQuantity: { enabled: false },
      urgencyTimer: { enabled: false },
      trustBadgeStyle: "minimal",
      accentColor: "#2563eb",
      ctaColor: "#1d4ed8",
      formBackground: "#ffffff",
      borderRadius: "20px",
      sectionPadding: 24,
      inputVariant: "filled",
      inputBackground: "#f1f5f9",
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
    id: "urgency-max",
    name: "Maximum Conversion",
    description: "Chaque pixel est optimisé pour convertir. Agressif.",
    config: mergeConfig(DEFAULT_FORM_CONFIG, {
      sectionOrder: FULL_SECTION_ORDER,
      enableOffersSection: true,
      enableTrustBadges: false,
      stickers: {
        product: {
          enabled: true,
          text: { fr: "-50% AUJOURD'HUI", ar: "تخفيض 50٪ اليوم" },
          color: "#dc2626",
        },
      },
      urgencyText: {
        enabled: true,
        style: "glow",
        colorPreset: "red",
        text: {
          fr: "🔥 URGENT! Stock presque épuisé!",
          ar: "🔥 عاجل! المخزون ينفد!",
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
        hours: 0,
        minutes: 15,
        seconds: 0,
        showLabel: true,
      },
      accentColor: "#dc2626",
      ctaColor: "#b91c1c",
      ctaAnimation: "bounce",
      showTotalInCTA: true,
      borderRadius: "8px",
      inputVariant: "outlined",
    }),
  },
];

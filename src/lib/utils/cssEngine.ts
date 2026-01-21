import { CSSProperties } from "react";

/**
 * UNIFIED CSS ENGINE
 *
 * This engine is responsible for generating all dynamic styles for the form.
 * It is shared between the FormLoader (Shopify Runtime) and Styles/Preview (Editor).
 *
 * DESIGN PHILOSOPHY:
 * - All dynamic colors/styles come from 'config'
 * - Structural layout (flex, grid) remains in Tailwind classes in the components
 * - The engine outputs React.CSSProperties objects to be spread onto elements
 */

type ConfigInfo = {
  // Colors
  accentColor: string;
  formBackground?: string;
  textColor?: string;
  headingColor?: string;
  inputBorderColor?: string;
  inputBackground?: string;
  inputPlaceholderColor?: string;
  ctaColor?: string;

  // Dimensions
  borderRadius: string;
  inputSpacing?: number;
  sectionSpacing?: number;
  sectionMarginTop?: number;
  sectionMarginBottom?: number;

  // Typography
  fontFamily?: { [key: string]: string };
};

// --- HELPER: Colors ---
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "0, 0, 0";
}

function getContrastColor(hexColor: string): string {
  // Simple logic: if dark, return white, else black
  const rgb = hexToRgb(hexColor);
  const [r, g, b] = rgb.split(",").map((x) => parseInt(x.trim()));
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#1e293b" : "#ffffff";
}

// --- FONTS ---
export function getFontFamilyCSS(fontName: string): string {
  const fontMap: Record<string, string> = {
    Inter: '"Inter", system-ui, -apple-system, sans-serif',
    Roboto: '"Roboto", sans-serif',
    "Open Sans": '"Open Sans", sans-serif',
    Poppins: '"Poppins", sans-serif',
    Montserrat: '"Montserrat", sans-serif',
    Cairo: '"Cairo", sans-serif',
    Tajawal: '"Tajawal", sans-serif',
    Almarai: '"Almarai", sans-serif',
    Amiri: '"Amiri", serif',
    "Noto Sans Arabic": '"Noto Sans Arabic", sans-serif',
  };
  return fontMap[fontName] || `"${fontName}", sans-serif`;
}

// --- ROOT CONTAINER ---
export const buildRootStyles = (config: ConfigInfo, lang: string): CSSProperties => {
  // Default font based on language
  const fontName = config.fontFamily?.[lang] || (lang === "ar" ? "Cairo" : "Inter");

  return {
    borderRadius: "16px", // The outer container usually has fixed radius or matches config
    backgroundColor: config.formBackground || "#ffffff",
    fontFamily: getFontFamilyCSS(fontName),
    color: config.textColor || "#1e293b",
  };
};

export const buildPlaceholderStyles = (color: string) => `
    .custom-input::placeholder {
        color: ${color} !important;
        opacity: 1;
    }
`;

// --- HEADER ---
export const buildHeaderStyles = (
  config: ConfigInfo,
  styleVariant: string,
): CSSProperties => {
  const base = {
    backgroundColor:
      styleVariant === "banner"
        ? config.accentColor
        : config.formBackground || "#ffffff",
    borderColor: config.inputBorderColor || `${config.accentColor}15`,
    // Top corners rounded, bottom 0 if classic/centered
    borderRadius:
      styleVariant === "banner" || styleVariant === "classic"
        ? "16px 16px 0 0"
        : "0",
  };

  if (styleVariant === "banner") {
    return {
      ...base,
      color: "#ffffff",
    };
  }

  return base;
};

// --- INPUTS ---
export const buildInputStyles = (
  config: ConfigInfo,
  variant: "filled" | "outline" = "outline",
): CSSProperties & { "--focus-color": string; "--focus-ring": string } => {
  const isFilled = variant === "filled";
  const spacing = config.inputSpacing ?? 12;

  return {
    borderRadius: config.borderRadius,
    marginBottom: `${spacing}px`,
    backgroundColor: config.inputBackground || (isFilled ? "#f8fafc" : "#ffffff"),
    borderColor: isFilled ? "transparent" : config.inputBorderColor || "#e2e8f0",
    color: config.textColor || "#1e293b",
    // CSS Variables for Tailwind/custom focus handling
    "--focus-color": config.accentColor,
    "--focus-ring": `rgba(${hexToRgb(config.accentColor)}, 0.1)`,
  };
};

// --- OPTION CARDS (Delivery, Offers, Variants) ---
type OptionCardState = {
  selected: boolean;
  disabled?: boolean;
};

export const buildOptionCardStyles = (
  config: ConfigInfo,
  state: OptionCardState,
): CSSProperties => {
  const { selected, disabled } = state;

  // Disabled state
  if (disabled) {
    return {
      borderRadius: config.borderRadius,
      backgroundColor: config.formBackground || "#ffffff", // Usually just bg
      borderColor: config.inputBorderColor || "#e2e8f0",
      opacity: 0.6,
      cursor: "not-allowed",
    };
  }

  // Selected state
  if (selected) {
    return {
      borderRadius: config.borderRadius,
      backgroundColor: config.accentColor,
      borderColor: config.accentColor,
      boxShadow: `0 8px 20px -4px ${config.accentColor}50`, // Colored shadow
      color: "#ffffff",
      transform: "translateY(-1px)", // Subtle lift
    };
  }

  // Default state
  return {
    borderRadius: config.borderRadius,
    backgroundColor: config.formBackground || "#ffffff",
    borderColor: config.inputBorderColor || "#e2e8f0",
    color: config.textColor || "#1e293b",
  };
};

// --- TEXT STYLES ---
type TextVariant = "heading" | "body" | "subtext" | "price" | "inverse";

export const buildTextStyles = (
  config: ConfigInfo,
  variant: TextVariant,
  state?: OptionCardState,
): CSSProperties => {
  const isSelected = state?.selected;

  // If selected (in a card), text is usually white (inverse)
  if (isSelected) {
    if (variant === "subtext") return { color: "rgba(255, 255, 255, 0.7)" };
    return { color: "#ffffff" };
  }

  switch (variant) {
    case "heading":
      return { color: config.headingColor || config.textColor || "#0f172a" };
    case "price":
      return { color: config.headingColor || config.textColor || "#0f172a" }; // Sometimes accent?
    case "subtext":
      return { color: config.textColor ? `${config.textColor}99` : "#94a3b8" };
    case "inverse":
      return { color: "#ffffff" };
    case "body":
    default:
      return { color: config.textColor || "#334155" };
  }
};

// --- SELECTION INDICATORS (Radio circles) ---
export const buildSelectionIndicatorStyles = (
  config: ConfigInfo,
  selected: boolean,
): CSSProperties => {
  if (selected) {
    return {
      borderColor: "#ffffff",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    };
  }
  return {
    borderColor: config.inputBorderColor || "#e2e8f0",
    backgroundColor: "transparent",
  };
};

// --- ICON CONTAINERS ---
export const buildIconContainerStyles = (
  config: ConfigInfo,
  selected: boolean,
): CSSProperties => {
  if (selected) {
    return {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      color: "#ffffff",
    };
  }
  return {
    backgroundColor: `${config.accentColor}10`, // 10% opacity accent
    color: config.accentColor,
  };
};

// --- SECTION SPACING ---
export const buildSectionMargin = (
  config: ConfigInfo,
  isFirst: boolean,
): CSSProperties => {
  const spacing = config.sectionSpacing ?? 20;
  const marginTop = config.sectionMarginTop ?? 0;
  const marginBottom = config.sectionMarginBottom ?? 0;

  if (isFirst) {
    return {
      marginTop: `${marginTop}px`,
      marginBottom: `${spacing + marginBottom}px`,
    };
  }
  return {
    marginTop: `${spacing + marginTop}px`,
    marginBottom: `${marginBottom}px`,
  };
};

// --- CTA BUTTONS ---
type CtaVariant = "solid" | "outline" | "gradient" | "ghost";
type CtaAnimation =
  | "shake"
  | "pulse"
  | "bounce"
  | "glow"
  | "slide"
  | "scale"
  | "float"
  | "spin"
  | "none";

interface CtaStyleConfig {
  ctaColor: string;
  accentColor: string;
  borderRadius: string;
  ctaVariant?: CtaVariant;
  ctaAnimation?: CtaAnimation;
}

export function buildCtaClasses(config: CtaStyleConfig): string {
  const { ctaVariant = "solid", ctaAnimation = "none" } = config;

  const base =
    "w-full py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98]";

  // Map animation names to CSS classes
  const animationMap: Record<string, string> = {
    shake: "animate-shake-loop",
    pulse: "animate-pulse-loop",
    bounce: "animate-bounce-loop",
    glow: "animate-glow-loop",
    slide: "animate-slide-loop",
    scale: "animate-scale-loop",
    float: "animate-float-loop",
    spin: "animate-spin-loop",
    none: "",
  };

  const animation = animationMap[ctaAnimation] || "";

  if (ctaVariant === "outline") {
    return `${base} border-2 bg-transparent hover:bg-opacity-10 ${animation}`;
  }
  if (ctaVariant === "gradient") {
    return `${base} text-white ${animation}`;
  }
  if (ctaVariant === "ghost") {
    return `${base} bg-transparent hover:bg-opacity-10 ${animation}`;
  }

  return `${base} text-white hover:opacity-90 shadow-xl ${animation}`;
}

export function buildCtaStyles(config: CtaStyleConfig): CSSProperties {
  const {
    ctaColor,
    accentColor,
    borderRadius,
    ctaVariant = "solid",
    ctaAnimation = "none",
  } = config;

  const base: CSSProperties = { borderRadius };

  if (ctaVariant === "outline") {
    return {
      ...base,
      borderColor: ctaColor,
      color: ctaColor,
      boxShadow: `0 4px 15px ${ctaColor}20`,
    };
  }

  if (ctaVariant === "gradient") {
    return {
      ...base,
      background: `linear-gradient(135deg, ${ctaColor} 0%, ${accentColor} 100%)`,
      boxShadow: `0 10px 25px -5px ${ctaColor}40`,
    };
  }

  if (ctaVariant === "ghost") {
    return {
      ...base,
      color: ctaColor,
    };
  }

  // Solid variant
  return {
    ...base,
    backgroundColor: ctaColor,
    boxShadow:
      ctaAnimation === "glow"
        ? `0 0 20px ${ctaColor}60, 0 10px 25px -5px ${ctaColor}40`
        : `0 10px 25px -5px ${ctaColor}40`,
  };
}

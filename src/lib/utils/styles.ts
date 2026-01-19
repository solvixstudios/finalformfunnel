/**
 * Style Builder Utilities
 * Centralized functions for building CSS styles
 */

import type { CtaAnimation, CtaVariant } from "@/types";
import type { CSSProperties } from "react";

interface CtaStyleConfig {
  ctaColor: string;
  accentColor: string;
  borderRadius: string;
  ctaVariant?: CtaVariant;
  ctaAnimation?: CtaAnimation;
}

/**
 * Build CTA button classes based on variant and animation
 */
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

/**
 * Build CTA button inline styles based on variant
 */
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

/**
 * Build section margin styles
 */
export function buildSectionMarginStyle(
  sectionSpacing: number,
  sectionMarginTop: number,
  sectionMarginBottom: number,
  isFirst: boolean = false
): CSSProperties {
  if (isFirst) {
    return {
      marginTop: `${sectionMarginTop}px`,
      marginBottom: `${sectionSpacing + sectionMarginBottom}px`,
    };
  }
  return {
    marginTop: `${sectionSpacing + sectionMarginTop}px`,
    marginBottom: `${sectionMarginBottom}px`,
  };
}

/**
 * Build input field styles
 */
export function buildInputStyles(config: {
  borderRadius: string;
  inputSpacing: number;
  inputBackground?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
  isFilled: boolean;
  accentColor: string;
}): CSSProperties & { "--focus-color": string; "--focus-ring": string } {
  const {
    borderRadius,
    inputSpacing,
    inputBackground,
    inputBorderColor,
    inputTextColor,
    isFilled,
    accentColor,
  } = config;

  // Convert hex to RGB for focus ring
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
          result[3],
          16
        )}`
      : "99, 102, 241";
  };

  return {
    borderRadius,
    marginBottom: `${inputSpacing}px`,
    backgroundColor: inputBackground || (isFilled ? "#f8fafc" : "#ffffff"),
    borderColor: isFilled ? "transparent" : inputBorderColor || "#e2e8f0",
    color: inputTextColor || "#1e293b",
    "--focus-color": accentColor,
    "--focus-ring": `rgb(${hexToRgb(accentColor)} / 0.1)`,
  };
}

/**
 * Get font family CSS string for language
 */
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

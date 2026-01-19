/**
 * Color Utilities
 * Centralized color manipulation and theme helpers
 */

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert hex to RGB string for CSS variables
 */
export function hexToRgbString(hex: string): string {
  const rgb = hexToRgb(hex);
  return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : "99, 102, 241";
}

/**
 * Get urgency color based on preset and optional stock level
 */
export function getUrgencyColor(
  colorPreset: string,
  customColor: string,
  stockLevel?: number,
  accentColor?: string
): string {
  // Color presets mapping
  const colorMap: Record<string, string> = {
    red: "#ef4444",
    amber: "#f59e0b",
    indigo: "#6366f1",
    emerald: "#10b981",
    violet: "#8b5cf6",
  };

  // Default uses theme accent color
  if (colorPreset === "default" || colorPreset === "theme") {
    return accentColor || "#6366f1";
  }

  if (colorPreset === "custom") {
    return customColor;
  }

  if (colorPreset === "dynamic" && stockLevel !== undefined) {
    // Dynamic color based on stock level
    if (stockLevel <= 3) return "#ef4444"; // Red - critical
    if (stockLevel <= 7) return "#f59e0b"; // Amber - warning
    return "#10b981"; // Green - good
  }

  return colorMap[colorPreset] || customColor || "#ef4444";
}

/**
 * Generate shadow color with transparency
 */
export function createShadowColor(hex: string, opacity: number = 0.4): string {
  return `${hex}${Math.round(opacity * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

/**
 * Lighten or darken a hex color
 */
export function adjustColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const adjust = (value: number) => Math.max(0, Math.min(255, value + amount));

  const r = adjust(rgb.r).toString(16).padStart(2, "0");
  const g = adjust(rgb.g).toString(16).padStart(2, "0");
  const b = adjust(rgb.b).toString(16).padStart(2, "0");

  return `#${r}${g}${b}`;
}

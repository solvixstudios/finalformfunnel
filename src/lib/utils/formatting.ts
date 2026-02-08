/**
 * Formatting Utilities
 * Centralized formatting functions for currency, dates, and text
 */

import type { Language } from "@/types";

/**
 * Format currency with locale-appropriate symbol
 * Arabic uses "دج", French uses "DZD" on right
 */
export function formatCurrency(amount: number, lang: Language = "fr"): string {
  // Use 'en-US' with useGrouping: false to avoid commas
  const formatted = new Intl.NumberFormat('en-US', { useGrouping: false }).format(amount);
  return lang === "ar" ? `${formatted} دج` : `${formatted} DZD`;
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Format countdown time for display
 */
export function formatCountdownTime(
  hours: number,
  minutes: number,
  seconds: number
): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Pad number with leading zeros
 */
export function padNumber(num: number, length: number = 2): string {
  return num.toString().padStart(length, "0");
}

/**
 * Constants - Re-exports for backward compatibility
 *
 * NOTE: This file now re-exports from modular locations.
 * For new code, import directly from:
 * - @/config/defaults (DEFAULT_FORM_CONFIG, INITIAL_OFFER, DEFAULT_OFFERS)
 * - @/data/wilayas (WILAYAS, RAW_WILAYAS)
 * - @/data/labels (FIELD_LABELS, SECTION_LABELS)
 * - @/data/presets (HEADER_STYLE_PRESETS, URGENCY_STYLE_PRESETS, URGENCY_COLOR_PRESETS)
 */

// Re-export config
export {
  DEFAULT_FORM_CONFIG,
  DEFAULT_OFFERS,
  FORM_CONFIG_SCHEMA_VERSION,
  INITIAL_OFFER,
  type FormConfig,
} from "../config/defaults";

// Re-export data
export { FIELD_LABELS, SECTION_LABELS } from "../data/labels";
export {
  HEADER_STYLE_PRESETS,
  URGENCY_COLOR_PRESETS,
  URGENCY_STYLE_PRESETS,
} from "../data/presets";
export { RAW_WILAYAS, WILAYAS } from "../data/wilayas";

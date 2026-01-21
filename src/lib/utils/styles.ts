/**
 * Style Utilities
 *
 * DEPRECATED: Please use '@/lib/utils/cssEngine' directly for new code.
 * This file is kept for backward compatibility and redirects to the new centralized engine.
 */

import { buildSectionMargin } from "./cssEngine";

export * from "./cssEngine";

// Alias for backward compatibility
export const buildSectionMarginStyle = buildSectionMargin;

/**
 * Deep merge two objects recursively
 * Preserves nested structure while merging values from source into target
 * 
 * @param target - Base object with default values
 * @param source - Object with values to merge in
 * @param maxDepth - Maximum recursion depth to prevent infinite loops (default: 10)
 * @returns Merged object with source values taking precedence
 */
export const deepMerge = <T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>,
  maxDepth = 10
): T => {
  const merge = (
    defaults: unknown,
    imported: unknown,
    currentDepth: number
  ): unknown => {
    if (currentDepth > maxDepth) return imported; // Prevent infinite recursion

    const merged = { ...(defaults as Record<string, unknown>) };

    for (const key in imported as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(imported, key)) {
        const defaultValue = (defaults as Record<string, unknown>)[key];
        const importedValue = (imported as Record<string, unknown>)[key];

        // If both are objects (not arrays or null), recurse
        if (
          defaultValue &&
          typeof defaultValue === "object" &&
          !Array.isArray(defaultValue) &&
          importedValue &&
          typeof importedValue === "object" &&
          !Array.isArray(importedValue)
        ) {
          merged[key] = merge(defaultValue, importedValue, currentDepth + 1);
        } else {
          // Otherwise, use imported value
          merged[key] = importedValue;
        }
      }
    }

    return merged;
  };

  return merge(target, source, 0) as T;
};

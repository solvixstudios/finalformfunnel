/**
 * Deep merge two objects recursively
 * Preserves nested structure while merging values from source into target
 * 
 * @param target - Base object with default values
 * @param source - Object with values to merge in
 * @param maxDepth - Maximum recursion depth to prevent infinite loops (default: 10)
 * @returns Merged object with source values taking precedence
 */
export const deepMerge = <T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
  maxDepth = 10
): T => {
  const merge = (
    defaults: any,
    imported: any,
    currentDepth: number
  ): any => {
    if (currentDepth > maxDepth) return imported; // Prevent infinite recursion

    const merged = { ...defaults };

    for (const key in imported) {
      if (Object.prototype.hasOwnProperty.call(imported, key)) {
        const defaultValue = defaults[key];
        const importedValue = imported[key];

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

  return merge(target, source, 0);
};

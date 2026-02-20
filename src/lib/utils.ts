import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function sha256(string: string) {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

/**
 * Deep equality comparison that works with nested objects and arrays
 * More reliable than JSON.stringify which can be order-sensitive
 * Handles null, undefined, primitives, arrays, and plain objects
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  // Identical references
  if (a === b) return true;

  // Different types
  if (typeof a !== typeof b) return false;

  // Handle null (typeof null === 'object')
  if (a === null || b === null) return a === b;

  // Handle primitive types
  if (typeof a !== 'object') return a === b;

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => deepEqual(val, b[idx]));
  }

  // Handle plain objects (but not arrays)
  if (Array.isArray(a) || Array.isArray(b)) return false;

  // Get all keys from both objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  // Different number of keys
  if (keysA.length !== keysB.length) return false;

  // Check if all keys and values match
  return keysA.every(key => {
    if (!keysB.includes(key)) return false;
    return deepEqual(a[key], b[key]);
  });
}

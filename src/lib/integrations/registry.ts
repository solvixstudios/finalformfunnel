/**
 * Platform Adapter Registry
 * Factory for getting the right adapter based on platform type
 */

import { ShopifyAdapter } from './adapters/shopify';
import type { PlatformAdapter, PlatformType } from './adapters/types';
import { WooCommerceAdapter } from './adapters/woocommerce';

const adapters: Record<PlatformType, PlatformAdapter> = {
  shopify: new ShopifyAdapter(),
  woocommerce: new WooCommerceAdapter(),
};

/**
 * Get the adapter for a specific platform
 */
export function getAdapter(platform: PlatformType): PlatformAdapter {
  const adapter = adapters[platform];
  if (!adapter) {
    throw new Error(`Unknown platform: ${platform}`);
  }
  return adapter;
}

/**
 * Check if a platform is supported
 */
export function isPlatformSupported(platform: string): platform is PlatformType {
  return platform in adapters;
}

/**
 * Get list of supported platforms
 */
export function getSupportedPlatforms(): PlatformType[] {
  return Object.keys(adapters) as PlatformType[];
}

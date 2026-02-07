/**
 * Platform Integrations Module
 * Unified exports for multi-platform e-commerce integrations
 */

// Types
export type {
    AssignmentContext, ConnectResult,
    EnableLoaderResult, LoaderStatus, OrderData, PlatformAdapter, PlatformCredentials, PlatformType, Product, StoreInfo
} from './adapters/types';

// Registry
export { getAdapter, getSupportedPlatforms, isPlatformSupported } from './registry';

// Adapters (for direct access if needed)
export { LOADER_VERSION, ShopifyAdapter } from './adapters/shopify';
export { WooCommerceAdapter } from './adapters/woocommerce';


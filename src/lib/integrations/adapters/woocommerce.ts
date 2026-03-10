/**
 * WooCommerce Platform Adapter (Stub)
 * Will use access token only via WordPress plugin
 */

import type {
  AssignmentContext,
  ConnectResult,
  EnableLoaderResult,
  OrderData,
  PlatformAdapter,
  PlatformCredentials,
  Product,
} from './types';

export class WooCommerceAdapter implements PlatformAdapter {
  readonly platform = 'woocommerce' as const;

  /**
   * Validates WooCommerce credentials (e.g., Application Passwords or REST API Keys)
   * and registers the store in the backend database.
   */
  async connect(_subdomain: string, _credentials: PlatformCredentials, _userId?: string): Promise<ConnectResult> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  /**
   * Injects the FinalForm loader script into the WooCommerce theme.
   * Typically done via WordPress REST API (Settings API) or injecting a script snippet.
   */
  async enableLoader(_subdomain: string, _credentials: PlatformCredentials, _userId?: string): Promise<EnableLoaderResult> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  /**
   * Removes the injected script from the WooCommerce theme.
   */
  async disableLoader(_subdomain: string, _credentials: PlatformCredentials, _userId?: string): Promise<void> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  /**
   * Disconnects the store entirely and removes tracking credentials.
   */
  async disconnectStore(_subdomain: string, _credentials?: PlatformCredentials, _userId?: string): Promise<void> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  /**
   * Note: The Firebase backend handles assignment state directly now.
   * This method might only be needed if WooCommerce requires specific local caching
   * of the assigned form ID (e.g., as post meta). Otherwise, it can remain a NO-OP.
   */
  async assignForm(
    _subdomain: string,
    _credentials: PlatformCredentials,
    _formConfig: Record<string, any>,
    _context?: AssignmentContext
  ): Promise<unknown> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  /**
   * Similar to assignForm, this might just clear local post meta in WP.
   */
  async removeForm(_subdomain: string, _credentials: PlatformCredentials, _ownerId?: string): Promise<void> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  /**
   * Queries the WP REST API (/wp-json/wc/v3/products) to fetch product listings.
   * Maps WooCommerce data into our standard `Product` interface format.
   */
  async fetchProducts(_subdomain: string, _credentials: PlatformCredentials): Promise<Product[]> {
    throw new Error('WooCommerce integration not implemented yet');
  }

  /**
   * Submits a completed FinalForm checkout directly to WooCommerce servers.
   * Typically hits /wp-json/wc/v3/orders.
   */
  async submitOrder(_orderData: OrderData): Promise<unknown> {
    throw new Error('WooCommerce integration not implemented yet');
  }
}

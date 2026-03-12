/**
 * WooCommerce Platform Adapter
 * Communicates with the Final Form backend which proxies to the WP plugin.
 * Uses per-store installation keys (accessToken) for authentication.
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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const WEBHOOK_ENV = import.meta.env.VITE_WEBHOOK_ENV || 'webhook';

/**
 * Normalize backend response keys to camelCase
 */
function normalizeResponse(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(normalizeResponse);

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = normalizeResponse(value);
  }
  return result;
}

export class WooCommerceAdapter implements PlatformAdapter {
  readonly platform = 'woocommerce' as const;

  /**
   * Verify the connection to a WooCommerce store via the backend.
   * Backend pings the WP plugin's /finalform/v1/verify endpoint.
   */
  async connect(domain: string, credentials: PlatformCredentials, userId?: string): Promise<ConnectResult> {
    const response = await fetch(`${BACKEND_URL}/${WEBHOOK_ENV}/woocommerce/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain,
        accessToken: credentials.accessToken,
        userId,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'WooCommerce connection failed');
    }

    const data = normalizeResponse(await response.json());

    return {
      store: {
        id: data.storeId || domain,
        name: data.siteName || domain,
        domain: data.domain || domain,
        platform: 'woocommerce',
      },
    };
  }

  /**
   * Enable the loader script on the WooCommerce store.
   * The WP plugin handles script injection via its "Active" toggle.
   * We just tell the backend to toggle it on.
   */
  async enableLoader(domain: string, credentials: PlatformCredentials, userId?: string): Promise<EnableLoaderResult> {
    const response = await fetch(`${BACKEND_URL}/${WEBHOOK_ENV}/woocommerce/enable-loader`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain,
        accessToken: credentials.accessToken,
        userId,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to enable loader');
    }

    return {
      scriptId: `wc-loader-${domain}`,
    };
  }

  /**
   * Disable the loader on the WooCommerce store.
   */
  async disableLoader(domain: string, credentials: PlatformCredentials, userId?: string): Promise<void> {
    try {
      await fetch(`${BACKEND_URL}/${WEBHOOK_ENV}/woocommerce/disable-loader`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          accessToken: credentials.accessToken,
          userId,
        }),
      });
    } catch (err) {
      // Don't throw — disable is best-effort
      console.warn('Failed to disable WooCommerce loader:', err);
    }
  }

  /**
   * Disconnect the store.
   * For WooCommerce, there's no remote cleanup needed (unlike Shopify ScriptTags).
   * The WP plugin keeps its settings until the user removes it.
   */
  async disconnectStore(domain: string, _credentials?: PlatformCredentials, _userId?: string): Promise<void> {
    // Just log — no remote cleanup needed
    if (import.meta.env.DEV) {
      console.log(`WooCommerce store disconnected: ${domain}`);
    }
  }

  /**
   * Assign a form to the store — NO-OP for WooCommerce.
   * Form assignments are handled entirely via Firestore.
   * The loader reads the assignment from Firestore/backend on each page load.
   */
  async assignForm(
    _subdomain: string,
    _credentials: PlatformCredentials,
    _formConfig: Record<string, any>,
    _context?: AssignmentContext
  ): Promise<unknown> {
    // NO-OP — Firestore handles assignments
    return { success: true };
  }

  /**
   * Remove a form assignment — NO-OP for WooCommerce.
   */
  async removeForm(_subdomain: string, _credentials: PlatformCredentials, _ownerId?: string): Promise<void> {
    // NO-OP — Firestore handles assignments
  }

  /**
   * Fetch products from the WooCommerce store via the backend.
   * Backend proxies to the WP plugin's /finalform/v1/products endpoint.
   */
  async fetchProducts(domain: string, credentials: PlatformCredentials): Promise<Product[]> {
    const response = await fetch(`${BACKEND_URL}/${WEBHOOK_ENV}/woocommerce/get-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain,
        accessToken: credentials.accessToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch WooCommerce products');
    }

    const data = normalizeResponse(await response.json());
    return data.products || [];
  }

  /**
   * Submit an order from the Final Form loader to the backend.
   */
  async submitOrder(orderData: OrderData): Promise<unknown> {
    const response = await fetch(`${BACKEND_URL}/${WEBHOOK_ENV}/woocommerce/submit-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Order submission failed');
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }
}

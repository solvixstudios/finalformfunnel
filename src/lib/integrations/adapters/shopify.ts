/**
 * Shopify Platform Adapter
 * Implements PlatformAdapter for Shopify Custom App integration
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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://your-backend-instance.com';
const WEBHOOK_ENV = import.meta.env.VITE_WEBHOOK_ENV || 'webhook';

export const LOADER_VERSION = '1.2.2';

// Configuration
const REQUEST_TIMEOUT_MS = 15000; // 15 second timeout
const isDev = import.meta.env.DEV;

/**
 * Fetch with timeout and better error handling
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error: unknown) {
    if ((error as Error).name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Parse error from response with environment-aware detail level
 */
async function parseErrorResponse(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const data = await response.json();
    const errorMessage = data.error || data.message || fallbackMessage;

    if (isDev) {
      console.error('[ShopifyAdapter] Error:', { status: response.status, data });
    }

    return errorMessage;
  } catch {
    return fallbackMessage;
  }
}

/**
 * Helper to normalize backend array responses
 */
function normalizeResponse<T>(data: T | T[]): T {
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Helper to format Shopify GID
 */
function formatGid(id: string, type: string = 'Product'): string {
  if (/^\d+$/.test(id)) {
    return `gid://shopify/${type}/${id}`;
  }
  return id;
}

export class ShopifyAdapter implements PlatformAdapter {
  readonly platform = 'shopify' as const;

  async connect(subdomain: string, credentials: PlatformCredentials, userId?: string): Promise<ConnectResult> {
    const { clientId, clientSecret } = credentials;

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Shopify requires clientId and clientSecret' };
    }

    console.log('[Shopify Adapter] connect() called with:', {
      subdomain,
      userId,
      clientIdLen: clientId?.length,
      clientSecretLen: clientSecret?.length
    });

    try {
      // The provided snippet has a different URL and console.log, applying that specific change.
      console.log(`[Shopify Adapter] Sending config to webhook ${BACKEND_URL}/webhook/shopify/connect...`);
      const response = await fetch(`${BACKEND_URL}/webhook/shopify/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain, clientId, clientSecret, userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Connection failed`);
      }

      const data = normalizeResponse(await response.json());
      const shop = data?.shop;

      if (!shop) {
        throw new Error('Invalid response: Shop data missing');
      }

      return {
        success: true,
        store: {
          id: shop.id,
          name: shop.name,
          domain: shop.myshopify_domain || shop.domain,
          email: shop.email,
          currency: shop.currency,
          timezone: shop.timezone,
          locale: shop.primary_locale,
        },
        loader: {
          installed: data.loaderInstalled || false,
          version: data.loaderVersion,
          scriptId: data.loaderScriptTagId,
        },
        firebaseStoreId: data.storeId,
      };
    } catch (error: unknown) {
      return { success: false, error: (error as Error).message || 'Failed to connect to Shopify' };
    }
  }

  async enableLoader(subdomain: string, credentials: PlatformCredentials, userId?: string): Promise<EnableLoaderResult> {
    const { clientId, clientSecret } = credentials;

    const response = await fetch(`${BACKEND_URL}/${WEBHOOK_ENV}/shopify/enable-loader`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain, clientId, clientSecret, userId, version: LOADER_VERSION }),
    });

    if (!response.ok) {
      throw new Error('Failed to enable loader');
    }

    const data = normalizeResponse(await response.json());
    return {
      success: true,
      scriptId: data.scriptTagId,
      version: data.version || LOADER_VERSION,
    };
  }

  async disableLoader(subdomain: string, credentials: PlatformCredentials, userId?: string): Promise<void> {
    const { clientId, clientSecret } = credentials;

    // Disable the loader script tag ONLY (don't remove store from backend yet)
    const response = await fetch(`${BACKEND_URL}/${WEBHOOK_ENV}/shopify/disable-loader`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain, clientId, clientSecret, userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to disable loader');
    }
  }

  async disconnectStore(subdomain: string, credentials?: PlatformCredentials, userId?: string): Promise<void> {
    const shopDomain = `${subdomain}.myshopify.com`;
    if (credentials?.clientId && credentials?.clientSecret) {
      try {
        await this.disableLoader(subdomain, credentials, userId);
        console.log(`[Shopify Adapter] Successfully disabled loader config for ${shopDomain} during disconnect`);
      } catch (err) {
        console.warn(`[Shopify Adapter] Could not disable loader during disconnect for ${shopDomain}:`, err);
      }
    } else {
      console.log(`[Shopify Adapter] Disconnecting store ${shopDomain}`);
    }
  }

  async assignForm(
    subdomain: string,
    credentials: PlatformCredentials,
    formConfig: Record<string, unknown>,
    context?: AssignmentContext
  ): Promise<unknown> {
    // Backend architecture changed: assignments are managed in Firestore by the client.
    // The server reads them fresh on each /config request. No backend sync needed.
    console.log('[ShopifyAdapter] assignForm: form saved to Firestore by client.');
    return { success: true };
  }

  async removeForm(subdomain: string, credentials: PlatformCredentials, productId?: string): Promise<void> {
    // Backend architecture changed: assignments are managed in Firestore by the client.
    console.log('[ShopifyAdapter] removeForm: form removed from Firestore by client.');
  }

  async getAssignments(subdomain: string, credentials: PlatformCredentials): Promise<{ type: string; formId: string; productId?: string; storeId: string }[]> {
    const { clientId, clientSecret } = credentials;
    const shopDomain = `${subdomain}.myshopify.com`;

    const response = await fetchWithTimeout(`${BACKEND_URL}/${WEBHOOK_ENV}/shopify/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopDomain, clientId, clientSecret }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch assignments');
    }

    const data = normalizeResponse(await response.json());
    return data.assignments || [];
  }

  async fetchProducts(subdomain: string, credentials: PlatformCredentials): Promise<Product[]> {
    const { clientId, clientSecret } = credentials;

    const response = await fetch(`${BACKEND_URL}/${WEBHOOK_ENV}/shopify/get-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain, clientId, clientSecret }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const data = normalizeResponse(await response.json());
    return data.products || [];
  }

  async submitOrder(orderData: OrderData): Promise<unknown> {
    const response = await fetch(`${BACKEND_URL}/${WEBHOOK_ENV}/shopify/submit-order`, {
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

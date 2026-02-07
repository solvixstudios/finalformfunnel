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

const N8N_BACKEND_URL = import.meta.env.VITE_N8N_BACKEND_URL || 'https://your-n8n-instance.com';
const WEBHOOK_ENV = import.meta.env.VITE_N8N_WEBHOOK_ENV || 'webhook';

export const LOADER_VERSION = '1.1.0';

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
  } catch (error: any) {
    if (error.name === 'AbortError') {
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
 * Helper to normalize n8n array responses
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

  async connect(subdomain: string, credentials: PlatformCredentials): Promise<ConnectResult> {
    const { clientId, clientSecret } = credentials;
    
    if (!clientId || !clientSecret) {
      return { success: false, error: 'Shopify requires clientId and clientSecret' };
    }

    try {
      const response = await fetch(`${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain, clientId, clientSecret }),
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
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to connect to Shopify' };
    }
  }

  async enableLoader(subdomain: string, credentials: PlatformCredentials): Promise<EnableLoaderResult> {
    const { clientId, clientSecret } = credentials;
    
    const response = await fetch(`${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/enable-loader`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain, clientId, clientSecret }),
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

  async disableLoader(subdomain: string, credentials: PlatformCredentials): Promise<void> {
    const { clientId, clientSecret } = credentials;
    
    // Disable the loader script tag
    const response = await fetch(`${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/disable-loader`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subdomain, clientId, clientSecret }),
    });

    if (!response.ok) {
      throw new Error('Failed to disable loader');
    }

    // Also remove credentials from n8n data table
    const shopDomain = `${subdomain}.myshopify.com`;
    try {
      await fetch(`${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopDomain }),
      });
    } catch (e) {
      // Silently fail - credentials removal is secondary
      console.warn('Failed to remove credentials from n8n:', e);
    }
  }

  async assignForm(
    subdomain: string,
    credentials: PlatformCredentials,
    formConfig: Record<string, any>,
    context?: AssignmentContext
  ): Promise<any> {
    const { clientId, clientSecret } = credentials;
    
    // Merge context into form data
    const data = { ...formConfig, ...context };

    const payload: any = {
      subdomain,
      clientId,
      clientSecret,
      action: 'save',
      data,
    };

    // Add owner ID if product assignment
    if (context?.productId) {
      payload.ownerId = formatGid(context.productId);
    }

    const response = await fetch(`${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/master-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(() => ({}));
    const result = normalizeResponse(responseData);

    if (!response.ok || result.error || result.success === false) {
      throw new Error(result.error || result.message || 'Failed to sync form to Shopify');
    }

    return result;
  }

  async removeForm(subdomain: string, credentials: PlatformCredentials, ownerId?: string): Promise<void> {
    const { clientId, clientSecret } = credentials;
    
    const payload: any = {
      subdomain,
      clientId,
      clientSecret,
      action: 'delete',
    };

    if (ownerId) {
      payload.ownerId = formatGid(ownerId);
    }

    const response = await fetch(`${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/master-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to remove form from Shopify');
    }
  }

  async fetchProducts(subdomain: string, credentials: PlatformCredentials): Promise<Product[]> {
    const { clientId, clientSecret } = credentials;
    
    const response = await fetch(`${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/get-products`, {
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

  async submitOrder(orderData: OrderData): Promise<any> {
    const response = await fetch(`${N8N_BACKEND_URL}/${WEBHOOK_ENV}/submit-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Order submission failed');
    }

    return response.json();
  }
}

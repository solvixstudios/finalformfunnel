// API service for n8n backend communication

const N8N_BACKEND_URL =
  import.meta.env.VITE_N8N_BACKEND_URL || "https://your-n8n-instance.com";
const WEBHOOK_ENV = import.meta.env.VITE_N8N_WEBHOOK_ENV || "webhook";
export const LOADER_VERSION = "1.1.0";

export interface ShopifyShopInfo {
  id: number;
  name: string;
  email: string;
  domain: string;
  province?: string;
  country?: string;
  address1?: string;
  zip?: string;
  city?: string;
  phone?: string;
  primary_locale?: string;
  currency?: string;
  timezone?: string;
  myshopify_domain?: string;
}

export interface ShopifyConnectResponse {
  success: boolean;
  shop?: ShopifyShopInfo;
  error?: string;
  loaderInstalled?: boolean;
}

export async function connectToShopify(
  subdomain: string,
  clientId: string,
  clientSecret: string
): Promise<ShopifyConnectResponse> {
  try {
    const response = await fetch(
      `${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/connect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subdomain,
          clientId,
          clientSecret,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: Failed to verify connection`
      );
    }

    const data = await response.json();

    // Handle array response from n8n (e.g. [{ shop: ... }])
    const shopData = Array.isArray(data) ? data[0]?.shop : data.shop;

    if (!shopData) {
      throw new Error("Invalid response from server: Shop data missing");
    }

    return {
      success: true,
      shop: shopData,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to connect to Shopify",
    };
  }
}

export async function enableLoader(
  subdomain: string,
  clientId: string,
  clientSecret: string
) {
  const response = await fetch(
    `${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/enable-loader`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subdomain, clientId, clientSecret }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to enable loader");
  }

  return response.json();
}

export async function disableLoader(
  subdomain: string,
  clientId: string,
  clientSecret: string
) {
  const response = await fetch(
    `${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/disable-loader`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subdomain, clientId, clientSecret }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to disable loader");
  }

  return response.json();
}

export async function assignFormToShopify(
  subdomain: string,
  clientId: string,
  clientSecret: string,
  formConfig: any,
  productId?: string
) {
  const response = await fetch(
    `${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/assign-form`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subdomain,
        clientId,
        clientSecret,
        formConfig,
        productId,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to sync to Shopify Metafields");
  }

  return response.json();
}

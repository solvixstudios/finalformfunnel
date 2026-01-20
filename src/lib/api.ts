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
  clientSecret: string,
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
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: Failed to verify connection`,
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
  clientSecret: string,
) {
  const response = await fetch(
    `${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/enable-loader`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subdomain, clientId, clientSecret }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to enable loader");
  }

  const data = await response.json();
  // Handle array response from n8n (e.g. [{ success: true }])
  return Array.isArray(data) ? data[0] : data;
}

export async function disableLoader(
  subdomain: string,
  clientId: string,
  clientSecret: string,
) {
  const response = await fetch(
    `${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/disable-loader`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subdomain, clientId, clientSecret }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to disable loader");
  }

  const data = await response.json();
  // Handle array response from n8n (e.g. [{ success: true }])
  return Array.isArray(data) ? data[0] : data;
}

export async function assignFormToShopify(
  subdomain: string,
  clientId: string,
  clientSecret: string,
  formConfig: any,
  ownerId?: string,
  context?: {
    formId?: string;
    formName?: string;
    assignmentType?: string;
    storeId?: string;
    storeName?: string;
    shopifyDomain?: string;
    productId?: string;
    productHandle?: string;
  },
) {
  // Merge context into formConfig so it's saved in the metafield
  const data = { ...formConfig, ...context };

  const payload: any = {
    subdomain,
    clientId,
    clientSecret,
    action: "save",
    data,
  };

  if (ownerId) {
    if (/^\d+$/.test(ownerId)) {
      payload.ownerId = `gid://shopify/Product/${ownerId}`;
    } else {
      payload.ownerId = ownerId;
    }
  }

  const response = await fetch(
    `${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/master-sync`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  const responseData = await response.json().catch(() => ({}));

  // Handle array response from n8n
  const result = Array.isArray(responseData) ? responseData[0] : responseData;

  // Check for errors in response body (not just HTTP status)
  if (!response.ok || result.error || result.success === false) {
    throw new Error(
      result.error || result.message || "Failed to sync to Shopify Metafields",
    );
  }

  return result;
}

export async function removeFormFromShopify(
  subdomain: string,
  clientId: string,
  clientSecret: string,
  metafieldId?: string, // If we know the ID
  ownerId?: string, // To find the metafield if we don't know ID?
) {
  // Current n8n workflow expects 'metafieldId' for delete.
  // If we only have ownerId, we'd need to QUERY first.
  // The master workflow currently takes 'metafieldId' for delete.
  // To make it robust:
  // We should probably pass ownerId + key/namespace, and let n8n find and delete it.
  // But for now let's stick to the plan: likely we need to FIND it first.
  // Let's Assume the n8n "Delete" path does "Find ID by Owner+Key -> Delete".
  // I need to update the n8n workflow to support "Find and Delete" not just "Delete by ID".
  //
  // For now, I'll send ownerId and action "delete", and I'll update the n8n logic to Lookup-then-Delete.

  const payload: any = {
    subdomain,
    clientId,
    clientSecret,
    action: "delete",
  };

  if (ownerId) {
    if (/^\d+$/.test(ownerId)) {
      payload.ownerId = `gid://shopify/Product/${ownerId}`;
    } else {
      payload.ownerId = ownerId;
    }
  }

  const response = await fetch(
    `${N8N_BACKEND_URL}/${WEBHOOK_ENV}/shopify/master-sync`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to remove from Shopify");
  }

  return response.json();
}

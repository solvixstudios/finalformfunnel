/**
 * Shopify-related type definitions
 * Single source of truth for all Shopify request/response shapes
 */

// ── Store Records ───────────────────────────────────────────────

export interface StoreRecord {
    storeId: string;
    shopDomain: string;
    subdomain: string;
    clientId: string;
    clientSecret: string;
    accessToken: string;
    shopName: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface StoreLookup {
    userId: string;
    storeId: string;
    shopDomain: string;
    updatedAt: string;
}

export interface ProductConfigRecord {
    storeId: string;
    productId: string;
    formId?: string;
    formData: string;
    updatedAt: string;
}

export interface StoreConfigRecord {
    storeId: string;
    formId?: string;
    formData: string;
    updatedAt: string;
}

// ── Connect ─────────────────────────────────────────────────────

export interface ConnectBody {
    subdomain: string;
    clientId: string;
    clientSecret: string;
    userId: string;
}

export interface ConnectResponseData {
    storeId: string;
    shop: ShopInfo;
    loaderInstalled: boolean;
    loaderVersion: string | null;
    loaderScriptTagId: string | null;
    accessToken: string;
    credentialsStored: boolean;
}

export interface ShopInfo {
    id?: number;
    name?: string;
    email?: string;
    domain?: string;
    currency?: string;
    timezone?: string;
}

// ── Config ──────────────────────────────────────────────────────

export interface ConfigQuery {
    shop?: string;
    shopDomain?: string;
    productId?: string;
    productHandle?: string;
    userId?: string;
    formId?: string;
}

export interface ConfigResponseData {
    config: unknown | null;
    source?: 'product' | 'store';
}

// ── Save Config ─────────────────────────────────────────────────

export interface SaveConfigBody {
    shopDomain: string;
    clientId: string;
    clientSecret: string;
    formId: string;
    formData: unknown;
    userId: string;
    productId?: string;
    ownerId?: string; // backwards compat
}

// ── Products ────────────────────────────────────────────────────

export interface ProductsQuery {
    subdomain: string;
    userId: string;
    search?: string;
    limit?: string;
    page_info?: string;
}

// ── Submit Order ────────────────────────────────────────────────

export interface SubmitOrderBody {
    userId: string;
    shopDomain: string;
    name?: string;
    phone?: string;
    email?: string;
    wilaya?: string;
    commune?: string;
    address?: string;
    note?: string;
    shippingType?: 'home' | 'desk';
    shippingPrice?: number;
    quantity?: number;
    totalPrice?: number;
    currency?: string;
    variantId?: string;
    productTitle?: string;
    productId?: string;
    formId?: string;
    status?: string;
    items?: Array<{ title: string; quantity: number; price: number }>;
    googleSheetConfig?: {
        scriptUrl: string;
        sheetName?: string;
        abandonedSheetName?: string;
    };
    sheetPayload?: Record<string, unknown>;
    [key: string]: unknown;
}

// ── Loader ──────────────────────────────────────────────────────

export interface LoaderBody {
    subdomain: string;
    userId: string;
}

// ── Master Sync ─────────────────────────────────────────────────

export interface MasterSyncBody {
    subdomain: string;
    action?: 'save' | 'delete';
    ownerId?: string;
    data?: unknown;
    clientId: string;
    clientSecret: string;
    userId: string;
}

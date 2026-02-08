/**
 * Platform Adapter Types
 * Generic interfaces for e-commerce platform integrations
 */

export type PlatformType = 'shopify' | 'woocommerce';

// Credentials vary by platform
export interface PlatformCredentials {
  // Shopify Custom App
  clientId?: string;
  clientSecret?: string;
  // WooCommerce (plugin-based, simpler)
  accessToken?: string;
}

export interface StoreInfo {
  id: number | string;
  name: string;
  domain: string;
  email?: string;
  currency?: string;
  timezone?: string;
  locale?: string;
}

export interface LoaderStatus {
  installed: boolean;
  version?: string;
  scriptId?: string;
}

export interface ConnectResult {
  success: boolean;
  store?: StoreInfo;
  loader?: LoaderStatus;
  error?: string;
}

export interface EnableLoaderResult {
  success: boolean;
  scriptId?: string;
  version?: string;
  error?: string;
  upgraded?: boolean;
  alreadyInstalled?: boolean;
}

export interface Product {
  id: string;
  title: string;
  handle: string;
  image?: string;
  price?: number;
  variants?: Array<{
    id: string;
    title: string;
    price: number;
    option1?: string;
    option2?: string;
    option3?: string;
  }>;
}

export interface AssignmentContext {
  formId?: string;
  formName?: string;
  assignmentType?: 'store' | 'product';
  storeId?: string;
  storeName?: string;
  shopifyDomain?: string;
  productId?: string;
  productHandle?: string;
}

export interface OrderData {
  // Customer Info
  name: string;
  phone: string;
  wilaya: string;
  wilayaId?: string;
  commune?: string;
  address?: string;
  note?: string;
  // Delivery
  shippingType: 'home' | 'desk';
  // Product Selection
  offerId?: string;
  variant?: string;
  variantId?: number | string;
  quantity: number;
  // Pricing
  totalPrice: number;
  currency: string;
  promo?: string;
  // Store & Product Context
  shopDomain: string;
  shopName?: string;
  productId: string | number;
  productHandle?: string;
  // Line Items
  items: Array<{
    title: string;
    variant?: string;
    quantity: number;
    price: number;
  }>;
  // Allow additional fields
  [key: string]: any;
}

/**
 * Platform Adapter Interface
 * Each platform implements this to provide unified API
 */
export interface PlatformAdapter {
  readonly platform: PlatformType;

  // Connection
  connect(subdomain: string, credentials: PlatformCredentials, userId?: string): Promise<ConnectResult>;

  // Loader Management
  enableLoader(subdomain: string, credentials: PlatformCredentials): Promise<EnableLoaderResult>;
  disableLoader(subdomain: string, credentials: PlatformCredentials): Promise<void>;

  // Form Assignment
  assignForm(
    subdomain: string,
    credentials: PlatformCredentials,
    formConfig: Record<string, any>,
    context?: AssignmentContext
  ): Promise<any>;
  
  removeForm(
    subdomain: string,
    credentials: PlatformCredentials,
    ownerId?: string
  ): Promise<void>;

  // Products
  fetchProducts(subdomain: string, credentials: PlatformCredentials): Promise<Product[]>;

  // Orders
  submitOrder(orderData: OrderData): Promise<any>;
}

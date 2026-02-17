// User data
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  language: "ar" | "en" | "fr";
}

// Form configuration
export interface SavedForm {
  id: string;
  userId: string;
  name: string;
  description: string;
  config: Record<string, any>;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  type?: 'store' | 'product'; // Default to 'product' for backward compatibility
}

// Connected store
export interface ConnectedStore {
  id: string;
  userId: string;
  name: string;
  platform: "shopify" | "woocommerce";
  url: string;
  // Normalized Shopify domain for ownership tracking (e.g., "my-store.myshopify.com")
  shopifyDomain?: string;
  // Shopify Custom App credentials
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  // Legacy fields
  apiKey?: string;
  apiSecret?: string;
  status: "connected" | "disconnected" | "pending";
  // Loader status
  loaderInstalled?: boolean;
  loaderVersion?: string; // e.g., "1.0.0"
  loaderScriptTagId?: string; // Shopify script tag ID for tracking
  loaderInstalledAt?: string;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Store ownership tracking - one store per user
export interface StoreOwner {
  shopifyDomain: string; // Primary key (document ID)
  userId: string; // Owner's Firebase UID
  storeId: string; // Reference to stores collection
  connectedAt: string; // ISO timestamp
}

// Form assignment to store or product
export interface FormAssignment {
  id: string;
  userId: string;
  formId: string;
  storeId: string;
  shopifyDomain: string; // e.g., "my-store.myshopify.com"
  assignmentType: "store" | "product";
  // Product-level assignment fields
  productId?: string; // Shopify product ID
  productHandle?: string; // Shopify product handle (for URL matching)
  productTitle?: string; // For display purposes
  // Priority: product = 10, store = 1
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Store product (synced from store API)
export interface StoreProduct {
  id: string;
  userId: string;
  storeId: string;
  name: string;
  price: number;
  image?: string;
  externalId?: string; // ID from Shopify/WooCommerce
  handle?: string; // Shopify product handle
  createdAt: string;
  updatedAt: string;
}

// WhatsApp Integration
export interface WhatsAppProfile {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Order Item
export interface OrderItem {
  title: string;
  variant?: string;
  variantId?: number | string;
  quantity: number;
  price: number;
}

// Order submitted from form
export interface Order {
  id: string;
  // Customer Info
  customerName: string;
  phone: string;
  wilaya: string;
  wilayaId?: string;
  commune?: string;
  address?: string;
  note?: string;
  // Delivery
  shippingType: 'home' | 'desk';
  shippingCost?: number;
  // Product & Pricing
  items: OrderItem[];
  totalPrice: number;
  currency: string;
  offerId?: string;
  promoCode?: string;
  // Store Info
  storeId?: string;
  shopDomain: string;
  shopName?: string;
  productId?: string | number;
  // Shopify Integration
  shopifyDraftOrderId?: string;
  shopifyDraftOrderName?: string;
  // Status
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  source: 'form' | 'manual';
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

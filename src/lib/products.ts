/**
 * Shared product sync utilities for IndexedDB
 * Used by StoresPage, ProductsPage, and FormAssignmentDialog
 */

// --- Types ---

export interface ProductVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string | null;
  position: number;
  compare_at_price: string | null;
}

export interface Product {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  status: string;
  tags: string;
  variants: ProductVariant[];
  images: { id: number; product_id: number; src: string; alt: string | null }[];
  image: { id: number; product_id: number; src: string; alt: string | null } | null;
  created_at: string;
  updated_at: string;
  price?: string; // Add price property
}

export interface StoreCache {
  storeId: string;
  products: Product[];
  lastSynced: number;
}

// --- IndexedDB Configuration ---

const DB_NAME = "AddressSyncStudioDB";
const STORE_NAME = "productsCatalog";
const DB_VERSION = 2;

// --- IndexedDB Helpers ---

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "storeId" });
      }
    };
  });
};

export const saveProductsToCache = async (
  storeId: string,
  products: Product[],
): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const data: StoreCache = {
      storeId,
      products,
      lastSynced: Date.now(),
    };
    const request = store.put(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getProductsFromCache = async (
  storeId: string,
): Promise<StoreCache | undefined> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(storeId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

// --- Sync Function ---

interface SyncOptions {
  onProgress?: (count: number) => void;
  onComplete?: (products: Product[]) => void;
  onError?: (error: Error) => void;
}

export const syncProductsFromShopify = async (
  store: { id: string; url: string; clientId?: string; clientSecret?: string },
  options?: SyncOptions,
): Promise<Product[]> => {
  const allProducts: Product[] = [];
  let nextPageInfo: string | undefined = undefined;
  let hasMore = true;
  const cleanSubdomain = store.url
    .replace(".myshopify.com", "")
    .replace("https://", "")
    .replace(/\/$/, "");

  while (hasMore) {
    const response = await fetch(
      "https://finalform.app.n8n.cloud/webhook/shopify/products",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: cleanSubdomain,
          clientId: store.clientId,
          clientSecret: store.clientSecret,
          limit: 250,
          page_info: nextPageInfo,
        }),
      },
    );

    if (!response.ok) throw new Error("Fetch failed");

    const data = await response.json();

    let batch: Product[] = [];
    if (data.products) {
      batch =
        typeof data.products === "string"
          ? JSON.parse(data.products)
          : data.products;
      if ((batch as any).products) batch = (batch as any).products;
    }

    allProducts.push(...batch);
    options?.onProgress?.(allProducts.length);

    if (data.next_page_info) {
      nextPageInfo = data.next_page_info;
    } else {
      hasMore = false;
    }

    // Safety break
    if (allProducts.length > 50000) {
      hasMore = false;
    }
  }

  // Save to IndexedDB
  await saveProductsToCache(store.id, allProducts);
  options?.onComplete?.(allProducts);

  return allProducts;
};

// --- Event system for cross-component updates ---

type ProductSyncListener = (storeId: string, products: Product[]) => void;
const listeners: Set<ProductSyncListener> = new Set();

export const subscribeToProductSync = (listener: ProductSyncListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const notifyProductSyncComplete = (storeId: string, products: Product[]) => {
  listeners.forEach((listener) => listener(storeId, products));

  // Also dispatch window event for components that can't use the subscription pattern
  window.dispatchEvent(
    new CustomEvent("productSyncComplete", {
      detail: { storeId, products },
    }),
  );
};

import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { StoreOwner } from "./types";

/**
 * Normalize a store domain to a consistent format.
 * Removes protocol, trailing slashes, lowercases — safe for ALL platforms.
 */
export function normalizeStoreDomain(domain: string): string {
  if (!domain) return "";
  return domain
    .replace(/https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase()
    .trim();
}

/**
 * Extract the subdomain/identifier the backend expects, based on platform.
 * - Shopify: strips `.myshopify.com` → returns "my-store"
 * - WooCommerce: returns the full domain "example.com"
 */
export function getSubdomain(url: string, platform: 'shopify' | 'woocommerce' = 'shopify'): string {
  const clean = normalizeStoreDomain(url);
  if (platform === 'shopify') {
    return clean.replace('.myshopify.com', '');
  }
  // WooCommerce: backend expects the full domain
  return clean;
}

/**
 * Convert a domain to a safe document ID (Firebase doesn't allow slashes)
 * Replaces dots with underscores for the document ID
 */
function domainToDocId(domain: string): string {
  return normalizeStoreDomain(domain).replace(/\./g, "_");
}

/**
 * Check if a store domain is already owned by another user
 * @param storeDomain The store domain to check
 * @returns Object with ownership status and owner info if owned
 */
export async function checkStoreOwnership(storeDomain: string): Promise<{
  isOwned: boolean;
  ownerId?: string;
  storeId?: string;
}> {
  try {
    const docId = domainToDocId(storeDomain);
    const ownerDoc = await getDoc(doc(db, "storeOwners", docId));

    if (ownerDoc.exists()) {
      const data = ownerDoc.data() as StoreOwner;
      return {
        isOwned: true,
        ownerId: data.userId,
        storeId: data.storeId,
      };
    }

    return { isOwned: false };
  } catch (error) {
    console.error("Error checking store ownership:", error);
    // On error, don't block - just return not owned
    // This prevents network issues from blocking store connections
    return { isOwned: false };
  }
}

/**
 * Claim ownership of a store for a user
 * Creates or updates the storeOwners document
 * @param storeDomain The store domain to claim
 * @param userId The user's Firebase UID
 * @param storeId The store document ID in the stores collection
 */
export async function claimStoreOwnership(
  storeDomain: string,
  userId: string,
  storeId: string,
): Promise<void> {
  const docId = domainToDocId(storeDomain);
  const normalizedDomain = normalizeStoreDomain(storeDomain);

  const ownerData: StoreOwner = {
    storeDomain: normalizedDomain,
    userId,
    storeId,
    connectedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "storeOwners", docId), ownerData);
}

/**
 * Release ownership of a store (when disconnecting)
 * Deletes the storeOwners document
 * @param storeDomain The store domain to release
 */
export async function releaseStoreOwnership(storeDomain: string): Promise<void> {
  const docId = domainToDocId(storeDomain);
  await deleteDoc(doc(db, "storeOwners", docId));
}

/**
 * Check if the current user owns a specific store
 * Useful for validation before operations
 */
export async function isStoreOwnedByUser(
  storeDomain: string,
  userId: string,
): Promise<boolean> {
  const ownership = await checkStoreOwnership(storeDomain);
  return ownership.isOwned && ownership.ownerId === userId;
}

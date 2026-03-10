import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { StoreOwner } from "./types";

/**
 * Normalize a Shopify domain to a consistent format
 * Removes protocol, trailing slashes, and ensures .myshopify.com suffix
 */
export function normalizeShopifyDomain(domain: string): string {
  if (!domain) return "";
  return domain
    .replace(/https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase()
    .trim();
}

/**
 * Convert a domain to a safe document ID (Firebase doesn't allow slashes)
 * Replaces dots with underscores for the document ID
 */
function domainToDocId(domain: string): string {
  return normalizeShopifyDomain(domain).replace(/\./g, "_");
}

/**
 * Check if a Shopify domain is already owned by another user
 * @param shopifyDomain The Shopify domain to check (e.g., "my-store.myshopify.com")
 * @returns Object with ownership status and owner info if owned
 */
export async function checkStoreOwnership(shopifyDomain: string): Promise<{
  isOwned: boolean;
  ownerId?: string;
  storeId?: string;
}> {
  try {
    const docId = domainToDocId(shopifyDomain);
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
 * @param shopifyDomain The Shopify domain to claim
 * @param userId The user's Firebase UID
 * @param storeId The store document ID in the stores collection
 */
export async function claimStoreOwnership(
  shopifyDomain: string,
  userId: string,
  storeId: string,
): Promise<void> {
  const docId = domainToDocId(shopifyDomain);
  const normalizedDomain = normalizeShopifyDomain(shopifyDomain);

  const ownerData: StoreOwner = {
    shopifyDomain: normalizedDomain,
    userId,
    storeId,
    connectedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "storeOwners", docId), ownerData);
}

/**
 * Release ownership of a store (when disconnecting)
 * Deletes the storeOwners document
 * @param shopifyDomain The Shopify domain to release
 */
export async function releaseStoreOwnership(shopifyDomain: string): Promise<void> {
  const docId = domainToDocId(shopifyDomain);
  await deleteDoc(doc(db, "storeOwners", docId));
}

/**
 * Check if the current user owns a specific store
 * Useful for validation before operations
 */
export async function isStoreOwnedByUser(
  shopifyDomain: string,
  userId: string,
): Promise<boolean> {
  const ownership = await checkStoreOwnership(shopifyDomain);
  return ownership.isOwned && ownership.ownerId === userId;
}

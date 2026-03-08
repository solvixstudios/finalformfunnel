/**
 * Store Service
 * All Firestore operations for store management.
 * Manages users/{userId}/stores and the top-level store_domains lookup.
 */

import { db } from '../config/firebase';
import type { StoreRecord, StoreLookup } from '../types/shopify.types';
import { AppError } from '../middleware/errorHandler';

const sanitizeSubdomain = (domain: string) =>
    domain.toLowerCase().replace('.myshopify.com', '');

// ── Find Store ──────────────────────────────────────────────────

/**
 * Find a store by domain within a specific user's collection.
 */
export async function findStoreByDomain(userId: string, shopDomain: string) {
    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('stores')
        .where('shopDomain', '==', shopDomain)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, data: snapshot.docs[0].data() as StoreRecord };
}

/**
 * Find a store via the top-level store_domains lookup (no userId needed).
 * Used by the storefront loader.
 */
export async function findStoreByDomainGlobal(shopDomain: string) {
    const doc = await db.collection('store_domains').doc(shopDomain).get();
    if (!doc.exists) return null;
    return doc.data() as StoreLookup;
}

/**
 * Find a store and verify credentials match.
 */
export async function findStoreWithCredentials(
    userId: string,
    shopDomain: string,
    clientId: string,
    clientSecret: string
) {
    const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('stores')
        .where('shopDomain', '==', shopDomain)
        .where('clientId', '==', clientId)
        .where('clientSecret', '==', clientSecret)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, data: snapshot.docs[0].data() as StoreRecord };
}

// ── Create / Update Store ───────────────────────────────────────

import crypto from 'crypto';

/**
 * Create or update a store record and the store_domains lookup.
 */
export async function upsertStore(
    userId: string,
    shopDomain: string,
    data: {
        subdomain: string;
        clientId: string;
        clientSecret: string;
        accessToken: string;
        shopName: string;
    }
): Promise<string> {
    const storesRef = db.collection('users').doc(userId).collection('stores');
    const existing = await storesRef.where('shopDomain', '==', shopDomain).limit(1).get();

    let storeId: string;

    if (!existing.empty) {
        // Update existing
        const doc = existing.docs[0];
        storeId = doc.id;
        await doc.ref.update({
            accessToken: data.accessToken,
            shopName: data.shopName,
            updatedAt: new Date().toISOString(),
        });
    } else {
        // Create new
        storeId = crypto.randomUUID();
        await storesRef.doc(storeId).set({
            storeId,
            shopDomain,
            subdomain: data.subdomain,
            clientId: data.clientId,
            clientSecret: data.clientSecret,
            accessToken: data.accessToken,
            shopName: data.shopName,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    }

    // Write top-level lookup for storefront queries + ownership
    await db.collection('store_domains').doc(shopDomain).set(
        {
            userId,
            storeId,
            shopDomain,
            connectedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        { merge: true }
    );

    return storeId;
}

// ── Delete Store ────────────────────────────────────────────────

export async function deleteStore(userId: string, storeId: string) {
    const storeRef = db.collection('users').doc(userId).collection('stores').doc(storeId);
    const storeSnap = await storeRef.get();

    // Clean up store_domains lookup
    if (storeSnap.exists) {
        const data = storeSnap.data();
        if (data?.shopDomain) {
            await db.collection('store_domains').doc(data.shopDomain).delete().catch(() => { });
        }
    }

    await storeRef.delete();
}

// ── Get Credentials ─────────────────────────────────────────────

export async function getStoreCredentials(userId: string, shopDomain: string) {
    const store = await findStoreByDomain(userId, shopDomain);
    if (!store) throw AppError.badRequest('Store not connected. Please connect your store first.');
    if (!store.data.accessToken) throw AppError.badRequest('Store access token missing.');
    return store;
}

export { sanitizeSubdomain };

/**
 * useStoreAssignments — fetches form assignments from n8n (single source of truth).
 *
 * Replaces useFormAssignments (Firebase) with data fetched from the n8n
 * /shopify/assignments endpoint. Includes in-memory caching (60s TTL),
 * optimistic updates, and automatic refetching after mutations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ShopifyAdapter } from '../integrations/adapters/shopify';
import type { ConnectedStore } from '../firebase/types';

export interface N8nAssignment {
    type: 'store' | 'product';
    formId: string;
    productId?: string;
    storeId: string;
}

interface CacheEntry {
    data: N8nAssignment[];
    timestamp: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds
const cache = new Map<string, CacheEntry>();
const adapter = new ShopifyAdapter();

function getCacheKey(subdomain: string): string {
    return `assignments:${subdomain}`;
}

function getCached(key: string): N8nAssignment[] | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key: string, data: N8nAssignment[]): void {
    cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear cache for a specific store or all stores.
 * Call this after mutations (assign/remove) to force refetch.
 */
export function invalidateAssignmentsCache(subdomain?: string): void {
    if (subdomain) {
        cache.delete(getCacheKey(subdomain));
    } else {
        cache.clear();
    }
}

export function useStoreAssignments(stores: ConnectedStore[]) {
    const [assignments, setAssignments] = useState<N8nAssignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchIdRef = useRef(0);

    // Fetch assignments for all connected stores
    const fetchAssignments = useCallback(async () => {
        const connectedStores = stores.filter(s => s.status === 'connected' && s.clientId && s.clientSecret);
        if (connectedStores.length === 0) {
            setAssignments([]);
            return;
        }

        const fetchId = ++fetchIdRef.current;
        setLoading(true);
        setError(null);

        try {
            const results: N8nAssignment[] = [];

            for (const store of connectedStores) {
                const subdomain = (store.shopifyDomain || store.url || '').replace(/https?:\/\//, '').replace('.myshopify.com', '');
                if (!subdomain) continue;

                const cacheKey = getCacheKey(subdomain);
                const cached = getCached(cacheKey);

                if (cached) {
                    results.push(...cached);
                    continue;
                }

                try {
                    const storeAssignments = await adapter.getAssignments(subdomain, {
                        clientId: store.clientId!,
                        clientSecret: store.clientSecret!,
                    });

                    const typed = storeAssignments.map(a => ({
                        type: a.type as 'store' | 'product',
                        formId: a.formId,
                        productId: a.productId,
                        // Use the Firebase store.id (not the n8n UUID) so UI consumers
                        // can match assignments to stores via store.id
                        storeId: store.id,
                    }));

                    setCache(cacheKey, typed);
                    results.push(...typed);
                } catch (e: any) {
                    console.warn(`[useStoreAssignments] Failed to fetch for ${subdomain}:`, e.message);
                    // Continue with other stores — don't fail all for one store
                }
            }

            // Only update if this is still the latest fetch
            if (fetchId === fetchIdRef.current) {
                setAssignments(results);
            }
        } catch (e: any) {
            if (fetchId === fetchIdRef.current) {
                setError(e.message || 'Failed to fetch assignments');
            }
        } finally {
            if (fetchId === fetchIdRef.current) {
                setLoading(false);
            }
        }
    }, [stores]);

    // Auto-fetch on store changes
    useEffect(() => {
        fetchAssignments();
    }, [fetchAssignments]);

    // Refetch after mutations — call this after assignForm/removeForm
    const refetch = useCallback(() => {
        // Invalidate all caches to force fresh data
        invalidateAssignmentsCache();
        return fetchAssignments();
    }, [fetchAssignments]);

    return {
        assignments,
        loading,
        error,
        refetch,
    };
}

/**
 * Store Controller
 * Handles connect, disconnect, and getConfig endpoints.
 */

import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import * as storeService from '../services/store.service';
import * as configService from '../services/config.service';
import * as shopifyApi from '../services/shopify-api.service';

// ── POST /connect ───────────────────────────────────────────────

export async function connect(req: Request, res: Response) {
    const { subdomain, clientId, clientSecret, userId } = req.body;

    if (!subdomain || !clientId || !clientSecret || !userId) {
        throw AppError.badRequest('Missing required fields: subdomain, clientId, clientSecret, userId');
    }

    const cleanSubdomain = storeService.sanitizeSubdomain(subdomain);
    const shopDomain = `${cleanSubdomain}.myshopify.com`;

    // 1. Get access token from Shopify
    let accessToken: string;
    try {
        accessToken = await shopifyApi.getAccessToken(shopDomain, clientId, clientSecret);
    } catch (e: any) {
        throw AppError.unauthorized('Connection failed. Please verify your credentials.');
    }

    // 2. Fetch shop details
    let shopData: any;
    try {
        shopData = await shopifyApi.getShopInfo(shopDomain, accessToken);
    } catch (e: any) {
        throw AppError.internal('Failed to retrieve shop details');
    }

    // 3. Check existing ScriptTags
    let scriptTags: any[] = [];
    try {
        scriptTags = await shopifyApi.getScriptTags(shopDomain, accessToken);
    } catch (e: any) {
        console.error('Failed to get script tags:', e?.response?.data || e.message);
    }

    const loaderTags = shopifyApi.findAllLoaderTags(scriptTags);
    const loaderTag = loaderTags.length > 0 ? loaderTags[0] : undefined;
    const loaderInstalled = !!loaderTag;
    const loaderVersion = shopifyApi.parseLoaderVersion(loaderTag);

    // 4. Store credentials in Firestore
    const storeId = await storeService.upsertStore(userId, shopDomain, {
        subdomain: cleanSubdomain,
        clientId,
        clientSecret,
        accessToken,
        shopName: shopData?.name || cleanSubdomain,
    });

    res.json({
        success: true,
        storeId,
        shop: shopData,
        loaderInstalled,
        loaderVersion,
        loaderScriptTagId: loaderTag ? loaderTag.id.toString() : null,
        accessToken,
        credentialsStored: true,
    });
}

// ── POST /disconnect ────────────────────────────────────────────

export async function disconnect(req: Request, res: Response) {
    const { storeId, userId } = req.body;

    if (!storeId || !userId) {
        throw AppError.badRequest('Missing storeId or userId');
    }

    await storeService.deleteStore(userId, storeId);
    res.json({ success: true, message: 'Disconnected successfully' });
}

// ── GET /config ─────────────────────────────────────────────────

/**
 * Storefront config endpoint.
 * Resolves: store_domains → assignments → forms.
 * Returns raw form config for the loader.
 */
export async function getConfig(req: Request, res: Response) {
    const shopDomain = (req.query.shopDomain || req.query.shop) as string | undefined;
    const productId = req.query.productId as string | undefined;
    const userId = req.query.userId as string | undefined;

    if (!shopDomain) {
        throw AppError.badRequest('Missing shopDomain or shop query parameter');
    }

    let storeId: string;
    let resolvedUserId: string;

    if (userId) {
        // Admin panel path — find store under user's stores
        const store = await storeService.findStoreByDomain(userId, String(shopDomain));
        if (!store) throw AppError.notFound('Store not found');
        storeId = store.id;
        resolvedUserId = userId;
    } else {
        // Storefront loader path — use store_domains lookup (O(1))
        const lookup = await storeService.findStoreByDomainGlobal(String(shopDomain));
        if (!lookup) throw AppError.notFound('Store not found');
        storeId = lookup.storeId;
        resolvedUserId = lookup.userId;
    }

    // Prevent caching — form changes must appear immediately on refresh
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    });

    const result = await configService.getConfig(resolvedUserId, storeId, productId);

    if (result) {
        // Return raw config — loader accesses .offers, .shipping, .addons directly
        res.json({
            ...result.data,
            userId: resolvedUserId
        });
    } else {
        res.json({});
    }
}

// ── GET /assignments ────────────────────────────────────────────

export async function getAssignments(req: Request, res: Response) {
    const { shopDomain, clientId, clientSecret } = req.body;

    if (!shopDomain) {
        throw AppError.badRequest('Missing shopDomain');
    }

    // 1. Find store via global lookup to get userId & storeId
    const lookup = await storeService.findStoreByDomainGlobal(String(shopDomain));
    if (!lookup) {
        return res.json({ assignments: [] });
    }

    const { userId, storeId } = lookup;

    // 2. Fetch assignments via service
    const assignments = await storeService.getAssignmentsForStore(userId, storeId);

    res.json({ assignments });
}

/**
 * Loader Controller
 * Handles enable-loader and disable-loader endpoints.
 */

import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import * as storeService from '../services/store.service';
import * as shopifyApi from '../services/shopify-api.service';

const CURRENT_VERSION = '1.1.0';

// ── POST /enable-loader ─────────────────────────────────────────

export async function enableLoader(req: Request, res: Response) {
    const { subdomain, userId } = req.body;

    if (!subdomain || !userId) {
        throw AppError.badRequest('Missing subdomain or userId');
    }

    const cleanSubdomain = storeService.sanitizeSubdomain(subdomain);
    const shopDomain = `${cleanSubdomain}.myshopify.com`;

    const store = await storeService.getStoreCredentials(userId, shopDomain);
    const accessToken = store.data.accessToken;

    // Check existing scripts
    const scriptTags = await shopifyApi.getScriptTags(shopDomain, accessToken);
    const loaderTag = shopifyApi.findLoaderTag(scriptTags);

    if (loaderTag) {
        const existingVersion = shopifyApi.parseLoaderVersion(loaderTag);

        if (existingVersion === CURRENT_VERSION) {
            return res.json({
                success: true,
                version: existingVersion,
                alreadyInstalled: true,
                scriptTagId: String(loaderTag.id),
            });
        }

        // Upgrade: remove old, install new
        await shopifyApi.deleteScriptTag(shopDomain, accessToken, loaderTag.id);
    }

    // Install new loader
    const sfToken = await shopifyApi.createStorefrontToken(shopDomain, accessToken);
    const src = `https://finalformfunnel.web.app/finalform-loader.prod.js?sf_token=${sfToken}&v=${CURRENT_VERSION}`;
    const newTag = await shopifyApi.createScriptTag(shopDomain, accessToken, src);

    res.json({
        success: true,
        version: CURRENT_VERSION,
        alreadyInstalled: false,
        scriptTagId: String(newTag.id),
    });
}

// ── POST /disable-loader ────────────────────────────────────────

export async function disableLoader(req: Request, res: Response) {
    const { subdomain, userId } = req.body;

    if (!subdomain || !userId) {
        throw AppError.badRequest('Missing subdomain or userId');
    }

    const cleanSubdomain = storeService.sanitizeSubdomain(subdomain);
    const shopDomain = `${cleanSubdomain}.myshopify.com`;

    const store = await storeService.getStoreCredentials(userId, shopDomain);
    const accessToken = store.data.accessToken;

    const scriptTags = await shopifyApi.getScriptTags(shopDomain, accessToken);
    const loaderTag = shopifyApi.findLoaderTag(scriptTags);

    if (loaderTag) {
        await shopifyApi.deleteScriptTag(shopDomain, accessToken, loaderTag.id);
        return res.json({ success: true, removed: true, message: 'Loader disabled successfully!' });
    }

    res.json({ success: true, removed: false, message: 'Loader was not installed.' });
}

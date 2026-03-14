/**
 * Loader Controller
 * Handles enable-loader and disable-loader endpoints.
 */

import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import * as storeService from '../services/store.service';
import * as shopifyApi from '../services/shopify-api.service';

const CURRENT_VERSION = '1.1.0';

const installationLocks = new Set<string>();

// ── POST /enable-loader ─────────────────────────────────────────

export async function enableLoader(req: Request, res: Response) {
    const { subdomain, userId, version } = req.body;
    const requestedVersion = version || '2.2.1'; // Fallback if client didn't supply it

    if (!subdomain || !userId) {
        throw AppError.badRequest('Missing subdomain or userId');
    }

    const cleanSubdomain = storeService.sanitizeSubdomain(subdomain);
    const shopDomain = `${cleanSubdomain}.myshopify.com`;

    if (installationLocks.has(shopDomain)) {
        return res.status(429).json({ success: false, error: 'Installation already in progress. Please wait.' });
    }

    installationLocks.add(shopDomain);

    try {
        const store = await storeService.getStoreCredentials(userId, shopDomain);
        const accessToken = store.data.accessToken;

        // Check existing scripts
        const scriptTags = await shopifyApi.getScriptTags(shopDomain, accessToken);
        const loaderTags = shopifyApi.findAllLoaderTags(scriptTags);

        let alreadyInstalledId: string | null = null;
        let needsInstall = true;

        // Aggressively clean up all old/mismatched tags
        for (const tag of loaderTags) {
            const existingVersion = shopifyApi.parseLoaderVersion(tag);

            // If we found the exact version we want, keep this ONE tag and note it
            if (existingVersion === requestedVersion && !alreadyInstalledId) {
                alreadyInstalledId = String(tag.id);
                needsInstall = false;
            } else {
                // Delete duplicates or outdated versions
                await shopifyApi.deleteScriptTag(shopDomain, accessToken, tag.id);
            }
        }

        if (!needsInstall && alreadyInstalledId) {
            return res.json({
                success: true,
                version: requestedVersion,
                alreadyInstalled: true,
                scriptTagId: alreadyInstalledId,
            });
        }

        // Install new loader
        const origin = req.headers.origin || 'https://finalformfunnel.web.app';
        const sfToken = await shopifyApi.createStorefrontToken(shopDomain, accessToken);
        const src = `${origin}/finalform-loader.prod.js?sf_token=${sfToken}&v=${requestedVersion}`;
        const newTag = await shopifyApi.createScriptTag(shopDomain, accessToken, src);

        res.json({
            success: true,
            version: requestedVersion,
            alreadyInstalled: false,
            scriptTagId: String(newTag.id),
        });
    } finally {
        installationLocks.delete(shopDomain);
    }
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
    const loaderTags = shopifyApi.findAllLoaderTags(scriptTags);

    let removedAny = false;

    // Loop through ALL matching tags and destroy them
    for (const tag of loaderTags) {
        await shopifyApi.deleteScriptTag(shopDomain, accessToken, tag.id);
        removedAny = true;
    }

    if (removedAny) {
        return res.json({ success: true, removed: true, message: 'Loader disabled successfully!' });
    }

    res.json({ success: true, removed: false, message: 'Loader was not installed.' });
}


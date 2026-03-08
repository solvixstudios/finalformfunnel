/**
 * Sync Controller
 * Handles master-sync endpoint.
 */

import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import * as storeService from '../services/store.service';
import * as configService from '../services/config.service';

// ── POST /master-sync ───────────────────────────────────────────

export async function masterSync(req: Request, res: Response) {
    const { subdomain, action, ownerId, data: configData, clientId, clientSecret, userId } = req.body;

    if (!subdomain || !clientId || !clientSecret || !userId) {
        throw AppError.badRequest('Missing required fields: subdomain, clientId, clientSecret, userId');
    }

    const cleanSubdomain = storeService.sanitizeSubdomain(subdomain);
    const shopDomain = `${cleanSubdomain}.myshopify.com`;

    // Verify credentials
    const store = await storeService.findStoreWithCredentials(userId, shopDomain, clientId, clientSecret);
    if (!store) throw AppError.unauthorized('Invalid credentials or store not found');

    const syncAction = (action || 'save') as 'save' | 'delete';

    // Determine if product-level
    const productId = ownerId ? String(ownerId) : undefined;

    await configService.syncConfig(userId, store.id, syncAction, configData, productId);

    res.json({ success: true, message: `Config synced successfully (${syncAction})` });
}

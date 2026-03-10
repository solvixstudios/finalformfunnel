/**
 * Order Controller
 * Handles submit-order endpoint.
 */

import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import * as storeService from '../services/store.service';
import * as orderService from '../services/order.service';
import * as capiService from '../services/capi.service';
import * as googleSheetsService from '../services/googleSheets.service';

// ── POST /submit-order ──────────────────────────────────────────

export async function submitOrder(req: Request, res: Response) {
    const body = req.body;
    const userId = body.userId;
    const shopDomain = body.shopDomain;

    if (!shopDomain || !userId) {
        throw AppError.badRequest('Missing shopDomain or userId');
    }

    const cleanSubdomain = storeService.sanitizeSubdomain(shopDomain);
    const fullShopDomain = `${cleanSubdomain}.myshopify.com`;

    const store = await storeService.getStoreCredentials(userId, fullShopDomain);

    // Handle abandoned carts: just trigger Google Sheet and CAPI, no Shopify order
    if (body.status === 'abandoned') {
        if (body.googleSheetConfig?.scriptUrl) {
            googleSheetsService.triggerGoogleSheet(body.googleSheetConfig, body.sheetPayload || {
                ...body,
                sheetName: body.googleSheetConfig.sheetName,
                abandonedSheetName: body.googleSheetConfig.abandonedSheetName,
                action: 'abandoned',
            });
        }

        // Trigger CAPI for abandoned carts (InitiateCheckout will be sent by the service)
        capiService.sendMetaCAPI(body).catch((err) => console.error('Meta CAPI abandoned error:', err));
        capiService.sendTikTokCAPI(body).catch((err) => console.error('TikTok CAPI abandoned error:', err));

        return res.json({ success: true, message: 'Abandoned order tracked' });
    }

    // Create Shopify order
    const result = await orderService.createShopifyOrder(
        fullShopDomain,
        store.data.accessToken,
        body
    );

    if (!result.success) {
        return res.status(400).json({
            success: false,
            errorType: result.errorType,
            errors: result.errors,
        });
    }

    // Trigger Google Sheet async
    if (body.googleSheetConfig?.scriptUrl) {
        googleSheetsService.triggerGoogleSheet(body.googleSheetConfig, body.sheetPayload || {
            ...body,
            orderId: result.orderId,
            sheetName: body.googleSheetConfig.sheetName,
            abandonedSheetName: body.googleSheetConfig.abandonedSheetName,
            action: body.status || 'order',
        });
    }

    // Trigger CAPI for successful orders (Purchase / CompletePayment will be sent by the service)
    capiService.sendMetaCAPI(body).catch((err) => console.error('Meta CAPI purchase error:', err));
    capiService.sendTikTokCAPI(body).catch((err) => console.error('TikTok CAPI purchase error:', err));

    res.json({
        success: true,
        orderId: result.orderId,
        shopifyId: result.shopifyId,
        legacyId: result.legacyId,
        message: 'Order created successfully',
    });
}

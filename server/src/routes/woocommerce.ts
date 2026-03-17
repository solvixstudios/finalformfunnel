import { Router, Request, Response } from 'express';
import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { asyncHandler } from '../middleware/errorHandler';
import * as storeController from '../controllers/store.controller';
import * as capiService from '../services/capi.service';
import * as googleSheetsService from '../services/googleSheets.service';
import * as subscriptionService from '../services/subscription.service';

const router = Router();

/**
 * POST /webhook/woocommerce/verify
 * 
 * Called by the WordPress plugin when the user saves their installation key.
 * Writes to users/{userId}/stores subcollection (where the React frontend reads from).
 */
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
    try {
        const { key, domain, wc_version, wp_version, plugin_version } = req.body;

        console.log(`[WooCommerce Webhook] 📩 Incoming verify request — domain: ${domain}`);

        if (!key || typeof key !== 'string') {
            res.status(400).json({ status: 'error', message: 'Missing or invalid installation key.' });
            return;
        }

        if (!domain) {
            res.status(400).json({ status: 'error', message: 'Missing store domain.' });
            return;
        }

        // Expected format: ff_wc_<userId>_<hex>
        const parts = key.split('_');
        if (parts.length < 4 || parts[0] !== 'ff' || parts[1] !== 'wc') {
            res.status(400).json({ status: 'error', message: 'Invalid key format. Keys must start with ff_wc_.' });
            return;
        }

        const userId = parts[2];

        if (!userId) {
            res.status(400).json({ status: 'error', message: 'Key is missing a user identifier.' });
            return;
        }

        // 1. Verify user exists
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.warn(`[WooCommerce Webhook] ⚠️  User not found: ${userId}`);
            res.status(404).json({ status: 'error', message: 'User account not found. Please ensure you copied the key from your Final Form dashboard.' });
            return;
        }

        const rawDomain = domain.replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();

        // 2. Write to users/{userId}/stores subcollection
        const storesRef = db.collection('users').doc(userId).collection('stores');
        
        const querySnapshot = await storesRef
            .where('userId', '==', userId)
            .where('platform', '==', 'woocommerce')
            .where('storeDomain', '==', rawDomain)
            .limit(1)
            .get();

        let storeId: string;
        const now = new Date().toISOString();

        if (querySnapshot.empty) {
            const newStoreRef = storesRef.doc();
            storeId = newStoreRef.id;
            
            await newStoreRef.set({
                id: storeId,
                userId,
                platform: 'woocommerce',
                name: rawDomain,
                url: rawDomain,
                storeDomain: rawDomain,
                accessToken: key,
                status: 'connected',
                loaderInstalled: false,
                createdAt: now,
                updatedAt: now,
                settings: {
                    wcVersion: wc_version || null,
                    wpVersion: wp_version || null,
                    pluginVersion: plugin_version || null,
                },
            });
            console.log(`[WooCommerce Webhook] ✅ Created new store: ${rawDomain} → users/${userId}/stores/${storeId}`);
        } else {
            const existingStore = querySnapshot.docs[0];
            storeId = existingStore.id;
            
            await existingStore.ref.update({
                accessToken: key,
                status: 'connected',
                updatedAt: now,
                'settings.wcVersion': wc_version || null,
                'settings.wpVersion': wp_version || null,
                'settings.pluginVersion': plugin_version || null,
            });
        }

        // Write top-level lookup for storefront queries (e.g., FormLoader config fetch)
        await db.collection('store_domains').doc(rawDomain).set(
            {
                userId,
                storeId,
                shopDomain: rawDomain,
                connectedAt: now,
                updatedAt: now,
            },
            { merge: true }
        );

        res.json({
            status: 'ok',
            message: 'Store connected successfully!',
            store_id: storeId,
            domain: rawDomain,
        });
        
    } catch (error: any) {
        console.error('[WooCommerce Webhook Error]:', error);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while verifying the connection. Please try again.',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
        });
    }
});

/**
 * POST /webhook/woocommerce/disconnect
 * 
 * Called by the WordPress plugin when the user clicks "Disconnect".
 * Sets the store status to 'disconnected' in Firestore so the React app sees it instantly.
 */
router.post('/disconnect', async (req: Request, res: Response): Promise<void> => {
    try {
        const { key, domain } = req.body;

        console.log(`[WooCommerce Webhook] 🔌 Incoming disconnect request — domain: ${domain}`);

        if (!key || typeof key !== 'string') {
            res.status(400).json({ status: 'error', message: 'Missing or invalid installation key.' });
            return;
        }

        // Extract userId from key
        const parts = key.split('_');
        if (parts.length < 4 || parts[0] !== 'ff' || parts[1] !== 'wc') {
            res.status(400).json({ status: 'error', message: 'Invalid key format.' });
            return;
        }

        const userId = parts[2];
        if (!userId) {
            res.status(400).json({ status: 'error', message: 'Key is missing a user identifier.' });
            return;
        }

        const rawDomain = domain ? domain.replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase() : '';

        // Find the store by key or domain in users/{userId}/stores
        const storesRef = db.collection('users').doc(userId).collection('stores');
        let querySnapshot;

        if (rawDomain) {
            querySnapshot = await storesRef
                .where('userId', '==', userId)
                .where('platform', '==', 'woocommerce')
                .where('storeDomain', '==', rawDomain)
                .limit(1)
                .get();
        }

        // Fallback: find by accessToken
        if (!querySnapshot || querySnapshot.empty) {
            querySnapshot = await storesRef
                .where('accessToken', '==', key)
                .limit(1)
                .get();
        }

        if (querySnapshot.empty) {
            console.warn(`[WooCommerce Webhook] ⚠️  Store not found for disconnect: ${rawDomain || key}`);
            // Still return OK — the store might have already been removed from the app side
            res.json({ status: 'ok', message: 'Store already disconnected.' });
            return;
        }

        // Delete the store document so the React app's onSnapshot removes it from the list
        const storeDoc = querySnapshot.docs[0];
        await storeDoc.ref.delete();

        // Clean up store_domains lookup so the storefront loader stops fetching data
        await db.collection('store_domains').doc(rawDomain).delete().catch(() => {});

        console.log(`[WooCommerce Webhook] ✅ Disconnected store: ${rawDomain} → users/${userId}/stores/${storeDoc.id}`);

        res.json({
            status: 'ok',
            message: 'Store disconnected successfully.',
        });

    } catch (error: any) {
        console.error('[WooCommerce Disconnect Error]:', error);
        res.status(500).json({
            status: 'error',
            message: 'An internal error occurred while disconnecting.',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
        });
    }
});

/**
 * POST /webhook/woocommerce/get-products
 * 
 * Proxies product requests to the WP plugin's REST API.
 * The React app calls this to sync products from a connected WooCommerce store.
 */
router.post('/get-products', async (req: Request, res: Response): Promise<void> => {
    try {
        const { domain, accessToken, page = 1, per_page = 250 } = req.body;

        console.log(`[WooCommerce Products] 📦 Fetching products from ${domain} (page ${page})`);

        if (!domain || !accessToken) {
            res.status(400).json({ status: 'error', message: 'Missing domain or accessToken.' });
            return;
        }

        // Normalize domain to ensure it has https://
        const cleanDomain = domain.includes('://') ? domain : `https://${domain}`;
        const apiUrl = `${cleanDomain}/wp-json/finalform/v1/products?page=${page}&per_page=${per_page}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-FinalForm-Key': accessToken,
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[WooCommerce Products] ❌ WP REST API returned ${response.status}: ${errorText}`);
            res.status(response.status).json({
                status: 'error',
                message: `WordPress API returned ${response.status}`,
            });
            return;
        }

        const data = await response.json();

        res.json({
            status: 'ok',
            products: data.products || [],
            total: data.total || 0,
            page: data.page || page,
            per_page: data.per_page || per_page,
            total_pages: data.total_pages || 1,
        });

    } catch (error: any) {
        console.error('[WooCommerce Products Error]:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch products from WooCommerce.',
            details: process.env.NODE_ENV !== 'production' ? error.message : undefined,
        });
    }
});

/**
 * POST /webhook/woocommerce/submit-order
 * 
 * Handles order submission from the Final Form loader.
 * Proxies to the WP plugin to create native WC_Order.
 * Fires CAPI and Google Sheets.
 */
router.post('/submit-order', async (req: Request, res: Response): Promise<void> => {
    try {
        const body = req.body;
        const { userId, shopDomain, status, accessToken } = body;

        if (!shopDomain || !userId) {
            res.status(400).json({ status: 'error', message: 'Missing shopDomain or userId' });
            return;
        }

        // Check plan order limit (skip for abandoned carts)
        if (status !== 'abandoned') {
            const limitCheck = await subscriptionService.checkOrderLimit(userId);
            if (!limitCheck.allowed) {
                res.status(403).json({
                    success: false,
                    errorType: 'PLAN_LIMIT_EXCEEDED',
                    errors: [limitCheck.reason],
                });
                return;
            }
        }

        // Handle abandoned carts
        if (status === 'abandoned') {
            if (body.googleSheetConfig?.scriptUrl) {
                googleSheetsService.triggerGoogleSheet(body.googleSheetConfig, body.sheetPayload || {
                    ...body,
                    sheetName: body.googleSheetConfig.sheetName,
                    abandonedSheetName: body.googleSheetConfig.abandonedSheetName,
                    action: 'abandoned',
                });
            }

            capiService.sendMetaCAPI(body).catch((err) => console.error('Meta CAPI abandoned error:', err));
            capiService.sendTikTokCAPI(body).catch((err) => console.error('TikTok CAPI abandoned error:', err));

            res.json({ success: true, message: 'Abandoned order tracked' });
            return;
        }

        // Create native WooCommerce order
        const cleanDomain = shopDomain.includes('://') ? shopDomain : `https://${shopDomain}`;
        const apiUrl = `${cleanDomain}/wp-json/finalform/v1/orders`;

        const wpResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-FinalForm-Key': accessToken || '',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!wpResponse.ok) {
            const errorText = await wpResponse.text();
            console.error(`[WooCommerce Order] ❌ WP REST API returned ${wpResponse.status}: ${errorText}`);
            res.status(wpResponse.status).json({
                success: false,
                errorType: 'PLUGIN_ERROR',
                errors: [`WordPress API returned ${wpResponse.status}`],
            });
            return;
        }

        const wpData = await wpResponse.json();

        // Trigger Google Sheet async
        if (body.googleSheetConfig?.scriptUrl) {
            googleSheetsService.triggerGoogleSheet(body.googleSheetConfig, body.sheetPayload || {
                ...body,
                orderId: wpData.order_id,
                sheetName: body.googleSheetConfig.sheetName,
                abandonedSheetName: body.googleSheetConfig.abandonedSheetName,
                action: body.status || 'order',
            });
        }

        // Trigger CAPI for successful orders
        capiService.sendMetaCAPI(body).catch((err) => console.error('Meta CAPI purchase error:', err));
        capiService.sendTikTokCAPI(body).catch((err) => console.error('TikTok CAPI purchase error:', err));

        res.json({
            success: true,
            orderId: wpData.order_id,
            message: 'Order created successfully natively',
        });

    } catch (error: any) {
        console.error('[WooCommerce Submit Order Error]:', error);
        res.status(500).json({
            success: false,
            errorType: 'SYSTEM_ERROR',
            errors: ['Failed to process WooCommerce order'],
        });
    }
});

// ── Config (read-only — source of truth is Firebase assignments + forms) ──
router.get('/config', asyncHandler(storeController.getConfig));

export default router;

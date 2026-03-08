/**
 * Shopify Routes
 * Thin route definitions — all logic lives in controllers/services.
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as storeController from '../controllers/store.controller';
import * as loaderController from '../controllers/loader.controller';
import * as orderController from '../controllers/order.controller';
import * as productController from '../controllers/product.controller';

const router = Router();

// ── Store Management ────────────────────────────────────────────
router.post('/connect', asyncHandler(storeController.connect));
router.post('/disconnect', asyncHandler(storeController.disconnect));

// ── Config (read-only — source of truth is Firebase assignments + forms) ──
router.get('/config', asyncHandler(storeController.getConfig));

// ── Products ────────────────────────────────────────────────────
router.get('/products', asyncHandler(productController.getProducts));

// ── Loader ──────────────────────────────────────────────────────
router.post('/enable-loader', asyncHandler(loaderController.enableLoader));
router.post('/disable-loader', asyncHandler(loaderController.disableLoader));

// ── Orders ──────────────────────────────────────────────────────
router.post('/submit-order', asyncHandler(orderController.submitOrder));

export default router;

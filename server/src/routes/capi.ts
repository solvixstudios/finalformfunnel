/**
 * CAPI Routes (Conversion API)
 * Handles Meta and TikTok server-side tracking events.
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import * as capiService from '../services/capi.service';

const router = Router();

// ── POST /Meta_CAPI_Handler ─────────────────────────────────────

router.post('/Meta_CAPI_Handler', asyncHandler(async (req, res) => {
    const data = req.body.orderData || req.body;
    const result = await capiService.sendMetaCAPI(data);
    res.json(result);
}));

// ── POST /TikTok_CAPI_Handler ───────────────────────────────────

router.post('/TikTok_CAPI_Handler', asyncHandler(async (req, res) => {
    const data = req.body.orderData || req.body;
    const result = await capiService.sendTikTokCAPI(data);
    res.json(result);
}));

export default router;

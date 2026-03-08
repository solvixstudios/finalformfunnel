/**
 * CAPI Routes (Conversion API)
 * Handles Meta and TikTok server-side tracking events.
 */

import { Router } from 'express';
import { db } from '../config/firebase';
import axios from 'axios';
import crypto from 'crypto';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// ── Helpers ─────────────────────────────────────────────────────

function sha256(val?: string) {
    if (!val) return undefined;
    return crypto.createHash('sha256').update(val).digest('hex');
}

const getEventNameMeta = (status: string) => status === 'abandoned' ? 'InitiateCheckout' : 'Purchase';
const getEventNameTikTok = (status: string) => status === 'abandoned' ? 'InitiateCheckout' : 'CompletePayment';

const formatPhone = (phoneInput: any) => {
    let phone = phoneInput ? phoneInput.toString().replace(/\D/g, '') : '';
    if (phone.startsWith('05') || phone.startsWith('06') || phone.startsWith('07')) {
        phone = '213' + phone.substring(1);
    } else if (phone.startsWith('5') || phone.startsWith('6') || phone.startsWith('7')) {
        phone = '213' + phone;
    }
    return phone;
};

// ── POST /Meta_CAPI_Handler ─────────────────────────────────────

router.post('/Meta_CAPI_Handler', asyncHandler(async (req, res) => {
    const data = req.body.orderData || req.body;
    const profiles = data.metaPixelProfiles || [];

    // Backward compat for single profile
    if (profiles.length === 0 && data.pixelId) {
        profiles.push({ pixelId: data.pixelId, capiToken: data.capiToken, testCode: data.testCode });
    }

    if (profiles.length === 0) {
        return res.json({ success: true, message: 'No Meta CAPI profiles configured' });
    }

    const results = [];

    for (const profile of profiles) {
        if (!profile.capiToken) {
            results.push({ pixelId: profile.pixelId, success: false, error: 'Missing CAPI Token' });
            continue;
        }

        const phone = formatPhone(data.phone);
        const nameParts = data.name ? data.name.trim().split(/\s+/) : [];
        const fn = nameParts.length > 0 ? nameParts[0].toLowerCase() : undefined;
        const ln = nameParts.length > 1 ? nameParts.slice(1).join(' ').toLowerCase() : undefined;

        const user_data = {
            em: data.email ? sha256(data.email.trim().toLowerCase()) : undefined,
            ph: phone ? sha256(phone) : undefined,
            fn: fn ? sha256(fn) : undefined,
            ln: ln ? sha256(ln) : undefined,
            ct: data.commune ? sha256(data.commune.trim().toLowerCase()) : undefined,
            st: data.wilaya ? sha256(data.wilaya.trim().toLowerCase()) : undefined,
            country: sha256('dz'),
            fbp: data.fbp,
            fbc: data.fbc,
            client_ip_address: data.clientIp,
            client_user_agent: data.userAgent || data.client_user_agent,
        };

        const eventPayload = {
            event_name: getEventNameMeta(data.status),
            event_time: Math.floor(Date.now() / 1000),
            event_id: data.event_id,
            event_source_url: data.shopDomain,
            action_source: 'website',
            user_data,
            custom_data: {
                value: data.totalPrice,
                currency: 'DZD',
                content_ids: [data.productId],
                content_type: 'product',
                content_name: data.productTitle,
                num_items: data.quantity,
            },
        };

        try {
            const response = await axios.post(
                `https://graph.facebook.com/v19.0/${profile.pixelId}/events`,
                { data: [eventPayload], test_event_code: profile.testCode || undefined },
                { params: { access_token: profile.capiToken }, headers: { 'Content-Type': 'application/json' } }
            );
            results.push({ pixelId: profile.pixelId, success: true, metaResponse: response.data });
        } catch (err: any) {
            console.error(`Meta CAPI Error for ${profile.pixelId}:`, err?.response?.data || err.message);
            results.push({ pixelId: profile.pixelId, success: false, error: err?.response?.data || err.message });
        }
    }

    res.json({ success: true, results });
}));

// ── POST /TikTok_CAPI_Handler ───────────────────────────────────

router.post('/TikTok_CAPI_Handler', asyncHandler(async (req, res) => {
    const data = req.body.orderData || req.body;
    const profiles = data.tiktokPixelProfiles || [];

    if (profiles.length === 0 && data.abstractPixelId) {
        profiles.push({ pixelId: data.abstractPixelId, accessToken: data.accessToken, testCode: data.testCode });
    }

    if (profiles.length === 0) {
        return res.json({ success: true, message: 'No TikTok CAPI profiles configured' });
    }

    const results = [];

    for (const profile of profiles) {
        if (!profile.accessToken) {
            results.push({ pixelId: profile.pixelId, success: false, error: 'Missing Access Token' });
            continue;
        }

        const phone = formatPhone(data.phone);

        const payload = {
            pixel_code: profile.pixelId,
            event: getEventNameTikTok(data.status),
            event_id: data.event_id,
            timestamp: Math.floor(Date.now() / 1000),
            context: {
                user: {
                    email: data.email ? sha256(data.email.trim().toLowerCase()) : undefined,
                    phone_number: phone ? sha256(phone) : undefined,
                    ip: data.clientIp,
                    user_agent: data.userAgent || data.client_user_agent,
                },
                page: { url: data.shopDomain },
            },
            properties: {
                value: data.totalPrice,
                currency: 'DZD',
                contents: [{
                    content_id: String(data.productId),
                    content_type: 'product',
                    content_name: data.productTitle,
                    quantity: data.quantity,
                    price: data.quantity ? data.totalPrice / data.quantity : data.totalPrice,
                }],
            },
            test_event_code: profile.testCode || undefined,
        };

        try {
            const response = await axios.post(
                'https://business-api.tiktok.com/open_api/v1.3/pixel/track/',
                payload,
                { headers: { 'Content-Type': 'application/json', 'Access-Token': profile.accessToken } }
            );
            results.push({ pixelId: profile.pixelId, success: true, tiktokResponse: response.data });
        } catch (err: any) {
            console.error(`TikTok CAPI Error for ${profile.pixelId}:`, err?.response?.data || err.message);
            results.push({ pixelId: profile.pixelId, success: false, error: err?.response?.data || err.message });
        }
    }

    res.json({ success: true, results });
}));

export default router;

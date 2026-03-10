/**
 * Product Controller
 * Handles product listing endpoint.
 */

import { Request, Response } from 'express';
import { AppError } from '../middleware/errorHandler';
import * as storeService from '../services/store.service';
import * as shopifyApi from '../services/shopify-api.service';

// ── POST /get-products ───────────────────────────────────────────

export async function getProducts(req: Request, res: Response) {
    const { subdomain, clientId, clientSecret, search, limit, page_info } = req.body;

    if (!subdomain || !clientId || !clientSecret) {
        throw AppError.badRequest('Missing subdomain, clientId or clientSecret');
    }

    const cleanSubdomain = storeService.sanitizeSubdomain(String(subdomain));
    const shopDomain = `${cleanSubdomain}.myshopify.com`;

    let accessToken: string;
    try {
        accessToken = await shopifyApi.getAccessToken(shopDomain, clientId, clientSecret);
    } catch (e: any) {
        throw AppError.unauthorized('Invalid Shopify credentials');
    }

    // Build query params
    const queryParams: any = {
        limit: limit || 250,
        fields: 'id,title,handle,status,variants,options,images,vendor,product_type,published_at',
    };
    if (search && !page_info) queryParams.title = search;
    if (page_info) queryParams.page_info = page_info;

    // Fetch products
    const result = await shopifyApi.fetchProducts(shopDomain, accessToken, queryParams);

    // Get count (only on first page)
    let count = result.products.length;
    if (!page_info) {
        try {
            count = await shopifyApi.getProductCount(shopDomain, accessToken, search as string);
        } catch (e) {
            // Use fallback count
        }
    }

    res.json({
        success: true,
        count,
        products: result.products,
        next_page_info: result.next_page_info,
        prev_page_info: result.prev_page_info,
    });
}

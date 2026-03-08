/**
 * Shopify API Service
 * All direct Shopify REST/GraphQL API interactions.
 * Keeps API calls isolated from business logic.
 */

import axios, { AxiosError } from 'axios';

const API_VERSION = '2024-01';

function shopifyUrl(domain: string, path: string) {
    return `https://${domain}/admin/api/${API_VERSION}/${path}`;
}

// ── Authentication ──────────────────────────────────────────────

export async function getAccessToken(
    domain: string,
    clientId: string,
    clientSecret: string
): Promise<string> {
    try {
        const response = await axios.post(
            `https://${domain}/admin/oauth/access_token`,
            {
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
            },
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        return response.data.access_token;
    } catch (e: any) {
        const detail = e?.response?.data || e.message;
        throw new Error(`Failed to get Shopify access token: ${JSON.stringify(detail)}`);
    }
}

// ── Shop Info ───────────────────────────────────────────────────

export async function getShopInfo(domain: string, accessToken: string) {
    const response = await axios.get(shopifyUrl(domain, 'shop.json'), {
        headers: { 'X-Shopify-Access-Token': accessToken },
    });
    return response.data.shop;
}

// ── Script Tags ─────────────────────────────────────────────────

export async function getScriptTags(domain: string, accessToken: string) {
    const response = await axios.get(shopifyUrl(domain, 'script_tags.json'), {
        headers: { 'X-Shopify-Access-Token': accessToken },
    });
    return response.data.script_tags || [];
}

export async function createScriptTag(domain: string, accessToken: string, src: string) {
    const response = await axios.post(
        shopifyUrl(domain, 'script_tags.json'),
        { script_tag: { event: 'onload', src } },
        { headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' } }
    );
    return response.data.script_tag;
}

export async function deleteScriptTag(domain: string, accessToken: string, tagId: string | number) {
    await axios.delete(shopifyUrl(domain, `script_tags/${tagId}.json`), {
        headers: { 'X-Shopify-Access-Token': accessToken },
    });
}

// ── Storefront Access Token ─────────────────────────────────────

export async function createStorefrontToken(domain: string, accessToken: string): Promise<string> {
    const response = await axios.post(
        shopifyUrl(domain, 'storefront_access_tokens.json'),
        { storefront_access_token: { title: 'FinalForm Loader' } },
        { headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' } }
    );
    return response.data.storefront_access_token.access_token;
}

// ── Products ────────────────────────────────────────────────────

export async function fetchProducts(
    domain: string,
    accessToken: string,
    params: { limit?: number; title?: string; page_info?: string; fields?: string }
) {
    const response = await axios.get(shopifyUrl(domain, 'products.json'), {
        headers: { 'X-Shopify-Access-Token': accessToken },
        params,
    });

    // Parse pagination from Link header
    const linkHeader = response.headers['link'] || '';
    let next_page_info: string | null = null;
    let prev_page_info: string | null = null;

    if (linkHeader) {
        const links = linkHeader.split(',');
        for (const link of links) {
            if (link.includes('rel="next"')) {
                const match = link.match(/page_info=([^>&]+)/);
                if (match) next_page_info = match[1];
            }
            if (link.includes('rel="previous"')) {
                const match = link.match(/page_info=([^>&]+)/);
                if (match) prev_page_info = match[1];
            }
        }
    }

    return {
        products: response.data.products || [],
        next_page_info,
        prev_page_info,
    };
}

export async function getProductCount(
    domain: string,
    accessToken: string,
    search?: string
): Promise<number> {
    const response = await axios.get(shopifyUrl(domain, 'products/count.json'), {
        headers: { 'X-Shopify-Access-Token': accessToken },
        params: search ? { title: search } : {},
    });
    return response.data.count;
}

// ── Orders (GraphQL) ────────────────────────────────────────────

export async function executeGraphQL(
    domain: string,
    accessToken: string,
    query: string,
    variables: Record<string, unknown>
) {
    const response = await axios.post(
        `https://${domain}/admin/api/${API_VERSION}/graphql.json`,
        { query, variables },
        { headers: { 'X-Shopify-Access-Token': accessToken, 'Content-Type': 'application/json' } }
    );
    return response.data;
}

// ── Helpers ─────────────────────────────────────────────────────

export function findLoaderTag(scriptTags: any[]) {
    return scriptTags.find((t: any) => t.src && t.src.includes('finalform'));
}

export function parseLoaderVersion(tag: any): string | null {
    if (!tag?.src) return null;
    const match = tag.src.match(/[?&]v(?:ersion)?=([0-9]+\.[0-9]+\.[0-9]+)/);
    return match ? match[1] : null;
}

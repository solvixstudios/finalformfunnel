/**
 * Order Service
 * Business logic for Shopify order creation via GraphQL.
 * Handles phone normalization, address building, and Google Sheets triggers.
 */

import axios from 'axios';
import * as shopifyApi from './shopify-api.service';

// ── Phone Normalization ─────────────────────────────────────────

/**
 * Strict E.164 phone validation (Algeria-focused with international fallback).
 */
export function normalizePhone(rawPhone?: string): string | undefined {
    if (!rawPhone) return undefined;
    const cleaned = rawPhone.trim();
    const digits = cleaned.replace(/\D/g, '');

    let local = digits;
    if (local.startsWith('00213')) local = local.substring(5);
    else if (local.startsWith('213') && local.length > 10) local = local.substring(3);
    else if (local.startsWith('0') && local.length === 10) local = local.substring(1);

    if (local.length === 9 && /^[5-7]/.test(local)) {
        return '+213' + local;
    }

    if (cleaned.startsWith('+') && digits.length >= 10 && digits.length <= 15) {
        return '+' + digits;
    }

    return undefined;
}

// ── Address Builder ─────────────────────────────────────────────

export function buildShippingAddress(orderData: Record<string, any>, validPhone?: string) {
    const rawName = (orderData.name || '').trim();
    const parts = rawName.split(' ');
    const firstName = parts[0] || 'Guest';
    const lastName = parts.slice(1).join(' ') || '.';
    const wilaya = (orderData.wilaya || '').replace(/^\d+\s*-\s*/, '');
    const commune = orderData.commune || '';

    const address: Record<string, any> = {
        firstName,
        lastName,
        address1: orderData.address || commune || 'N/A',
        city: commune || wilaya || 'Algeria',
        province: wilaya,
        countryCode: 'DZ',
    };

    if (validPhone) address.phone = validPhone;
    return { address, firstName, lastName, wilaya, commune };
}

// ── Build Email ─────────────────────────────────────────────────

export function normalizeEmail(email?: string, validPhone?: string): string {
    if (email && email.indexOf('@') >= 0) return email;
    const suffix = validPhone ? validPhone.replace('+', '') : Date.now();
    return `guest.${suffix}@generated.local`;
}

// ── Order Creation ──────────────────────────────────────────────

const ORDER_CREATE_MUTATION = `mutation orderCreate($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
  orderCreate(order: $order, options: $options) {
    order { id name legacyResourceId }
    userErrors { field message }
  }
}`;

export interface CreateOrderResult {
    success: boolean;
    orderId?: string;
    shopifyId?: string;
    legacyId?: string;
    errorType?: string;
    errors?: string[];
}

export async function createShopifyOrder(
    shopDomain: string,
    accessToken: string,
    orderData: Record<string, any>
): Promise<CreateOrderResult> {
    const rawPhone = (orderData.phone || '').trim();
    const validPhone = normalizePhone(rawPhone);
    const email = normalizeEmail(orderData.email, validPhone);
    const { address, firstName, lastName, wilaya, commune } = buildShippingAddress(orderData, validPhone);

    // Build line items
    let lineItems: any[] = [];
    const qty = Number(orderData.quantity) || 1;

    if (orderData.variantId) {
        let vid = String(orderData.variantId);
        if (!vid.startsWith('gid://')) vid = 'gid://shopify/ProductVariant/' + vid;
        lineItems.push({ variantId: vid, quantity: qty, requiresShipping: true });
    } else {
        const items = orderData.items || [
            { title: orderData.productTitle || 'Product', price: orderData.totalPrice, quantity: qty },
        ];
        lineItems = items.map((item: any) => ({
            title: item.title || 'Product',
            quantity: Number(item.quantity) || 1,
            originalUnitPrice: String(item.price || 0),
            requiresShipping: true,
        }));
    }

    // Shipping lines
    const shippingLines: any[] = [];
    const shipCost = Number(orderData.shippingPrice) || 0;
    if (shipCost > 0) {
        shippingLines.push({
            title: orderData.shippingType === 'desk' ? 'Stop Desk' : 'Home Delivery',
            priceSet: {
                shopMoney: { amount: String(shipCost), currencyCode: orderData.currency || 'DZD' },
            },
        });
    }

    // Tags & attributes
    const tags = ['FinalForm', 'COD'];
    if (orderData.shippingType) tags.push(orderData.shippingType);

    const customAttributes: any[] = [];
    const addAttr = (k: string, v: string) => {
        if (v) customAttributes.push({ key: k, value: String(v) });
    };
    addAttr('Wilaya', wilaya);
    addAttr('Commune', commune);
    addAttr('Original Phone', rawPhone);
    addAttr('Validated Phone', validPhone || 'OMITTED');
    addAttr('Form ID', orderData.formId);

    const orderInput: any = {
        order: {
            lineItems,
            shippingLines,
            shippingAddress: address,
            billingAddress: address,
            email,
            note: orderData.note || '',
            customAttributes,
            tags,
            financialStatus: 'PENDING',
        },
        options: { inventoryBehaviour: 'BYPASS' },
    };
    if (validPhone) orderInput.order.phone = validPhone;

    // Execute GraphQL
    const gqlResult = await shopifyApi.executeGraphQL(shopDomain, accessToken, ORDER_CREATE_MUTATION, orderInput);

    if (gqlResult.errors) {
        return {
            success: false,
            errorType: 'GRAPHQL_SYSTEM',
            errors: gqlResult.errors.map((e: any) => e.message),
        };
    }

    const result = gqlResult.data?.orderCreate;
    if (!result) {
        return { success: false, errorType: 'NO_DATA', errors: ['No data returned from Shopify'] };
    }

    if (result.userErrors && result.userErrors.length > 0) {
        return {
            success: false,
            errorType: 'USER_ERROR',
            errors: result.userErrors.map((e: any) => e.field.join('.') + ': ' + e.message),
        };
    }

    return {
        success: true,
        orderId: result.order.name,
        shopifyId: result.order.id,
        legacyId: result.order.legacyResourceId,
    };
}

// ── Google Sheets Trigger ───────────────────────────────────────

export function triggerGoogleSheet(
    config: { scriptUrl: string; sheetName?: string; abandonedSheetName?: string },
    payload: Record<string, unknown>
) {
    // Fire-and-forget, don't block the response
    axios.post(config.scriptUrl, payload).catch((err) => {
        console.error('Google Sheet trigger error:', err.message);
    });
}

/**
 * Config Service
 * Reads form config by resolving assignments → forms.
 * Single source of truth: assignments + forms collections.
 * No more product_configs / store_configs.
 */

import { db } from '../config/firebase';

// ── Helpers ─────────────────────────────────────────────────────

function cleanProductId(rawId: string): string {
    let id = String(rawId).trim();
    if (id === 'null' || id === 'undefined') return '';
    const gidMatch = id.match(/^gid:\/\/shopify\/Product\/(.+)$/);
    if (gidMatch) id = gidMatch[1];
    return id;
}

// ── Types ───────────────────────────────────────────────────────

interface ResolvedConfig {
    data: Record<string, unknown>;
    source: 'product' | 'store';
    formId: string;
    formName: string;
}

// ── Get Config ──────────────────────────────────────────────────

/**
 * Get form config for a store, with product-level → store-level fallback.
 * Reads from assignments → forms (single source of truth).
 */
export async function getConfig(
    userId: string,
    storeId: string,
    productId?: string
): Promise<ResolvedConfig | null> {
    const assignmentsRef = db
        .collection('users')
        .doc(userId)
        .collection('assignments');

    // 1. Try product-level assignment first
    if (productId && productId !== 'null' && productId !== 'undefined') {
        const cleanId = cleanProductId(productId);
        if (cleanId) {
            console.log(`[configService] Looking for product assignment: storeId=${storeId}, productId=${cleanId}`);

            const productSnap = await assignmentsRef
                .where('storeId', '==', storeId)
                .where('assignmentType', '==', 'product')
                .where('isActive', '==', true)
                .get();

            // Match productId (could be string or number in Firestore)
            const match = productSnap.docs.find(doc => {
                const data = doc.data();
                return String(data.productId) === cleanId;
            });

            if (match) {
                const assignment = match.data();
                const formData = await resolveFormConfig(userId, assignment.formId);
                if (formData) {
                    console.log(`[configService] Found product-level config via form ${assignment.formId}`);
                    return {
                        data: formData.config,
                        source: 'product',
                        formId: assignment.formId,
                        formName: formData.name,
                    };
                }
            }
        }
    }

    // 2. Fallback to store-level assignment
    console.log(`[configService] Looking for store-level assignment: storeId=${storeId}`);

    const storeSnap = await assignmentsRef
        .where('storeId', '==', storeId)
        .where('assignmentType', '==', 'store')
        .where('isActive', '==', true)
        .limit(1)
        .get();

    if (!storeSnap.empty) {
        const assignment = storeSnap.docs[0].data();
        const formData = await resolveFormConfig(userId, assignment.formId);
        if (formData) {
            console.log(`[configService] Found store-level config via form ${assignment.formId}`);
            return {
                data: formData.config,
                source: 'store',
                formId: assignment.formId,
                formName: formData.name,
            };
        }
    }

    console.log(`[configService] No matching assignment found`);
    return null;
}

// ── Resolve Form Config ─────────────────────────────────────────

/**
 * Read the form document and resolve any addon references
 * (pixels, sheets, whatsapp profiles).
 */
async function resolveFormConfig(
    userId: string,
    formId: string
): Promise<{ name: string; config: Record<string, unknown> } | null> {
    const formSnap = await db
        .collection('users')
        .doc(userId)
        .collection('forms')
        .doc(formId)
        .get();

    if (!formSnap.exists) return null;

    const formData = formSnap.data()!;

    // Draft guard: never serve config for unpublished forms
    if (formData.status === 'draft') {
        console.log(`[configService] Form ${formId} is draft — skipping`);
        return null;
    }

    const config = { ...(formData.config || {}) } as Record<string, unknown>;
    const addons = (config.addons || {}) as Record<string, unknown>;

    // Resolve Google Sheets references
    if (Array.isArray(addons.selectedSheetIds) && addons.selectedSheetIds.length > 0) {
        try {
            const sheetDocs = await Promise.all(
                addons.selectedSheetIds.map((id: string) =>
                    db.collection('users').doc(userId).collection('google_sheets').doc(id).get()
                )
            );

            const sheets = sheetDocs
                .filter(s => s.exists)
                .map(s => {
                    const d = s.data()!;
                    return {
                        webhookUrl: d.webhookUrl,
                        sheetName: d.sheetName || 'Orders',
                        abandonedSheetName: d.abandonedSheetName,
                        columns: d.columns || [],
                        pinnedCount: d.pinnedCount ?? 3,
                    };
                });

            addons.sheets = sheets;
            addons.enableSheets = sheets.length > 0;
        } catch (e) {
            console.warn('[configService] Failed to resolve Google Sheets:', e);
        }
    }

    // Resolve Meta Pixel profiles
    if (Array.isArray(addons.metaPixelIds) && addons.metaPixelIds.length > 0) {
        try {
            const pixelDocs = await Promise.all(
                addons.metaPixelIds.map((id: string) =>
                    db.collection('users').doc(userId).collection('meta_pixels').doc(id).get()
                )
            );

            addons.metaPixels = pixelDocs
                .filter(p => p.exists)
                .map(p => ({ id: p.id, ...p.data() }));
        } catch (e) {
            console.warn('[configService] Failed to resolve Meta Pixels:', e);
        }
    }

    // Resolve TikTok Pixel profiles
    if (Array.isArray(addons.tiktokPixelIds) && addons.tiktokPixelIds.length > 0) {
        try {
            const ttDocs = await Promise.all(
                addons.tiktokPixelIds.map((id: string) =>
                    db.collection('users').doc(userId).collection('tiktok_pixels').doc(id).get()
                )
            );

            addons.tiktokPixels = ttDocs
                .filter(t => t.exists)
                .map(t => ({ id: t.id, ...t.data() }));
        } catch (e) {
            console.warn('[configService] Failed to resolve TikTok Pixels:', e);
        }
    }

    // Resolve WhatsApp profile
    if (addons.selectedWhatsappProfileId) {
        try {
            const waDoc = await db.collection('users')
                .doc(userId)
                .collection('whatsapp_profiles')
                .doc(addons.selectedWhatsappProfileId as string)
                .get();

            if (waDoc.exists) {
                const waData = waDoc.data();
                addons.whatsappProfile = { id: waDoc.id, ...waData };

                // Inject the phone number into the thankYou config for the frontend loader
                if (config.thankYou && typeof config.thankYou === 'object') {
                    (config.thankYou as any).whatsappNumber = waData?.phoneNumber;
                }
            }
        } catch (e) {
            console.warn('[configService] Failed to resolve WhatsApp profile:', e);
        }
    }

    // Resolve Offers Rule (or fallback to empty array to wipe legacy data)
    if (config.offerRuleId) {
        try {
            const offerRuleSnap = await db.collection('users').doc(userId).collection('offerRules').doc(config.offerRuleId as string).get();
            if (offerRuleSnap.exists) {
                const ruleData = offerRuleSnap.data();
                if (ruleData?.offers && Array.isArray(ruleData.offers)) {
                    config.offers = ruleData.offers;
                }
            }
        } catch (e) {
            console.warn('[configService] Failed to resolve Offers rule:', e);
        }
    } else {
        // Force empty array to purge legacy defaults from old Firestore docs
        config.offers = [];
    }

    // Resolve Shipping Rule (or fallback to free shipping to wipe legacy data)
    if (config.shippingRuleId) {
        try {
            const shippingRuleSnap = await db.collection('users').doc(userId).collection('shippingRules').doc(config.shippingRuleId as string).get();
            if (shippingRuleSnap.exists) {
                const ruleData = shippingRuleSnap.data();
                if (ruleData?.shipping) {
                    config.shipping = ruleData.shipping;
                }
            }
        } catch (e) {
            console.warn('[configService] Failed to resolve Shipping rule:', e);
        }
    } else {
        // Force free shipping to purge legacy defaults from old Firestore docs
        config.shipping = { standard: { home: 0, desk: 0 }, exceptions: [] };
    }

    // Resolve Coupons Rule
    if (config.couponRuleId) {
        try {
            const couponRuleSnap = await db.collection('users').doc(userId).collection('couponRules').doc(config.couponRuleId as string).get();
            if (couponRuleSnap.exists) {
                const ruleData = couponRuleSnap.data();
                if (ruleData?.coupons && Array.isArray(ruleData.coupons)) {
                    config.promoCode = {
                        enabled: ruleData.config?.enabled || false,
                        codes: ruleData.coupons
                    };
                }
            }
        } catch (e) {
            console.warn('[configService] Failed to resolve Coupons rule:', e);
        }
    } else if (!config.promoCode) {
        config.promoCode = { enabled: false, codes: [] };
    }

    config.addons = addons;

    return { name: formData.name || 'Untitled', config };
}

// ── Sync Config (master-sync endpoint) ──────────────────────────

/**
 * Called by the master-sync endpoint.
 * In the new architecture, assignments live in Firestore and the server
 * reads them on demand via getConfig(). This function exists as an
 * acknowledgment / logging hook; no writes are needed.
 */
export async function syncConfig(
    userId: string,
    storeId: string,
    action: 'save' | 'delete',
    _configData?: Record<string, unknown>,
    productId?: string
): Promise<void> {
    console.log(`[configService] syncConfig called: userId=${userId}, storeId=${storeId}, action=${action}, productId=${productId || 'store-level'}`);
    // No-op: assignments are managed in Firestore by the client.
    // The server reads them fresh on each /config request.
}

export { cleanProductId };

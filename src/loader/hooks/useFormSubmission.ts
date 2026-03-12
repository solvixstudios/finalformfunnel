import { useState } from 'react';
import { z } from 'zod';
import { collection, addDoc } from 'firebase/firestore/lite';
import { db } from '../firebase';
import { getCookie } from '@/lib/utils/cookies';
import { getAdapter } from '@/lib/integrations';
import type { Product } from '../FormLoader';
import type { FormConfig, OrderFormData, GoogleSheetColumn } from '@/types/form';
import type { Offer, AppliedPromoCode } from '@/types/offers';

interface FormSubmissionParams {
    config: FormConfig;
    product: Product;
    lang: 'fr' | 'ar';
    formData: OrderFormData;
    previewMode?: boolean;
    getWilayaRawName: (id: string) => string;
    offers: Offer[];
    selectedVariantId: number | null;
    calculations: Record<string, any>; // Consider typing this further if Calculations type exists
    basePrice: number;
    clientIp: string;
    appliedPromoCode: AppliedPromoCode | null;
    formContainerRef: React.RefObject<HTMLDivElement>;
}

export function useFormSubmission({
    config,
    product,
    lang,
    formData,
    previewMode = false,
    getWilayaRawName,
    offers,
    selectedVariantId,
    calculations,
    basePrice,
    clientIp,
    appliedPromoCode,
    formContainerRef
}: FormSubmissionParams) {
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [showThankYou, setShowThankYou] = useState(false);
    const [finalOrderData, setFinalOrderData] = useState<any>(null);
    const [abandonedSent, setAbandonedSent] = useState(false);

    const [formSessionId] = useState(() => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

    const fields = config.fields || ({} as FormConfig['fields']);

    const schema = z.object({
        name: fields?.name?.required ? z.string().min(2, lang === 'fr' ? 'Nom obligatoire' : 'الاسم مطلوب') : z.string().optional(),
        phone: fields?.phone?.required ? z.string().regex(/^(05|06|07)[0-9]{8}$/, lang === 'fr' ? 'Numéro invalide (05/06/07...)' : 'رقم غير صحيح') : z.string().optional(),
        wilaya: fields?.wilaya?.required ? z.string().min(1, lang === 'fr' ? 'Sélectionnez une wilaya' : 'اختر ولاية') : z.string().optional(),
        commune: (fields?.commune?.visible && fields?.commune?.required && config.locationInputMode !== 'single_dropdown')
            ? z.string().min(1, lang === 'fr' ? 'Sélectionnez une commune' : 'اختر بلدية')
            : z.string().optional(),
    });

    const buildPayload = (status: 'completed' | 'abandoned') => {
        const wilayaName = getWilayaRawName(formData.wilaya);
        const selectedOffer = offers.find((o) => o.id === formData.offerId) || offers[0];

        const sheets = config.addons?.sheets || [];
        if (sheets.length === 0 && config.addons?.sheetWebhookUrl) {
            sheets.push({
                webhookUrl: config.addons.sheetWebhookUrl,
                sheetName: 'Orders'
            });
        }
        const activeSheet = sheets[0];

        const basePayload = {
            ...formData,
            wilaya: wilayaName,
            wilayaId: formData.wilaya,
            variantId: selectedVariantId,
            totalPrice: calculations.displayedTotal,
            offerPrice: calculations.offerPrice,
            offerTitle: selectedOffer?.title?.[lang] || selectedOffer?.title?.fr || '',
            offerQty: selectedOffer?.qty || formData.quantity,
            currency: 'DZD',
            productId: product.id,
            productHandle: (product as any).handle || '',
            productTitle: product.title,
            shopName: config.storeName || window.location.hostname,
            shopDomain: config.storeDomain || window.location.hostname,
            promo: appliedPromoCode?.code || '',
            promoDiscount: appliedPromoCode?.discountValue || 0,
            shippingPrice: calculations.shippingCost,
            clientIp,
            items: [{
                title: product.title,
                variant: formData.variant,
                variantId: selectedVariantId,
                quantity: selectedOffer?.qty || formData.quantity,
                price: basePrice,
            }],
            metaPixelProfiles: config.addons?.pixelData || config.pixels || [],
            event_id: (window as any)._ff_event_id,
            fbp: getCookie('_fbp'),
            fbc: getCookie('_fbc'),
            tiktokPixelProfiles: config.addons?.tiktokPixelData || [],
            ttclid: getCookie('ttclid'),
            status,
            orderId: formSessionId,
            googleSheetConfig: activeSheet ? {
                scriptUrl: activeSheet.webhookUrl,
                sheetName: activeSheet.sheetName || 'Orders',
                abandonedSheetName: activeSheet.abandonedSheetName || 'Abandoned'
            } : undefined,
            userId: (config as any).userId || null,
            createdAt: new Date().toISOString()
        };

        if (activeSheet && activeSheet.webhookUrl) {
            (basePayload as Record<string, unknown>).sheetPayload = formatSheetPayload(
                basePayload as Record<string, unknown>,
                status,
                { sheetName: activeSheet.sheetName || 'Orders', columns: activeSheet.columns, pinnedCount: activeSheet.pinnedCount }
            );
        }

        return basePayload;
    };

    const formatSheetPayload = (
        data: Record<string, unknown>,
        status: 'completed' | 'abandoned',
        sheetConfig: { sheetName?: string; columns?: GoogleSheetColumn[]; pinnedCount?: number }
    ) => {
        const columns = sheetConfig.columns || [];
        const sheetName = sheetConfig.sheetName;
        const pinnedCount = sheetConfig.pinnedCount ?? 3;

        const rowData: Record<string, unknown> = {
            sheetName,
            orderStatus: status,
            submittedAt: new Date().toISOString(),
            _pinnedCount: pinnedCount,
        };

        const orderedColumns: { id: string; label: string }[] = [];
        const enabledCols = columns.filter((col) => Boolean(col.enabled));

        if (enabledCols.length === 0) {
            const raw = {
                ...data,
                sheetName,
                orderStatus: status,
                submittedAt: new Date().toISOString(),
                orderId: data.orderId || formSessionId,
                phone: data.phone ? "'" + data.phone : '' // Google sheets fix for leading zero
            };
            Object.keys(raw).forEach(k => {
                if (typeof raw[k] === 'object' && raw[k] !== null) {
                    raw[k] = JSON.stringify(raw[k]);
                }
            });
            return raw;
        }

        enabledCols.forEach((colRaw) => {
            const col = colRaw as { id: string; label: string };
            orderedColumns.push({ id: col.id, label: col.label });

            let value: unknown = '';
            switch (col.id) {
                case 'orderId': value = data.orderId || formSessionId; break;
                case 'date': value = new Date().toLocaleString(lang); break;
                case 'status': value = status === 'completed' ? 'Nouvelle commande' : 'Panier abandonné'; break;
                case 'name': value = data.name; break;
                case 'phone': value = data.phone ? "'" + data.phone : ''; break; // Prevent Google Sheets from dropping leading 0
                case 'wilaya': value = data.wilaya; break;
                case 'commune': value = data.commune; break;
                case 'address': value = data.address; break;
                case 'product': value = data.productTitle; break;
                case 'variant': value = data.variant; break;
                case 'quantity': value = data.offerQty || data.quantity; break;
                case 'unitPrice': value = data.offerPrice || data.totalPrice; break;
                case 'totalPrice': value = data.totalPrice; break;
                case 'shippingPrice': value = data.shippingPrice; break;
                case 'shippingType': value = data.shippingType === 'desk' ? 'Bureau' : 'Domicile'; break;
                case 'offerName': value = data.offerTitle || ''; break;
                case 'offerId': value = data.offerId || ''; break;
                case 'offerQuantity': value = data.offerQty || data.quantity; break;
                case 'wilayaId': value = data.wilayaId || ''; break;
                case 'promoCode': value = data.promo || ''; break;
                case 'note': value = data.note; break;
                case 'source': value = data.shopDomain || window.location.hostname; break;
                case 'ipAddress': value = clientIp || ''; break;
                default: value = data[col.id] || '';
            }

            if (typeof value === 'object' && value !== null) {
                rowData[col.id] = JSON.stringify(value);
            } else {
                rowData[col.id] = value;
            }
        });

        rowData._orderedColumns = orderedColumns;

        if (!rowData.orderId) {
            rowData.orderId = data.orderId || formSessionId;
        }

        if (status === 'completed') {
            rowData._updateExistingOrderId = rowData.orderId;
        }

        return rowData;
    };

    const handleFormSubmit = async () => {
        const result = schema.safeParse(formData);

        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                errors[issue.path[0] as string] = issue.message;
            });
            setFormErrors(errors);

            const firstErrorField = Object.keys(errors)[0];
            const container = formContainerRef.current || document;
            const el = container.querySelector(`[name="${firstErrorField}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            return;
        }
        setFormErrors({});

        const payload = buildPayload('completed');
        setFinalOrderData(payload);
        setSubmissionError(null);
        setIsSubmitting(true);

        if (!previewMode) {
            try {
                const pixelData = config.addons?.pixelData || config.pixels || [];
                if (pixelData.length > 0 && (window as any).fbq) {
                    try {
                        (window as any).fbq('track', 'Purchase', {
                            content_type: 'product',
                            content_ids: [product.id],
                            content_name: product.title,
                            currency: 'DZD',
                            value: calculations.displayedTotal,
                            num_items: formData.quantity,
                        }, { eventID: (window as any)._ff_event_id });
                    } catch (e) {
                        console.warn('FinalForm: Meta Pixel Error', e);
                    }
                }

                const tiktokData = config.addons?.tiktokPixelData || [];
                if (tiktokData.length > 0 && (window as any).ttq) {
                    try {
                        (window as any).ttq.track('CompletePayment', {
                            content_type: 'product',
                            content_id: String(product.id),
                            content_name: product.title,
                            quantity: formData.quantity,
                            price: calculations.offerPrice || basePrice,
                            value: calculations.displayedTotal,
                            currency: 'DZD',
                        }, { event_id: (window as any)._ff_event_id });
                    } catch (e) {
                        console.warn('FinalForm: TikTok Pixel Error', e);
                    }
                }

                const adapter = getAdapter((config as any).platform || 'shopify');
                await adapter.submitOrder(payload as unknown as Parameters<typeof adapter.submitOrder>[0]);

                if (import.meta.env.DEV) {
                    console.log("Order submitted successfully to backend");
                }

                // Direct write to Firebase Orders collection
                try {
                    if (payload.userId) {
                        await addDoc(collection(db, 'users', payload.userId as string, 'orders'), payload);
                    } else {
                        await addDoc(collection(db, 'orders'), payload);
                    }
                    if (import.meta.env.DEV) {
                        console.log("Order saved to Firebase");
                    }
                } catch (fbErr) {
                    console.warn("Failed to save order to Firebase:", fbErr);
                }

                setShowThankYou(true);
            } catch (err: unknown) {
                if (import.meta.env.DEV) {
                    console.error("Submission failed:", err);
                }
                setShowThankYou(true);
                setSubmissionError(err instanceof Error ? err.message : 'Submission failed');
            } finally {
                setIsSubmitting(false);
            }
        } else {
            setShowThankYou(true);
            setIsSubmitting(false);
        }
    };

    const logAbandonedOrder = async () => {
        if (previewMode || abandonedSent) return;

        const sheets = config.addons?.sheets || [];
        if (sheets.length === 0 && config.addons?.sheetWebhookUrl) {
            sheets.push({ webhookUrl: config.addons.sheetWebhookUrl, abandonedSheetName: 'Abandoned' });
        }
        const activeSheet = sheets[0];

        if (!activeSheet?.webhookUrl) return;

        try {
            const payload = buildPayload('abandoned');

            if (import.meta.env.DEV) {
                console.log("Logging abandoned order to backend...", payload);
            }

            const adapter = getAdapter((config as any).platform || 'shopify');
            adapter.submitOrder(payload as unknown as Parameters<typeof adapter.submitOrder>[0]).catch(err => console.error("Abandoned log failed", err));

            // Direct write abandoned to Firebase Orders collection
            try {
                if (payload.userId) {
                    await addDoc(collection(db, 'users', payload.userId as string, 'orders'), payload);
                } else {
                    await addDoc(collection(db, 'orders'), payload);
                }
            } catch (fbErr) {
                console.warn("Failed to save abandoned order to Firebase:", fbErr);
            }

            setAbandonedSent(true);

        } catch (e) {
            console.error("Failed to log abandoned order", e);
        }
    };

    const handleInputBlur = (field: string, value: string) => {
        if (field === 'phone') {
            const isValidPhone = /^(05|06|07)[0-9]{8}$/.test(value);
            if (isValidPhone) {
                logAbandonedOrder();
            }
        }
    };

    return {
        formErrors,
        setFormErrors,
        isSubmitting,
        submissionError,
        showThankYou,
        setShowThankYou,
        finalOrderData,
        handleFormSubmit,
        logAbandonedOrder,
        handleInputBlur
    };
}

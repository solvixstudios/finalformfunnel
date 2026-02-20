import { SectionLabel } from '@/components/FormTab/preview/components/SectionLabel';
import { ThankYouPopup } from '@/components/FormTab/preview/components/ThankYouPopup';
import {
    CtaButton,
    DeliverySection,
    HeaderSection,
    OffersSection,
    PromoCodeSection,
    StickyCTA,
    SummarySection,
    TrustBadgesSection,
    UrgencyQuantitySection,
    UrgencyTextSection,
    UrgencyTimerSection,
    VariantsSection
} from '@/components/FormTab/preview/sections';
// import { WILAYAS } from '@/lib/constants'; // Removed: Static Data
import { buildCtaStyles, buildInputStyles, buildRootStyles, buildSectionMargin, getFontFamilyCSS } from '@/lib/utils/cssEngine';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/formatting';
import { ChevronDown } from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { z } from 'zod'; // Import Zod

import { useCountdownTimer } from '@/components/FormTab/preview/hooks/useCountdownTimer';
import { usePreviewCalculations } from '@/components/FormTab/preview/hooks/usePreviewCalculations';
import { usePromoCode } from '@/components/FormTab/preview/hooks/usePromoCode';
import { useStickyObserver } from '@/components/FormTab/preview/hooks/useStickyObserver';
import { getAdapter } from '@/lib/integrations';
import { Commune, fetchCommunes, fetchWilayas, Wilaya } from '@/lib/location'; // New Location Utility
import { getCookie } from '@/lib/utils/cookies';

// Types
interface Variant {
    id: number;
    title: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    price: number | string;
    featured_image?: { src: string } | null;
}

interface Product {
    id: number;
    title: string;
    images: string[];
    variants: Variant[];
    options: { name: string; values: string[] }[];
    featuredImage?: { url: string };
    featured_image?: string;
}

export const FormLoader = ({ config, product, offers, shipping, sectionWrapper, previewMode = false }: { config: any, product: Product, offers: any[], shipping: any, sectionWrapper?: any, previewMode?: boolean }) => {
    // --- STATE ---
    const [lang, setLang] = useState<'fr' | 'ar'>(config.header?.defaultLanguage || 'fr');

    // Location Data
    const [wilayasList, setWilayasList] = useState<Wilaya[]>([]);
    const [communesList, setCommunesList] = useState<Commune[]>([]);
    const [loadingCommunes, setLoadingCommunes] = useState(false);

    // Client IP (for sheet logging)
    const [clientIp, setClientIp] = useState('');

    // --- CONSISTENT DATA HOOKS ---
    const tiktokData = useMemo(() => {
        let data = config.addons?.tiktokPixelData || [];

        // Robust Fallback for Legacy Configs
        if (data.length === 0) {
            // Check all known legacy locations
            const legacyId =
                config.addons?.tiktokPixelId ||
                config.tiktokPixelId ||
                config.addons?.tiktokPixel ||
                config.tiktokPixel ||
                // Last ditch: check if it's in 'pixels' but mistyped? Unlikely.
                null;

            if (legacyId) {
                data = [{ pixelId: legacyId }];
            }
        }

        // Debug: Log config to help diagnose missing data
        console.log('FinalForm: TikTok Config Debug', {
            hasData: data.length > 0,
            legacyIdFound: !!(config.addons?.tiktokPixelId || config.tiktokPixelId),
            configAddons: config.addons,
            fullConfigKeys: Object.keys(config)
        });

        return data;
    }, [config]);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        wilaya: '',
        commune: '',
        address: '',
        note: '',
        offerId: offers[0]?.id || '',
        variant: product?.variants?.[0]?.title || '',
        quantity: 1,
        shippingType: 'home' as 'home' | 'desk',
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // Error state

    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        product?.variants?.[0]?.id || null
    );

    // Track selected options (e.g. { "Size": "Small", "Color": "Red" })
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        const initialOptions: Record<string, string> = {};
        if (product?.options?.length && product.variants?.length > 0) {
            const firstVariant = product.variants[0];
            product.options.forEach((opt, index) => {
                const optKey = `option${index + 1}` as keyof Variant;
                if (!opt || !opt.name) return;
                const val = firstVariant[optKey];
                if (typeof val === 'string') {
                    initialOptions[opt.name] = val;
                }
            });
        }
        return initialOptions;
    });

    // Update variant ID when options change
    useEffect(() => {
        if (!product?.variants || !product?.options?.length) return;

        const match = product.variants.find(v => {
            return product.options.every((opt, index) => {
                if (!opt || !opt.name) return true;
                const optKey = `option${index + 1}` as keyof Variant;
                return v[optKey] === selectedOptions[opt.name];
            });
        });

        if (match) {
            setSelectedVariantId(match.id);
            setFormData(prev => ({ ...prev, variant: match.title }));
        }
    }, [selectedOptions, product]);

    const [showThankYou, setShowThankYou] = useState(false);
    const [finalOrderData, setFinalOrderData] = useState<any>(null); // To pass to popup
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [abandonedSent, setAbandonedSent] = useState(false);

    // Persistent Session ID for this form load (to match abandoned vs completed)
    const [formSessionId] = useState(() => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`);

    // Refs
    const ctaRef = useRef<HTMLDivElement>(null);
    const formContainerRef = useRef<HTMLDivElement>(null);

    // --- HOOKS ---
    const {
        promoCodeInput,
        setPromoCodeInput,
        appliedPromoCode,
        promoCodeError,
        promoCodeSuccess,
        handleApplyPromoCode,
        handleRemovePromoCode,
    } = usePromoCode(config.promoCode?.codes || []);

    const countdown = useCountdownTimer({
        enabled: config.urgencyTimer?.enabled || false,
        hours: config.urgencyTimer?.hours ?? 2,
        minutes: config.urgencyTimer?.minutes ?? 30,
        seconds: config.urgencyTimer?.seconds ?? 0,
    });

    const showStickyCTA = useStickyObserver({
        enabled: config.ctaSticky || false,
        targetRef: ctaRef,
        containerRef: formContainerRef,
        useWindowRoot: !previewMode,
    });

    // --- PRODUCT DATA HELPERS ---
    // Handle both default Shopify REST API (from .js) and Storefront/GraphQL shapes
    const getProductPrice = () => {
        if (!product) return 2500;
        const v = product.variants?.find(v => v.id === selectedVariantId) || product.variants?.[0];
        if (!v) return 2500;

        if (v.price && typeof v.price === 'object' && 'amount' in (v.price as any) && (v.price as any).amount) {
            return parseFloat((v.price as any).amount);
        }
        // REST API shape (price is number in cents) -> Convert to units
        if (v.price && typeof v.price === 'number') {
            return v.price / 100;
        }
        // REST API shape (string representation)
        if (v.price && typeof v.price === 'string') {
            return parseFloat(v.price);
        }
        return 2500;
    };

    const getProductImage = () => {
        if (!product) return undefined;
        // REST API
        if (product.featured_image) return product.featured_image;
        // Storefront API
        if (product.featuredImage?.url) return product.featuredImage.url;
        // Fallback arrays
        if (product.images?.[0]) {
            return typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any).src;
        }

        // Variant image
        const currentVariant = product.variants?.find(v => v.id === selectedVariantId);
        if (currentVariant?.featured_image?.src) {
            return currentVariant.featured_image.src;
        }

        return undefined;
    };

    const basePrice = getProductPrice();
    const productTitle = product?.title || 'Produit Demo';
    const productImage = getProductImage();

    const calculations = usePreviewCalculations({
        offers: offers as any,
        selectedOfferId: formData.offerId,
        shipping,
        selectedWilaya: formData.wilaya,
        shippingType: formData.shippingType,
        appliedPromoCode,
        hideShippingInSummary: config.hideShippingInSummary || false,
        basePricePerUnit: basePrice,
    });

    // --- EFFECTS ---
    useEffect(() => {
        if (offers.length > 0 && !offers.find((o: any) => o.id === formData.offerId)) {
            setFormData(prev => ({ ...prev, offerId: offers[0].id }));
        }
    }, [offers, formData.offerId]);

    // Reset abandoned sentinel if phone changes significantly? 
    // Actually, we usually only log once per session/form load to avoid spam. 
    // If user changes phone, maybe we should log again? 
    // For now, simple "once per load" is safer to prevent duplicates.

    // Fetch Wilayas on mount
    useEffect(() => {
        fetchWilayas().then(data => setWilayasList(data));
        // Fetch client IP silently
        fetch('https://api.ipify.org?format=json')
            .then(r => r.json())
            .then(d => setClientIp(d.ip || ''))
            .catch(() => { });
    }, []);

    // --- TRACKING EFFECTS ---
    useEffect(() => {
        // Initialize Meta Pixels
        const pixelData = config.addons?.pixelData || [];
        const pixelIds = config.addons?.metaPixelIds || [];

        // Fallback: If no pixelData but we have IDs (legacy), we can only init client-side if we knew the ID.
        // But for now, we rely on pixelData.
        // Actually, if we implemented getFormConfig to return 'pixels', we could use that.
        // But config.pixels might not be passed if using N8N.
        // Let's us pixelData from config primarily.

        const pixelsToInit = pixelData.length > 0 ? pixelData : (config.pixels || []);

        // DEBUG: Trace Pixel Logic
        console.log('FinalForm: Pixel Init Check', {
            pixelDataLength: pixelData.length,
            legacyPixelsLength: (config.pixels || []).length,
            previewMode,
            hasWindowFbq: !!(window as any).fbq
        });

        if (pixelsToInit.length > 0 && !previewMode) {
            console.log('FinalForm: Initializing Pixels...', pixelsToInit);
            // Inject Base Code
            if (!(window as any).fbq) {
                const f = (window as any).fbq = function () {
                    // @ts-ignore
                    f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments)
                };
                if (!(window as any)._fbq) (window as any)._fbq = f;
                // @ts-ignore
                f.push = f;
                // @ts-ignore
                f.loaded = true;
                // @ts-ignore
                f.version = '2.0';
                // @ts-ignore
                f.queue = [];
                const t = document.createElement('script');
                t.async = true;
                t.src = 'https://connect.facebook.net/en_US/fbevents.js';
                const s = document.getElementsByTagName('script')[0];
                s.parentNode!.insertBefore(t, s);
            }

            // Init Pixels
            pixelsToInit.forEach((p: any) => {
                (window as any).fbq('init', p.pixelId);
            });

            // Generate Event ID for Deduplication
            const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            (window as any)._ff_event_id = eventId; // Store globally for submit handler

            // PageView
            (window as any).fbq('track', 'PageView', {}, { eventID: eventId });

            // ViewContent (Product)
            if (product) {
                (window as any).fbq('track', 'ViewContent', {
                    content_type: 'product',
                    content_ids: [product.id],
                    content_name: product.title,
                    currency: 'DZD',
                    value: getProductPrice() || 0,
                }, { eventID: eventId });
            }
        }

        // --- TIKTOK PIXEL LOGIC ---
        // Using memoized tiktokData
        // Debug
        console.log('FinalForm: TikTok Init Check', {
            tiktokDataLength: tiktokData.length,
            hasWindowTtq: !!(window as any).ttq
        });

        if (tiktokData.length > 0 && !previewMode) {
            // Lazy Load TikTok Base Code
            if (!(window as any).ttq) {
                // Official TikTok Pixel Base Code
                // Reference: https://ads.tiktok.com/marketing_api/docs?id=1739584855420929
                (function (w: any, d: any, t: string) {
                    w.TiktokAnalyticsObject = t;
                    var ttq = w[t] = w[t] || [];
                    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
                    ttq.setAndDefer = function (t: any, e: any) {
                        t[e] = function () {
                            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
                        };
                    };
                    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
                    ttq.instance = function (t: any) {
                        for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
                        return e;
                    };
                    ttq.load = function (e: any, n: any) {
                        var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
                        ttq._i = ttq._i || {};
                        ttq._i[e] = [];
                        ttq._i[e]._u = r;
                        ttq._t = ttq._t || {};
                        ttq._t[e] = +new Date();
                        ttq._o = ttq._o || {};
                        ttq._o[e] = n || {};
                        var o = d.createElement("script");
                        o.type = "text/javascript";
                        o.async = true;
                        o.src = r + "?sdkid=" + e + "&lib=" + t;
                        var a = d.getElementsByTagName("script")[0];
                        a.parentNode.insertBefore(o, a);
                    };
                })(window, document, 'ttq');
            }

            // Init TikTok Pixels
            tiktokData.forEach((p: any) => {
                if ((window as any).ttq) {
                    (window as any).ttq.load(p.pixelId);
                    (window as any).ttq.page(); // Standard Page View
                }
            });

            // ViewContent for TikTok
            if (product && (window as any).ttq) {
                const productPrice = getProductPrice() || 0;
                (window as any).ttq.track('ViewContent', {
                    content_type: 'product',
                    content_id: String(product.id),
                    content_name: product.title,
                    price: productPrice,
                    value: productPrice,
                    currency: 'DZD',
                }, { event_id: (window as any)._ff_event_id });
            }
        }
    }, [config, product]); // Run once on mount (or config change)

    // InitiateCheckout (When valid phone number is entered)
    const hasInitiatedCheckout = useRef(false);

    useEffect(() => {
        // Algeria Phone Regex: Starts with 05, 06, or 07 and has 10 digits total
        const phoneRegex = /^(05|06|07)[0-9]{8}$/;
        const isValidPhone = phoneRegex.test(formData.phone);

        if (isValidPhone && !hasInitiatedCheckout.current && !previewMode && product) {
            console.log("FinalForm: Valid Phone - Firing InitiateCheckout");

            // Meta Pixel
            const pixelData = config.addons?.pixelData || config.pixels || [];
            if (pixelData.length > 0 && (window as any).fbq) {
                const eventId = (window as any)._ff_event_id;
                try {
                    (window as any).fbq('track', 'InitiateCheckout', {
                        content_type: 'product',
                        content_ids: [product.id],
                        content_name: product.title,
                        currency: 'DZD',
                        value: getProductPrice() || 0,
                        num_items: formData.quantity
                    }, { eventID: eventId });
                } catch (e) {
                    console.warn('FinalForm: Meta InitiateCheckout Error', e);
                }
            }

            // TikTok Pixel
            const tiktokData = config.addons?.tiktokPixelData || [];
            if (tiktokData.length > 0 && (window as any).ttq) {
                const eventId = (window as any)._ff_event_id;
                try {
                    (window as any).ttq.track('InitiateCheckout', {
                        content_type: 'product',
                        content_id: String(product.id),
                        content_name: product.title,
                        quantity: formData.quantity,
                        price: getProductPrice() || 0,
                        value: (getProductPrice() || 0) * formData.quantity,
                        currency: 'DZD',
                    }, { event_id: eventId });
                } catch (e) {
                    console.warn('FinalForm: TikTok InitiateCheckout Error', e);
                }
            }

            hasInitiatedCheckout.current = true;
        }
    }, [formData.phone, config, product, formData.quantity, previewMode]);

    // Bind interaction to container (Removed generic interaction handler)
    /* 
       Previously invoked handleInteraction() on click/input. 
       Now distinct events are fired specifically (e.g. InitiateCheckout on valid phone).
    */

    // Fetch Communes when Wilaya changes
    useEffect(() => {
        if (formData.wilaya) {
            setLoadingCommunes(true);
            fetchCommunes(formData.wilaya).then(data => {
                setCommunesList(data);
                setLoadingCommunes(false);
            });
            // handleInteraction removed: InitiateCheckout now strictly relies on phone validation.
        } else {
            setCommunesList([]);
        }
    }, [formData.wilaya]);

    // --- HELPERS ---
    // Backwards-compat: if config has `settings` wrapper but no top-level fields, unwrap it
    if (config.settings && !config.fields) {
        Object.assign(config, config.settings);
    }

    const translations = config.translations || {};
    // Revert to strict fields from config
    const fields = config.fields || {};
    const sectionSettings = config.sectionSettings || {};

    const txt = (key: string) => translations[key]?.[lang] || translations[key]?.fr || '';
    const getFieldTxt = (fieldKey: string) => fields[fieldKey]?.placeholder?.[lang] || fields[fieldKey]?.placeholder?.fr || '';
    const formatCurrency = (amount: number) => formatCurrencyUtil(amount, lang);
    const fontFamily = getFontFamilyCSS(config.fontFamily?.[lang] || (lang === 'fr' ? 'Inter' : 'Cairo'));

    // Section margin helper
    const getSectionMarginStyle = (isFirst: boolean = false) => buildSectionMargin(config as any, isFirst);

    // Input styling
    const inputSpacing = config.inputSpacing || 12;
    const svxInputClass = `custom-input w-full px-4 py-3.5 text-[13px] font-semibold outline-none transition-all duration-200 border-2 focus:ring-4`;
    const inputStyle = buildInputStyles(config as any, config.inputVariant || 'filled');

    // Validation Schema
    const schema = z.object({
        name: fields.name?.required ? z.string().min(2, lang === 'fr' ? 'Nom obligatoire' : 'الاسم مطلوب') : z.string().optional(),
        phone: fields.phone?.required ? z.string().regex(/^(05|06|07)[0-9]{8}$/, lang === 'fr' ? 'Numéro invalide (05/06/07...)' : 'رقم غير صحيح') : z.string().optional(),
        wilaya: fields.wilaya?.required ? z.string().min(1, lang === 'fr' ? 'Sélectionnez une wilaya' : 'اختر ولاية') : z.string().optional(),
        commune: (fields.commune?.visible && fields.commune?.required && config.locationInputMode !== 'single_dropdown')
            ? z.string().min(1, lang === 'fr' ? 'Sélectionnez une commune' : 'اختر بلدية')
            : z.string().optional(),
    });

    // Field visibility logic
    const getVisibleFields = () => {
        const fieldsToCheck = config.fields || {};
        const entries = Object.entries(fieldsToCheck)
            .filter(([key, field]: any) => field.visible && key !== 'location_block')
            .sort(([, a]: any, [, b]: any) => a.order - b.order);

        const result: any[] = [];
        let locationRendered = false;

        for (const [key, field] of entries) {
            if (key === 'wilaya' || key === 'commune' || key === 'address') {
                if (!locationRendered) {
                    result.push(['location_block', field]);
                    locationRendered = true;
                }
            } else {
                result.push([key, field]);
            }
        }
        return result;
    };

    const sortedFields = getVisibleFields();
    const isDoubleDropdown = config.locationInputMode === 'double_dropdown';
    const isSingleDropdown = config.locationInputMode === 'single_dropdown';
    const isFreeText = config.locationInputMode === 'free_text';
    const showLocationSideBySide = config.locationLayout === 'sideBySide' && isDoubleDropdown;

    // Variants (Static for now, should come from product)
    const variants = product?.variants?.filter(v => v).map((v: any) => v.title) || ['Modèle A', 'Modèle B', 'Modèle C'];

    // Delivery section visibility
    const showDeliverySection = shipping &&
        !config.hideDeliveryOption &&
        (config.enableHomeDelivery !== false || config.enableDeskDelivery !== false);

    // CTA styles (for sticky)
    const getCtaStyles = (): React.CSSProperties => {
        return buildCtaStyles({
            ctaColor: config.ctaColor,
            accentColor: config.accentColor,
            borderRadius: config.borderRadius,
            ctaVariant: config.ctaVariant,
            ctaAnimation: config.ctaAnimation
        });
    };

    // --- GOOGLE SHEETS HELPER ---
    const formatSheetPayload = (
        data: any,
        status: 'completed' | 'abandoned',
        sheetConfig: { sheetName: string; columns?: any[]; pinnedCount?: number }
    ) => {
        const columns = sheetConfig.columns || [];
        const sheetName = sheetConfig.sheetName;
        const pinnedCount = sheetConfig.pinnedCount ?? 3;

        // Metadata for the Apps Script
        const rowData: Record<string, any> = {
            sheetName,
            orderStatus: status,
            submittedAt: new Date().toISOString(),
            _pinnedCount: pinnedCount,
        };

        // Build ordered columns with labels for the Apps Script headers
        const orderedColumns: { id: string; label: string }[] = [];

        const enabledCols = columns.filter((col: any) => col.enabled);

        // If no columns configured (legacy), send flat payload
        if (enabledCols.length === 0) {
            const raw = {
                ...data,
                sheetName,
                orderStatus: status,
                submittedAt: new Date().toISOString(),
                orderId: data.orderId || formSessionId
            };
            Object.keys(raw).forEach(k => {
                if (typeof raw[k] === 'object' && raw[k] !== null) {
                    raw[k] = JSON.stringify(raw[k]);
                }
            });
            return raw;
        }

        enabledCols.forEach((col: any) => {
            orderedColumns.push({ id: col.id, label: col.label });

            let value: any = '';
            switch (col.id) {
                case 'orderId': value = data.orderId || formSessionId; break;
                case 'date': value = new Date().toLocaleString(lang); break;
                case 'status': value = status === 'completed' ? 'Nouvelle commande' : 'Panier abandonné'; break;
                case 'name': value = data.name; break;
                case 'phone': value = data.phone || ''; break;
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

        // Column order + labels for the Apps Script
        rowData._orderedColumns = orderedColumns;

        // Ensure orderId is always present for row matching
        if (!rowData.orderId) {
            rowData.orderId = data.orderId || formSessionId;
        }

        // On completed orders, tell script to find & update existing abandoned row
        if (status === 'completed') {
            rowData._updateExistingOrderId = rowData.orderId;
        }

        return rowData;
    };

    const handleFormSubmit = async () => {
        // Validate with Zod
        const result = schema.safeParse(formData);

        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                errors[issue.path[0] as string] = issue.message;
            });
            setFormErrors(errors);

            // Scroll to first error
            const firstErrorField = Object.keys(errors)[0];
            const container = formContainerRef.current || document;
            const el = container.querySelector(`[name="${firstErrorField}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            return;
        }
        setFormErrors({});

        // Resolve Wilaya Name — use rawName (plain, e.g. "Adrar") instead of display name ("01 - Adrar")
        const selectedWilayaObj = wilayasList.find(w => w.id === formData.wilaya);
        const wilayaName = selectedWilayaObj ? selectedWilayaObj.rawName : formData.wilaya;

        // Resolve selected offer
        const selectedOffer = offers.find((o: any) => o.id === formData.offerId) || offers[0];

        // Prepare Sheet Payload (Client-Side Formatting)
        const sheets = config.addons?.sheets || [];
        // Legacy fallback
        if (sheets.length === 0 && config.addons?.sheetWebhookUrl) {
            sheets.push({
                webhookUrl: config.addons.sheetWebhookUrl,
                sheetName: 'Orders'
            });
        }
        const activeSheet = sheets[0]; // Proxy first sheet config through n8n

        // Optimistic UI Data
        const payload = {
            ...formData,
            wilaya: wilayaName, // Pass plain name instead of ID
            wilayaId: formData.wilaya, // Keep ID just in case
            variantId: selectedVariantId,
            totalPrice: calculations.displayedTotal,
            offerPrice: calculations.offerPrice,
            offerTitle: selectedOffer?.title?.[lang] || selectedOffer?.title?.fr || '',
            offerQty: selectedOffer?.qty || formData.quantity,
            currency: 'DZD',
            productId: product.id,
            productHandle: (product as any).handle || '', // Include handle for Shopify matching
            productTitle: product.title,
            shopName: config.storeName || window.location.hostname,
            shopDomain: config.shopifyDomain || window.location.hostname, // Prioritize configured myshopify domain
            promo: appliedPromoCode?.code || '', // Include applied promo code
            promoDiscount: appliedPromoCode?.discountValue || 0,
            shippingPrice: calculations.shippingCost, // Add explicitly for Shopify Order
            clientIp,
            items: [{
                title: product.title,
                variant: formData.variant,
                variantId: selectedVariantId,
                quantity: selectedOffer?.qty || formData.quantity,
                price: basePrice,
            }],
            // Meta Pixel Payload
            metaPixelProfiles: config.addons?.pixelData || config.pixels || [],
            event_id: (window as any)._ff_event_id,
            fbp: getCookie('_fbp'),
            fbc: getCookie('_fbc'),
            // TikTok Pixel Payload
            tiktokPixelProfiles: config.addons?.tiktokPixelData || [],
            ttclid: getCookie('ttclid'),
            // Metadata for N8N routing
            status: 'completed',
            googleSheetConfig: activeSheet ? {
                scriptUrl: activeSheet.webhookUrl,
                sheetName: activeSheet.sheetName || 'Orders',
                abandonedSheetName: activeSheet.abandonedSheetName || 'Abandoned'
            } : undefined
        };

        // Attach formatted sheet payload if config exists
        if (activeSheet && activeSheet.webhookUrl) {
            (payload as any).sheetPayload = formatSheetPayload(
                payload,
                'completed',
                { sheetName: activeSheet.sheetName || 'Orders', columns: activeSheet.columns, pinnedCount: activeSheet.pinnedCount }
            );
        }

        setFinalOrderData(payload); // Pass to popup
        setSubmissionError(null);
        setIsSubmitting(true);

        if (!previewMode) {
            try {
                // Fire Pixels Optimistically (Check valid first? We are in try block, so client validation passed)

                // Fire Meta Purchase
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

                // Fire TikTok CompletePayment
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

                // Background submission (N8N handles Shopify + Sheets)
                const adapter = getAdapter('shopify');
                await adapter.submitOrder(payload);

                if (import.meta.env.DEV) {
                    console.log("Order submitted successfully to n8n");
                }

                setShowThankYou(true); // Show success after submission completes
            } catch (err: any) {
                if (import.meta.env.DEV) {
                    console.error("Submission failed:", err);
                }
                // Still show thank you for optimistic UX, but log error
                setShowThankYou(true);
                setSubmissionError(err.message || 'Submission failed');
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // Preview mode - just show thank you
            setShowThankYou(true);
            setIsSubmitting(false);
        }
    };

    const logAbandonedOrder = async () => {
        // Log if enabled AND (phone is valid OR we have enough info)
        if (previewMode || abandonedSent) return;

        // Check availability of sheets config
        const sheets = config.addons?.sheets || [];
        if (sheets.length === 0 && config.addons?.sheetWebhookUrl) {
            sheets.push({ webhookUrl: config.addons.sheetWebhookUrl, abandonedSheetName: 'Abandoned' });
        }
        const activeSheet = sheets[0];

        if (!activeSheet?.webhookUrl) return;

        try {
            // Resolve Wilaya Name for logging — use rawName (plain, e.g. "Adrar")
            const selectedWilayaObj = wilayasList.find(w => w.id === formData.wilaya);
            const wilayaName = selectedWilayaObj ? selectedWilayaObj.rawName : formData.wilaya;

            // Resolve selected offer
            const selectedOffer = offers.find((o: any) => o.id === formData.offerId) || offers[0];

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
                productTitle: product.title,
                shopName: config.storeName || window.location.hostname,
                shopDomain: config.shopifyDomain || window.location.hostname,
                promo: appliedPromoCode?.code || '',
                shippingPrice: calculations.shippingCost,
                clientIp,
                items: [{
                    title: product.title,
                    variant: formData.variant,
                    variantId: selectedVariantId,
                    quantity: selectedOffer?.qty || formData.quantity,
                    price: basePrice,
                }]
            };

            const sheetPayload = formatSheetPayload(
                { ...basePayload, orderId: formSessionId },
                'abandoned',
                { sheetName: activeSheet.sheetName || 'Orders', columns: activeSheet.columns, pinnedCount: activeSheet.pinnedCount }
            );

            // Send to N8N (status: abandoned)
            const n8nPayload = {
                ...basePayload,
                status: 'abandoned',
                googleSheetConfig: {
                    scriptUrl: activeSheet.webhookUrl,
                    sheetName: activeSheet.sheetName || 'Orders',
                    abandonedSheetName: activeSheet.abandonedSheetName || 'Abandoned'
                },
                sheetPayload,
                // Meta Pixel Payload
                metaPixelProfiles: config.addons?.pixelData || config.pixels || [],
                event_id: (window as any)._ff_event_id,
                fbp: getCookie('_fbp'),
                fbc: getCookie('_fbc')
            };

            if (import.meta.env.DEV) {
                console.log("Logging abandoned order to n8n...", n8nPayload);
            }

            const adapter = getAdapter('shopify');
            // Fire and forget - using submitOrder but with 'abandoned' status
            adapter.submitOrder(n8nPayload).catch(err => console.error("Abandoned log failed", err));

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

    // --- RENDER HELPERS ---
    const renderSectionBlock = (sectionId: string, content: React.ReactNode, index: number, ref?: React.RefObject<HTMLDivElement>) => {
        const style = getSectionMarginStyle(index === 0);

        if (sectionWrapper) {
            return (
                <React.Fragment key={sectionId}>
                    {sectionWrapper({
                        sectionId,
                        children: content,
                        style,
                        elementRef: ref
                    })}
                </React.Fragment>
            );
        }

        return (
            <div key={sectionId} style={style} ref={ref}>
                {content}
            </div>
        );
    };

    // --- RENDER ---
    return (
        <div
            className="ff-root w-full font-sans relative flex flex-col shadow-2xl select-none rounded-2xl overflow-hidden border border-slate-200/50"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            style={buildRootStyles(config as any, lang)}
        >
            <style>{`
                .custom-input::placeholder {
                    color: ${config.inputPlaceholderColor || '#94a3b8'} !important;
                    opacity: 1;
                }
                .error-ring {
                    border-color: #ef4444 !important;
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
                }
            `}</style>

            {showThankYou && (
                <ThankYouPopup
                    config={config}
                    lang={lang}
                    onClose={() => setShowThankYou(false)}
                    fixed={!previewMode}
                    orderData={finalOrderData}
                />
            )}

            {/* Header Section - Rendered OUTSIDE scroll container ONLY for 'hidden' style (floating language switcher) */}
            {config.header?.style === 'hidden' && (() => {
                const headerContent = (
                    <HeaderSection
                        config={config}
                        lang={lang}
                        onLanguageToggle={() => setLang(l => l === 'fr' ? 'ar' : 'fr')}
                        formatCurrency={formatCurrency}
                        basePrice={basePrice}
                        productTitle={productTitle}
                        productImage={productImage}
                    />
                );

                if (sectionWrapper) {
                    return (
                        <React.Fragment key="header-fixed">
                            {sectionWrapper({
                                sectionId: 'header',
                                children: headerContent,
                                style: { zIndex: 60, position: 'relative' },
                            })}
                        </React.Fragment>
                    );
                }
                return headerContent;
            })()}

            <div className="flex-1 overflow-y-auto custom-scroll relative" ref={formContainerRef}>
                {/* Header Section - Rendered INSIDE scroll container for all other styles (Classic, Centered, etc.) */}
                {config.header?.style !== 'hidden' && (() => {
                    const headerContent = (
                        <HeaderSection
                            config={config}
                            lang={lang}
                            onLanguageToggle={() => setLang(l => l === 'fr' ? 'ar' : 'fr')}
                            formatCurrency={formatCurrency}
                            basePrice={basePrice}
                            productTitle={productTitle}
                            productImage={productImage}
                        />
                    );

                    if (sectionWrapper) {
                        return (
                            <React.Fragment key="header-scroll">
                                {sectionWrapper({
                                    sectionId: 'header',
                                    children: headerContent,
                                    style: { zIndex: 40, position: 'relative' },
                                })}
                            </React.Fragment>
                        );
                    }
                    return headerContent;
                })()}

                <div className="p-5">
                    {(config.sectionOrder || []).map((sectionId: string, index: number) => {
                        // Variants
                        if (sectionId === 'variants') {
                            const hasEffectiveVariants = product?.variants && (
                                product.variants.length > 1 ||
                                (product.variants.length === 1 && product.variants[0].title !== 'Default Title')
                            );

                            if (!previewMode && product && !hasEffectiveVariants) {
                                return null;
                            }

                            return renderSectionBlock(
                                sectionId,
                                <VariantsSection
                                    config={config}
                                    lang={lang}
                                    variants={variants}
                                    options={(product?.options || []).filter((o: any) => o && o.name)}
                                    selectedOptions={selectedOptions}
                                    onOptionSelect={(optName, val) => {
                                        setSelectedOptions(prev => ({
                                            ...prev,
                                            [optName]: val
                                        }));
                                    }}
                                    selectedVariant={formData.variant}
                                    onSelect={(v) => {
                                        const varObj = product.variants?.find((pv: any) => pv.title === v);
                                        if (varObj) {
                                            setSelectedVariantId(varObj.id);
                                            setFormData({ ...formData, variant: v });
                                        } else {
                                            setFormData({ ...formData, variant: v });
                                        }
                                    }}
                                />,
                                index
                            );
                        }

                        // Shipping Form Fields
                        if (sectionId === 'shipping') {
                            return renderSectionBlock(
                                sectionId,
                                <div className="space-y-4">
                                    {config.sectionSettings?.shipping?.showTitle && (
                                        <SectionLabel accentColor={config.accentColor}>{txt('shipping')}</SectionLabel>
                                    )}
                                    <div>
                                        {sortedFields.map(([key, field]: any) => {
                                            if (key === 'location_block') {
                                                return (
                                                    <div key="location_block">
                                                        {(isSingleDropdown || isDoubleDropdown) && (
                                                            <div className={showLocationSideBySide ? 'grid grid-cols-2 gap-3' : 'space-y-0'} style={{ marginBottom: `${inputSpacing}px` }}>
                                                                <div className="relative">
                                                                    <select
                                                                        name="wilaya"
                                                                        value={formData.wilaya}
                                                                        onChange={(e) => setFormData({ ...formData, wilaya: e.target.value, commune: '' })}
                                                                        className={`${svxInputClass} appearance-none cursor-pointer ${formErrors.wilaya ? 'error-ring' : ''}`}
                                                                        style={{ ...inputStyle, marginBottom: showLocationSideBySide ? 0 : inputSpacing }}
                                                                    >
                                                                        <option value="">{getFieldTxt('wilaya') + (config.fields.wilaya?.required ? ' *' : '')}</option>
                                                                        {wilayasList.map(w => (
                                                                            <option key={w.id} value={w.id}>
                                                                                {lang === 'ar' ? w.ar_name : w.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 pointer-events-none`} color={config.inputPlaceholderColor || '#94a3b8'} size={16} />
                                                                </div>
                                                                {isDoubleDropdown && config.fields.commune?.visible && (
                                                                    <div className="relative">
                                                                        <select
                                                                            name="commune"
                                                                            value={formData.commune}
                                                                            onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                                                                            className={`${svxInputClass} appearance-none cursor-pointer ${formErrors.commune ? 'error-ring' : ''}`}
                                                                            style={{ ...inputStyle, marginBottom: 0 }}
                                                                            disabled={!formData.wilaya || loadingCommunes}
                                                                        >
                                                                            <option value="">{loadingCommunes ? 'Loading...' : getFieldTxt('commune') + (config.fields.commune?.required ? ' *' : '')}</option>
                                                                            {communesList.map(c => (
                                                                                <option key={c.pk} value={c.fields.name}>{c.fields.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 pointer-events-none`} color={config.inputPlaceholderColor || '#94a3b8'} size={16} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {isFreeText && config.fields.address?.visible !== false && (
                                                            <input
                                                                type="text"
                                                                name="address"
                                                                value={formData.address}
                                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                                placeholder={getFieldTxt('address') + (config.fields.address?.required ? ' *' : '')}
                                                                className={svxInputClass}
                                                                style={inputStyle}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            }

                                            if (key === 'name' || key === 'phone') {
                                                return (
                                                    <div key={key} className="relative">
                                                        <input
                                                            name={key}
                                                            type={key === 'phone' ? 'tel' : 'text'}
                                                            value={formData[key as keyof typeof formData] as string}
                                                            onChange={(e) => {
                                                                setFormData({ ...formData, [key]: e.target.value });
                                                                if (formErrors[key]) setFormErrors(prev => {
                                                                    const newErrors = { ...prev };
                                                                    delete newErrors[key];
                                                                    return newErrors;
                                                                });
                                                            }}
                                                            placeholder={getFieldTxt(key) + (field.required ? ' *' : '')}
                                                            className={`${svxInputClass} ${formErrors[key] ? 'error-ring' : ''}`}
                                                            style={inputStyle}
                                                            onFocus={() => {
                                                                // Optional: clear error on focus
                                                            }}
                                                            onBlur={(e) => handleInputBlur(key, e.target.value)}
                                                        />
                                                        {formErrors[key] && Object.keys(formErrors)[0] === key && (
                                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                                                                <div
                                                                    className="text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1"
                                                                    style={{ backgroundColor: config.accentColor || '#ef4444' }}
                                                                >
                                                                    <span>!</span>
                                                                    <span>{formErrors[key]}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            if (key === 'note') {
                                                return (
                                                    <textarea
                                                        key={key}
                                                        name="note"
                                                        value={formData.note}
                                                        onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                                        placeholder={getFieldTxt(key) + (field.required ? ' *' : '')}
                                                        className={`${svxInputClass} resize-none`}
                                                        style={inputStyle}
                                                        rows={2}
                                                        readOnly={false}
                                                    />
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>,
                                index
                            );
                        }

                        // Delivery Type
                        if (sectionId === 'delivery' && showDeliverySection) {
                            return renderSectionBlock(
                                sectionId,
                                <DeliverySection
                                    config={{ ...config, sectionSettings }}
                                    lang={lang}
                                    shippingType={formData.shippingType}
                                    onSelect={(type) => setFormData({ ...formData, shippingType: type })}
                                    formatCurrency={formatCurrency}
                                    homePrice={calculations.currentRates.home}
                                    deskPrice={calculations.currentRates.desk}
                                    showSection={showDeliverySection}
                                    hasWilaya={!!formData.wilaya}
                                />,
                                index
                            );
                        }

                        // Offers
                        if (sectionId === 'offers' && config.type !== 'store') {
                            return renderSectionBlock(
                                sectionId,
                                <OffersSection
                                    config={config}
                                    lang={lang}
                                    offers={offers as any}
                                    selectedOfferId={formData.offerId}
                                    onSelect={(id) => setFormData({ ...formData, offerId: id })}
                                    formatCurrency={formatCurrency}
                                    basePrice={basePrice}
                                />,
                                index
                            );
                        }

                        // Promo Code
                        if (sectionId === 'promoCode' && config.promoCode?.enabled) {
                            return renderSectionBlock(
                                sectionId,
                                <PromoCodeSection
                                    config={config}
                                    lang={lang}
                                    promoCodeInput={promoCodeInput}
                                    setPromoCodeInput={setPromoCodeInput}
                                    promoCodeError={promoCodeError}
                                    promoCodeSuccess={promoCodeSuccess}
                                    appliedPromoCode={appliedPromoCode}
                                    onApply={handleApplyPromoCode}
                                    onRemove={handleRemovePromoCode}
                                />,
                                index
                            );
                        }

                        // Summary
                        if (sectionId === 'summary' && config.enableSummarySection) {
                            return renderSectionBlock(
                                sectionId,
                                <SummarySection
                                    config={config}
                                    lang={lang}
                                    offerPrice={calculations.offerPrice}
                                    shippingCost={calculations.shippingCost}
                                    promoDiscount={calculations.promoDiscount}
                                    totalPromoDiscount={calculations.totalPromoDiscount}
                                    displayedTotal={calculations.displayedTotal}
                                    appliedPromoCode={appliedPromoCode}
                                    formatCurrency={formatCurrency}
                                />,
                                index
                            );
                        }

                        // CTA
                        if (sectionId === 'cta') {
                            return renderSectionBlock(
                                sectionId,
                                <CtaButton
                                    config={config}
                                    text={txt('cta') || (lang === 'fr' ? 'Commander maintenant' : 'اطلب الآن')}
                                    onClick={handleFormSubmit}
                                    isLoading={isSubmitting}
                                />,
                                index,
                                ctaRef
                            );
                        }

                        // Urgency Text
                        if (sectionId === 'urgencyText') {
                            return renderSectionBlock(
                                sectionId,
                                <UrgencyTextSection
                                    config={config}
                                    lang={lang}
                                />,
                                index
                            );
                        }

                        // Urgency Quantity (Stock)
                        if (sectionId === 'urgencyQuantity') {
                            return renderSectionBlock(
                                sectionId,
                                <UrgencyQuantitySection
                                    config={config}
                                    lang={lang}
                                />,
                                index
                            );
                        }

                        // Urgency Timer
                        if (sectionId === 'urgencyTimer') {
                            return renderSectionBlock(
                                sectionId,
                                <UrgencyTimerSection
                                    config={config}
                                    lang={lang}
                                    countdown={countdown}
                                />,
                                index
                            );
                        }

                        // Trust Badges
                        if (sectionId === 'trustBadges' && config.enableTrustBadges) {
                            return renderSectionBlock(
                                sectionId,
                                <TrustBadgesSection
                                    config={config}
                                    lang={lang}
                                />,
                                index
                            );
                        }

                        return null;
                    })}
                </div>
            </div>

            {/* Sticky CTA */}
            <StickyCTA
                variant={config.ctaStickyVariant}
                visible={showStickyCTA}
                text={txt('stickyLabel') || txt('cta')}
                onClick={() => ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                ctaStyles={getCtaStyles()}
                formBackground={config.formBackground || '#ffffff'}
                borderColor={config.inputBorderColor || '#e2e8f0'}
                textColor={config.textColor || '#334155'}
                accentColor={config.accentColor}
                productTitle={productTitle}
                productImage={productImage}
                totalPrice={formatCurrency(calculations.displayedTotal)}
                fixed={!previewMode}
            />
        </div >
    );
};

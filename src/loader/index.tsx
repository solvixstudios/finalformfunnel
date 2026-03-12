import '@/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FormLoader } from './FormLoader';

// Declare global variable defined in Vite config
declare const __APP_VERSION__: string;

const CONTAINER_ID = 'finalform-container';
const SPINNER_ID = 'finalform-spinner';

/**
 * Fetch product data from Shopify AJAX API
 */
async function fetchShopifyProduct() {
    try {
        // 1. Try getting from global objects first (fastest), BUT ensure it has key data
        const metaProduct = (window as any).meta?.product;
        if (metaProduct && metaProduct.id && metaProduct.title) {
            console.log('FinalForm: Found complete product in window.meta');
            return metaProduct;
        }
        // If meta.product exists but is incomplete (some themes only expose id), fall through to fetch .js

        // 2. Fallback to fetching .js
        if (window.location.pathname.includes('/products/')) {
            console.log('FinalForm: Fetching product.js...');
            const res = await fetch(window.location.pathname + '.js');
            if (res.ok) {
                const data = await res.json();
                console.log('FinalForm: Raw product data', data);
                // Shopify .js API usually returns { product: { ... } } or just { ... } depending on endpoint
                return data.product || data;
            }
        }
    } catch (e) {
        console.warn('FinalForm: Product fetch failed', e);
    }
    return null;
}

/**
 * Fetch product data from WooCommerce page globals
 */
function fetchWooCommerceProduct() {
    try {
        // WC injects product data via various globals
        const wcParams = (window as any).wc_single_product_params || (window as any).wc_product_params;
        
        // Try JSON-LD structured data (most reliable across WC themes)
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
            try {
                const data = JSON.parse(jsonLd.textContent || '');
                if (data['@type'] === 'Product' && data.name) {
                    return {
                        id: data.sku || data.productID || window.location.pathname.split('/product/')[1]?.replace(/\/$/, ''),
                        title: data.name,
                        handle: window.location.pathname.split('/product/')[1]?.replace(/\/$/, '') || '',
                        body_html: data.description || '',
                        variants: data.offers ? [{
                            id: data.sku || 'default',
                            title: 'Default',
                            price: data.offers.price || data.offers.lowPrice || '0',
                        }] : [{ id: 'default', title: 'Default', price: '0' }],
                        images: data.image ? [{ src: Array.isArray(data.image) ? data.image[0] : data.image }] : [],
                        image: data.image ? { src: Array.isArray(data.image) ? data.image[0] : data.image } : null,
                    };
                }
            } catch { /* ignore parse errors */ }
        }

        // Fallback: check for WC variation form data
        const variationForm = document.querySelector('.variations_form');
        if (variationForm) {
            const productData = variationForm.getAttribute('data-product_variations');
            const productId = variationForm.getAttribute('data-product_id');
            const titleEl = document.querySelector('.product_title, h1.entry-title');
            if (productId && titleEl) {
                return {
                    id: productId,
                    title: titleEl.textContent?.trim() || '',
                    handle: window.location.pathname.split('/product/')[1]?.replace(/\/$/, '') || '',
                    variants: productData ? JSON.parse(productData).map((v: any) => ({
                        id: v.variation_id,
                        title: Object.values(v.attributes || {}).join(' / ') || 'Default',
                        price: v.display_price,
                    })) : [{ id: productId, title: 'Default', price: '0' }],
                    images: [],
                    image: null,
                };
            }
        }
    } catch (e) {
        console.warn('FinalForm: WooCommerce product detection failed', e);
    }
    return null;
}

/**
 * Fetch config from backend webhook (Source of Truth)
 */
async function fetchConfigFromBackend(shop: string, productId?: string, productHandle?: string) {
    if (!shop) return null;
    console.log('FinalForm: Fetching config from backend...');

    try {
        // Construct URL for backend webhook
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
        if (!BACKEND_URL) {
            console.error('FinalForm: VITE_BACKEND_URL is not defined');
            return null;
        }
        const WEBHOOK_URL = `${BACKEND_URL}/webhook/shopify/config`;

        const url = new URL(WEBHOOK_URL);
        url.searchParams.append('shop', shop);
        if (productId) url.searchParams.append('productId', productId);
        if (productHandle) url.searchParams.append('productHandle', productHandle);
        // Cache-busting timestamp to prevent stale data
        url.searchParams.append('_t', Date.now().toString());

        const res = await fetch(url.toString(), {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'ngrok-skip-browser-warning': 'true',
                'Accept': 'application/json'
            }
        });

        if (!res.ok) {
            console.warn('FinalForm: Config fetch failed', res.status);
            return null;
        }

        const config = await res.json();

        if (!config || Object.keys(config).length === 0) {
            console.warn('FinalForm: Empty config returned');
            return null;
        }

        return config;

    } catch (e) {
        console.error('FinalForm: Config Fetch Error', e);
        return null;
    }
}

/**
 * Initialize the loader
 */
async function initLoader() {
    // Guard against duplicate initialization (e.g. multiple script tags on the page)
    if ((window as any).__FINALFORM_INITIALIZED__) {
        console.log('FinalForm: Already initialized, skipping duplicate.');
        return;
    }
    (window as any).__FINALFORM_INITIALIZED__ = true;

    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown';
    console.log(`FinalForm: Initializing v${version}...`);

    // 0. Inject Loading Spinner IMMEDIATELY
    if (!document.getElementById(SPINNER_ID)) {
        const spinnerStyle = document.createElement('style');
        spinnerStyle.textContent = `
            #${SPINNER_ID} {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 2147483646;
                width: 50px;
                height: 50px;
                background: white;
                border-radius: 50%;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transform: translateY(20px);
                transition: opacity 0.3s, transform 0.3s;
                pointer-events: none;
            }
            #${SPINNER_ID}.visible {
                opacity: 1;
                transform: translateY(0);
                pointer-events: auto;
            }
            .ff-spinner {
                width: 24px;
                height: 24px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #4f46e5;
                border-radius: 50%;
                animation: ff-spin 1s linear infinite;
            }
            @keyframes ff-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(spinnerStyle);

        const spinner = document.createElement('div');
        spinner.id = SPINNER_ID;
        spinner.innerHTML = '<div class="ff-spinner"></div>';
        document.body.appendChild(spinner);

        // Slight delay to fade in
        setTimeout(() => spinner.classList.add('visible'), 50);
    }

    // 1. Helper to parse script params
    const getScriptParams = () => {
        const scripts = document.querySelectorAll('script');
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src;
            if (src && (src.includes('finalform-loader.prod.js') || src.includes('finalform-loader.js') || src.includes('loader.js'))) {
                // Check data attributes first (WooCommerce plugin injects these)
                const dataStore = scripts[i].getAttribute('data-store');
                const dataPlatform = scripts[i].getAttribute('data-platform');
                const result: Record<string, string> = {};
                if (dataStore) result.shop = dataStore;
                if (dataPlatform) result.platform = dataPlatform;

                // Also check query params (Shopify uses these)
                try {
                    const url = new URL(src);
                    const entries = Object.fromEntries(url.searchParams.entries());
                    return { ...entries, ...result }; // data attributes take priority
                } catch (e) {
                    if (Object.keys(result).length > 0) return result;
                }
            }
        }
        return {};
    };

    const params = getScriptParams();
    const shop = params.shop || window.location.hostname;
    const detectedPlatform = params.platform || 'shopify';

    // 2. Identify Product Context
    let productId: string | undefined;
    let productHandle: string | undefined;

    if (detectedPlatform === 'woocommerce') {
        // WooCommerce product detection
        const isWcProductPage = window.location.pathname.includes('/product/') || document.querySelector('.single-product') !== null;
        if (isWcProductPage) {
            productHandle = window.location.pathname.split('/product/')[1]?.replace(/\/$/, '');
            // Try to get ID from variation form or body class
            const variationForm = document.querySelector('.variations_form');
            if (variationForm) {
                productId = variationForm.getAttribute('data-product_id') || undefined;
            }
            if (!productId) {
                const bodyClasses = document.body.className;
                const match = bodyClasses.match(/postid-(\d+)/);
                if (match) productId = match[1];
            }
        }
    } else {
        // Shopify product detection
        // Attempt 1: Standard Shopify meta
        const metaProductId = (window as any).meta?.product?.id;
        if (metaProductId) {
            productId = metaProductId.toString();
        }

        // Attempt 2: Shopify Analytics
        if (!productId) {
            const analyticsProductId = (window as any).ShopifyAnalytics?.meta?.product?.id;
            if (analyticsProductId) {
                productId = analyticsProductId.toString();
            }
        }

        // Normalize handle
        productHandle = window.location.pathname.split('/products/')[1]?.split('/')[0];
    }

    // Check if we are on a product page (required for product forms)
    if (!productId && !productHandle) {
        console.log('FinalForm: No product context found. Proceeding to fetch global config.');
    } else {
        console.log('FinalForm: Context', { shop, productId, productHandle, platform: detectedPlatform });
    }

    // --- EARLY SKELETON INJECTION (FAST FEEDBACK) ---
    let container = document.getElementById(CONTAINER_ID);
    let shadowRoot: ShadowRoot | null = null;
    let fallbackCSSPath = '';

    // If we think we're on a product page, inject the container and skeleton IMMEDIATELY
    if (productId || productHandle) {
        if (!container) {
            container = document.createElement('div');
            container.id = CONTAINER_ID;
            // CSS Reset for the container wrapper
            container.style.display = 'block';
            container.style.width = '100%';
            container.style.all = 'initial';
            container.style.display = 'block';

            const cartForm = document.querySelector('form[action*="/cart/add"]');
            if (cartForm && cartForm.parentNode) {
                console.log('FinalForm: Injecting after cart form early');
                cartForm.parentNode.insertBefore(container, cartForm.nextSibling);
            } else {
                console.log('FinalForm: Injecting to body early');
                document.body.appendChild(container); // Fallback
            }
        }

        shadowRoot = container.shadowRoot;
        if (!shadowRoot) {
            shadowRoot = container.attachShadow({ mode: 'open' });
        }

        // Helper to get CSS Path
        const getCssPath = () => {
            const scripts = document.querySelectorAll('script');
            let basePath = 'https://finalformfunnel.web.app/';
            for (let i = 0; i < scripts.length; i++) {
                const src = scripts[i].src;
                if (src && (src.includes('finalform-loader.prod.js') || src.includes('finalform-loader.js'))) {
                    const lastSlash = src.lastIndexOf('/');
                    if (lastSlash !== -1) basePath = src.substring(0, lastSlash + 1);
                    break;
                }
            }
            const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : Date.now();
            return basePath + 'finalform-loader.css?v=' + version;
        };

        fallbackCSSPath = getCssPath();

        const cssId = 'finalform-shadow-css';
        if (!shadowRoot.getElementById(cssId)) {
            const link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = fallbackCSSPath;
            shadowRoot.appendChild(link);
        }

        // Inject Skeleton immediately (Fix FOUC & Loading perception)
        if (!shadowRoot.getElementById('finalform-skeleton') && !shadowRoot.getElementById('finalform-shadow-wrapper')) {
            const skeletonDiv = document.createElement('div');
            skeletonDiv.id = 'finalform-skeleton';
            skeletonDiv.innerHTML = `
                <div class="animate-pulse space-y-4 p-4 opacity-60">
                    <div class="h-8 bg-slate-200 rounded w-3/4 mx-auto"></div>
                    <div class="h-64 bg-slate-100 rounded-xl"></div>
                    <div class="space-y-3">
                        <div class="h-12 bg-slate-200 rounded"></div>
                        <div class="h-12 bg-slate-200 rounded"></div>
                    </div>
                    <div class="h-14 bg-slate-300 rounded-xl mt-4"></div>
                </div>
            `;
            shadowRoot.appendChild(skeletonDiv);
        }

        // Setup Overlay Container early
        const overlayContainerId = 'finalform-overlay-container';
        let overlayContainer = document.getElementById(overlayContainerId);
        if (!overlayContainer) {
            overlayContainer = document.createElement('div');
            overlayContainer.id = overlayContainerId;
            overlayContainer.style.position = 'fixed';
            overlayContainer.style.top = '0';
            overlayContainer.style.left = '0';
            overlayContainer.style.width = '100%';
            overlayContainer.style.height = '100%';
            overlayContainer.style.background = 'transparent'; // EXT: Fix blank screen issue
            overlayContainer.style.pointerEvents = 'none'; // Allow clicks to pass through by default
            overlayContainer.style.zIndex = '2147483647'; // Max Z-Index
            document.body.appendChild(overlayContainer);

            const dummy = document.createElement('div');
            dummy.style.display = 'none';
            overlayContainer.appendChild(dummy);

            const overlayShadow = overlayContainer.attachShadow({ mode: 'open' });
            const overlayLink = document.createElement('link');
            overlayLink.rel = 'stylesheet';
            overlayLink.type = 'text/css';
            overlayLink.href = fallbackCSSPath;
            overlayShadow.appendChild(overlayLink);

            const portalRoot = document.createElement('div');
            portalRoot.id = 'finalform-portal-root';
            overlayShadow.appendChild(portalRoot);
        }
    }

    // 3. Resolve Config & Fetch Product Data (IN PARALLEL)
    console.log('FinalForm: Fetching config and product data concurrently...');
    const [config, productData] = await Promise.all([
        fetchConfigFromBackend(shop, productId, productHandle),
        detectedPlatform === 'woocommerce'
            ? Promise.resolve(fetchWooCommerceProduct())
            : fetchShopifyProduct()
    ]);

    if (!config) {
        console.warn('FinalForm: Config load failed or no assignment found. Aborting.');
        const s = document.getElementById(SPINNER_ID);
        if (s) s.remove();
        if (container) container.style.display = 'none'; // Hide skeleton if config fails
        return;
    }

    console.log('FinalForm: Config loaded successfully.');

    // 4.5 Process Host Overrides (Auto Hide Theme Elements)
    const shouldHide = config.autoHideThemeElements !== false;
    if (shouldHide) {
        const styleId = 'finalform-host-overrides';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
.product__text,
.product__title,
.price__container,
variant-selects,
.product-form__quantity,
.product-form__buttons,
share-button {
  display: none !important;
}
  .product__info-container>*+* {
    margin: 0 !important;
}

.product__info-wrapper {
  padding: 0 !important;
}`;
            document.head.appendChild(style);
            console.log('FinalForm: Applied theme cleanup overrides');
        }
    }

    // 7. Initialize Global Pixels (if not on product page)
    const initGlobalPixels = (config: Record<string, unknown>) => {
        const addons = config.addons as Record<string, unknown> | undefined;
        const pixelData = (addons?.pixelData || config.pixels || []) as { pixelId: string }[];
        if (pixelData.length > 0) {
            console.log('FinalForm: Initializing Global Pixels...', pixelData.length);

            // Inject Base Code if needed
            if (!(window as any).fbq) {
                const f = ((window as any).fbq = function () {
                    // eslint-disable-next-line prefer-rest-params
                    const args = arguments;
                    const fq = (f as unknown as { callMethod?: Function; queue: unknown[] });
                    fq.callMethod ? fq.callMethod.apply(f, args) : fq.queue.push(args)
                }) as unknown as Record<string, unknown>;

                if (!(window as any)._fbq) (window as any)._fbq = f;

                f.push = f;
                f.loaded = true;
                f.version = '2.0';
                f.queue = [];
                const t = document.createElement('script');
                t.async = true;
                t.src = 'https://connect.facebook.net/en_US/fbevents.js';
                const s = document.getElementsByTagName('script')[0];
                if (s && s.parentNode) s.parentNode.insertBefore(t, s);
            }

            // Init Pixels
            pixelData.forEach((p: { pixelId: string }) => {
                const winObj = window as unknown as Record<string, unknown>;
                if (winObj.fbq) {
                    (winObj.fbq as Function)('init', p.pixelId);
                }
            });

            // PageView
            const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const winObj = window as unknown as Record<string, unknown>;
            if (winObj.fbq) {
                (winObj.fbq as Function)('track', 'PageView', {}, { eventID: eventId });
            }
        }

        // Initialize TikTok Pixels
        const tiktokData = (addons?.tiktokPixelData || []) as { pixelId: string }[];
        if (tiktokData.length > 0) {
            console.log('FinalForm: Initializing TikTok Global Pixels...', tiktokData.length);

            // Inject TikTok Base Script
            if (!(window as any).ttq) {
                (function (w: Window & typeof globalThis, d: Document, t: string) {
                    const winObj = w as unknown as Record<string, unknown>;
                    winObj.TiktokAnalyticsObject = t;

                    type TTQArray = unknown[] & {
                        methods: string[];
                        setAndDefer: (t: TTQArray, e: string) => void;
                        instance: (t: string) => TTQArray;
                        load: (e: string, n?: Record<string, unknown>) => void;
                        page: () => void;
                        _i: Record<string, TTQArray & { _u: string }>;
                        _t: Record<string, number>;
                        _o: Record<string, Record<string, unknown>>;
                    };

                    const ttq = (winObj[t] = winObj[t] || []) as TTQArray;

                    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];

                    ttq.setAndDefer = function (objT: TTQArray, e: string) {
                        (objT as unknown as Record<string, unknown>)[e] = function () {
                            objT.push([e].concat(Array.prototype.slice.call(arguments, 0)));
                        };
                    };

                    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);

                    ttq.instance = function (instanceT: string) {
                        for (var e = (ttq._i && ttq._i[instanceT]) || ([] as unknown as TTQArray), n = 0; n < ttq.methods.length; n++) {
                            ttq.setAndDefer(e, ttq.methods[n]);
                        }
                        return e;
                    };

                    ttq.load = function (e: string, n?: Record<string, unknown>) {
                        var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
                        ttq._i = ttq._i || {};
                        ttq._i[e] = [] as unknown as TTQArray & { _u: string };
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
                        if (a && a.parentNode) a.parentNode.insertBefore(o, a);
                    };
                })(window, document, 'ttq');
            }

            // Load and Identify
            tiktokData.forEach((p: { pixelId: string }) => {
                if (p.pixelId) {
                    const winObj = window as unknown as Record<string, unknown>;
                    if (winObj.ttq) {
                        (winObj.ttq as { load: (id: string) => void; page: () => void }).load(p.pixelId);
                        (winObj.ttq as { load: (id: string) => void; page: () => void }).page();
                    }
                }
            });
        }
    };

    // 8. Render Form OR Init Global Pixels
    if (productData) {
        // If container wasn't injected early (e.g. DOM wasn't ready)
        if (!container || !shadowRoot) {
            container = document.getElementById(CONTAINER_ID);
            if (!container) {
                container = document.createElement('div');
                container.id = CONTAINER_ID;
                container.style.display = 'block';
                container.style.width = '100%';
                container.style.all = 'initial';
                container.style.display = 'block';

                const cartForm = document.querySelector('form[action*="/cart/add"]');
                if (cartForm && cartForm.parentNode) {
                    cartForm.parentNode.insertBefore(container, cartForm.nextSibling);
                } else {
                    document.body.appendChild(container); // Fallback
                }
            }
            shadowRoot = container.shadowRoot;
            if (!shadowRoot) shadowRoot = container.attachShadow({ mode: 'open' });

            const cssId = 'finalform-shadow-css';
            if (!shadowRoot.getElementById(cssId)) {
                const link = document.createElement('link');
                link.id = cssId;
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = fallbackCSSPath || 'https://finalformfunnel.web.app/finalform-loader.css';
                shadowRoot.appendChild(link);
            }
        }

        // Remove Skeleton if exists
        const skel = shadowRoot.getElementById('finalform-skeleton');
        if (skel) skel.remove();

        // Remove Spinner
        const spinner = document.getElementById(SPINNER_ID);
        if (spinner) spinner.remove();

        const offers = config.offers || [];
        const shipping = config.shipping || { standard: { home: 0, desk: 0 }, exceptions: [] };

        const root = createRoot(shadowRoot);
        root.render(
            <React.StrictMode>
                <div id="finalform-shadow-wrapper">
                    <FormLoader
                        config={config}
                        product={productData}
                        offers={offers}
                        shipping={shipping}
                    />
                </div>
            </React.StrictMode>
        );
    } else {
        // No product data -> We are on a non-product page (Home, Collection, etc.)
        console.log('FinalForm: No product context. Initializing Global Pixels only.');
        initGlobalPixels(config);

        const s = document.getElementById(SPINNER_ID);
        if (s) s.remove();
        if (container) container.style.display = 'none';
    }
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoader);
} else {
    initLoader();
}

// Expose manual init
(window as any).initFinalForm = initLoader;

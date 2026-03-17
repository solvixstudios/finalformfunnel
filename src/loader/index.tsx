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

function fetchWooCommerceProduct() {
    try {
        let fallbackPrice = '0';
        const priceEl = document.querySelector('.woocommerce-Price-amount bdi') || document.querySelector('.price .amount');
        if (priceEl) {
             const text = priceEl.textContent || '';
             // Handle comma decimals e.g. 1,000.00 or 1000,00 -> 1000.00
             const cleaned = text.replace(/[^\d,\.]/g, '').replace(',', '.');
             const match = cleaned.match(/\d+(\.\d+)?/);
             if (match) fallbackPrice = match[0];
        }

        // Try JSON-LD structured data (most reliable across WC themes)
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (let i = 0; i < jsonLdScripts.length; i++) {
            try {
                let data = JSON.parse(jsonLdScripts[i].textContent || '');
                
                // Handle Yoast SEO / arrays
                if (Array.isArray(data)) {
                     data = data.find((item: any) => item['@graph'] ? item['@graph'].some((g: any) => g['@type'] === 'Product') : item['@type'] === 'Product') || data[0];
                }
                if (data && data['@graph']) {
                     data = data['@graph'].find((g: any) => g['@type'] === 'Product') || data;
                }
                
                if (data && data['@type'] === 'Product' && data.name) {
                    let price = data.offers?.price || data.offers?.lowPrice || fallbackPrice;
                    if (Array.isArray(data.offers)) {
                         price = data.offers[0]?.price || fallbackPrice;
                    }
                    return {
                        id: data.sku || data.productID || window.location.pathname.split('/product/')[1]?.replace(/\/$/, ''),
                        title: data.name,
                        handle: window.location.pathname.split('/product/')[1]?.replace(/\/$/, '') || '',
                        body_html: data.description || '',
                        variants: [{
                            id: data.sku || 'default',
                            title: 'Default',
                            price: price,
                        }],
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
                        price: v.display_price || fallbackPrice,
                    })) : [{ id: productId, title: 'Default', price: fallbackPrice }],
                    images: [],
                    image: null,
                };
            }
        }

        // Final fallback: Title and DOM price
        const titleEl = document.querySelector('.product_title, h1.entry-title');
        if (titleEl) {
             return {
                 id: window.location.pathname.split('/product/')[1]?.replace(/\/$/, '') || 'default',
                 title: titleEl.textContent?.trim() || '',
                 handle: window.location.pathname.split('/product/')[1]?.replace(/\/$/, '') || '',
                 variants: [{ id: 'default', title: 'Default', price: fallbackPrice }],
             };
        }
    } catch (e) {
        console.warn('FinalForm: WooCommerce product detection failed', e);
    }
    return null;
}

/**
 * Fetch config from backend webhook (Source of Truth)
 */
async function fetchConfigFromBackend(shop: string, platform: string, productId?: string, productHandle?: string) {
    if (!shop) return null;
    console.log(`FinalForm: Fetching ${platform} config from backend...`);

    try {
        // Construct URL for backend webhook
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
        if (!BACKEND_URL) {
            console.error('FinalForm: VITE_BACKEND_URL is not defined');
            return null;
        }
        const WEBHOOK_URL = `${BACKEND_URL}/webhook/${platform}/config`;

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

    // 1. Parse script params to identify shop & platform
    const getScriptParams = () => {
        const scripts = document.querySelectorAll('script');
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src;
            if (src && (src.includes('finalform-loader.prod.js') || src.includes('finalform-loader.js') || src.includes('loader.js'))) {
                const dataStore = scripts[i].getAttribute('data-store');
                const dataPlatform = scripts[i].getAttribute('data-platform');
                const result: Record<string, string> = {};
                if (dataStore) result.shop = dataStore;
                if (dataPlatform) result.platform = dataPlatform;
                try {
                    const url = new URL(src);
                    const entries = Object.fromEntries(url.searchParams.entries());
                    return { ...entries, ...result };
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

    // 2. Identify Product Context (lightweight, no DOM injection yet)
    let productId: string | undefined;
    let productHandle: string | undefined;

    if (detectedPlatform === 'woocommerce') {
        const isWcProductPage = window.location.pathname.includes('/product/') || document.querySelector('.single-product') !== null;
        if (isWcProductPage) {
            productHandle = window.location.pathname.split('/product/')[1]?.replace(/\/$/, '');
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
        const metaProductId = (window as any).meta?.product?.id;
        if (metaProductId) productId = metaProductId.toString();
        if (!productId) {
            const analyticsProductId = (window as any).ShopifyAnalytics?.meta?.product?.id;
            if (analyticsProductId) productId = analyticsProductId.toString();
        }
        productHandle = window.location.pathname.split('/products/')[1]?.split('/')[0];
    }

    if (!productId && !productHandle) {
        console.log('FinalForm: No product context found. Proceeding to fetch global config.');
    } else {
        console.log('FinalForm: Context', { shop, productId, productHandle, platform: detectedPlatform });
    }

    // 3. Fetch config & product data IN PARALLEL — NO DOM modifications yet
    console.log(`FinalForm: Fetching ${detectedPlatform} config and product data concurrently...`);
    const [config, productData] = await Promise.all([
        fetchConfigFromBackend(shop, detectedPlatform, productId, productHandle),
        detectedPlatform === 'woocommerce'
            ? Promise.resolve(fetchWooCommerceProduct())
            : fetchShopifyProduct()
    ]);

    // ── SILENT EXIT: no config means no form assigned — do NOTHING ──
    if (!config) {
        console.log('FinalForm: No config found. Silent exit — no DOM changes.');
        return;
    }

    config.platform = detectedPlatform;
    console.log(`FinalForm: Config loaded successfully for platform [${config.platform}].`);

    // 4. Global Pixels (non-product pages)
    const initGlobalPixels = (cfg: Record<string, unknown>) => {
        const addons = cfg.addons as Record<string, unknown> | undefined;
        const pixelData = (addons?.pixelData || cfg.pixels || []) as { pixelId: string }[];
        if (pixelData.length > 0) {
            console.log('FinalForm: Initializing Global Pixels...', pixelData.length);
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
            pixelData.forEach((p: { pixelId: string }) => {
                const winObj = window as unknown as Record<string, unknown>;
                if (winObj.fbq) {
                    (winObj.fbq as Function)('init', p.pixelId);
                }
            });
            const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const winObj = window as unknown as Record<string, unknown>;
            if (winObj.fbq) {
                (winObj.fbq as Function)('track', 'PageView', {}, { eventID: eventId });
            }
        }

        const tiktokData = (addons?.tiktokPixelData || []) as { pixelId: string }[];
        if (tiktokData.length > 0) {
            console.log('FinalForm: Initializing TikTok Global Pixels...', tiktokData.length);
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

    // 5. If no product data → non-product page → global pixels only, silent exit
    if (!productData) {
        console.log('FinalForm: No product context. Initializing Global Pixels only.');
        initGlobalPixels(config);
        return; // ← silent, no DOM changes
    }

    // ═══════════════════════════════════════════════════════════════
    //  6. FORM RENDER — we KNOW a form exists, NOW inject DOM
    // ═══════════════════════════════════════════════════════════════

    // 6a. Show lightweight spinner (small fixed-corner spinner)
    const spinnerStyle = document.createElement('style');
    spinnerStyle.id = 'ff-spinner-style';
    spinnerStyle.textContent = `
        #${SPINNER_ID} {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 2147483646;
            width: 44px;
            height: 44px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.12);
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
        }
        .ff-spinner {
            width: 22px;
            height: 22px;
            border: 2.5px solid #e5e7eb;
            border-top: 2.5px solid #4f46e5;
            border-radius: 50%;
            animation: ff-spin 0.7s linear infinite;
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

    // 6b. Create container & shadow root
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = CONTAINER_ID;
        container.style.display = 'block';
        container.style.width = '100%';
        container.style.all = 'initial';
        container.style.display = 'block';

        if (detectedPlatform === 'woocommerce') {
            // Priority 0: Specific cleanup requested by user for their custom theme
            const customThemeDesc = document.querySelector('.col-lg-7.col-12.product-desc');
            if (customThemeDesc) {
                customThemeDesc.innerHTML = '';
                customThemeDesc.appendChild(container);
            } else {
                // Priority 1: WooCommerce standard summary container
                const summaryContainer = document.querySelector('.summary.entry-summary');
                if (summaryContainer) {
                    const nativeForm = summaryContainer.querySelector('form.cart');
                    if (nativeForm) nativeForm.remove();
                    summaryContainer.appendChild(container);
                } else {
                // Priority 2: Custom themes generic add to cart button container
                const addToCartBtn = document.querySelector('button[name="add-to-cart"]');
                if (addToCartBtn && addToCartBtn.parentElement) {
                    addToCartBtn.parentElement.parentElement?.appendChild(container) || addToCartBtn.parentElement.appendChild(container);
                    addToCartBtn.remove();
                } else {
                    // Priority 3: Fallback container
                    const entryContent = document.querySelector('.entry-content') || document.querySelector('.hentry');
                    if (entryContent) {
                        entryContent.appendChild(container);
                    } else {
                        document.body.appendChild(container);
                    }
                }
                }
            }
        } else {
            // Shopify Fallbacks
            // Priority 1: Standard form
            const cartForm = document.querySelector('form[action*="/cart/add"]');
            if (cartForm && cartForm.parentNode) {
                cartForm.parentNode.insertBefore(container, cartForm.nextSibling);
            } else {
                // Priority 2: Product form class
                const productForm = document.querySelector('.product-form') || document.querySelector('.ProductForm');
                if (productForm && productForm.parentNode) {
                    productForm.parentNode.insertBefore(container, productForm.nextSibling);
                } else {
                    // Priority 3: Any add button
                    const addBtn = document.querySelector('button[name="add"]') || document.querySelector('[id^="add-to-cart"]');
                    if (addBtn && addBtn.parentNode) {
                        addBtn.parentNode.insertBefore(container, addBtn.nextSibling);
                    } else {
                        document.body.appendChild(container);
                    }
                }
            }
        }
    }

    let shadowRoot = container.shadowRoot;
    if (!shadowRoot) {
        shadowRoot = container.attachShadow({ mode: 'open' });
    }

    // 6c. Inject CSS into shadow root
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
        const ver = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : Date.now();
        return basePath + 'finalform-loader.css?v=' + ver;
    };

    const cssPath = getCssPath();
    const cssId = 'finalform-shadow-css';
    if (!shadowRoot.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = cssPath;
        shadowRoot.appendChild(link);
    }

    // 6d. Setup Overlay Container for modals/popups
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
        overlayContainer.style.background = 'transparent';
        overlayContainer.style.pointerEvents = 'none';
        overlayContainer.style.zIndex = '2147483647';
        document.body.appendChild(overlayContainer);

        const dummy = document.createElement('div');
        dummy.style.display = 'none';
        overlayContainer.appendChild(dummy);

        const overlayShadow = overlayContainer.attachShadow({ mode: 'open' });
        const overlayLink = document.createElement('link');
        overlayLink.rel = 'stylesheet';
        overlayLink.type = 'text/css';
        overlayLink.href = cssPath;
        overlayShadow.appendChild(overlayLink);

        const portalRoot = document.createElement('div');
        portalRoot.id = 'finalform-portal-root';
        overlayShadow.appendChild(portalRoot);
    }

    // 6e. Apply Host Overrides (Hide Theme Elements)
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

    // 6f. Remove spinner — form is about to render
    const spinnerEl = document.getElementById(SPINNER_ID);
    if (spinnerEl) spinnerEl.remove();
    const spinnerStyleEl = document.getElementById('ff-spinner-style');
    if (spinnerStyleEl) spinnerStyleEl.remove();

    // 6g. Render React form
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
}

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoader);
} else {
    initLoader();
}

// Expose manual init
(window as any).initFinalForm = initLoader;

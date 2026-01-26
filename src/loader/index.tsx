import '@/index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FormLoader } from './FormLoader';

// Declare global variable defined in Vite config
declare const __APP_VERSION__: string;

const CONTAINER_ID = 'finalform-container';

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
        } else if (metaProduct) {
            console.log('FinalForm: window.meta.product found but incomplete (missing title). Fetching full data...');
        }

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
 * Fetch config from Storefront API
 * Hierarchy: Product Metafield > Shop Metafield
 */
async function fetchConfigFromStorefrontApi(shop: string, token: string, productId?: string, productHandle?: string) {
    if (!token) {
        console.error('FinalForm: Missing sf_token in script URL. Cannot fetch config.');
        return null;
    }

    console.log('FinalForm: Fetching config via Storefront API...');

    let query = '';

    // If we are on a product page, we want to check Product *and* Shop config
    if (productHandle) {
        query = `
        query getConfigs($handle: String!) {
            product(handle: $handle) {
                metafield(namespace: "finalform", key: "config") {
                    value
                }
            }
            shop {
                metafield(namespace: "finalform", key: "config") {
                    value
                }
            }
        }
        `;
    } else {
        // Just Shop config
        query = `
        query getShopConfig {
            shop {
                metafield(namespace: "finalform", key: "config") {
                    value
                }
            }
        }
        `;
    }

    try {
        const res = await fetch(`https://${shop}/api/2023-01/graphql.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Storefront-Access-Token': token,
            },
            body: JSON.stringify({
                query,
                variables: { handle: productHandle }
            })
        });

        if (!res.ok) {
            console.error('FinalForm: SF API Error', res.statusText);
            return null;
        }

        const json = await res.json();

        // Priority 1: Product Config
        const productConfig = json.data?.product?.metafield?.value;
        if (productConfig) {
            try {
                const parsed = JSON.parse(productConfig);
                console.log('FinalForm: Using Product-Specific Config');
                return parsed;
            } catch (e) {
                console.error('FinalForm: Invalid JSON in Product Metafield', e);
            }
        }

        // Priority 2: Shop Config (Global Fallback)
        const shopConfig = json.data?.shop?.metafield?.value;
        if (shopConfig) {
            try {
                const parsed = JSON.parse(shopConfig);
                console.log('FinalForm: Using Global Shop Config');
                return parsed;
            } catch (e) {
                console.error('FinalForm: Invalid JSON in Shop Metafield', e);
            }
        }

        console.warn('FinalForm: No configuration found in Metafields (Product or Shop).');

    } catch (e) {
        console.error('FinalForm: SF API Fetch Exception', e);
    }

    return null;
}

/**
 * Initialize the loader
 */
async function initLoader() {
    const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown';
    console.log(`FinalForm: Initializing v${version}...`);

    // 1. Helper to parse script params
    const getScriptParams = () => {
        const scripts = document.querySelectorAll('script');
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src;
            if (src && (src.includes('finalform-loader.prod.js') || src.includes('finalform-loader.js'))) {
                try {
                    const url = new URL(src);
                    return Object.fromEntries(url.searchParams.entries());
                } catch (e) {
                    // Ignore parsing errors
                }
            }
        }
        return {};
    };

    const params = getScriptParams();
    const shop = params.shop || window.location.hostname;
    const sfToken = params.sf_token;

    // 1.5. Remove Tailwind CDN Injection (We rely on built CSS now)

    // 2. Identify Product Context
    let productId = (window as any).meta?.product?.id?.toString();
    if (!productId && (window as any).ShopifyAnalytics?.meta?.product?.id) {
        productId = (window as any).ShopifyAnalytics.meta.product.id.toString();
    }

    // Normalize handle
    const productHandle = window.location.pathname.split('/products/')[1]?.split('/')[0];

    // Check if we are on a product page (required for product forms)
    // If we can't find a product ID/handle, we might skip unless it's a specific landing page form
    if (!productId && !productHandle && !sfToken) {
        console.log('FinalForm: No product context or token found. Skipping.');
        return;
    }

    console.log('FinalForm: Context', { shop, productId, productHandle });

    // 3. Resolve Config (Storefront API Only)
    let config = null;

    if (sfToken) {
        config = await fetchConfigFromStorefrontApi(shop, sfToken, productId, productHandle);
    } else {
        console.warn('FinalForm: sf_token missing. Please add ?sf_token=YOUR_TOKEN to the script tag.');
    }

    if (!config) {
        console.warn('FinalForm: Config load failed. Aborting.');
        return;
    }

    console.log('FinalForm: Config loaded successfully.');

    // 4. Fetch Product Data
    const productData = await fetchShopifyProduct();

    // 4.5 Process Host Overrides (Auto Hide Theme Elements)
    if (config) {
        // Default to true if undefined for backward compatibility with older forms if desired, 
        // but schema defaults to true.
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
    }

    // 5. Inject Main Container (Form)
    let container = document.getElementById(CONTAINER_ID);
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
            console.log('FinalForm: Injecting after cart form');
            cartForm.parentNode.insertBefore(container, cartForm.nextSibling);
        } else {
            console.log('FinalForm: Injecting to body');
            document.body.appendChild(container); // Fallback
        }
    }

    // 6. Main Shadow DOM Setup
    let shadowRoot = container.shadowRoot;
    if (!shadowRoot) {
        shadowRoot = container.attachShadow({ mode: 'open' });
    }

    // 7. Inject CSS into Main Shadow DOM
    const cssId = 'finalform-shadow-css';

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

    const cssPath = getCssPath();

    if (!shadowRoot.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = cssPath;
        shadowRoot.appendChild(link);
    }

    // 7.5. Inject Skeleton immediately (Fix FOUC)
    // We check if React root already exists or is being created
    if (!shadowRoot.getElementById('finalform-shadow-wrapper')) {
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

    // 7.5 Overlay Container (Top Level, Fixed)
    const overlayContainerId = 'finalform-overlay-container';
    let overlayContainer = document.getElementById(overlayContainerId);
    if (!overlayContainer) {
        overlayContainer = document.createElement('div');
        overlayContainer.id = overlayContainerId;
        // Apply Overlay Styles (Fixed to Viewport)
        overlayContainer.style.position = 'fixed';
        overlayContainer.style.top = '0';
        overlayContainer.style.left = '0';
        overlayContainer.style.width = '100%';
        overlayContainer.style.height = '100%';
        overlayContainer.style.pointerEvents = 'none'; // Allow clicks to pass through by default
        overlayContainer.style.zIndex = '2147483647'; // Max Z-Index

        document.body.appendChild(overlayContainer);

        // Add dummy element to prevent div:empty
        const dummy = document.createElement('div');
        dummy.style.display = 'none';
        overlayContainer.appendChild(dummy);

        const overlayShadow = overlayContainer.attachShadow({ mode: 'open' });

        // Inject CSS here too so overlays have styles
        const overlayLink = document.createElement('link');
        overlayLink.rel = 'stylesheet';
        overlayLink.type = 'text/css';
        overlayLink.href = cssPath;
        overlayShadow.appendChild(overlayLink);

        // Create Portal Root inside Overlay Shadow
        const portalRoot = document.createElement('div');
        portalRoot.id = 'finalform-portal-root';
        overlayShadow.appendChild(portalRoot);
    }

    // 8. Render Form
    if (productData) {
        // Remove Skeleton if exists
        const skel = shadowRoot.getElementById('finalform-skeleton');
        if (skel) skel.remove();

        const offers = config.offers || [];
        const shipping = config.shipping || { standard: { home: 0, desk: 0 } };

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
        console.warn('FinalForm: Product data not available, cannot render FormLoader');
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

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

    // 4. Fetch Product Data (Inventory, Real-time status)
    const productData = await fetchShopifyProduct();

    // 5. Inject Container
    let container = document.getElementById(CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = CONTAINER_ID;

        // CSS Reset for the container wrapper in light DOM
        // This ensures the container itself doesn't inherit weird margins/padding
        container.style.display = 'block';
        container.style.width = '100%';
        container.style.all = 'initial'; // Dangerous if not careful, but good for isolation. resets display to inline usually.
        container.style.display = 'block'; // set back to block

        // Strategy: Look for common Add to Cart forms
        const cartForm = document.querySelector('form[action*="/cart/add"]');

        if (cartForm && cartForm.parentNode) {
            console.log('FinalForm: Injecting after cart form');
            // Insert after the cart form
            cartForm.parentNode.insertBefore(container, cartForm.nextSibling);

            // Optional: Hide original form if configured
            // Default to true if not specified
            if (config.hideOriginalForm !== false) {
                // cartForm.style.display = 'none'; // Commented out for safety until verified
            }
        } else {
            console.log('FinalForm: Injecting to body');
            document.body.appendChild(container); // Fallback
        }
    }

    // 6. Shadow DOM Setup
    let shadowRoot = container.shadowRoot;
    if (!shadowRoot) {
        shadowRoot = container.attachShadow({ mode: 'open' });
    }

    // 7. Inject CSS into Shadow DOM
    const cssId = 'finalform-shadow-css';
    if (!shadowRoot.getElementById(cssId)) {
        const scripts = document.querySelectorAll('script');
        let basePath = 'https://finalformfunnel.web.app/'; // Fallback
        for (let i = 0; i < scripts.length; i++) {
            const src = scripts[i].src;
            if (src && (src.includes('finalform-loader.prod.js') || src.includes('finalform-loader.js'))) {
                const lastSlash = src.lastIndexOf('/');
                if (lastSlash !== -1) {
                    basePath = src.substring(0, lastSlash + 1);
                }
                break;
            }
        }

        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.type = 'text/css';

        // Cache bust with version
        const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : Date.now();
        link.href = basePath + 'finalform-loader.css?v=' + version;

        shadowRoot.appendChild(link);
        console.log('FinalForm: Injected CSS into Shadow DOM', link.href);
    }

    // 8. Render
    if (productData) {
        const offers = config.offers || [];
        const shipping = config.shipping || { standard: { home: 0, desk: 0 } };

        // We specifically render into the shadowRoot
        const root = createRoot(shadowRoot);
        root.render(
            <React.StrictMode>
                {/* We might need a wrapper div inside shadow root if changing styles on :host is not enough */}
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

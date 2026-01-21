import '@/index.css';
import { getFormConfig } from '@/lib/api/formConfig';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FormLoader } from './FormLoader';

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

    // 3. Fetch Config and Product Data in parallel
    const [configRes, productData] = await Promise.all([
        getFormConfig(shop, productId, productHandle),
        fetchShopifyProduct()
    ]);

    console.log('FinalForm: Resolved Data', { config: configRes, product: productData });

    if ('error' in configRes) {
        console.error('FinalForm: Config load failed', configRes.error);
        return;
    }

    const { config } = configRes;

    // 4. Inject Container
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

    // 5. Shadow DOM Setup
    let shadowRoot = container.shadowRoot;
    if (!shadowRoot) {
        shadowRoot = container.attachShadow({ mode: 'open' });
    }

    // 6. Inject CSS into Shadow DOM
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

    // 7. Render
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

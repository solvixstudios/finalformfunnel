import '@/index.css';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore/lite';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { db } from './firebase';
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
 * Fetch config from Firebase Firestore (Source of Truth)
 */
async function fetchConfigFromFirebase(shop: string, productId?: string, productHandle?: string) {
    if (!shop) return null;
    console.log('FinalForm: Fetching config from Firebase...');

    try {
        // 1. Get all assignments for this shop
        // We use shopifyDomain to filter. Ensure shop is normalized or matches what's saved.
        // Usually 'shop' param is 'myshop.myshopify.com' or custom domain. The backend saves 'myshopify.com' usually if connected via API,
        // but 'url' might be used. 'normalizeShopifyDomain' logic in backend is important.
        // Here we assume 'shop' passed in params matches 'shopifyDomain' in Firestore.

        const assignmentsRef = collection(db, 'assignments');
        const q = query(assignmentsRef, where('shopifyDomain', '==', shop), where('isActive', '==', true));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            console.warn('FinalForm: No assignments found for this shop.');
            return null;
        }

        const assignments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

        // 2. Find Best Match
        // Priority 1: Specific Product (by ID or Handle)
        // Priority 2: Store Wide

        // We sort by priority (descending) just in case, though logic below handles it
        // assignments.sort((a, b) => b.priority - a.priority);

        let match = null;

        // Check Product ID Match
        if (productId) {
            match = assignments.find(a => a.assignmentType === 'product' && String(a.productId) === String(productId));
        }

        // Check Handle Match (if no ID match)
        if (!match && productHandle) {
            match = assignments.find(a => a.assignmentType === 'product' && a.productHandle === productHandle);
        }

        // Check Store Match (if no product match)
        if (!match) {
            match = assignments.find(a => a.assignmentType === 'store');
        }

        if (!match) {
            console.warn('FinalForm: No matching assignment found for this context.');
            return null;
        }

        console.log('FinalForm: Found assignment', match.id);

        // 3. Fetch the Form Config
        const formRef = doc(db, 'forms', match.formId);
        const formSnap = await getDoc(formRef);

        if (!formSnap.exists()) {
            console.error('FinalForm: Assigned form document does not exist.');
            return null;
        }

        const formData = formSnap.data();
        return formData.config;

    } catch (e) {
        console.error('FinalForm: Firebase Fetch Error', e);
        return null;
    }
}

/**
 * Initialize the loader
 */
async function initLoader() {
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
    // const sfToken = params.sf_token; // Deprecated with Firebase

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
    if (!productId && !productHandle) {
        console.log('FinalForm: No product context found. Skipping.');
        const s = document.getElementById(SPINNER_ID);
        if (s) s.remove();
        return;
    }

    console.log('FinalForm: Context', { shop, productId, productHandle });

    // 3. Resolve Config (Firebase)
    // We pass shop, productId, productHandle to find the right assignment
    const config = await fetchConfigFromFirebase(shop, productId, productHandle);

    if (!config) {
        console.warn('FinalForm: Config load failed or no assignment found. Aborting.');
        const s = document.getElementById(SPINNER_ID);
        if (s) s.remove();
        return;
    }

    console.log('FinalForm: Config loaded successfully.');

    // 4. Fetch Product Data
    // We fetch product data in parallel if possible, but for now sequential is fine or use Promise.all
    // Actually config might dictate if we need product data, but usually we do.
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
        overlayContainer.style.background = 'transparent'; // EXT: Fix blank screen issue
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

        // Remove Spinner
        const spinner = document.getElementById(SPINNER_ID);
        if (spinner) spinner.remove();

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

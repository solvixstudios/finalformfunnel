import '@/index.css'; // Import Tailwind directives
import React from 'react';
import { createRoot } from 'react-dom/client';
import { FormLoader } from './FormLoader';

// --- CONFIGURATION LOADING ---
// Expected to be injected on window or passed via init function if we want to expose one.
// The legacy loader.js looked for specific element id.

const CONTAINER_ID = 'finalform-container';

/**
 * Initializes the loader.
 */
function initLoader() {
    const container = document.getElementById(CONTAINER_ID);

    if (!container) {
        console.warn("FinalForm: Container element not found. Waiting for manual init or ensure #finalform-container exists.");
        return;
    }

    // Get config from global variable or data attributes
    // In the real Shopify integration, we might want to expose a function `window.FinalForm.render(config)`
    // But for dropping replacement, we need to replicate some of the auto-init behavior if possible, or assume the snippet assigns config.

    const config = (window as any).FinalFormConfig;
    const product = (window as any).FinalFormProduct;

    if (!config) {
        console.error("FinalForm: No configuration found in window.FinalFormConfig");
        return;
    }

    // Fallbacks for missing structure
    const offers = config.offers || [];
    const shipping = config.shipping || { standard: { home: 600, desk: 400 } };

    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <FormLoader
                config={config.config || config} // Handle nested vs flat
                product={product}
                offers={offers}
                shipping={shipping}
            />
        </React.StrictMode>
    );
}

// Auto-init if window is ready, or wait for it
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLoader);
} else {
    initLoader();
}

// Expose a global render function for manual initialization
(window as any).renderFinalForm = (config: any, productData: any) => {
    (window as any).FinalFormConfig = config;
    (window as any).FinalFormProduct = productData;
    initLoader();
};

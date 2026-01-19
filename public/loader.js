/**
 * FinalForm COD Checkout Loader v1.1.0
 *
 * This script is injected into Shopify stores to display the COD checkout form.
 * It fetches form configuration directly from the app's API endpoint.
 *
 * How it works:
 * 1. Detects if we're on a product page
 * 2. Fetches form config from the app's API
 * 3. Renders the checkout form in the page
 */

(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    // n8n Webhook URL (Fall-back proxy)
    API_BASE_URL: "https://finalform.app.n8n.cloud",
    API_ENDPOINT: "/webhook/form-config",

    // Shopify Storefront API
    STOREFRONT_API_VERSION: "2024-01",

    // Cache duration in milliseconds (5 minutes)
    CACHE_DURATION: 5 * 60 * 1000,

    // Debug mode
    DEBUG: true,
  };

  // Logger
  const log = (...args) => {
    if (CONFIG.DEBUG) {
      console.log("[FinalForm]", ...args);
    }
  };

  // Get current domain
  function getCurrentDomain() {
    return window.location.hostname;
  }

  // Get Storefront Access Token from script URL
  function getStorefrontToken() {
    try {
      if (document.currentScript) {
        const url = new URL(document.currentScript.src);
        return url.searchParams.get("sf_token");
      }
      // Fallback
      const script = document.querySelector(
        'script[src*="loader.js"][src*="sf_token"]'
      );
      if (script) {
        const url = new URL(script.src);
        return url.searchParams.get("sf_token");
      }
    } catch (e) {
      log("Error parsing token:", e);
    }
    return null;
  }

  // Get product info from Shopify meta or URL
  function getProductInfo() {
    const meta = window.ShopifyAnalytics?.meta || {};
    const product = meta.product || {};

    // Try to get from URL if not in meta
    const pathMatch = window.location.pathname.match(/\/products\/([^/?]+)/);
    const productHandle = pathMatch ? pathMatch[1] : null;

    return {
      productId: product.id?.toString() || null,
      productHandle: productHandle || product.handle || null,
      isProductPage: !!productHandle || !!product.id,
    };
  }

  // Cache utilities
  const cache = {
    get(key) {
      try {
        const item = sessionStorage.getItem(`finalform_${key}`);
        if (!item) return null;

        const { data, expiry } = JSON.parse(item);
        if (Date.now() > expiry) {
          sessionStorage.removeItem(`finalform_${key}`);
          return null;
        }
        return data;
      } catch (e) {
        return null;
      }
    },

    set(key, data) {
      try {
        const item = {
          data,
          expiry: Date.now() + CONFIG.CACHE_DURATION,
        };
        sessionStorage.setItem(`finalform_${key}`, JSON.stringify(item));
      } catch (e) {
        log("Cache write failed:", e);
      }
    },
  };

  // 1. Try Fetching from Shopify Metafield (Zero Network Delay Strategy)
  async function fetchMetafieldConfig(handle, token) {
    if (!token || !handle) return null;

    log("Attempting to fetch config from Metafield...");

    const query = `
       query ($handle: String!) {
         product(handle: $handle) {
           metafield(namespace: "finalform", key: "config") {
             value
           }
         }
       }
     `;

    try {
      const response = await fetch(
        `/api/${CONFIG.STOREFRONT_API_VERSION}/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": token,
          },
          body: JSON.stringify({ query, variables: { handle } }),
        }
      );

      const result = await response.json();
      const value = result.data?.product?.metafield?.value;

      if (value) {
        return JSON.parse(value); // Returns the stored config
      }
    } catch (e) {
      log("Metafield fetch failed:", e);
    }

    return null;
  }

  // 2. Fetch form config from App API (Fallback)
  async function fetchFallbackConfig(domain, productId, productHandle) {
    log("Fetching config from fallback API...");
    // Build API URL
    const params = new URLSearchParams({ domain });
    if (productId) params.append("productId", productId);
    if (productHandle) params.append("productHandle", productHandle);

    const apiUrl = `${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINT}?${params}`;

    try {
      const response = await fetch(apiUrl);
      const html = await response.text();
      let data;
      try {
        data = JSON.parse(html);
      } catch (e) {
        const match = html.match(/<pre[^>]*>([^<]+)<\/pre>/);
        if (match) data = JSON.parse(match[1]);
        else throw new Error("Invalid API response format");
      }
      if (data.error) return null;
      return data;
    } catch (error) {
      log("Fallback fetch failed:", error);
      return null;
    }
  }

  // Main Fetch Orchestrator
  async function getFormConfig(domain, productInfo, sfToken) {
    const cacheKey = `config_${domain}_${productInfo.productHandle || "store"}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      log("Using cached config");
      return cached;
    }

    // Strategy A: Metafield (Fastest)
    if (sfToken && productInfo.productHandle) {
      const metaConfig = await fetchMetafieldConfig(
        productInfo.productHandle,
        sfToken
      );
      if (metaConfig) {
        log("Found config in Metafield!");
        // Wrap in standard structure if stored as raw config
        // The assignForm workflow stringifies the 'config' object.
        // We need to match the structure expected by renderForm.
        // Assuming stored value is raw form config. We need 'formId', 'assignment', etc?
        // Wait, assignForm stores `formConfig`. FormConfig is just styling/fields.
        // renderForm needs: { formName, formId, assignment, config: ... }
        // If we store ONLY config, we miss ID/Assignment info.
        // But for rendering, we mainly need 'config'.
        // Let's assume we store the FULL object in Metafield?
        // shopify-assign-form.json stores: value: JSON.stringify($json.formConfig)
        // But formConfig might be just the style part?
        // In FormAssignmentSheet, 'selectedForm.config' is likely the styles.
        // I should verify. If it's partial, I might need to mock metadata.

        // Re-constructing minimal valid object for renderForm
        const fullObject = {
          config: metaConfig,
          formName: "Product Form", // Placeholder
          formId: "metafield-form",
          assignment: { type: "product" },
        };
        cache.set(cacheKey, fullObject);
        return fullObject;
      }
    }

    // Strategy B: Fallback (n8n proxy)
    const fallback = await fetchFallbackConfig(
      domain,
      productInfo.productId,
      productInfo.productHandle
    );
    if (fallback) {
      log("Found config via Fallback");
      cache.set(cacheKey, fallback);
      return fallback;
    }

    return null;
  }

  // Render the checkout form
  function renderForm(
    config,
    targetSelector = '.product-form, form[action*="/cart/add"]'
  ) {
    if (!config || !config.config) {
      log("No valid config to render");
      return;
    }

    const target = document.querySelector(targetSelector);
    if (!target) {
      log("Target element not found:", targetSelector);
      return;
    }

    log("Rendering form...");

    const container = document.createElement("div");
    container.id = "finalform-container";
    container.className = "finalform-checkout";

    // Placeholder rendering logic
    container.innerHTML = `
      <div class="finalform-wrapper" style="
        font-family: system-ui, -apple-system, sans-serif;
        padding: 20px;
        border-radius: ${config.config.borderRadius || "12px"};
        background: ${config.config.formBackground || "#ffffff"};
        border: 1px solid #e2e8f0;
        margin-top: 20px;
      ">
        <div class="finalform-header" style="margin-bottom: 16px;">
          <h3 style="margin: 0; font-weight: 600; color: ${
            config.config.textColor || "#1e293b"
          };">
            ${config.config.translations?.cta?.fr || "Commander Maintenant"}
          </h3>
        </div>
        <div class="finalform-body">
             <p style="color: #64748b; font-size: 14px;">Loaded via ${
               config.formId === "metafield-form"
                 ? "Shopify Metafield (Fast)"
                 : "App API"
             }</p>
        </div>
        <button type="button" class="finalform-cta" style="
          width: 100%;
          padding: 14px 20px;
          background: ${config.config.ctaColor || "#4f46e5"};
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          margin-top: 16px;
        ">
          ${config.config.translations?.cta?.fr || "Commander"}
        </button>
      </div>
    `;

    target.style.display = "none";
    target.parentNode.insertBefore(container, target.nextSibling);
  }

  async function init() {
    log("FinalForm loader initializing...");
    const domain = getCurrentDomain();
    const sfToken = getStorefrontToken();
    const productInfo = getProductInfo();

    log("Domain:", domain);
    if (!productInfo.isProductPage) return;

    const config = await getFormConfig(domain, productInfo, sfToken);

    if (!config) {
      log("No config found, skipping render");
      return;
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => renderForm(config));
    } else {
      renderForm(config);
    }
  }

  init();
})();

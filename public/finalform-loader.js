/**
 * Final Form Loader v2.2
 *
 * A lightweight script that renders forms identical to the app's FormPreview.
 * Reads config from API and applies all styling, fields, and logic.
 *
 * Self-executing, no dependencies, Shadow DOM isolated.
 */
(function () {
  "use strict";

  // Prevent duplicate initialization
  if (window.__FINALFORM_INITIALIZED__) {
    console.log("[FinalForm] ⚠️ Already initialized, skipping...");
    return;
  }
  window.__FINALFORM_INITIALIZED__ = true;

  const LOADER_VERSION = "2.2.0";
  const ORDER_API = "https://finalform.app.n8n.cloud/webhook/order/submit";
  const CACHE_KEY = "ff_config";
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Default config used when no metafield config exists
  const DEFAULT_CONFIG = {
    config: {
      header: { enabled: true, style: "classic", defaultLanguage: "fr" },
      fields: {
        name: {
          visible: true,
          required: true,
          placeholder: { fr: "Nom complet", ar: "الاسم الكامل" },
        },
        phone: {
          visible: true,
          required: true,
          placeholder: { fr: "Téléphone", ar: "الهاتف" },
        },
        wilaya: {
          visible: true,
          required: true,
          placeholder: { fr: "Wilaya", ar: "الولاية" },
        },
        address: {
          visible: true,
          required: false,
          placeholder: { fr: "Adresse", ar: "العنوان" },
        },
      },
      shipping: { standard: { home: 600, desk: 400 } },
      enableHomeDelivery: true,
      enableDeskDelivery: true,
      translations: {
        cta: { fr: "Commander maintenant", ar: "اطلب الآن" },
        home: { fr: "Livraison à domicile", ar: "التوصيل للمنزل" },
        desk: { fr: "Stop desk", ar: "نقطة استلام" },
      },
      ctaVariant: "solid",
      ctaColor: "#4f46e5",
      accentColor: "#6366f1",
    },
  };

  // Global state to hold current config and context
  let currentConfig = null;
  let currentProduct = null;

  // Algeria Wilayas (simplified list)
  const WILAYAS = [
    { id: "01", name: "Adrar" },
    { id: "02", name: "Chlef" },
    { id: "03", name: "Laghouat" },
    { id: "04", name: "Oum El Bouaghi" },
    { id: "05", name: "Batna" },
    { id: "06", name: "Béjaïa" },
    { id: "07", name: "Biskra" },
    { id: "08", name: "Béchar" },
    { id: "09", name: "Blida" },
    { id: "10", name: "Bouira" },
    { id: "11", name: "Tamanrasset" },
    { id: "12", name: "Tébessa" },
    { id: "13", name: "Tlemcen" },
    { id: "14", name: "Tiaret" },
    { id: "15", name: "Tizi Ouzou" },
    { id: "16", name: "Alger" },
    { id: "17", name: "Djelfa" },
    { id: "18", name: "Jijel" },
    { id: "19", name: "Sétif" },
    { id: "20", name: "Saïda" },
    { id: "21", name: "Skikda" },
    { id: "22", name: "Sidi Bel Abbès" },
    { id: "23", name: "Annaba" },
    { id: "24", name: "Guelma" },
    { id: "25", name: "Constantine" },
    { id: "26", name: "Médéa" },
    { id: "27", name: "Mostaganem" },
    { id: "28", name: "M'Sila" },
    { id: "29", name: "Mascara" },
    { id: "30", name: "Ouargla" },
    { id: "31", name: "Oran" },
    { id: "32", name: "El Bayadh" },
    { id: "33", name: "Illizi" },
    { id: "34", name: "Bordj Bou Arreridj" },
    { id: "35", name: "Boumerdès" },
    { id: "36", name: "El Tarf" },
    { id: "37", name: "Tindouf" },
    { id: "38", name: "Tissemsilt" },
    { id: "39", name: "El Oued" },
    { id: "40", name: "Khenchela" },
    { id: "41", name: "Souk Ahras" },
    { id: "42", name: "Tipaza" },
    { id: "43", name: "Mila" },
    { id: "44", name: "Aïn Defla" },
    { id: "45", name: "Naâma" },
    { id: "46", name: "Aïn Témouchent" },
    { id: "47", name: "Ghardaïa" },
    { id: "48", name: "Relizane" },
  ];

  // --- UTILITIES ---
  function getShopDomain() {
    if (window.Shopify && window.Shopify.shop) return window.Shopify.shop;
    return window.location.hostname;
  }

  function getStorefrontToken() {
    try {
      if (document.currentScript) {
        const url = new URL(document.currentScript.src);
        const token = url.searchParams.get("sf_token");
        if (token) return token;
      }
      // Fallback
      const script = document.querySelector(
        'script[src*="finalform-loader.js"][src*="sf_token"]',
      );
      if (script) {
        const url = new URL(script.src);
        return url.searchParams.get("sf_token");
      }
    } catch (e) {
      console.warn("[FinalForm] Error parsing token:", e);
    }
    return null;
  }

  function getProductContext() {
    if (window.ShopifyAnalytics?.meta?.product) {
      const p = window.ShopifyAnalytics.meta.product;
      // Ensure IDs are strings
      return {
        id: p.id ? String(p.id) : null,
        handle: p.handle,
        title: p.name || p.title,
      };
    }
    // Fallback parsing from URL
    const match = window.location.pathname.match(/\/products\/([^/?]+)/);
    if (match) {
      return { handle: match[1] };
    }

    // Check meta.page for product handle
    if (
      window.meta?.page?.resourceType === "product" &&
      window.meta.page.resourceId
    ) {
      // We might not have handle here easily, but let's try
    }

    return null;
  }

  // --- CONFIG FETCHING ---

  /**
   * Fetch product-level metafield config via Storefront API
   * @param {string} handle - Product handle
   * @param {string} token - Storefront Access Token
   * @returns {Object|null} - Parsed config or null
   */
  async function fetchProductMetafieldConfig(handle, token) {
    if (!token || !handle) {
      console.log(
        "[FinalForm] ❌ Cannot fetch product metafield: missing token or handle",
      );
      return null;
    }

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
      console.log("[FinalForm] 🔍 Checking product metafield for handle:", handle);
      const response = await fetch(`/api/2024-01/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({ query, variables: { handle } }),
      });

      const result = await response.json();
      const value = result.data?.product?.metafield?.value;

      if (value) {
        console.log("[FinalForm] ✅ CONFIG SOURCE: Product Metafield");
        return JSON.parse(value);
      } else {
        console.log("[FinalForm] ⚠️ Product metafield not found or empty");
      }
    } catch (e) {
      console.warn("[FinalForm] ❌ Product metafield fetch failed:", e);
    }
    return null;
  }

  /**
   * Fetch store-level metafield config via Storefront API
   * @param {string} token - Storefront Access Token
   * @returns {Object|null} - Parsed config or null
   */
  async function fetchStoreMetafieldConfig(token) {
    if (!token) {
      console.log("[FinalForm] ❌ Cannot fetch store metafield: missing token");
      return null;
    }

    const query = `
      query {
        shop {
          metafield(namespace: "finalform", key: "config") {
            value
          }
        }
      }
    `;

    try {
      console.log("[FinalForm] 🔍 Checking store metafield...");
      const response = await fetch(`/api/2024-01/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({ query }),
      });

      const result = await response.json();
      const value = result.data?.shop?.metafield?.value;

      if (value) {
        console.log("[FinalForm] ✅ CONFIG SOURCE: Store Metafield");
        return JSON.parse(value);
      } else {
        console.log("[FinalForm] ⚠️ Store metafield not found or empty");
      }
    } catch (e) {
      console.warn("[FinalForm] ❌ Store metafield fetch failed:", e);
    }
    return null;
  }

  /**
   * Main config fetching function
   * Priority: 1) Cache -> 2) Product Metafield -> 3) Store Metafield -> 4) Default Config
   * NO n8n fallback - purely metafield-based
   */
  async function fetchConfig(domain, product, sfToken) {
    console.log("[FinalForm] 📦 Starting config resolution...");
    console.log("[FinalForm] Domain:", domain);
    console.log("[FinalForm] Product:", product?.handle || "N/A");
    console.log(
      "[FinalForm] Storefront Token:",
      sfToken ? "✓ Present" : "✗ Missing",
    );

    // Step 1: Check cache first
    const cached = getCachedConfig(domain, product);
    if (cached) {
      console.log("[FinalForm] ✅ CONFIG SOURCE: Cache");
      return cached;
    }

    // Step 2: Try product-level metafield (if on a product page)
    if (sfToken && product?.handle) {
      const productConfig = await fetchProductMetafieldConfig(
        product.handle,
        sfToken,
      );
      if (productConfig) {
        cacheConfig(domain, product, productConfig);
        return productConfig;
      }
    }

    // Step 3: Try store-level metafield (fallback for all products)
    if (sfToken) {
      const storeConfig = await fetchStoreMetafieldConfig(sfToken);
      if (storeConfig) {
        cacheConfig(domain, product, storeConfig);
        return storeConfig;
      }
    }

    // Step 4: Use default config (no external API calls)
    console.log(
      "[FinalForm] ✅ CONFIG SOURCE: Default Config (no metafields found)",
    );
    console.log(
      "[FinalForm] ℹ️ To customize, assign a form to this product or store via the FinalForm dashboard",
    );

    // Return a copy of default config to avoid mutations
    const defaultCopy = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    cacheConfig(domain, product, defaultCopy);
    return defaultCopy;
  }

  function getCacheKey(domain, product) {
    return `${CACHE_KEY}_${domain}_${product?.id || product?.handle || "store"}`;
  }

  function getCachedConfig(domain, product) {
    try {
      const raw = sessionStorage.getItem(getCacheKey(domain, product));
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      return Date.now() - ts < CACHE_TTL ? data : null;
    } catch {
      return null;
    }
  }

  function cacheConfig(domain, product, data) {
    try {
      sessionStorage.setItem(
        getCacheKey(domain, product),
        JSON.stringify({ data, ts: Date.now() }),
      );
    } catch {}
  }

  function formatCurrency(amount, lang = "fr") {
    return lang === "ar" ? `${amount} دج` : `${amount} DA`;
  }

  /**
   * Fetch product data via Storefront API for rendering
   * @param {string} handle - Product handle
   * @returns {Object|null} - Product data or null
   */
  async function fetchProduct(handle) {
    const sfToken = getStorefrontToken();
    if (!sfToken || !handle) {
      console.log(
        "[FinalForm] ⚠️ Cannot fetch product data: missing token or handle",
      );
      return null;
    }

    const query = `
      query ($handle: String!) {
        product(handle: $handle) {
          id
          title
          handle
          description
          images(first: 5) {
            edges {
              node {
                src: url
                altText
              }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
        }
      }
    `;

    try {
      const response = await fetch("/api/2026-01/graphql.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": sfToken,
        },
        body: JSON.stringify({ query, variables: { handle } }),
      });

      const result = await response.json();
      const productData = result.data?.product;

      if (productData) {
        // Transform to simpler format
        return {
          product: {
            id: productData.id,
            title: productData.title,
            handle: productData.handle,
            description: productData.description,
            images:
              productData.images?.edges?.map((e) => ({
                src: e.node.src,
                alt: e.node.altText,
              })) || [],
            variants:
              productData.variants?.edges?.map((e) => ({
                id: e.node.id,
                title: e.node.title,
                price: e.node.price?.amount,
                available: e.node.availableForSale,
              })) || [],
          },
        };
      }
    } catch (e) {
      console.warn("[FinalForm] ❌ Failed to fetch product:", e);
    }
    return null;
  }

  // --- FORM BUILDER ---
  function buildForm(config, productData) {
    const c = config.config || {};
    const lang = c.header?.defaultLanguage || "fr";
    const isRTL = lang === "ar";
    const dir = isRTL ? "rtl" : "ltr";

    // Helpers
    const txt = (key) =>
      c.translations?.[key]?.[lang] || c.translations?.[key]?.fr || "";
    const getFieldTxt = (key) =>
      c.fields?.[key]?.placeholder?.[lang] || c.fields?.[key]?.placeholder?.fr || "";
    const offers = c.offers || [];
    const shipping = c.shipping || { standard: { home: 600, desk: 400 } };
    const product = productData?.product;
    const variants = product?.variants || [];

    // State (will be bound to form)
    const state = {
      offerId: offers[0]?.id || "",
      shippingType: "home",
      wilaya: "",
      name: "",
      phone: "",
      commune: "",
      address: "",
      note: "",
      variantId: variants[0]?.id || "",
    };

    // Build HTML
    return `
      <div class="ff-root" dir="${dir}">
        ${buildHeader(c, product, lang)}
        <div class="ff-body">
          ${buildSections(c, state, product, variants, lang)}
        </div>
        ${c.ctaSticky ? buildStickyCTA(c, lang) : ""}
      </div>
    `;
  }

  function buildHeader(c, product, lang) {
    if (!c.header?.enabled || c.header?.style === "hidden") return "";

    const showImage = c.header?.showProductImage && product?.images?.[0];
    const showPrice = c.header?.showProductPrice;
    const price = product?.variants?.[0]?.price || "";

    return `
      <div class="ff-header ff-header--${c.header?.style || "classic"}">
        ${
          showImage
            ? `<img src="${product.images[0].src}" alt="${product.title}" class="ff-header-img" />`
            : ""
        }
        <div class="ff-header-content">
          <h2 class="ff-header-title">${product?.title || ""}</h2>
          ${
            showPrice
              ? `<p class="ff-header-price">${price} <span class="ff-currency">${
                  lang === "ar" ? "دج" : "DA"
                }</span></p>`
              : ""
          }
        </div>
      </div>
    `;
  }

  function buildSections(c, state, product, variants, lang) {
    const order = c.sectionOrder || [
      "variants",
      "shipping",
      "delivery",
      "offers",
      "promoCode",
      "summary",
      "cta",
      "trustBadges",
    ];
    let html = "";

    for (const section of order) {
      switch (section) {
        case "variants":
          if (variants.length > 1) html += buildVariants(c, variants, lang);
          break;
        case "shipping":
          html += buildShippingFields(c, lang);
          break;
        case "delivery":
          if (!c.hideDeliveryOption) html += buildDelivery(c, lang);
          break;
        case "offers":
          if (c.offers?.length > 0) html += buildOffers(c, lang);
          break;
        case "promoCode":
          if (c.promoCode?.enabled) html += buildPromoCode(c, lang);
          break;
        case "summary":
          if (c.enableSummarySection) html += buildSummary(c, lang);
          break;
        case "cta":
          html += buildCTA(c, lang);
          break;
        case "urgencyText":
          if (c.urgencyText?.enabled) html += buildUrgencyText(c, lang);
          break;
        case "urgencyQuantity":
          if (c.urgencyQuantity?.enabled) html += buildUrgencyQuantity(c, lang);
          break;
        case "urgencyTimer":
          if (c.urgencyTimer?.enabled) html += buildUrgencyTimer(c, lang);
          break;
        case "trustBadges":
          if (c.enableTrustBadges) html += buildTrustBadges(c, lang);
          break;
      }
    }
    return html;
  }

  function buildVariants(c, variants, lang) {
    const title = c.translations?.variants?.[lang] || "Select variant";
    const style = c.variantStyle || "buttons";

    return `
      <div class="ff-section ff-variants">
        ${
          c.sectionSettings?.variants?.showTitle
            ? `<div class="ff-section-title">${title}</div>`
            : ""
        }
        <div class="ff-variants-grid ff-variants--${style}">
          ${variants
            .map(
              (v, i) => `
            <label class="ff-variant-item ${
              i === 0 ? "ff-variant-item--selected" : ""
            }" data-variant-id="${v.id}">
              <input type="radio" name="ff_variant" value="${v.id}" ${
                i === 0 ? "checked" : ""
              } />
              <span class="ff-variant-title">${v.title}</span>
              <span class="ff-variant-price">${v.price} ${
                lang === "ar" ? "دج" : "DA"
              }</span>
            </label>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function buildShippingFields(c, lang) {
    const fields = c.fields || {};
    const getPlaceholder = (key) =>
      fields[key]?.placeholder?.[lang] || fields[key]?.placeholder?.fr || "";
    const isRequired = (key) => (fields[key]?.required ? " *" : "");
    const inputClass = "ff-input";

    let html = `<div class="ff-section ff-shipping-fields">`;
    if (c.sectionSettings?.shipping?.showTitle) {
      html += `<div class="ff-section-title">${
        c.translations?.shipping?.[lang] || "Shipping Info"
      }</div>`;
    }

    // Name
    if (fields.name?.visible) {
      html += `<input type="text" name="ff_name" class="${inputClass}" placeholder="${getPlaceholder(
        "name",
      )}${isRequired("name")}" ${fields.name?.required ? "required" : ""} />`;
    }

    // Phone
    if (fields.phone?.visible) {
      html += `<input type="tel" name="ff_phone" class="${inputClass}" placeholder="${getPlaceholder(
        "phone",
      )}${isRequired("phone")}" ${fields.phone?.required ? "required" : ""} />`;
    }

    // Wilaya
    if (fields.wilaya?.visible) {
      html += `
        <div class="ff-select-wrap">
          <select name="ff_wilaya" class="${inputClass}" ${
            fields.wilaya?.required ? "required" : ""
          }>
            <option value="">${getPlaceholder("wilaya")}${isRequired(
              "wilaya",
            )}</option>
            ${WILAYAS.map((w) => `<option value="${w.id}">${w.name}</option>`).join(
              "",
            )}
          </select>
          <svg class="ff-select-arrow" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      `;
    }

    // Commune
    if (fields.commune?.visible && c.locationInputMode === "double_dropdown") {
      html += `
        <div class="ff-select-wrap">
          <select name="ff_commune" class="${inputClass}" ${
            fields.commune?.required ? "required" : ""
          } disabled>
            <option value="">${getPlaceholder("commune")}${isRequired(
              "commune",
            )}</option>
          </select>
          <svg class="ff-select-arrow" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </div>
      `;
    }

    // Address
    if (fields.address?.visible) {
      html += `<textarea name="ff_address" class="${inputClass}" placeholder="${getPlaceholder(
        "address",
      )}${isRequired("address")}" rows="2" ${
        fields.address?.required ? "required" : ""
      }></textarea>`;
    }

    // Note
    if (fields.note?.visible) {
      html += `<textarea name="ff_note" class="${inputClass}" placeholder="${getPlaceholder(
        "note",
      )}${isRequired("note")}" rows="2"></textarea>`;
    }

    html += `</div>`;
    return html;
  }

  function buildDelivery(c, lang) {
    const home = c.translations?.home?.[lang] || "Home";
    const desk = c.translations?.desk?.[lang] || "Desk";
    const homePrice = c.shipping?.standard?.home || 600;
    const deskPrice = c.shipping?.standard?.desk || 400;
    const enableHome = c.enableHomeDelivery !== false;
    const enableDesk = c.enableDeskDelivery !== false;

    return `
      <div class="ff-section ff-delivery">
        ${
          c.sectionSettings?.delivery?.showTitle
            ? `<div class="ff-section-title">${
                c.translations?.delivery?.[lang] || "Delivery"
              }</div>`
            : ""
        }
        <div class="ff-delivery-options">
          ${
            enableHome
              ? `
            <label class="ff-delivery-option ff-delivery-option--selected" data-type="home">
              <input type="radio" name="ff_delivery" value="home" checked />
              <span class="ff-delivery-label">${home}</span>
              <span class="ff-delivery-price">${homePrice} ${
                lang === "ar" ? "دج" : "DA"
              }</span>
            </label>
          `
              : ""
          }
          ${
            enableDesk
              ? `
            <label class="ff-delivery-option" data-type="desk">
              <input type="radio" name="ff_delivery" value="desk" />
              <span class="ff-delivery-label">${desk}</span>
              <span class="ff-delivery-price">${deskPrice} ${
                lang === "ar" ? "دج" : "DA"
              }</span>
            </label>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  function buildOffers(c, lang) {
    const offers = c.offers || [];
    const title = c.translations?.offers?.[lang] || "Choose offer";

    return `
      <div class="ff-section ff-offers">
        ${
          c.sectionSettings?.offers?.showTitle
            ? `<div class="ff-section-title">${title}</div>`
            : ""
        }
        <div class="ff-offers-grid">
          ${offers
            .map(
              (o, i) => `
            <label class="ff-offer-card ${
              i === 0 ? "ff-offer-card--selected" : ""
            }" data-offer-id="${o.id}">
              <input type="radio" name="ff_offer" value="${o.id}" ${
                i === 0 ? "checked" : ""
              } />
              <span class="ff-offer-title">${
                o.title?.[lang] || o.title?.fr || ""
              }</span>
              <span class="ff-offer-desc">${
                o.desc?.[lang] || o.desc?.fr || ""
              }</span>
              ${
                o.discount > 0
                  ? `<span class="ff-offer-badge">-${o.discount}%</span>`
                  : ""
              }
            </label>
          `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  function buildPromoCode(c, lang) {
    const placeholder = c.promoCode?.placeholder?.[lang] || "Promo code";
    const btnText = c.promoCode?.buttonText?.[lang] || "Apply";

    return `
      <div class="ff-section ff-promo">
        ${
          c.sectionSettings?.promoCode?.showTitle
            ? `<div class="ff-section-title">${
                c.translations?.promoCode?.[lang] || "Promo"
              }</div>`
            : ""
        }
        <div class="ff-promo-input-wrap">
          <input type="text" name="ff_promo" class="ff-input ff-promo-input" placeholder="${placeholder}" />
          <button type="button" class="ff-promo-btn">${btnText}</button>
        </div>
        <div class="ff-promo-message"></div>
      </div>
    `;
  }

  function buildSummary(c, lang) {
    const subtotalLabel = c.translations?.subtotal?.[lang] || "Subtotal";
    const shippingLabel = c.translations?.shippingLabel?.[lang] || "Shipping";
    const totalLabel = c.translations?.total?.[lang] || "Total";

    return `
      <div class="ff-section ff-summary">
        ${
          c.sectionSettings?.summary?.showTitle
            ? `<div class="ff-section-title">${totalLabel}</div>`
            : ""
        }
        <div class="ff-summary-row"><span>${subtotalLabel}</span><span class="ff-summary-subtotal">--</span></div>
        ${
          !c.hideShippingInSummary
            ? `<div class="ff-summary-row"><span>${shippingLabel}</span><span class="ff-summary-shipping">--</span></div>`
            : ""
        }
        <div class="ff-summary-row ff-summary-total"><span>${totalLabel}</span><span class="ff-summary-total-value">--</span></div>
      </div>
    `;
  }

  function buildCTA(c, lang) {
    const text = c.translations?.cta?.[lang] || "Order Now";
    const variant = c.ctaVariant || "solid";
    const animation = c.ctaAnimation || "none";

    return `
      <div class="ff-section ff-cta-wrap">
        <button type="submit" class="ff-cta ff-cta--${variant} ff-cta--${animation}">
          ${text}
        </button>
      </div>
    `;
  }

  function buildUrgencyText(c, lang) {
    const text = c.urgencyText?.text?.[lang] || "";
    const style = c.urgencyText?.style || "banner";
    if (!text) return "";

    return `<div class="ff-section ff-urgency-text ff-urgency-text--${style}">${text}</div>`;
  }

  function buildUrgencyQuantity(c, lang) {
    const stock = c.urgencyQuantity?.stockCount || 5;
    const style = c.urgencyQuantity?.style || "counter";

    return `
      <div class="ff-section ff-urgency-qty ff-urgency-qty--${style}">
        <span class="ff-urgency-qty-icon">🔥</span>
        <span>${
          lang === "ar"
            ? `${stock} متبقية في المخزون`
            : `Only ${stock} left in stock!`
        }</span>
      </div>
    `;
  }

  function buildUrgencyTimer(c, lang) {
    const h = c.urgencyTimer?.hours || 0;
    const m = c.urgencyTimer?.minutes || 30;
    const s = c.urgencyTimer?.seconds || 0;
    const style = c.urgencyTimer?.style || "digital";

    return `
      <div class="ff-section ff-urgency-timer ff-urgency-timer--${style}" data-hours="${h}" data-minutes="${m}" data-seconds="${s}">
        <span class="ff-timer-segment"><span class="ff-timer-value ff-timer-h">${String(
          h,
        ).padStart(2, "0")}</span><span class="ff-timer-label">${
          lang === "ar" ? "س" : "h"
        }</span></span>
        <span class="ff-timer-sep">:</span>
        <span class="ff-timer-segment"><span class="ff-timer-value ff-timer-m">${String(
          m,
        ).padStart(2, "0")}</span><span class="ff-timer-label">${
          lang === "ar" ? "د" : "m"
        }</span></span>
        <span class="ff-timer-sep">:</span>
        <span class="ff-timer-segment"><span class="ff-timer-value ff-timer-s">${String(
          s,
        ).padStart(2, "0")}</span><span class="ff-timer-label">${
          lang === "ar" ? "ث" : "s"
        }</span></span>
      </div>
    `;
  }

  function buildTrustBadges(c, lang) {
    const badges = c.trustBadges || {};
    const style = c.trustBadgeStyle || "cards";
    const icons = {
      cod: "💵",
      guarantee: "✅",
      return: "↩️",
      support: "💬",
      fastDelivery: "🚚",
    };

    let html = `<div class="ff-section ff-trust ff-trust--${style}">`;
    if (c.sectionSettings?.trustBadges?.showTitle) {
      html += `<div class="ff-section-title">${
        c.translations?.trustTitle?.[lang] || "Guarantees"
      }</div>`;
    }
    html += `<div class="ff-trust-grid">`;

    for (const [key, badge] of Object.entries(badges)) {
      if (badge?.enabled) {
        const label =
          badge.customText?.[lang] || badge.label?.[lang] || badge.label?.fr || "";
        html += `<div class="ff-trust-badge"><span class="ff-trust-icon">${
          icons[key] || "✓"
        }</span><span>${label}</span></div>`;
      }
    }

    html += `</div></div>`;
    return html;
  }

  function buildStickyCTA(c, lang) {
    const text = c.translations?.cta?.[lang] || "Order Now";
    return `
      <div class="ff-sticky-cta">
        <button type="button" class="ff-cta ff-cta--${
          c.ctaVariant || "solid"
        }">${text}</button>
      </div>
    `;
  }

  // --- STYLES ---
  function getStyles(c) {
    const cfg = c.config || {};
    const accent = cfg.accentColor || "#6366f1";
    const cta = cfg.ctaColor || "#4f46e5";
    const radius = cfg.borderRadius || "12px";
    const bg = cfg.formBackground || "#ffffff";
    const text = cfg.textColor || "#1e293b";
    const inputBg = cfg.inputBackground || "#f8fafc";
    const inputBorder = cfg.inputBorderColor || "#e2e8f0";
    const inputText = cfg.inputTextColor || "#1e293b";
    const inputPlaceholder = cfg.inputPlaceholderColor || "#94a3b8";

    return `
      * { box-sizing: border-box; }
      .ff-root {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
        background: ${bg};
        color: ${text};
        border-radius: ${radius};
        border: 1px solid ${inputBorder};
        overflow: hidden;
        margin: 20px 0;
      }
      .ff-header {
        display: flex;
        gap: 12px;
        padding: 16px;
        border-bottom: 1px solid ${inputBorder};
        align-items: center;
      }
      .ff-header-img { width: 80px; height: 80px; object-fit: cover; border-radius: 8px; }
      .ff-header-title { margin: 0; font-size: 16px; font-weight: 600; }
      .ff-header-price { margin: 4px 0 0; font-size: 18px; font-weight: 700; color: ${accent}; }
      .ff-currency { font-size: 12px; opacity: 0.7; }
      .ff-body { padding: 16px; }
      .ff-section { margin-bottom: 20px; }
      .ff-section-title { font-size: 13px; font-weight: 600; color: ${text}; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
      .ff-section-title::before { content: ''; width: 3px; height: 14px; background: ${accent}; border-radius: 2px; }
      
      .ff-input {
        width: 100%; padding: 12px 14px; border: 2px solid ${inputBorder};
        border-radius: 8px; font-size: 14px; background: ${inputBg}; color: ${inputText};
        margin-bottom: 10px; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
      }
      .ff-input:focus { border-color: ${accent}; box-shadow: 0 0 0 3px ${accent}20; }
      .ff-input::placeholder { color: ${inputPlaceholder}; }
      
      .ff-select-wrap { position: relative; }
      .ff-select-wrap select { appearance: none; padding-right: 36px; cursor: pointer; }
      .ff-select-arrow { position: absolute; right: 12px; top: 50%; transform: translateY(-70%); width: 16px; height: 16px; pointer-events: none; fill: none; stroke: ${inputPlaceholder}; stroke-width: 2; }
      [dir="rtl"] .ff-select-wrap select { padding-right: 14px; padding-left: 36px; }
      [dir="rtl"] .ff-select-arrow { right: auto; left: 12px; }

      .ff-variants-grid { display: flex; flex-wrap: wrap; gap: 8px; }
      .ff-variant-item { flex: 1; min-width: 80px; padding: 10px 12px; border: 2px solid ${inputBorder}; border-radius: 8px; cursor: pointer; text-align: center; transition: all 0.15s; }
      .ff-variant-item input { display: none; }
      .ff-variant-item--selected { border-color: ${accent}; background: ${accent}10; }
      .ff-variant-title { display: block; font-weight: 600; font-size: 13px; }
      .ff-variant-price { display: block; font-size: 12px; color: ${accent}; margin-top: 2px; }

      .ff-delivery-options { display: flex; gap: 10px; }
      .ff-delivery-option { flex: 1; padding: 14px; border: 2px solid ${inputBorder}; border-radius: 10px; cursor: pointer; text-align: center; transition: all 0.15s; }
      .ff-delivery-option input { display: none; }
      .ff-delivery-option--selected { border-color: ${accent}; background: ${accent}10; }
      .ff-delivery-label { display: block; font-weight: 600; font-size: 13px; }
      .ff-delivery-price { display: block; font-size: 12px; color: ${accent}; margin-top: 4px; }

      .ff-offers-grid { display: flex; flex-direction: column; gap: 8px; }
      .ff-offer-card { position: relative; padding: 14px; border: 2px solid ${inputBorder}; border-radius: 10px; cursor: pointer; transition: all 0.15s; }
      .ff-offer-card input { display: none; }
      .ff-offer-card--selected { border-color: ${accent}; background: ${accent}10; }
      .ff-offer-title { display: block; font-weight: 600; font-size: 14px; }
      .ff-offer-desc { display: block; font-size: 12px; color: #64748b; margin-top: 2px; }
      .ff-offer-badge { position: absolute; top: -8px; right: 10px; background: #ef4444; color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
      [dir="rtl"] .ff-offer-badge { right: auto; left: 10px; }

      .ff-promo-input-wrap { display: flex; gap: 8px; }
      .ff-promo-input { flex: 1; margin-bottom: 0; }
      .ff-promo-btn { padding: 12px 20px; background: ${accent}; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; white-space: nowrap; }
      .ff-promo-message { font-size: 12px; margin-top: 6px; }
      .ff-promo-message.success { color: #10b981; }
      .ff-promo-message.error { color: #ef4444; }

      .ff-summary { background: #f8fafc; padding: 14px; border-radius: 10px; }
      .ff-summary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
      .ff-summary-total { font-weight: 700; font-size: 15px; margin-top: 10px; padding-top: 10px; border-top: 1px dashed ${inputBorder}; }
      .ff-summary-total-value { color: ${accent}; }

      .ff-cta {
        width: 100%; padding: 16px; border: none; border-radius: 10px;
        font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.15s;
      }
      .ff-cta--solid { background: ${cta}; color: white; }
      .ff-cta--outline { background: transparent; border: 2px solid ${cta}; color: ${cta}; }
      .ff-cta--gradient { background: linear-gradient(135deg, ${cta} 0%, ${accent} 100%); color: white; }
      .ff-cta--shake { animation: ff-shake 2.5s ease-in-out infinite; animation-delay: 1s; }
      @keyframes ff-shake { 0%, 84%, 100% { transform: translateX(0); } 85%, 87%, 89%, 91% { transform: translateX(-4px); } 86%, 88%, 90%, 92% { transform: translateX(4px); } 93% { transform: translateX(0); } }

      .ff-urgency-text { padding: 10px 14px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center; }
      .ff-urgency-text--banner { background: #fef3c7; color: #92400e; }
      .ff-urgency-text--pill { background: #fee2e2; color: #b91c1c; border-radius: 20px; }

      .ff-urgency-qty { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #fef2f2; border-radius: 8px; font-size: 13px; font-weight: 600; color: #dc2626; }
      .ff-urgency-qty-icon { font-size: 16px; }

      .ff-urgency-timer { display: flex; justify-content: center; gap: 4px; padding: 12px; background: #1e293b; color: white; border-radius: 8px; font-weight: 700; }
      .ff-timer-segment { display: flex; flex-direction: column; align-items: center; min-width: 40px; }
      .ff-timer-value { font-size: 24px; }
      .ff-timer-label { font-size: 10px; opacity: 0.7; }
      .ff-timer-sep { font-size: 24px; line-height: 1; margin-top: 4px; }

      .ff-trust-grid { display: flex; flex-wrap: wrap; gap: 8px; }
      .ff-trust-badge { flex: 1; min-width: 120px; display: flex; align-items: center; gap: 6px; padding: 10px 12px; background: #f1f5f9; border-radius: 8px; font-size: 12px; font-weight: 500; }
      .ff-trust-icon { font-size: 16px; }

      .ff-sticky-cta { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: ${bg}; border-top: 1px solid ${inputBorder}; box-shadow: 0 -4px 20px rgba(0,0,0,0.1); z-index: 1000; display: none; }
      .ff-sticky-cta .ff-cta { margin: 0; }

      .ff-success { text-align: center; padding: 40px 20px; }
      .ff-success-icon { font-size: 56px; margin-bottom: 16px; }
      .ff-success-title { font-size: 20px; font-weight: 700; margin: 0 0 8px; }
      .ff-success-message { color: #64748b; margin: 0; }
    `;
  }

  // --- HANDLERS ---
  function attachHandlers(shadow, config) {
    const form = shadow.querySelector(".ff-root");
    if (!form) return;

    // Variant selection
    shadow.querySelectorAll(".ff-variant-item").forEach((el) => {
      el.addEventListener("click", () => {
        shadow
          .querySelectorAll(".ff-variant-item")
          .forEach((v) => v.classList.remove("ff-variant-item--selected"));
        el.classList.add("ff-variant-item--selected");
        el.querySelector("input").checked = true;
      });
    });

    // Delivery selection
    shadow.querySelectorAll(".ff-delivery-option").forEach((el) => {
      el.addEventListener("click", () => {
        shadow
          .querySelectorAll(".ff-delivery-option")
          .forEach((d) => d.classList.remove("ff-delivery-option--selected"));
        el.classList.add("ff-delivery-option--selected");
        el.querySelector("input").checked = true;
      });
    });

    // Offer selection
    shadow.querySelectorAll(".ff-offer-card").forEach((el) => {
      el.addEventListener("click", () => {
        shadow
          .querySelectorAll(".ff-offer-card")
          .forEach((o) => o.classList.remove("ff-offer-card--selected"));
        el.classList.add("ff-offer-card--selected");
        el.querySelector("input").checked = true;
      });
    });

    // Form submission
    const cta = shadow.querySelector(".ff-cta");
    if (cta) {
      cta.addEventListener("click", async (e) => {
        e.preventDefault();
        const formData = collectFormData(shadow);
        const body = shadow.querySelector(".ff-body");

        // Build order payload with full assignment context
        const orderPayload = {
          // Customer data
          ...formData,
          // Form & Assignment context
          formId: config.formId,
          formName: config.formName,
          assignmentId: config.assignment?.id,
          assignmentType: config.assignment?.type,
          // Store context
          storeId: config.store?.id || config.assignment?.storeId,
          shopifyDomain: config.store?.domain || config.assignment?.shopifyDomain,
          storeName: config.store?.name,
          // Product context (if product-level assignment)
          productId: config.assignment?.productId || currentProduct?.id,
          productHandle: config.assignment?.productHandle || currentProduct?.handle,
          productTitle: currentProduct?.title || config.assignment?.productTitle,
          productPrice: currentProduct?.price,
          // Assigned products list (for multi-product forms)
          assignedProducts: config.assignment?.assignedProducts || [],
          // Timestamps
          submittedAt: new Date().toISOString(),
        };

        console.log("[FinalForm] Submitting order:", orderPayload);

        // Show loading state
        cta.disabled = true;
        cta.textContent = "...";

        try {
          const res = await fetch(ORDER_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload),
          });
          const result = await res.json();

          if (result.success) {
            // Show success
            if (body) {
              const lang = config.config?.header?.defaultLanguage || "fr";
              body.innerHTML = `
                <div class="ff-success">
                  <div class="ff-success-icon">✅</div>
                  <h3 class="ff-success-title">${
                    config.config?.thankYou?.title?.[lang] || "Thank you!"
                  }</h3>
                  <p class="ff-success-message">${
                    config.config?.thankYou?.message?.[lang] ||
                    "Your order has been received."
                  }</p>
                  <p style="margin-top: 8px; font-size: 12px; color: #64748b;">Order ID: ${
                    result.orderId || "N/A"
                  }</p>
                </div>
              `;
            }
          } else {
            throw new Error(result.errors?.join(", ") || "Order failed");
          }
        } catch (err) {
          console.error("[FinalForm] Order submission failed:", err);
          cta.disabled = false;
          cta.textContent = config.config?.translations?.cta?.fr || "Order Now";
          // Show error message
          const msgEl = document.createElement("div");
          msgEl.style.cssText =
            "color: #ef4444; font-size: 12px; text-align: center; margin-top: 8px;";
          msgEl.textContent = "Order failed. Please try again.";
          cta.parentElement.appendChild(msgEl);
          setTimeout(() => msgEl.remove(), 3000);
        }
      });
    }

    // Timer countdown
    const timer = shadow.querySelector(".ff-urgency-timer");
    if (timer) {
      let h = parseInt(timer.dataset.hours) || 0;
      let m = parseInt(timer.dataset.minutes) || 0;
      let s = parseInt(timer.dataset.seconds) || 0;

      setInterval(() => {
        if (s > 0) s--;
        else if (m > 0) {
          m--;
          s = 59;
        } else if (h > 0) {
          h--;
          m = 59;
          s = 59;
        }

        const hEl = timer.querySelector(".ff-timer-h");
        const mEl = timer.querySelector(".ff-timer-m");
        const sEl = timer.querySelector(".ff-timer-s");
        if (hEl) hEl.textContent = String(h).padStart(2, "0");
        if (mEl) mEl.textContent = String(m).padStart(2, "0");
        if (sEl) sEl.textContent = String(s).padStart(2, "0");
      }, 1000);
    }
  }

  function collectFormData(shadow) {
    const data = {};
    shadow.querySelectorAll("input, select, textarea").forEach((el) => {
      if (el.name && el.name.startsWith("ff_")) {
        const key = el.name.replace("ff_", "");
        if (el.type === "radio") {
          if (el.checked) data[key] = el.value;
        } else {
          data[key] = el.value;
        }
      }
    });
    return data;
  }

  // --- RENDER ---
  function render(config, productData) {
    let container = document.getElementById("finalform-container");
    if (!container) {
      const productForm = document.querySelector('form[action*="/cart/add"]');
      if (productForm) {
        container = document.createElement("div");
        container.id = "finalform-container";
        productForm.insertAdjacentElement("afterend", container);
      } else {
        container = document.createElement("div");
        container.id = "finalform-container";
        document.body.appendChild(container);
      }
    }

    // Check if shadow root already exists (prevents re-attach error)
    let shadow = container.shadowRoot;
    if (!shadow) {
      shadow = container.attachShadow({ mode: "open" });
    }

    shadow.innerHTML = `<style>${getStyles(config)}</style>${buildForm(
      config,
      productData,
    )}`;
    attachHandlers(shadow, config);
  }

  // --- INIT ---
  async function init() {
    console.log(
      `[FinalForm] 🚀 Initializing v${LOADER_VERSION} (Metafield-only mode)...`,
    );

    const domain = getShopDomain();
    const product = getProductContext();
    const sfToken = getStorefrontToken();

    console.log("[FinalForm] Context:", {
      domain,
      product: product?.handle || "N/A",
    });

    // fetchConfig handles all scenarios:
    // - Product page with product metafield
    // - Product page falling back to store metafield
    // - Any page using store metafield
    // - Default config as final fallback
    const config = await fetchConfig(domain, product, sfToken);

    if (!config) {
      console.log(
        "[FinalForm] ❌ No config could be loaded (unexpected - default should always be available)",
      );
      return;
    }

    console.log("[FinalForm] ✅ Config loaded successfully");

    // Store globally for order submission
    currentConfig = config;

    let productData = null;
    if (product?.handle) {
      productData = await fetchProduct(product.handle);
      currentProduct = productData?.product || null;
    }

    console.log("[FinalForm] Assignment context:", {
      formId: config.formId,
      assignmentType: config.assignment?.type,
      storeId: config.store?.id,
      productId: config.assignment?.productId,
    });

    render(config, productData);
    console.log("[FinalForm] Rendered successfully");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

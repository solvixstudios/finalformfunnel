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

  const LOADER_VERSION = "2.4.0";
  const ORDER_API = "https://finalform.app.n8n.cloud/webhook/order/submit";

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
   * Priority: 1) Product Metafield -> 2) Store Metafield -> 3) Default Config
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

    // Step 1: Try product-level metafield (if on a product page)
    if (sfToken && product?.handle) {
      const productConfig = await fetchProductMetafieldConfig(
        product.handle,
        sfToken,
      );
      if (productConfig) {
        console.log(
          "[FinalForm] 📋 Product Config Loaded:",
          JSON.stringify(productConfig, null, 2),
        );
        return productConfig;
      }
    }

    // Step 2: Try store-level metafield (fallback for all products)
    if (sfToken) {
      const storeConfig = await fetchStoreMetafieldConfig(sfToken);
      if (storeConfig) {
        console.log(
          "[FinalForm] 📋 Store Config Loaded:",
          JSON.stringify(storeConfig, null, 2),
        );
        return storeConfig;
      }
    }

    // Step 3: Use default config (no external API calls)
    console.log(
      "[FinalForm] ✅ CONFIG SOURCE: Default Config (no metafields found)",
    );
    console.log(
      "[FinalForm] ℹ️ To customize, assign a form to this product or store via the FinalForm dashboard",
    );

    // Return a copy of default config to avoid mutations
    const defaultCopy = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    return defaultCopy;
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
    const currency = lang === "ar" ? "دج" : "DA";

    return `
      <div class="ff-section ff-delivery">
        ${
          c.sectionSettings?.delivery?.showTitle !== false
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
              <div class="ff-delivery-check">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div class="ff-delivery-icon">🏠</div>
              <span class="ff-delivery-label">${home}</span>
              <span class="ff-delivery-price">${homePrice} ${currency}</span>
            </label>
          `
              : ""
          }
          ${
            enableDesk
              ? `
            <label class="ff-delivery-option" data-type="desk">
              <input type="radio" name="ff_delivery" value="desk" />
              <div class="ff-delivery-check"></div>
              <div class="ff-delivery-icon">📦</div>
              <span class="ff-delivery-label">${desk}</span>
              <span class="ff-delivery-price">${deskPrice} ${currency}</span>
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
    const cfg = c.config || c; // Handle both nested and flat config
    const accent = cfg.accentColor || "#6366f1";
    const cta = cfg.ctaColor || "#4f46e5";
    const radius = cfg.borderRadius || "12px";
    const bg = cfg.formBackground || "#ffffff";
    const text = cfg.textColor || "#1e293b";
    const inputBg = cfg.inputBackground || "#f8fafc";
    const inputBorder = cfg.inputBorderColor || "#e2e8f0";
    const inputText = cfg.inputTextColor || "#1e293b";
    const inputPlaceholder = cfg.inputPlaceholderColor || "#94a3b8";
    const inputSpacing = cfg.inputSpacing || 12;
    const sectionSpacing = cfg.sectionSpacing || 20;
    const isFilled = cfg.inputVariant === "filled";

    // Font loading
    const fontFr = cfg.fontFamily?.fr || "Inter";
    const fontAr = cfg.fontFamily?.ar || "Cairo";

    return `
      /* Font Loading */
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Cairo:wght@400;500;600;700;800;900&display=swap');

      * { box-sizing: border-box; margin: 0; padding: 0; }
      
      .ff-root {
        font-family: "${fontFr}", system-ui, -apple-system, sans-serif;
        background: ${bg};
        color: ${text};
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        position: relative;
      }
      [dir="rtl"] .ff-root {
        font-family: "${fontAr}", system-ui, -apple-system, sans-serif;
      }

      /* Header Styles */
      .ff-header {
        display: flex;
        gap: 16px;
        padding: 20px;
        border-bottom: 1px solid ${inputBorder};
        align-items: center;
      }
      .ff-header--minimal {
        padding: 16px 20px;
        flex-direction: column;
        text-align: center;
      }
      .ff-header-img { 
        width: 90px; 
        height: 90px; 
        object-fit: cover; 
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      .ff-header-content { flex: 1; }
      .ff-header-title { 
        margin: 0; 
        font-size: 17px; 
        font-weight: 700;
        line-height: 1.3;
      }
      .ff-header-price { 
        margin: 6px 0 0; 
        font-size: 20px; 
        font-weight: 800; 
        color: ${accent}; 
      }
      .ff-currency { font-size: 13px; opacity: 0.7; margin-left: 2px; }
      [dir="rtl"] .ff-currency { margin-left: 0; margin-right: 2px; }

      /* Body & Sections */
      .ff-body { padding: 20px; }
      .ff-section { margin-bottom: ${sectionSpacing}px; }
      .ff-section:last-child { margin-bottom: 0; }
      
      .ff-section-title { 
        font-size: 13px; 
        font-weight: 700; 
        color: ${text}; 
        margin-bottom: 12px; 
        display: flex; 
        align-items: center; 
        gap: 10px;
        text-transform: uppercase;
        letter-spacing: 0.025em;
      }
      .ff-section-title::before { 
        content: ''; 
        width: 4px; 
        height: 16px; 
        background: ${accent}; 
        border-radius: 2px; 
      }

      /* Input Styling - Matches Tailwind: px-4 py-3.5 text-[13px] font-semibold border-2 */
      .ff-input {
        width: 100%;
        padding: 14px 16px;
        border: 2px solid ${isFilled ? "transparent" : inputBorder};
        border-radius: ${radius};
        font-size: 13px;
        font-weight: 600;
        background: ${isFilled ? inputBg : "#ffffff"};
        color: ${inputText};
        margin-bottom: ${inputSpacing}px;
        outline: none;
        transition: all 0.2s ease;
        -webkit-appearance: none;
      }
      .ff-input:focus { 
        border-color: ${accent}; 
        box-shadow: 0 0 0 4px ${accent}20;
      }
      .ff-input::placeholder { 
        color: ${inputPlaceholder};
        font-weight: 600;
      }
      
      /* Select Dropdown */
      .ff-select-wrap { position: relative; margin-bottom: ${inputSpacing}px; }
      .ff-select-wrap select { 
        appearance: none; 
        -webkit-appearance: none;
        padding-right: 40px; 
        cursor: pointer;
        margin-bottom: 0;
      }
      .ff-select-arrow { 
        position: absolute; 
        right: 16px; 
        top: 50%; 
        transform: translateY(-50%); 
        width: 18px; 
        height: 18px; 
        pointer-events: none; 
        fill: none; 
        stroke: ${inputPlaceholder}; 
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      [dir="rtl"] .ff-select-wrap select { padding-right: 16px; padding-left: 40px; }
      [dir="rtl"] .ff-select-arrow { right: auto; left: 16px; }
      textarea.ff-input { resize: none; min-height: 70px; }

      /* Variants */
      .ff-variants-grid { display: flex; flex-wrap: wrap; gap: 10px; }
      .ff-variant-item { 
        flex: 1; 
        min-width: 90px; 
        padding: 12px 14px; 
        border: 2px solid ${inputBorder}; 
        border-radius: ${radius}; 
        cursor: pointer; 
        text-align: center; 
        transition: all 0.2s ease;
        background: ${bg};
      }
      .ff-variant-item:hover { border-color: ${accent}40; }
      .ff-variant-item input { display: none; }
      .ff-variant-item--selected { 
        border-color: ${accent}; 
        background: ${accent}10;
        box-shadow: 0 4px 12px -2px ${accent}30;
      }
      .ff-variant-title { display: block; font-weight: 700; font-size: 13px; color: ${text}; }
      .ff-variant-price { display: block; font-size: 12px; color: ${accent}; margin-top: 4px; font-weight: 600; }

      /* Delivery Options - Full card style like preview */
      .ff-delivery-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .ff-delivery-option { 
        position: relative;
        padding: 16px; 
        border: 2px solid ${inputBorder}; 
        border-radius: ${radius}; 
        cursor: pointer; 
        text-align: center; 
        transition: all 0.2s ease;
        background: ${bg};
      }
      .ff-delivery-option input { display: none; }
      .ff-delivery-option--selected { 
        border-color: ${accent}; 
        background: ${accent};
        box-shadow: 0 8px 20px -4px ${accent}50;
      }
      .ff-delivery-option--selected .ff-delivery-label,
      .ff-delivery-option--selected .ff-delivery-price { color: white; }
      .ff-delivery-option--selected .ff-delivery-icon { background: rgba(255,255,255,0.2); color: white; }
      .ff-delivery-icon {
        width: 40px;
        height: 40px;
        margin: 0 auto 10px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: ${accent}10;
        color: ${accent};
        font-size: 20px;
      }
      .ff-delivery-label { display: block; font-weight: 700; font-size: 14px; color: ${text}; }
      .ff-delivery-price { display: block; font-size: 13px; color: ${text}80; margin-top: 4px; font-weight: 600; }
      .ff-delivery-check {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid ${inputBorder};
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ff-delivery-option--selected .ff-delivery-check {
        border-color: white;
        background: rgba(255,255,255,0.2);
      }
      [dir="rtl"] .ff-delivery-check { right: auto; left: 12px; }

      /* Offers */
      .ff-offers-grid { display: flex; flex-direction: column; gap: 10px; }
      .ff-offer-card { 
        position: relative; 
        padding: 16px; 
        border: 2px solid ${inputBorder}; 
        border-radius: ${radius}; 
        cursor: pointer; 
        transition: all 0.2s ease;
        background: ${bg};
      }
      .ff-offer-card:hover { border-color: ${accent}40; }
      .ff-offer-card input { display: none; }
      .ff-offer-card--selected { 
        border-color: ${accent}; 
        background: ${accent}10;
        box-shadow: 0 4px 15px -2px ${accent}30;
      }
      .ff-offer-title { display: block; font-weight: 700; font-size: 15px; color: ${text}; }
      .ff-offer-desc { display: block; font-size: 13px; color: #64748b; margin-top: 4px; }
      .ff-offer-badge { 
        position: absolute; 
        top: -10px; 
        right: 12px; 
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
        color: white; 
        font-size: 11px; 
        font-weight: 800; 
        padding: 4px 10px; 
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
      }
      [dir="rtl"] .ff-offer-badge { right: auto; left: 12px; }

      /* Promo Code */
      .ff-promo-input-wrap { display: flex; gap: 10px; }
      .ff-promo-input { flex: 1; margin-bottom: 0 !important; }
      .ff-promo-btn { 
        padding: 14px 20px; 
        background: ${accent}; 
        color: white; 
        border: none; 
        border-radius: ${radius}; 
        font-weight: 700; 
        font-size: 13px;
        cursor: pointer; 
        white-space: nowrap;
        transition: all 0.2s ease;
      }
      .ff-promo-btn:hover { opacity: 0.9; }
      .ff-promo-message { font-size: 13px; margin-top: 8px; font-weight: 600; }
      .ff-promo-message.success { color: #10b981; }
      .ff-promo-message.error { color: #ef4444; }

      /* Summary */
      .ff-summary { 
        background: #f8fafc; 
        padding: 18px; 
        border-radius: ${radius};
        border: 1px solid ${inputBorder};
      }
      .ff-summary-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; }
      .ff-summary-total { 
        font-weight: 800; 
        font-size: 16px; 
        margin-top: 12px; 
        padding-top: 12px; 
        border-top: 2px dashed ${inputBorder}; 
      }
      .ff-summary-total-value { color: ${accent}; }

      /* CTA Button - Matches: py-4 font-black text-sm uppercase tracking-widest */
      .ff-cta {
        width: 100%;
        padding: 18px;
        border: none;
        border-radius: ${radius};
        font-size: 14px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .ff-cta:active { transform: scale(0.98); }
      .ff-cta--solid { 
        background: ${cta}; 
        color: white;
        box-shadow: 0 10px 25px -5px ${cta}40;
      }
      .ff-cta--solid:hover { opacity: 0.9; }
      .ff-cta--outline { 
        background: transparent; 
        border: 2px solid ${cta}; 
        color: ${cta};
        box-shadow: 0 4px 15px ${cta}20;
      }
      .ff-cta--gradient { 
        background: linear-gradient(135deg, ${cta} 0%, ${accent} 100%); 
        color: white;
        box-shadow: 0 10px 25px -5px ${cta}40;
      }
      .ff-cta--ghost {
        background: transparent;
        color: ${cta};
      }

      /* CTA Animations */
      .ff-cta--shake { animation: ff-shake 2.5s ease-in-out infinite; }
      .ff-cta--pulse { animation: ff-pulse 2s ease-in-out infinite; }
      .ff-cta--bounce { animation: ff-bounce 2s ease-in-out infinite; }
      .ff-cta--glow { animation: ff-glow 2s ease-in-out infinite; }
      
      @keyframes ff-shake { 
        0%, 84%, 100% { transform: translateX(0); } 
        85%, 87%, 89%, 91% { transform: translateX(-4px); } 
        86%, 88%, 90%, 92% { transform: translateX(4px); } 
        93% { transform: translateX(0); } 
      }
      @keyframes ff-pulse {
        0%, 70%, 100% { transform: scale(1); opacity: 1; }
        75% { transform: scale(1.02); opacity: 0.9; }
        80% { transform: scale(1); opacity: 1; }
      }
      @keyframes ff-bounce {
        0%, 70%, 100% { transform: translateY(0); }
        75% { transform: translateY(-4px); }
        80% { transform: translateY(0); }
        85% { transform: translateY(-2px); }
        90% { transform: translateY(0); }
      }
      @keyframes ff-glow {
        0%, 70%, 100% { box-shadow: 0 10px 25px -5px ${cta}40; }
        75%, 85% { box-shadow: 0 0 30px ${cta}60, 0 10px 25px -5px ${cta}40; }
      }

      /* Urgency Text */
      .ff-urgency-text { 
        padding: 12px 16px; 
        border-radius: ${radius}; 
        font-size: 14px; 
        font-weight: 700; 
        text-align: center;
      }
      .ff-urgency-text--banner { background: #fef3c7; color: #92400e; }
      .ff-urgency-text--pill { background: #fee2e2; color: #b91c1c; border-radius: 25px; }

      /* Urgency Quantity */
      .ff-urgency-qty { 
        display: flex; 
        align-items: center; 
        justify-content: center;
        gap: 10px; 
        padding: 12px 16px; 
        background: #fef2f2; 
        border-radius: ${radius}; 
        font-size: 14px; 
        font-weight: 700; 
        color: #dc2626;
      }
      .ff-urgency-qty-icon { font-size: 18px; }

      /* Urgency Timer */
      .ff-urgency-timer { 
        display: flex; 
        justify-content: center; 
        gap: 6px; 
        padding: 16px; 
        background: #1e293b; 
        color: white; 
        border-radius: ${radius}; 
        font-weight: 800;
      }
      .ff-timer-segment { 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        min-width: 50px;
        padding: 8px;
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
      }
      .ff-timer-value { font-size: 28px; line-height: 1; }
      .ff-timer-label { font-size: 11px; opacity: 0.7; margin-top: 4px; text-transform: uppercase; }
      .ff-timer-sep { font-size: 28px; line-height: 1; margin-top: 8px; opacity: 0.5; }

      /* Trust Badges */
      .ff-trust-grid { display: flex; flex-wrap: wrap; gap: 10px; }
      .ff-trust-badge { 
        flex: 1; 
        min-width: 130px; 
        display: flex; 
        align-items: center; 
        gap: 8px; 
        padding: 12px 14px; 
        background: #f1f5f9; 
        border-radius: ${radius}; 
        font-size: 13px; 
        font-weight: 600;
        color: ${text};
      }
      .ff-trust-icon { font-size: 18px; }

      /* Sticky CTA */
      .ff-sticky-cta { 
        position: fixed; 
        bottom: 0; 
        left: 0; 
        right: 0; 
        padding: 16px 20px; 
        background: ${bg}; 
        border-top: 1px solid ${inputBorder}; 
        box-shadow: 0 -4px 20px rgba(0,0,0,0.1); 
        z-index: 1000; 
        display: none;
      }
      .ff-sticky-cta .ff-cta { margin: 0; }

      /* Success State */
      .ff-success { text-align: center; padding: 50px 20px; }
      .ff-success-icon { font-size: 64px; margin-bottom: 20px; }
      .ff-success-title { font-size: 22px; font-weight: 800; margin: 0 0 10px; color: ${text}; }
      .ff-success-message { color: #64748b; margin: 0; font-size: 15px; }

      /* Language Switcher */
      .ff-lang-switcher {
        position: absolute;
        top: 16px;
        right: 16px;
        display: flex;
        gap: 4px;
        background: ${inputBorder}40;
        padding: 4px;
        border-radius: 8px;
      }
      .ff-lang-btn {
        padding: 6px 10px;
        border: none;
        background: transparent;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        color: ${text}80;
      }
      .ff-lang-btn--active {
        background: white;
        color: ${text};
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      [dir="rtl"] .ff-lang-switcher { right: auto; left: 16px; }
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

        // Build order payload with full assignment context (flat structure from metafield)
        const orderPayload = {
          // Customer data
          ...formData,
          // Form & Assignment context (stored flat in metafield)
          formId: config.formId,
          formName: config.formName,
          assignmentType: config.assignmentType,
          // Store context
          storeId: config.storeId,
          storeName: config.storeName,
          shopifyDomain: config.shopifyDomain || getShopDomain(),
          // Product context (if product-level assignment)
          productId: config.productId || currentProduct?.id,
          productHandle: config.productHandle || currentProduct?.handle,
          productTitle: currentProduct?.title,
          productPrice: currentProduct?.price,
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

  // --- HIDE THEME ELEMENTS (run early) ---
  function hideThemeElements() {
    const styleId = "finalform-hide-elements";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .product-info__rating,
      .product-info__title,
      .product-info__price,
      .product-info__inventory,
      .product-info__variant-picker,
      #easysell,
      form[action*="/cart/add"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    console.log("[FinalForm] 🎨 Injected styles to hide theme elements");
  }

  // --- INIT ---
  async function init() {
    console.log(
      `[FinalForm] 🚀 Initializing v${LOADER_VERSION} (Metafield-only mode)...`,
    );

    // Hide theme elements first for better UX
    hideThemeElements();

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

    // Log assignment context - these are stored flat in metafield
    console.log("[FinalForm] Assignment context:", {
      formId: config.formId || "(not set)",
      assignmentType: config.assignmentType || "(not set)",
      storeId: config.storeId || "(not set)",
      productId: config.productId || currentProduct?.id || "(not set)",
    });

    render(config, productData);
    console.log("[FinalForm] ✅ Rendered successfully");
  }

  // Note: Element hiding is now done early in init() via hideThemeElements()

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

/**
 * Form Config Public API
 *
 * This module provides functions to fetch form configurations
 * for the Shopify loader script. It queries Firebase directly.
 */

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import type { FormConfig, MetaPixelProfile } from "../../types/form";

export interface FormConfigResponse {
  formId: string;
  formName: string;
  userId?: string;
  assignment: {
    id: string;
    type: "store" | "product";
    storeId: string;
    productId?: string;
    productHandle?: string;
    priority: number;
  };
  store: {
    id: string;
    name: string;
    domain: string;
    platform: string;
  };
  config: FormConfig;
  pixels?: MetaPixelProfile[]; // Meta Pixel profiles
}

export interface FormConfigError {
  error: string;
  domain?: string;
}

/**
 * Get form config for a specific store/product
 *
 * @param domain - The Shopify store domain (e.g., "my-store.myshopify.com")
 * @param productId - Optional product ID for product-specific forms
 * @param productHandle - Optional product handle for URL matching
 */
export async function getFormConfig(
  domain: string,
  productId?: string,
  productHandle?: string
): Promise<FormConfigResponse | FormConfigError> {
  try {
    // Normalize domain - remove protocol and trailing slashes
    const normalizedDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .toLowerCase();

    // Find the store by URL
    let storeDoc = null;

    // Try exact match first
    const storesQuery = query(
      collectionGroup(db, "stores"),
      where("status", "==", "connected"),
      limit(50) // Get all connected stores and filter client-side
    );

    const storesSnapshot = await getDocs(storesQuery);

    for (const doc of storesSnapshot.docs) {
      const storeData = doc.data();
      const storeUrl = (storeData.url || "")
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");

      // Check if domain matches (with or without myshopify.com)
      if (
        storeUrl === normalizedDomain ||
        storeUrl === normalizedDomain.replace(".myshopify.com", "") ||
        `${storeUrl}.myshopify.com` === normalizedDomain
      ) {
        storeDoc = { id: doc.id, ...storeData };
        break;
      }
    }

    if (!storeDoc) {
      return { error: "Store not found", domain };
    }

    // Try to find product-specific assignment first
    let assignment = null;

    if (productId || productHandle) {
      const productAssignmentsQuery = query(
        collection(db, "users", storeDoc.userId, "assignments"),
        where("storeId", "==", storeDoc.id),
        where("assignmentType", "==", "product"),
        where("isActive", "==", true),
        limit(100)
      );

      const productAssignments = await getDocs(productAssignmentsQuery);

      for (const doc of productAssignments.docs) {
        const data = doc.data();
        if (
          (productId && data.productId === productId) ||
          (productHandle && data.productHandle === productHandle)
        ) {
          assignment = { id: doc.id, ...data };
          break;
        }
      }
    }

    // Fall back to store-level assignment
    if (!assignment) {
      const storeAssignmentsQuery = query(
        collection(db, "users", storeDoc.userId, "assignments"),
        where("storeId", "==", storeDoc.id),
        where("assignmentType", "==", "store"),
        where("isActive", "==", true),
        orderBy("priority", "desc"),
        limit(1)
      );

      const storeAssignments = await getDocs(storeAssignmentsQuery);

      if (!storeAssignments.empty) {
        const doc = storeAssignments.docs[0];
        assignment = { id: doc.id, ...doc.data() };
      }
    }

    if (!assignment) {
      return { error: "No form assignment found", domain };
    }

    // Get the form config
    const formRef = doc(db, "users", storeDoc.userId, "forms", assignment.formId);
    const formSnap = await getDoc(formRef);

    if (!formSnap.exists()) {
      return { error: "Form not found" };
    }

    const formData = formSnap.data();
    const config = (formData.config || {}) as FormConfig;

    // Fetch Meta Pixels if configured
    let pixels: MetaPixelProfile[] = [];
    if (config.addons?.metaPixelIds?.length && config.addons.metaPixelIds.length > 0) {
      try {
        const pixelIds = config.addons.metaPixelIds;
        const pixelPromises = pixelIds.map((id: string) => getDoc(doc(db, "users", storeDoc.userId, "meta_pixels", id)));
        const pixelSnaps = await Promise.all(pixelPromises);

        pixels = pixelSnaps
          .filter(snap => snap.exists())
          // @ts-ignore
          .map(snap => ({ id: snap.id, pixelId: snap.data()?.pixelId || snap.id, ...snap.data() } as MetaPixelProfile));
      } catch (e) {
        console.warn("Error fetching meta pixels:", e);
      }
    }

    // --- MULTI-RULE INJECTION ---
    try {
      // 1. Inject Shipping Profile
      if (config.shippingRuleId) {
        const shippingRuleRef = doc(db, 'users', storeDoc.userId, 'shippingRules', config.shippingRuleId);
        const shippingRuleSnap = await getDoc(shippingRuleRef);
        if (shippingRuleSnap.exists()) {
          const ruleData = shippingRuleSnap.data();
          if (ruleData.shipping) {
            config.shipping = ruleData.shipping;
          }
        }
      } else {
        // No rule assigned = free shipping (ignore any embedded legacy defaults)
        config.shipping = { standard: { home: 0, desk: 0 }, exceptions: [] as any };
      }

      // 2. Inject Offers Profile
      if (config.offerRuleId) {
        const offerRuleRef = doc(db, 'users', storeDoc.userId, 'offerRules', config.offerRuleId);
        const offerRuleSnap = await getDoc(offerRuleRef);
        if (offerRuleSnap.exists()) {
          const ruleData = offerRuleSnap.data();
          if (ruleData.offers && Array.isArray(ruleData.offers)) {
            config.offers = ruleData.offers;
          }
        }
      } else {
        // No rule assigned = no offers (ignore any embedded legacy defaults)
        config.offers = [];
      }

      // 3. Inject Coupons Profile
      if (config.couponRuleId) {
        const couponRuleRef = doc(db, 'users', storeDoc.userId, 'couponRules', config.couponRuleId);
        const couponRuleSnap = await getDoc(couponRuleRef);
        if (couponRuleSnap.exists()) {
          const ruleData = couponRuleSnap.data();
          if (ruleData.coupons && Array.isArray(ruleData.coupons)) {
            config.promoCode = {
              enabled: ruleData.config?.enabled || false,
              codes: ruleData.coupons
            };
          }
        }
      } else if (!config.promoCode) {
        config.promoCode = { enabled: false, codes: [] }; // Initial fallback
      }

    } catch (e) {
      console.warn("Error injecting form rules:", e);
    }
    // --- END MULTI-RULE INJECTION ---

    return {
      formId: assignment.formId,
      formName: formData.name,
      userId: storeDoc.userId,
      assignment: {
        id: assignment.id,
        type: assignment.assignmentType,
        storeId: assignment.storeId,
        productId: assignment.productId,
        productHandle: assignment.productHandle,
        priority: assignment.priority,
      },
      store: {
        id: storeDoc.id,
        name: storeDoc.name,
        domain: normalizedDomain,
        platform: storeDoc.platform,
      },
      config: config,
      pixels,
    };
  } catch (error: unknown) {
    console.error("Error fetching form config:", error);
    return { error: error instanceof Error ? error.message : "Failed to fetch form config" };
  }
}

/**
 * Check if a response is an error
 */
export function isFormConfigError(
  response: FormConfigResponse | FormConfigError
): response is FormConfigError {
  return "error" in response;
}

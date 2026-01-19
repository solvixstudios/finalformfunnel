/**
 * JSON Validator for Final Form Funnel
 * Validates and provides helpful error messages for form config and offers JSON
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

interface OfferValidationResult extends ValidationResult {
  offers?: any[];
}

interface FormConfigValidationResult extends ValidationResult {
  config?: any;
}

/**
 * Validate offers JSON format
 */
export function validateOffersJSON(json: any): OfferValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let offers: any[] = [];

  // Check if it's an array
  if (!Array.isArray(json)) {
    errors.push("Offers must be an array of objects");
    return { isValid: false, errors, warnings, suggestions };
  }

  if (json.length === 0) {
    warnings.push("No offers defined. At least one offer is recommended.");
  }

  // Validate each offer
  json.forEach((offer, index) => {
    const prefix = `Offer ${index + 1}:`;

    if (!offer || typeof offer !== "object") {
      errors.push(`${prefix} Offer must be an object`);
      return;
    }

    // Check required fields
    if (!offer.id || typeof offer.id !== "string") {
      errors.push(`${prefix} Missing or invalid 'id' field (must be string)`);
    }

    if (typeof offer.qty !== "number" || offer.qty < 1) {
      warnings.push(`${prefix} Invalid 'qty' (should be number >= 1)`);
    }

    if (typeof offer.discount !== "number") {
      warnings.push(`${prefix} Invalid 'discount' (should be number)`);
    }

    // Check type field
    if (!offer.type && !offer._type) {
      warnings.push(`${prefix} Missing 'type' field - defaulting to 'perc'`);
    } else {
      const type = (offer.type || offer._type || "").toLowerCase();
      if (type !== "perc" && type !== "percentage" && type !== "fixed") {
        errors.push(`${prefix} Invalid 'type' (must be 'perc' or 'fixed')`);
      }
    }

    // Check title and desc
    if (!offer.title) {
      errors.push(`${prefix} Missing 'title' field`);
    } else if (typeof offer.title === "string") {
      suggestions.push(`${prefix} Title should be object with 'fr' and 'ar' keys`);
    } else if (typeof offer.title === "object") {
      if (!offer.title.fr && !offer.title.ar) {
        errors.push(`${prefix} Title must have at least 'fr' or 'ar' property`);
      }
    }

    if (!offer.desc) {
      warnings.push(`${prefix} Missing 'desc' field`);
    } else if (typeof offer.desc === "string") {
      suggestions.push(`${prefix} Desc should be object with 'fr' and 'ar' keys`);
    }

    // Normalize the offer for the result
    const normalizedOffer = {
      id: offer.id || `offer-${index}`,
      qty: offer.qty || 1,
      discount: offer.discount || 0,
      type: (offer.type || offer._type || "perc").toLowerCase(),
      title:
        typeof offer.title === "string"
          ? { fr: offer.title, ar: offer.title }
          : offer.title || { fr: "", ar: "" },
      desc:
        typeof offer.desc === "string"
          ? { fr: offer.desc, ar: offer.desc }
          : offer.desc || { fr: "", ar: "" },
    };

    offers.push(normalizedOffer);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    offers: errors.length === 0 ? offers : undefined,
  };
}

/**
 * Validate form config JSON format
 */
export function validateFormConfigJSON(json: any): FormConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!json || typeof json !== "object") {
    errors.push("Form config must be an object");
    return { isValid: false, errors, warnings, suggestions };
  }

  // Validate sectionOrder
  if (json.sectionOrder) {
    if (!Array.isArray(json.sectionOrder)) {
      errors.push("sectionOrder must be an array");
    } else {
      const validSections = [
        "variants",
        "shipping",
        "delivery",
        "offers",
        "summary",
        "cta",
      ];
      const invalidSections = json.sectionOrder.filter(
        (s: string) => !validSections.includes(s)
      );
      if (invalidSections.length > 0) {
        errors.push(
          `Invalid sections in sectionOrder: ${invalidSections.join(", ")}`
        );
      }
    }
  }

  // Validate colors
  if (json.accentColor && !/^#[0-9A-F]{6}$/i.test(json.accentColor)) {
    warnings.push("accentColor should be valid hex color (e.g., #6366f1)");
  }

  if (json.ctaColor && !/^#[0-9A-F]{6}$/i.test(json.ctaColor)) {
    warnings.push("ctaColor should be valid hex color (e.g., #6366f1)");
  }

  // Validate locationInputMode
  if (json.locationInputMode) {
    const validModes = ["double_dropdown", "single_dropdown", "free_text"];
    if (!validModes.includes(json.locationInputMode)) {
      errors.push(
        `Invalid locationInputMode. Must be one of: ${validModes.join(", ")}`
      );
    }
  }

  // Validate fields
  if (json.fields && typeof json.fields === "object") {
    Object.entries(json.fields).forEach(([fieldKey, field]: any) => {
      if (field.visible !== undefined && typeof field.visible !== "boolean") {
        warnings.push(`Field '${fieldKey}': visible should be boolean`);
      }
      if (field.required !== undefined && typeof field.required !== "boolean") {
        warnings.push(`Field '${fieldKey}': required should be boolean`);
      }
      if (field.order !== undefined && typeof field.order !== "number") {
        warnings.push(`Field '${fieldKey}': order should be number`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
    config: json,
  };
}

/**
 * Get helpful suggestions based on validation results
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return "✅ JSON format is valid and ready to use!";
  }

  let summary = "";
  if (result.errors.length > 0) {
    summary += `❌ ${result.errors.length} error(s) found\n`;
  }
  if (result.warnings.length > 0) {
    summary += `⚠️  ${result.warnings.length} warning(s) found\n`;
  }
  if (result.suggestions.length > 0) {
    summary += `💡 ${result.suggestions.length} suggestion(s) for improvement\n`;
  }

  return summary.trim();
}

/**
 * Example valid offer JSON structure
 */
export function getExampleOffersJSON() {
  return [
    {
      id: "offre-1",
      qty: 1,
      discount: 0,
      type: "perc",
      title: { fr: "1 Pièce", ar: "قطعة واحدة" },
      desc: { fr: "Prix standard", ar: "السعر العادي" },
    },
    {
      id: "offre-2",
      qty: 2,
      discount: 0.1,
      type: "perc",
      title: { fr: "2 Pièces", ar: "قطعتين" },
      desc: { fr: "Remise de 10%", ar: "تخفيض 10٪" },
    },
    {
      id: "offre-3",
      qty: 3,
      discount: 0.2,
      type: "perc",
      title: { fr: "3 Pièces", ar: "3 قطع" },
      desc: { fr: "Remise de 20%", ar: "تخفيض 20٪" },
    },
  ];
}

/**
 * Example valid form config JSON structure
 */
export function getExampleFormConfigJSON() {
  return {
    accentColor: "#6366f1",
    ctaColor: "#6366f1",
    ctaShake: true,
    borderRadius: "14px",
    inputVariant: "filled",
    locationLayout: "sideBySide",
    locationInputMode: "double_dropdown",
    enableShippingSection: true,
    enableSummarySection: true,
    showTotalInCTA: false,
    sectionOrder: ["variants", "shipping", "delivery", "offers", "cta", "summary"],
    fields: {
      name: {
        visible: true,
        required: true,
        order: 0,
        placeholder: { fr: "Nom et Prénom", ar: "الاسم واللقب" },
      },
      phone: {
        visible: true,
        required: true,
        order: 1,
        placeholder: { fr: "Numéro de téléphone", ar: "رقم الهاتف" },
      },
      wilaya: {
        visible: true,
        required: true,
        order: 2,
        placeholder: { fr: "Wilaya", ar: "الولاية" },
      },
    },
    translations: {
      offers: { fr: "Choisissez votre offre", ar: "اختر عرضك" },
      home: { fr: "À Domicile", ar: "توصيل للمنزل" },
      desk: { fr: "En Bureau", ar: "توصيل للمكتب" },
    },
  };
}

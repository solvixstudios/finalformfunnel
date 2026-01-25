import { toast } from "@/components/ui/sonner";
import { useFormStore } from "../stores";
import type { FormConfig } from "../stores/formStore";
import { DEFAULT_FORM_CONFIG, FORM_CONFIG_SCHEMA_VERSION } from "./constants";
import { validateFormConfig } from "./formSchemaValidator";
export { validateFormConfig };

export interface FormLoadResult {
  success: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Export form configuration to a canonical format for saving to storage
 * Converts internal format to export format:
 * - Converts internal '_type' to 'type'
 * - Converts discount from percentage (20) to decimal (0.2)
 * - Filters fields based on location input mode
 * - Includes all necessary metadata
 */
export const getExportData = (formConfig: FormConfig): Record<string, any> => {
  const exportFields: Record<string, any> = {};

  Object.entries(formConfig.fields).forEach(([key, field]: any) => {
    // Filter fields based on location input mode
    if (formConfig.locationInputMode === "free_text") {
      if (key === "wilaya" || key === "commune") return;
    } else {
      if (key === "address") return;
      if (formConfig.locationInputMode === "single_dropdown" && key === "commune")
        return;
    }

    exportFields[key] = {
      visible: field.visible,
      required: field.required,
      order: field.order,
      placeholder: field.placeholder,
    };
  });

  // Convert internal offer format to export format
  const exportOffers = formConfig.offers.map(
    ({ _idManuallyEdited, _type, ...o }: any) => ({
      ...o,
      type: _type,
      discount: _type === "perc" ? o.discount / 100 : o.discount,
    }),
  );

  const shippingConfig = formConfig.shipping;
  const exportShipping = {
    standard: {
      home: shippingConfig.standard.home,
      desk: shippingConfig.standard.desk,
    },
    exceptions: shippingConfig.exceptions.map((ex: any) => ({
      id: ex.id,
      home: ex.home,
      desk: ex.desk,
    })),
  };

  return {
    $schema: `form-config/v${FORM_CONFIG_SCHEMA_VERSION}`,
    version: FORM_CONFIG_SCHEMA_VERSION,
    // Color & Styling
    accentColor: formConfig.accentColor,
    ctaColor: formConfig.ctaColor,
    borderRadius: formConfig.borderRadius,
    formBackground: formConfig.formBackground,
    textColor: formConfig.textColor,
    headingColor: formConfig.headingColor,
    // Input Styling
    inputBackground: formConfig.inputBackground,
    inputBorderColor: formConfig.inputBorderColor,
    inputTextColor: formConfig.inputTextColor,
    inputPlaceholderColor: formConfig.inputPlaceholderColor,
    inputVariant: formConfig.inputVariant,
    // Layout
    locationLayout: formConfig.locationLayout,
    locationInputMode: formConfig.locationInputMode,
    variantStyle: formConfig.variantStyle,
    // Header Configuration
    header: formConfig.header,
    // Section Visibility
    enableShippingSection: formConfig.enableShippingSection,
    enableSummarySection: formConfig.enableSummarySection,
    enableOffersSection: formConfig.enableOffersSection,
    enableTrustBadges: formConfig.enableTrustBadges,
    showTotalInCTA: formConfig.showTotalInCTA,
    // Delivery Options
    enableHomeDelivery: formConfig.enableHomeDelivery,
    enableDeskDelivery: formConfig.enableDeskDelivery,
    hideDeliveryOption: formConfig.hideDeliveryOption,
    // Section Styling
    sectionSpacing: formConfig.sectionSpacing,
    sectionPadding: formConfig.sectionPadding,
    inputSpacing: formConfig.inputSpacing,
    sectionMarginTop: formConfig.sectionMarginTop,
    sectionMarginBottom: formConfig.sectionMarginBottom,
    hideShippingInSummary: formConfig.hideShippingInSummary,
    // Section Settings
    sectionSettings: formConfig.sectionSettings,
    sectionOrder: formConfig.sectionOrder,
    // Fields
    fields: exportFields,
    // Translations
    translations: formConfig.translations,
    // Typography
    fontFamily: formConfig.fontFamily,
    // CTA Configuration
    ctaShake: formConfig.ctaShake,
    ctaVariant: formConfig.ctaVariant,
    ctaAnimation: formConfig.ctaAnimation,
    ctaSticky: formConfig.ctaSticky,
    // Offers
    offers: exportOffers,
    // Shipping
    shipping: exportShipping,
    // Promo Code
    promoCode: formConfig.promoCode,
    // Trust Badges
    trustBadgeStyle: formConfig.trustBadgeStyle,
    trustBadges: formConfig.trustBadges,
    // Urgency Configs
    urgencyText: formConfig.urgencyText,
    urgencyQuantity: formConfig.urgencyQuantity,
    urgencyTimer: formConfig.urgencyTimer,
    // Stickers
    stickers: formConfig.stickers,
    // Thank You
    thankYou: formConfig.thankYou,
  };
};

/**
 * Deep merge two objects recursively, preserving nested structure
 * Used to merge imported config with defaults while maintaining nested properties
 */
export const deepMergeFormConfig = (
  defaults: any,
  imported: any,
  depth = 0,
): any => {
  if (depth > 10) return imported; // Prevent infinite recursion

  const merged = { ...defaults };

  for (const key in imported) {
    if (Object.prototype.hasOwnProperty.call(imported, key)) {
      const defaultValue = defaults[key];
      const importedValue = imported[key];

      // If both are objects (not arrays or null), recurse
      if (
        defaultValue &&
        typeof defaultValue === "object" &&
        !Array.isArray(defaultValue) &&
        importedValue &&
        typeof importedValue === "object" &&
        !Array.isArray(importedValue)
      ) {
        merged[key] = deepMergeFormConfig(defaultValue, importedValue, depth + 1);
      } else {
        // Otherwise, use imported value
        merged[key] = importedValue;
      }
    }
  }

  return merged;
};

/**
 * Normalize an imported/exported form config to internal runtime shape
 * Handles conversion of export format back to internal format:
 * - Converts offer 'type' field to internal '_type'
 * - Converts discount from decimal (0.2) to percentage (20) if needed
 * - Restores internal flags like _idManuallyEdited
 * - Ensures nested objects have required structure
 */
export const normalizeImportedConfig = (config: any): any => {
  if (!config || typeof config !== "object") {
    return DEFAULT_FORM_CONFIG;
  }

  // Create a working copy to avoid mutating input
  const normalized = { ...config };

  // Normalize offers: convert export format to internal format
  if (normalized.offers && Array.isArray(normalized.offers)) {
    normalized.offers = normalized.offers.map((offer: any) => {
      // Handle type field conversion: 'type' (export) -> '_type' (internal)
      const type = offer._type || offer.type || "perc";

      // Handle discount conversion: if discount is decimal (0.2), convert to percentage (20)
      let discount = offer.discount ?? 0;
      if (typeof discount === "number" && discount <= 1 && discount > 0) {
        discount = discount * 100;
      }

      return {
        ...offer,
        _type: type, // Use internal _type key
        discount: discount, // Store as percentage (20, not 0.2)
        _idManuallyEdited: offer._idManuallyEdited ?? false, // Restore internal flag
        _internalId:
          offer._internalId ||
          `internal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Restore or generate internal ID
        // Ensure title and desc have structure
        title: offer.title || { fr: "", ar: "" },
        desc: offer.desc || { fr: "", ar: "" },
      };
    });
  }

  // Normalize shipping: ensure exceptions have proper structure
  if (normalized.shipping) {
    if (!normalized.shipping.standard) {
      normalized.shipping.standard = { home: 600, desk: 400 };
    }
    if (!normalized.shipping.exceptions) {
      normalized.shipping.exceptions = [];
    } else if (Array.isArray(normalized.shipping.exceptions)) {
      normalized.shipping.exceptions = normalized.shipping.exceptions.map(
        (ex: any) => ({
          id: ex.id || "",
          home: ex.home ?? 0,
          desk: ex.desk ?? 0,
        }),
      );
    }
  }

  // Normalize fields: ensure all have required nested structure
  if (normalized.fields && typeof normalized.fields === "object") {
    Object.keys(normalized.fields).forEach((fieldKey) => {
      const field = normalized.fields[fieldKey];
      if (field && typeof field === "object") {
        normalized.fields[fieldKey] = {
          visible: field.visible ?? true,
          required: field.required ?? false,
          order: field.order ?? 0,
          placeholder: field.placeholder || { fr: "", ar: "" },
        };
      }
    });
  }

  // Normalize promoCode
  if (normalized.promoCode) {
    if (!normalized.promoCode.codes) {
      normalized.promoCode.codes = [];
    }
    normalized.promoCode.placeholder = normalized.promoCode.placeholder || {
      fr: "Code promo",
      ar: "كود الخصم",
    };
    normalized.promoCode.buttonText = normalized.promoCode.buttonText || {
      fr: "Appliquer",
      ar: "تطبيق",
    };
    normalized.promoCode.enabled = normalized.promoCode.enabled ?? false;
    normalized.promoCode.required = normalized.promoCode.required ?? false;
  }

  // Normalize header
  if (normalized.header) {
    normalized.header = {
      enabled: normalized.header.enabled ?? true,
      style: normalized.header.style || "classic",
      showLanguageSwitcher: normalized.header.showLanguageSwitcher ?? true,
      defaultLanguage: normalized.header.defaultLanguage || "fr",
      showProductImage: normalized.header.showProductImage ?? true,
      showProductPrice: normalized.header.showProductPrice ?? true,
    };
  }

  // Normalize translations: ensure all have fr/ar keys
  if (normalized.translations && typeof normalized.translations === "object") {
    Object.keys(normalized.translations).forEach((key) => {
      const trans = normalized.translations[key];
      if (typeof trans === "string") {
        // Convert string to bilingual object
        normalized.translations[key] = { fr: trans, ar: trans };
      } else if (!trans || typeof trans !== "object") {
        normalized.translations[key] = { fr: "", ar: "" };
      } else {
        // Ensure both fr and ar exist
        if (!trans.fr) trans.fr = "";
        if (!trans.ar) trans.ar = "";
      }
    });
  }

  // Normalize sectionSettings
  if (normalized.sectionSettings && typeof normalized.sectionSettings === "object") {
    Object.keys(normalized.sectionSettings).forEach((key) => {
      const setting = normalized.sectionSettings[key];
      if (!setting || typeof setting !== "object") {
        normalized.sectionSettings[key] = { showTitle: true };
      } else if (setting.showTitle === undefined) {
        setting.showTitle = true;
      }
    });
  }

  return normalized;
};

/**
 * Loads a form configuration with validation and normalization
 * @param form - The form object with config, name, and id
 * @param options - Options for loading behavior
 * @returns Result object with success status and any errors/warnings
 */
export const loadFormWithValidation = (
  form: { config: any; name: string; id: string },
  options: {
    showWarnings?: boolean;
    showSuccessToast?: boolean;
    onSuccess?: () => void;
  } = {},
): FormLoadResult => {
  const { showWarnings = true, showSuccessToast = true, onSuccess } = options;

  // First, normalize the imported config to internal format
  const normalizedConfig = normalizeImportedConfig(form.config);

  // Then validate the normalized configuration
  const validation = validateFormConfig(normalizedConfig);

  // Show warnings if any
  if (validation.warnings.length > 0 && showWarnings) {
    validation.warnings.forEach((warning) => {
      toast.warning(warning);
    });
  }

  // Block loading if validation fails
  if (!validation.valid) {
    const errorMessage = `Cannot load form: ${validation.errors.join(", ")}`;
    toast.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
      warnings: validation.warnings,
    };
  }

  // Load the normalized form configuration
  const { loadFormConfig, setFormName, setFormId, setEditingSection, markClean } =
    useFormStore.getState();

  loadFormConfig(normalizedConfig);
  setFormName(form.name);
  setFormId(form.id);
  setEditingSection(null);
  markClean(); // Mark as clean since we just loaded a saved form

  if (showSuccessToast) {
    toast.success(`${form.name} loaded successfully!`);
  }

  onSuccess?.();

  return {
    success: true,
    warnings: validation.warnings,
  };
};

import { FORM_CONFIG_SCHEMA_VERSION } from './constants';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a form configuration object
 * @param config - The form configuration to validate
 * @returns Validation result with errors and warnings
 */
export function validateFormConfig(config: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if config exists
  if (!config || typeof config !== 'object') {
    errors.push('Form configuration is missing or invalid');
    return { valid: false, errors, warnings };
  }

  const c = config as Record<string, unknown>;

  // Check version
  const configVersion = c.version;
  if (!configVersion) {
    warnings.push('Form configuration version is missing. Assuming latest version.');
  } else if (configVersion !== FORM_CONFIG_SCHEMA_VERSION) {
    // Compare semantic versions (simple comparison for now)
    warnings.push(
      `Form configuration version (${configVersion}) differs from current version (${FORM_CONFIG_SCHEMA_VERSION}). ` +
      'Some features may not work as expected.'
    );
  }

  // Check required fields
  const requiredFields = [
    'fields',
    'translations',
    'sectionOrder',
    'shipping',
    'offers',
  ];

  for (const field of requiredFields) {
    if (!(field in c)) {
      errors.push(`Required field '${field}' is missing`);
    }
  }

  // Validate fields structure
  if (c.fields && typeof c.fields === 'object') {
    const fieldKeys = Object.keys(c.fields);
    if (fieldKeys.length === 0) {
      warnings.push('No form fields defined');
    }
  } else if (c.fields) {
    errors.push("Field 'fields' must be an object");
  }

  // Validate sectionOrder
  if (c.sectionOrder && !Array.isArray(c.sectionOrder)) {
    errors.push("Field 'sectionOrder' must be an array");
  }

  // Validate shipping structure
  if (c.shipping) {
    if (typeof c.shipping !== 'object') {
      errors.push("Field 'shipping' must be an object");
    } else {
      const shippingObj = c.shipping as Record<string, unknown>;
      if (!shippingObj.standard) {
        warnings.push("Shipping 'standard' rates are missing");
      }
      if (!shippingObj.exceptions) {
        warnings.push("Shipping 'exceptions' array is missing");
      }
    }
  }

  // Validate offers array
  if (c.offers && !Array.isArray(c.offers)) {
    errors.push("Field 'offers' must be an array");
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings };
}

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
export function validateFormConfig(config: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if config exists
  if (!config || typeof config !== 'object') {
    errors.push('Form configuration is missing or invalid');
    return { valid: false, errors, warnings };
  }

  // Check version
  const configVersion = config.version;
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
    if (!(field in config)) {
      errors.push(`Required field '${field}' is missing`);
    }
  }

  // Validate fields structure
  if (config.fields && typeof config.fields === 'object') {
    const fieldKeys = Object.keys(config.fields);
    if (fieldKeys.length === 0) {
      warnings.push('No form fields defined');
    }
  } else if (config.fields) {
    errors.push("Field 'fields' must be an object");
  }

  // Validate sectionOrder
  if (config.sectionOrder && !Array.isArray(config.sectionOrder)) {
    errors.push("Field 'sectionOrder' must be an array");
  }

  // Validate shipping structure
  if (config.shipping) {
    if (typeof config.shipping !== 'object') {
      errors.push("Field 'shipping' must be an object");
    } else {
      if (!config.shipping.standard) {
        warnings.push("Shipping 'standard' rates are missing");
      }
      if (!config.shipping.exceptions) {
        warnings.push("Shipping 'exceptions' array is missing");
      }
    }
  }

  // Validate offers array
  if (config.offers && !Array.isArray(config.offers)) {
    errors.push("Field 'offers' must be an array");
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings };
}

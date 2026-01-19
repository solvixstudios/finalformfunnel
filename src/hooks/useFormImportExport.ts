import { useCallback } from "react";
import { toast } from "@/components/ui/sonner";
import {
  getExportData,
  normalizeImportedConfig,
} from "@/lib/formManagement";
import { validateFormConfig } from "@/lib/formSchemaValidator";
import { FORM_CONFIG_SCHEMA_VERSION } from "@/lib/constants";
import type { FormConfig } from "@/stores/formStore";

export interface ImportValidationResult {
  valid: boolean;
  config?: FormConfig;
  errors: string[];
  warnings: string[];
}

/**
 * Hook for handling form import/export operations
 * Provides JSON validation, file upload, and format conversion
 */
export const useFormImportExport = () => {
  /**
   * Validate and parse JSON content
   */
  const validateJsonContent = useCallback(
    (jsonContent: string): ImportValidationResult => {
      const errors: string[] = [];
      const warnings: string[] = [];
      let parsedConfig: any = null;

      // Try to parse JSON
      try {
        parsedConfig = JSON.parse(jsonContent);
      } catch (err: any) {
        return {
          valid: false,
          errors: [`Invalid JSON format: ${err.message}`],
          warnings: [],
        };
      }

      // Check if it's an object
      if (!parsedConfig || typeof parsedConfig !== "object") {
        return {
          valid: false,
          errors: ["Configuration must be a JSON object"],
          warnings: [],
        };
      }

      // Try to normalize the config
      try {
        const normalizedConfig = normalizeImportedConfig(parsedConfig);

        // Validate the normalized config
        const validationResult = validateFormConfig(normalizedConfig);

        if (!validationResult.valid && validationResult.errors) {
          validationResult.errors.forEach((err) => {
            if (typeof err === "string") {
              errors.push(err);
            } else if (err.message) {
              errors.push(err.message);
            }
          });
        }

        if (validationResult.warnings) {
          validationResult.warnings.forEach((warning) => {
            if (typeof warning === "string") {
              warnings.push(warning);
            } else if (warning.message) {
              warnings.push(warning.message);
            }
          });
        }

        // Check schema version
        const importedVersion = parsedConfig.version ||
          parsedConfig.$schema?.replace("form-config/v", "") || 
          "unknown";

        if (importedVersion !== FORM_CONFIG_SCHEMA_VERSION) {
          warnings.push(
            `Configuration schema version ${importedVersion} differs from current version ${FORM_CONFIG_SCHEMA_VERSION}. Some features might not work as expected.`
          );
        }

        return {
          valid: errors.length === 0,
          config: errors.length === 0 ? normalizedConfig : undefined,
          errors,
          warnings,
        };
      } catch (err: any) {
        return {
          valid: false,
          errors: [
            `Failed to process configuration: ${
              err.message || "Unknown error"
            }`,
          ],
          warnings,
        };
      }
    },
    []
  );

  /**
   * Import form from JSON file
   */
  const importFromFile = useCallback(
    async (file: File): Promise<ImportValidationResult> => {
      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return {
          valid: false,
          errors: ["File size exceeds 10MB limit"],
          warnings: [],
        };
      }

      // Check file type
      if (file.type && file.type !== "application/json") {
        return {
          valid: false,
          errors: ["File must be a JSON file"],
          warnings: [],
        };
      }

      // Read file content
      try {
        const content = await file.text();
        return validateJsonContent(content);
      } catch (err: any) {
        return {
          valid: false,
          errors: [`Failed to read file: ${err.message}`],
          warnings: [],
        };
      }
    },
    [validateJsonContent]
  );

  /**
   * Import form from JSON text (paste)
   */
  const importFromText = useCallback(
    (jsonText: string): ImportValidationResult => {
      if (!jsonText.trim()) {
        return {
          valid: false,
          errors: ["JSON content cannot be empty"],
          warnings: [],
        };
      }

      return validateJsonContent(jsonText.trim());
    },
    [validateJsonContent]
  );

  /**
   * Export form to JSON string
   */
  const exportToJson = useCallback((formConfig: FormConfig): string => {
    try {
      const exportData = getExportData(formConfig);
      return JSON.stringify(exportData, null, 2);
    } catch (err: any) {
      throw new Error(`Failed to export form: ${err.message}`);
    }
  }, []);

  /**
   * Download form as JSON file
   */
  const downloadAsFile = useCallback(
    (formConfig: FormConfig, fileName: string) => {
      try {
        const jsonString = exportToJson(formConfig);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${fileName.trim() || "form"}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Form downloaded successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to download form");
        throw err;
      }
    },
    [exportToJson]
  );

  /**
   * Copy form config to clipboard as JSON
   */
  const copyToClipboard = useCallback(
    async (formConfig: FormConfig): Promise<boolean> => {
      try {
        const jsonString = exportToJson(formConfig);
        await navigator.clipboard.writeText(jsonString);
        toast.success("Form copied to clipboard");
        return true;
      } catch (err: any) {
        toast.error(err.message || "Failed to copy form");
        return false;
      }
    },
    [exportToJson]
  );

  return {
    // Validation
    validateJsonContent,
    importFromFile,
    importFromText,
    // Export
    exportToJson,
    downloadAsFile,
    copyToClipboard,
  };
};

import { toast } from "sonner";
import { loadFormWithValidation } from "./formManagement";

/**
 * Hook for handling form import operations
 */
export const useFormImportExport = () => {
  /**
   * Import a form configuration from a file
   */
  const importFromFile = async (file: File): Promise<any | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);

          // Validate structure basics
          if (!json || typeof json !== "object") {
            throw new Error("Invalid JSON format");
          }

          // Normalize and Validate using formManagement
          const result = loadFormWithValidation(
            {
              config: json,
              name: file.name.replace(".json", ""),
              id: "temp-import",
            },
            {
              showSuccessToast: false, // Page will handle success toast
              showWarnings: true,
            },
          );

          if (result.success) {
            // FormsPage uses: const config = await importFromFile(file); await saveForm(..., config)
            // So we need to return the config object.
            resolve(json);
          } else {
            reject(new Error(result.error || "Validation failed"));
          }
        } catch (error) {
          console.error("Import error:", error);
          toast.error("Failed to parse JSON file");
          reject(error);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file");
        reject(new Error("File read error"));
      };

      reader.readAsText(file);
    });
  };

  return {
    importFromFile,
  };
};

import type { DEFAULT_FORM_CONFIG } from "../../lib/constants";

export interface FormTabProps {
  formConfig: typeof DEFAULT_FORM_CONFIG;
  setFormConfig: React.Dispatch<React.SetStateAction<typeof DEFAULT_FORM_CONFIG>>;
}

export interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export interface FormPreviewProps {
  config: typeof DEFAULT_FORM_CONFIG;
  offers: any[];
  shipping: any;
}

export type LocationInputMode = "double_dropdown" | "single_dropdown" | "free_text";
export type LocationLayout = "sideBySide" | "stacked";
export type VariantStyle = "buttons" | "cards" | "pills" | "dropdown";
export type InputVariant = "filled" | "outlined";
export type Language = "fr" | "ar";

export interface EditorProps {
  formConfig: typeof DEFAULT_FORM_CONFIG;
  setFormConfig: React.Dispatch<React.SetStateAction<typeof DEFAULT_FORM_CONFIG>>;
  onBack?: () => void;
}

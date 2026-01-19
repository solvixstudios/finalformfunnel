import type { DEFAULT_FORM_CONFIG } from "../../../lib/constants";

export const updateField = (
  key: string,
  fieldProps: any,
  formConfig: typeof DEFAULT_FORM_CONFIG,
  setFormConfig: React.Dispatch<React.SetStateAction<typeof DEFAULT_FORM_CONFIG>>
) => {
  // Handle Location Block Group Toggle
  if (key === "location_block") {
    if (Object.prototype.hasOwnProperty.call(fieldProps, "visible")) {
      const newFields = { ...formConfig.fields };
      // Toggle Wilaya (Commune will follow via rules)
      newFields.wilaya.visible = fieldProps.visible;
      // Also explicitly toggle Commune to be sure, though rules might handle it
      newFields.commune.visible = fieldProps.visible;
      setFormConfig({ ...formConfig, fields: newFields });
    }
    return;
  }

  const newFields = { ...formConfig.fields };
  const oldField = newFields[key];
  const newField = { ...oldField, ...fieldProps };
  newFields[key] = newField;

  // --- RULE IMPLEMENTATION ---

  // Rule: if any field is hidden -> it cannot be required (auto-disable required)
  if (
    Object.prototype.hasOwnProperty.call(fieldProps, "visible") &&
    !fieldProps.visible
  ) {
    newFields[key] = { ...newFields[key], required: false };
  }

  // Rule: if wilaya hidden -> commune hidden
  if (
    key === "wilaya" &&
    Object.prototype.hasOwnProperty.call(fieldProps, "visible") &&
    !fieldProps.visible
  ) {
    newFields["commune"] = {
      ...newFields["commune"],
      visible: false,
      required: false,
    };
  }

  // Rule: if commune shown -> wilaya must be shown
  if (
    key === "commune" &&
    Object.prototype.hasOwnProperty.call(fieldProps, "visible") &&
    fieldProps.visible
  ) {
    newFields["wilaya"] = { ...newFields["wilaya"], visible: true };
  }

  // Rule: if wilaya optional -> commune cannot be required
  if (
    key === "wilaya" &&
    Object.prototype.hasOwnProperty.call(fieldProps, "required") &&
    !fieldProps.required
  ) {
    newFields["commune"] = { ...newFields["commune"], required: false };
  }

  // Rule: if commune required -> wilaya must be required
  if (
    key === "commune" &&
    Object.prototype.hasOwnProperty.call(fieldProps, "required") &&
    fieldProps.required
  ) {
    newFields["wilaya"] = { ...newFields["wilaya"], required: true };
  }

  setFormConfig({ ...formConfig, fields: newFields });
};

export const getFieldsForCurrentMode = (formConfig: typeof DEFAULT_FORM_CONFIG) => {
  const mode = formConfig.locationInputMode;
  const allFields = Object.entries(formConfig.fields).sort(
    ([, a]: any, [, b]: any) => a.order - b.order
  );

  const filtered = allFields.filter(([key]) => {
    // Always show name, phone, note
    if (key === "name" || key === "phone" || key === "note") return true;

    // Location fields based on mode
    if (mode === "free_text") {
      return key === "address";
    } else if (mode === "single_dropdown") {
      return key === "wilaya";
    } else {
      // double_dropdown
      return key === "wilaya";
    }
  });

  // Map wilaya to location_block if double_dropdown or single_dropdown
  return filtered.map(([key, val]) => {
    if (
      (mode === "double_dropdown" || mode === "single_dropdown") &&
      key === "wilaya"
    )
      return ["location_block", val];
    return [key, val];
  });
};

export const getLocationFieldsForPlaceholders = (
  formConfig: typeof DEFAULT_FORM_CONFIG
) => {
  const mode = formConfig.locationInputMode;
  const allFields = Object.entries(formConfig.fields);

  if (mode === "free_text") {
    return allFields.filter(([key]) => key !== "wilaya" && key !== "commune");
  } else if (mode === "single_dropdown") {
    return allFields.filter(([key]) => key !== "commune" && key !== "address");
  } else {
    return allFields.filter(([key]) => key !== "address");
  }
};

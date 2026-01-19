import type { DEFAULT_FORM_CONFIG } from '../../../lib/constants';

export const syncFieldsForMode = (mode: string, currentFields: any) => {
    const newFields = { ...currentFields };

    if (mode === 'free_text') {
        // Free text: hide wilaya/commune, show address
        newFields.wilaya = { ...newFields.wilaya, visible: false };
        newFields.commune = { ...newFields.commune, visible: false };
        newFields.address = { ...newFields.address, visible: true };
    } else if (mode === 'single_dropdown') {
        // Single dropdown: show wilaya, hide commune, hide address
        newFields.wilaya = { ...newFields.wilaya, visible: true };
        newFields.commune = { ...newFields.commune, visible: false };
        newFields.address = { ...newFields.address, visible: false };
    } else {
        // double_dropdown: show both wilaya and commune, hide address
        newFields.wilaya = { ...newFields.wilaya, visible: true };
        newFields.commune = { ...newFields.commune, visible: true };
        newFields.address = { ...newFields.address, visible: false };
    }

    return newFields;
};

export const handleLocationModeChange = (
    mode: string,
    formConfig: typeof DEFAULT_FORM_CONFIG,
    setFormConfig: React.Dispatch<React.SetStateAction<typeof DEFAULT_FORM_CONFIG>>
) => {
    const newFields = syncFieldsForMode(mode, formConfig.fields);
    setFormConfig({ ...formConfig, locationInputMode: mode, fields: newFields });
};

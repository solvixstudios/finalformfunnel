import type { DEFAULT_FORM_CONFIG } from '../../../lib/constants';

export const moveSection = (
    from: number,
    to: number,
    formConfig: typeof DEFAULT_FORM_CONFIG,
    setFormConfig: React.Dispatch<React.SetStateAction<typeof DEFAULT_FORM_CONFIG>>
) => {
    const newOrder = [...formConfig.sectionOrder];
    const [moved] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, moved);
    setFormConfig({ ...formConfig, sectionOrder: newOrder });
};

export const moveField = (
    from: number,
    to: number,
    formConfig: typeof DEFAULT_FORM_CONFIG,
    setFormConfig: React.Dispatch<React.SetStateAction<typeof DEFAULT_FORM_CONFIG>>,
    getFieldsForCurrentMode: (config: typeof DEFAULT_FORM_CONFIG) => [string, any][]
) => {
    // Simplified approach: Just swap orders in the full list based on the visual list
    const visualList = getFieldsForCurrentMode(formConfig).map(([key]) => key);
    const itemMoved = visualList[from];
    visualList.splice(from, 1);
    visualList.splice(to, 0, itemMoved);

    // Reassign orders based on new visual list
    const newFields: unknown = { ...formConfig.fields };
    visualList.forEach((k, index) => {
        const key = k as string;
        if (key === 'location_block') {
            newFields.wilaya.order = index;
            newFields.commune.order = index; // Keep them together
        } else {
            newFields[key].order = index;
        }
    });

    setFormConfig({ ...formConfig, fields: newFields });
};

import { useEffect } from 'react';
import type { DEFAULT_FORM_CONFIG } from '../../../lib/constants';
import { syncFieldsForMode } from '../utils/locationHelpers';

export const useLocationMode = (
    formConfig: typeof DEFAULT_FORM_CONFIG,
    setFormConfig: React.Dispatch<React.SetStateAction<typeof DEFAULT_FORM_CONFIG>>
) => {
    // Cleanup: Remove location_block from fields if it exists (fixes crash)
    useEffect(() => {
        if (formConfig.fields.location_block) {
            const newFields = { ...formConfig.fields };
            delete newFields.location_block;
            setFormConfig((prev: any) => ({ ...prev, fields: newFields }));
        }
    }, [formConfig.fields.location_block, formConfig.fields, setFormConfig]);
};

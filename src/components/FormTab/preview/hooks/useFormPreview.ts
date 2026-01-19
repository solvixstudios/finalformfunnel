import { useState, useEffect } from 'react';
import type { Language } from '../../types';

export const useFormPreview = (defaultLanguage: Language, offers: any[]) => {
    const [lang, setLang] = useState<Language>(defaultLanguage);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        wilaya: '',
        commune: '',
        address: '',
        note: '',
        offerId: offers[0]?.id || '',
        variant: 'Modèle A',
        shippingType: 'home' as 'home' | 'desk'
    });
    const [showThankYou, setShowThankYou] = useState(false);

    // Sync offerId if current one is invalid
    useEffect(() => {
        if (offers.length > 0 && !offers.find((o: any) => o.id === formData.offerId)) {
            setFormData(prev => ({ ...prev, offerId: offers[0].id }));
        }
    }, [offers, formData.offerId]);

    return {
        lang,
        setLang,
        formData,
        setFormData,
        showThankYou,
        setShowThankYou
    };
};

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { WILAYAS } from '../../../../lib/constants';
import type { DEFAULT_FORM_CONFIG } from '../../../../lib/constants';
import type { Language } from '../../types';

interface LocationInputProps {
    config: typeof DEFAULT_FORM_CONFIG;
    lang: Language;
    formData: {
        wilaya: string;
        commune: string;
        address: string;
    };
    setFormData: React.Dispatch<React.SetStateAction<unknown>>;
    getFieldTxt: (key: string) => string;
    inputSpacing: number;
    svxInputClass: string;
    inputStyle: React.CSSProperties;
}

export const LocationInput = ({
    config,
    lang,
    formData,
    setFormData,
    getFieldTxt,
    inputSpacing,
    svxInputClass,
    inputStyle
}: LocationInputProps) => {
    const isDoubleDropdown = config.locationInputMode === 'double_dropdown';
    const isSingleDropdown = config.locationInputMode === 'single_dropdown';
    const isFreeText = config.locationInputMode === 'free_text';
    const showLocationSideBySide = config.locationLayout === 'sideBySide' && isDoubleDropdown;

    if (isFreeText) {
        return (
            <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={getFieldTxt('address') + (config.fields.address?.required ? ' *' : '')}
                className={svxInputClass}
                style={inputStyle}
            />
        );
    }

    if (isSingleDropdown) {
        return (
            <div className="relative" style={{ marginBottom: `${inputSpacing}px` }}>
                <select
                    value={formData.wilaya}
                    onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                    className={`${svxInputClass} appearance-none cursor-pointer`}
                    style={{ ...inputStyle, marginBottom: 0 }}
                >
                    <option value="">{getFieldTxt('wilaya') + (config.fields.wilaya?.required ? ' *' : '')}</option>
                    {WILAYAS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 text-slate-400 pointer-events-none`} size={18} />
            </div>
        );
    }

    if (isDoubleDropdown) {
        if (showLocationSideBySide) {
            return (
                <div className="grid grid-cols-2 gap-3" style={{ marginBottom: `${inputSpacing}px` }}>
                    <div className="relative">
                        <select
                            value={formData.wilaya}
                            onChange={(e) => setFormData({ ...formData, wilaya: e.target.value, commune: '' })}
                            className={`${svxInputClass} appearance-none cursor-pointer`}
                            style={{ ...inputStyle, marginBottom: 0 }}
                        >
                            <option value="">{getFieldTxt('wilaya') + (config.fields.wilaya?.required ? ' *' : '')}</option>
                            {WILAYAS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <ChevronDown className={`absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-4 text-slate-400 pointer-events-none`} size={16} />
                    </div>
                    {config.fields.commune?.visible && (
                        <div className="relative">
                            <select
                                className={`${svxInputClass} appearance-none cursor-pointer`}
                                style={{ ...inputStyle, marginBottom: 0 }}
                                disabled={!formData.wilaya}
                            >
                                <option>{getFieldTxt('commune') + (config.fields.commune?.required ? ' *' : '')}</option>
                                {formData.wilaya && <option>Centre Ville</option>}
                            </select>
                            <ChevronDown className={`absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-4 text-slate-400 pointer-events-none`} size={16} />
                        </div>
                    )}
                </div>
            );
        } else {
            return (
                <>
                    <div className="relative" style={{ marginBottom: `${inputSpacing}px` }}>
                        <select
                            value={formData.wilaya}
                            onChange={(e) => setFormData({ ...formData, wilaya: e.target.value, commune: '' })}
                            className={`${svxInputClass} appearance-none cursor-pointer`}
                            style={{ ...inputStyle, marginBottom: 0 }}
                        >
                            <option value="">{getFieldTxt('wilaya') + (config.fields.wilaya?.required ? ' *' : '')}</option>
                            {WILAYAS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 text-slate-400 pointer-events-none`} size={18} />
                    </div>
                    {config.fields.commune?.visible && (
                        <div className="relative" style={{ marginBottom: `${inputSpacing}px` }}>
                            <select
                                className={`${svxInputClass} appearance-none cursor-pointer`}
                                style={{ ...inputStyle, marginBottom: 0 }}
                                disabled={!formData.wilaya}
                            >
                                <option>{getFieldTxt('commune') + (config.fields.commune?.required ? ' *' : '')}</option>
                                {formData.wilaya && <option>Centre Ville</option>}
                            </select>
                            <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 text-slate-400 pointer-events-none`} size={18} />
                        </div>
                    )}
                </>
            );
        }
    }

    return null;
};

import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { Wilaya, Commune } from '@/lib/location';
import type { FormConfig, FieldConfig, OrderFormData } from '@/types/form';

interface ShippingFormFieldsProps {
    config: FormConfig;
    formData: OrderFormData;
    setFormData: (data: OrderFormData) => void;
    formErrors: Record<string, string>;
    setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    lang: 'fr' | 'ar';
    wilayasList: Wilaya[];
    communesList: Commune[];
    loadingCommunes: boolean;
    isSingleDropdown: boolean;
    isDoubleDropdown: boolean;
    isFreeText: boolean;
    showLocationSideBySide: boolean;
    sortedFields: [string, FieldConfig | undefined][];
    getFieldTxt: (key: string) => string;
    txt: (key: string) => string;
    svxInputClass: string;
    inputStyle: React.CSSProperties;
    inputSpacing: number;
    handleInputBlur: (field: string, value: string) => void;
}

export const ShippingFormFields: React.FC<ShippingFormFieldsProps> = ({
    config,
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    lang,
    wilayasList,
    communesList,
    loadingCommunes,
    isSingleDropdown,
    isDoubleDropdown,
    isFreeText,
    showLocationSideBySide,
    sortedFields,
    getFieldTxt,
    txt,
    svxInputClass,
    inputStyle,
    inputSpacing,
    handleInputBlur
}) => {
    return (
        <div>
            {sortedFields.map(([key, field]) => {
                if (key === 'location_block') {
                    return (
                        <div key="location_block">
                            {(isSingleDropdown || isDoubleDropdown) && (
                                <div className={showLocationSideBySide ? 'grid grid-cols-2 gap-3' : 'space-y-0'} style={{ marginBottom: `${inputSpacing}px` }}>
                                    <div className="relative">
                                        <select
                                            name="wilaya"
                                            value={String(formData.wilaya || '')}
                                            onChange={(e) => setFormData({ ...formData, wilaya: e.target.value, commune: '' })}
                                            className={`${svxInputClass} appearance-none cursor-pointer ${formErrors.wilaya ? 'error-ring' : ''}`}
                                            style={{ ...inputStyle, marginBottom: showLocationSideBySide ? 0 : inputSpacing }}
                                        >
                                            <option value="">{getFieldTxt('wilaya') + (config.fields.wilaya?.required ? ' *' : '')}</option>
                                            {wilayasList.map(w => (
                                                <option key={w.id} value={w.id}>
                                                    {lang === 'ar' ? w.ar_name : w.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 pointer-events-none`} color={(config as Record<string, string>).inputPlaceholderColor || '#94a3b8'} size={16} />
                                    </div>
                                    {isDoubleDropdown && config.fields.commune?.visible && (
                                        <div className="relative">
                                            <select
                                                name="commune"
                                                value={String(formData.commune || '')}
                                                onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                                                className={`${svxInputClass} appearance-none cursor-pointer ${formErrors.commune ? 'error-ring' : ''}`}
                                                style={{ ...inputStyle, marginBottom: 0 }}
                                                disabled={!formData.wilaya || loadingCommunes}
                                            >
                                                <option value="">{loadingCommunes ? (lang === 'fr' ? 'Chargement...' : 'جاري التحميل...') : getFieldTxt('commune') + (config.fields.commune?.required ? ' *' : '')}</option>
                                                {communesList.map(c => (
                                                    <option key={c.pk} value={c.fields.name}>{c.fields.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 pointer-events-none`} color={(config as Record<string, string>).inputPlaceholderColor || '#94a3b8'} size={16} />
                                        </div>
                                    )}
                                </div>
                            )}
                            {isFreeText && config.fields.address?.visible !== false && (
                                <input
                                    type="text"
                                    name="address"
                                    value={String(formData.address || '')}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder={getFieldTxt('address') + (config.fields.address?.required ? ' *' : '')}
                                    className={svxInputClass}
                                    style={inputStyle}
                                />
                            )}
                        </div>
                    );
                }

                if (key === 'name' || key === 'phone') {
                    return (
                        <div key={key} className="relative">
                            <input
                                name={key}
                                type={key === 'phone' ? 'tel' : 'text'}
                                value={String(formData[key] || '')}
                                onChange={(e) => {
                                    setFormData({ ...formData, [key]: e.target.value });
                                    if (formErrors[key]) setFormErrors(prev => {
                                        const newErrors = { ...prev };
                                        delete newErrors[key];
                                        return newErrors;
                                    });
                                }}
                                placeholder={getFieldTxt(key) + (field.required ? ' *' : '')}
                                className={`${svxInputClass} ${formErrors[key] ? 'error-ring animate-shake' : ''}`}
                                style={inputStyle}
                                onBlur={(e) => handleInputBlur(key, e.target.value)}
                            />
                            {formErrors[key] && Object.keys(formErrors)[0] === key && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                                    <div
                                        className="text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg flex items-center gap-1"
                                        style={{ backgroundColor: (config as Record<string, string>).accentColor || '#ef4444' }}
                                    >
                                        <span>!</span>
                                        <span>{formErrors[key]}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }

                if (key === 'note') {
                    return (
                        <textarea
                            key={key}
                            name="note"
                            value={String(formData.note || '')}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            placeholder={getFieldTxt(key) + (field.required ? ' *' : '')}
                            className={`${svxInputClass} resize-none`}
                            style={inputStyle}
                            rows={2}
                            readOnly={false}
                        />
                    );
                }
                return null;
            })}
        </div>
    );
};

/**
 * Variants Section Component  
 * Displays variant/model selection with multiple styles
 */

import type { Language } from '@/types';
import { Check, ChevronDown } from 'lucide-react';
import React from 'react';
import { SectionLabel } from '../components/SectionLabel';

interface VariantsSectionProps {
    config: {
        accentColor: string;
        textColor?: string;
        borderRadius: string;
        inputBorderColor?: string;
        formBackground?: string;
        variantStyle?: 'buttons' | 'cards' | 'pills' | 'dropdown';
        sectionSettings?: {
            variants?: { showTitle?: boolean };
        };
        translations: {
            variants?: { fr: string; ar: string };
            [key: string]: any;
        };
    };
    lang: Language;
    variants: string[];
    selectedVariant: string;
    onSelect: (variant: string) => void;
    marginStyle?: React.CSSProperties;
}

export const VariantsSection: React.FC<VariantsSectionProps> = ({
    config,
    lang,
    variants,
    selectedVariant,
    onSelect,
    marginStyle,
}) => {
    const txt = (key: string) =>
        config.translations[key]?.[lang] || config.translations[key]?.fr || '';

    const style = config.variantStyle || 'buttons';

    return (
        <div style={marginStyle}>
            {config.sectionSettings?.variants?.showTitle !== false && (
                <SectionLabel accentColor={config.accentColor}>{txt('variants')}</SectionLabel>
            )}

            {/* Buttons style */}
            {style === 'buttons' && (
                <div className="flex gap-2 overflow-x-auto overflow-y-visible pt-3 pb-1 scrollbar-hide -mx-1 px-1">
                    {variants.map((v, i) => {
                        const isSelected = selectedVariant === v;
                        return (
                            <button
                                key={i}
                                onClick={() => onSelect(v)}
                                className={`relative px-5 py-3 whitespace-nowrap text-xs font-bold transition-all duration-200 flex items-center gap-2 ${isSelected ? 'text-white shadow-lg' : 'border-2'
                                    }`}
                                style={{
                                    borderRadius: config.borderRadius,
                                    backgroundColor: isSelected ? config.accentColor : (config.formBackground || '#ffffff'),
                                    borderColor: isSelected ? config.accentColor : (config.inputBorderColor || '#e2e8f0'),
                                    color: isSelected ? '#ffffff' : (config.textColor || '#475569'),
                                    boxShadow: isSelected ? `0 8px 20px -4px ${config.accentColor}50` : undefined,
                                }}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-white bg-white/20' : ''
                                        }`}
                                    style={{
                                        borderColor: isSelected ? undefined : config.inputBorderColor || '#e2e8f0',
                                    }}
                                >
                                    {isSelected && <Check size={10} strokeWidth={4} className="text-white" />}
                                </div>
                                {v}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Cards style */}
            {style === 'cards' && (
                <div className="space-y-2">
                    {variants.map((v, i) => {
                        const isSelected = selectedVariant === v;
                        return (
                            <button
                                key={i}
                                onClick={() => onSelect(v)}
                                className={`relative w-full p-4 border-2 flex items-center gap-4 transition-all duration-200 ${isSelected ? 'text-white shadow-lg' : ''
                                    }`}
                                style={{
                                    borderRadius: config.borderRadius,
                                    backgroundColor: isSelected ? config.accentColor : (config.formBackground || '#ffffff'),
                                    borderColor: isSelected ? config.accentColor : (config.inputBorderColor || '#e2e8f0'),
                                    color: isSelected ? '#ffffff' : (config.textColor || '#475569'),
                                    boxShadow: isSelected ? `0 8px 20px -4px ${config.accentColor}50` : undefined,
                                }}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-white bg-white/20' : ''
                                        }`}
                                    style={{ borderColor: isSelected ? undefined : (config.inputBorderColor || '#e2e8f0') }}
                                >
                                    {isSelected && <Check size={10} strokeWidth={4} className="text-white" />}
                                </div>
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black ${isSelected ? 'bg-white/20 text-white' : ''
                                        }`}
                                    style={{
                                        backgroundColor: isSelected ? undefined : `${config.accentColor}10`,
                                        color: isSelected ? undefined : (config.textColor || '#94a3b8'),
                                    }}
                                >
                                    {String.fromCharCode(65 + i)}
                                </div>
                                <span
                                    className="text-sm font-bold"
                                    style={{ color: isSelected ? '#ffffff' : (config.textColor || '#334155') }}
                                >
                                    {v}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Pills style */}
            {style === 'pills' && (
                <div className="flex flex-wrap gap-2">
                    {variants.map((v, i) => {
                        const isSelected = selectedVariant === v;
                        return (
                            <button
                                key={i}
                                onClick={() => onSelect(v)}
                                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${isSelected ? 'text-white shadow-lg' : 'border-2'
                                    }`}
                                style={{
                                    backgroundColor: isSelected ? config.accentColor : 'transparent',
                                    borderColor: config.inputBorderColor || '#e2e8f0',
                                    color: isSelected ? '#ffffff' : (config.textColor || '#475569'),
                                }}
                            >
                                {v}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Dropdown style */}
            {style === 'dropdown' && (
                <div className="relative">
                    <select
                        value={selectedVariant}
                        onChange={(e) => onSelect(e.target.value)}
                        className="w-full px-4 py-3.5 text-sm font-semibold border-2 outline-none appearance-none cursor-pointer"
                        style={{
                            borderRadius: config.borderRadius,
                            backgroundColor: config.formBackground || '#ffffff',
                            borderColor: config.inputBorderColor || '#e2e8f0',
                            color: config.textColor || '#1e293b',
                        }}
                    >
                        {variants.map((v, i) => (
                            <option key={i} value={v}>
                                {v}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: config.textColor || '#94a3b8' }}
                    />
                </div>
            )}
        </div>
    );
};

/**
 * Delivery Section Component
 * Displays delivery type selection (home vs desk)
 */

import { buildOptionCardStyles } from '@/lib/utils/cssEngine';
import type { Language } from '@/types';
import { Check, Home, Package } from 'lucide-react';

import { SectionLabel } from '../components/SectionLabel';
import type { FormConfig } from '@/types/form';

interface DeliverySectionProps {
    config: FormConfig;
    lang: Language;
    shippingType: 'home' | 'desk';
    onSelect: (type: 'home' | 'desk') => void;
    formatCurrency: (amount: number) => string;
    homePrice: number;
    deskPrice: number;
    showSection: boolean;
    hasWilaya?: boolean;
    marginStyle?: React.CSSProperties;
}

export const DeliverySection: React.FC<DeliverySectionProps> = ({
    config,
    lang,
    shippingType,
    onSelect,
    formatCurrency,
    homePrice,
    deskPrice,
    showSection,
    hasWilaya = true,
    marginStyle,
}) => {
    if (!showSection) return null;

    const txt = (key: string) =>
        config.translations[key]?.[lang] || config.translations[key]?.fr || '';

    const isHomeEnabled = config.enableHomeDelivery !== false;
    const isDeskEnabled = config.enableDeskDelivery !== false;

    // Config
    const layout = config.sectionSettings?.delivery?.layout || 'cards';
    const isList = layout === 'list';
    const isCompact = layout === 'compact';
    const showPrices = config.sectionSettings?.delivery?.showPrices ?? true;
    const shouldShowPrice = showPrices && hasWilaya;

    const deliveryOptions = [
        {
            type: 'home' as const,
            label: txt('home'),
            price: homePrice,
            icon: Home,
            enabled: isHomeEnabled,
        },
        {
            type: 'desk' as const,
            label: txt('desk'),
            price: deskPrice,
            icon: Package,
            enabled: isDeskEnabled,
        },
    ];

    return (
        <div style={marginStyle}>
            {config.sectionSettings?.delivery?.showTitle !== false && (
                <SectionLabel accentColor={config.accentColor}>{txt('delivery')}</SectionLabel>
            )}

            <div className={`grid ${isList ? 'grid-cols-1 gap-3' : isCompact ? 'grid-cols-2 gap-2' : 'grid-cols-2 gap-3'}`}>
                {deliveryOptions.map(({ type, label, price, icon: Icon, enabled }) => {
                    const isSelected = shippingType === type;
                    const isDisabled = !enabled;

                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => enabled && onSelect(type)}
                            disabled={isDisabled}
                            className={`relative border-2 transition-all duration-200 ${isList
                                ? 'flex items-center p-3 gap-4 text-left'
                                : isCompact
                                    ? 'p-3 text-center block'
                                    : 'p-4 text-center block'
                                } ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''} ${isSelected && !isDisabled ? 'shadow-lg' : ''}`}

                            style={buildOptionCardStyles(config as unknown, { selected: isSelected, disabled: isDisabled })}
                        >
                            {/* Selection indicator */}
                            {!isDisabled && (
                                <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-white bg-white/20' : ''
                                        } ${isList
                                            ? ''
                                            : isCompact
                                                ? 'absolute top-1/2 -translate-y-1/2 right-3'
                                                : 'absolute top-3 right-3'
                                        }`}
                                    style={{
                                        borderColor: isSelected ? undefined : config.inputBorderColor || '#e2e8f0',
                                    }}
                                >
                                    {isSelected && <Check size={10} strokeWidth={4} className="text-white" />}
                                </div>
                            )}

                            {/* Icon - Hidden in compact mode */}
                            {!isCompact && (
                                <div
                                    className={`rounded-xl flex items-center justify-center flex-shrink-0 ${isDisabled ? 'opacity-50' : ''
                                        } ${isList
                                            ? 'w-10 h-10'
                                            : 'w-10 h-10 mx-auto mb-2'
                                        }`}
                                    style={{
                                        backgroundColor: isSelected && !isDisabled
                                            ? 'rgba(255,255,255,0.2)'
                                            : `${config.accentColor}10`,
                                        color: isSelected && !isDisabled ? '#ffffff' : config.accentColor,
                                    }}
                                >
                                    <Icon size={20} />
                                </div>
                            )}

                            <div className={`${isList ? 'flex-1' : ''}`}>
                                {/* Label */}
                                <div
                                    className={`font-bold ${isList ? '' : 'mb-0.5'
                                        } ${isDisabled ? 'line-through' : ''} ${isCompact ? 'text-sm' : 'text-sm'
                                        }`}
                                    style={{
                                        color: isSelected && !isDisabled ? '#ffffff' : (config.textColor || '#334155'),
                                    }}
                                >
                                    {label}
                                </div>

                                {/* Price */}
                                {shouldShowPrice && (
                                    <div
                                        className={`font-semibold ${isCompact ? 'text-xs' : 'text-xs'
                                            }`}
                                        style={{
                                            color: isSelected && !isDisabled
                                                ? 'rgba(255,255,255,0.8)'
                                                : (config.textColor || '#64748b'),
                                        }}
                                    >
                                        {isDisabled ? txt('unavailable') : price === 0 ? (
                                            <span className="text-emerald-600">{txt('free') || 'GRATUIT'}</span>
                                        ) : formatCurrency(price)}
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

        </div>
    );
};

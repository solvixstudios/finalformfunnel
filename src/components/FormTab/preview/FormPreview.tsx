/**
 * FormPreview - Refactored Version
 * Uses extracted section components for maintainability
 */

import { WILAYAS } from '@/lib/constants';
import { ChevronDown, Database, Palette, Settings2, Tag, Ticket, Truck } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import type { FormPreviewProps } from '../types';
import { PreviewSectionWrapper } from './components/PreviewSectionWrapper';
import { SectionLabel } from './components/SectionLabel';
import { ThankYouPopup } from './components/ThankYouPopup';

// Import section components
import {
    CtaButton,
    DeliverySection,
    HeaderSection,
    OffersSection,
    PromoCodeSection,
    StickyCTA,
    SummarySection,
    TrustBadgesSection,
    UrgencyQuantitySection,
    UrgencyTextSection,
    UrgencyTimerSection,
    VariantsSection
} from './sections';

// Import hooks
import { useCountdownTimer } from './hooks/useCountdownTimer';
import { usePreviewCalculations } from './hooks/usePreviewCalculations';
import { usePromoCode } from './hooks/usePromoCode';
import { useStickyObserver } from './hooks/useStickyObserver';

// Import utilities
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/formatting';
import { getFontFamilyCSS } from '@/lib/utils/styles';
import { useFormStore } from '@/stores';

export const FormPreview = ({ config, offers, shipping }: FormPreviewProps) => {
    // --- STATE ---
    const [lang, setLang] = useState<'fr' | 'ar'>(config.header?.defaultLanguage || 'fr');
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        wilaya: '',
        commune: '',
        address: '',
        note: '',
        offerId: offers[0]?.id || '',
        variant: 'Modèle A',
        shippingType: 'home' as 'home' | 'desk',
    });
    const [showThankYou, setShowThankYou] = useState(false);

    // Refs
    const ctaRef = useRef<HTMLDivElement>(null);
    const formContainerRef = useRef<HTMLDivElement>(null);

    const setEditingSection = useFormStore((state) => state.setEditingSection);

    const handleSectionSelect = (sectionId: string) => {
        setEditingSection(sectionId);
    };

    // --- HOOKS ---
    const {
        promoCodeInput,
        setPromoCodeInput,
        appliedPromoCode,
        promoCodeError,
        promoCodeSuccess,
        handleApplyPromoCode,
        handleRemovePromoCode,
    } = usePromoCode(config.promoCode?.codes || []);

    const countdown = useCountdownTimer({
        enabled: config.urgencyTimer?.enabled || false,
        hours: config.urgencyTimer?.hours ?? 2,
        minutes: config.urgencyTimer?.minutes ?? 30,
        seconds: config.urgencyTimer?.seconds ?? 0,
    });

    const showStickyCTA = useStickyObserver({
        enabled: config.ctaSticky || false,
        targetRef: ctaRef,
        containerRef: formContainerRef,
    });

    const calculations = usePreviewCalculations({
        offers: offers as any,
        selectedOfferId: formData.offerId,
        shipping,
        selectedWilaya: formData.wilaya,
        shippingType: formData.shippingType,
        appliedPromoCode,
        hideShippingInSummary: config.hideShippingInSummary || false,
        basePricePerUnit: 2500,
    });

    // --- EFFECTS ---
    useEffect(() => {
        setShowThankYou(false);
    }, [config, lang]);

    useEffect(() => {
        if (offers.length > 0 && !offers.find((o: any) => o.id === formData.offerId)) {
            setFormData(prev => ({ ...prev, offerId: offers[0].id }));
        }
    }, [offers, formData.offerId]);

    // --- HELPERS ---
    const txt = (key: string) => config.translations[key]?.[lang] || config.translations[key]?.fr || '';
    const getFieldTxt = (fieldKey: string) => config.fields[fieldKey]?.placeholder?.[lang] || config.fields[fieldKey]?.placeholder?.fr || '';
    const formatCurrency = (amount: number) => formatCurrencyUtil(amount, lang);
    const fontFamily = getFontFamilyCSS(config.fontFamily?.[lang] || (lang === 'fr' ? 'Inter' : 'Cairo'));

    // Section margin helper
    const getSectionMarginStyle = (isFirst: boolean = false) => {
        const sectionSpacing = config.sectionSpacing || 20;
        const sectionMarginTop = config.sectionMarginTop || 0;
        const sectionMarginBottom = config.sectionMarginBottom || 0;
        return isFirst
            ? { marginTop: `${sectionMarginTop}px`, marginBottom: `${sectionSpacing + sectionMarginBottom}px` }
            : { marginTop: `${sectionSpacing + sectionMarginTop}px`, marginBottom: `${sectionMarginBottom}px` };
    };

    // Input styling
    const inputSpacing = config.inputSpacing || 12;
    const isFilled = config.inputVariant === 'filled';
    const svxInputClass = `custom-input w-full px-4 py-3.5 text-[13px] font-semibold outline-none transition-all duration-200 border-2 focus:ring-4`;
    const inputStyle = {
        borderRadius: config.borderRadius,
        marginBottom: `${inputSpacing}px`,
        backgroundColor: config.inputBackground || (isFilled ? '#f8fafc' : '#ffffff'),
        borderColor: isFilled ? 'transparent' : (config.inputBorderColor || '#e2e8f0'),
        color: config.inputTextColor || '#1e293b',
    } as React.CSSProperties;

    // Field visibility logic
    const getVisibleFields = () => {
        const fields = { ...config.fields };
        const entries = Object.entries(fields)
            .filter(([key, field]: any) => field.visible && key !== 'location_block')
            .sort(([, a]: any, [, b]: any) => a.order - b.order);

        const result: any[] = [];
        let locationRendered = false;

        for (const [key, field] of entries) {
            if (key === 'wilaya' || key === 'commune' || key === 'address') {
                if (!locationRendered) {
                    result.push(['location_block', field]);
                    locationRendered = true;
                }
            } else {
                result.push([key, field]);
            }
        }
        return result;
    };

    const sortedFields = getVisibleFields();
    const isDoubleDropdown = config.locationInputMode === 'double_dropdown';
    const isSingleDropdown = config.locationInputMode === 'single_dropdown';
    const isFreeText = config.locationInputMode === 'free_text';
    const showLocationSideBySide = config.locationLayout === 'sideBySide' && isDoubleDropdown;

    // Variants
    const variants = ['Modèle A', 'Modèle B', 'Modèle C'];

    // Delivery section visibility
    const showDeliverySection = shipping &&
        !config.hideDeliveryOption &&
        (config.enableHomeDelivery !== false || config.enableDeskDelivery !== false);

    // CTA styles (for sticky)
    const getCtaStyles = (): React.CSSProperties => {
        const ctaVariant = config.ctaVariant || 'solid';
        const base = { borderRadius: config.borderRadius };

        if (ctaVariant === 'outline') {
            return { ...base, borderColor: config.ctaColor, color: config.ctaColor };
        }
        if (ctaVariant === 'gradient') {
            return { ...base, background: `linear-gradient(135deg, ${config.ctaColor} 0%, ${config.accentColor} 100%)` };
        }
        if (ctaVariant === 'ghost') {
            return { ...base, color: config.ctaColor };
        }
        return { ...base, backgroundColor: config.ctaColor };
    };

    // --- RENDER ---
    return (
        <div
            className="w-full h-full font-sans relative flex flex-col shadow-2xl select-none"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            style={{
                borderRadius: '16px',
                backgroundColor: config.formBackground || '#ffffff',
                fontFamily: fontFamily,
                color: config.textColor || '#1e293b',
            }}
        >
            <style>{`
                .custom-input::placeholder {
                    color: ${config.inputPlaceholderColor || '#94a3b8'} !important;
                    opacity: 1;
                }
            `}</style>

            {showThankYou && (
                <ThankYouPopup config={config} lang={lang} onClose={() => setShowThankYou(false)} />
            )}

            <div className="flex-1 overflow-y-auto custom-scroll relative" ref={formContainerRef}>
                {/* Header Section */}
                <PreviewSectionWrapper
                    sectionId="header"
                    onSelect={handleSectionSelect}
                    actions={[
                        { label: 'Edit Header', icon: <Settings2 size={14} />, onClick: () => setEditingSection('header') }
                    ]}
                >
                    <HeaderSection
                        config={config}
                        lang={lang}
                        onLanguageToggle={() => setLang(l => l === 'fr' ? 'ar' : 'fr')}
                        formatCurrency={formatCurrency}
                        basePrice={2500}
                    />
                </PreviewSectionWrapper>
                <div className="p-5">
                    {config.sectionOrder.map((sectionId: string, index: number) => {
                        const marginStyle = getSectionMarginStyle(index === 0);

                        // Variants
                        if (sectionId === 'variants') {
                            return (
                                <PreviewSectionWrapper
                                    key={sectionId}
                                    sectionId="variants"
                                    onSelect={handleSectionSelect}
                                    style={marginStyle}
                                    actions={[
                                        { label: 'Edit Variants', icon: <Tag size={14} />, onClick: () => setEditingSection('variants') }
                                    ]}
                                >
                                    <VariantsSection
                                        config={config}
                                        lang={lang}
                                        variants={variants}
                                        selectedVariant={formData.variant}
                                        onSelect={(v) => setFormData({ ...formData, variant: v })}
                                    />
                                </PreviewSectionWrapper>
                            );
                        }

                        // Shipping Form Fields
                        if (sectionId === 'shipping') {
                            return (
                                <PreviewSectionWrapper
                                    key={sectionId}
                                    sectionId="shipping"
                                    onSelect={handleSectionSelect}
                                    style={marginStyle}
                                    actions={[
                                        { label: 'Edit Design', icon: <Palette size={14} />, onClick: () => setEditingSection('shipping') },
                                    ]}
                                >
                                    <div className="space-y-4">
                                        {config.sectionSettings?.shipping?.showTitle && (
                                            <SectionLabel accentColor={config.accentColor}>{txt('shipping')}</SectionLabel>
                                        )}
                                        <div>
                                            {sortedFields.map(([key, field]: any) => {
                                                if (key === 'location_block') {
                                                    return (
                                                        <div key="location_block">
                                                            {(isSingleDropdown || isDoubleDropdown) && (
                                                                <div className={showLocationSideBySide ? 'grid grid-cols-2 gap-3' : 'space-y-0'} style={{ marginBottom: `${inputSpacing}px` }}>
                                                                    <div className="relative">
                                                                        <select
                                                                            value={formData.wilaya}
                                                                            onChange={(e) => setFormData({ ...formData, wilaya: e.target.value, commune: '' })}
                                                                            className={`${svxInputClass} appearance-none cursor-pointer`}
                                                                            style={{ ...inputStyle, marginBottom: showLocationSideBySide ? 0 : inputSpacing }}
                                                                        >
                                                                            <option value="">{getFieldTxt('wilaya') + (config.fields.wilaya?.required ? ' *' : '')}</option>
                                                                            {WILAYAS.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                                                        </select>
                                                                        <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 pointer-events-none`} color={config.inputPlaceholderColor || '#94a3b8'} size={16} />
                                                                    </div>
                                                                    {isDoubleDropdown && config.fields.commune?.visible && (
                                                                        <div className="relative">
                                                                            <select
                                                                                className={`${svxInputClass} appearance-none cursor-pointer`}
                                                                                style={{ ...inputStyle, marginBottom: 0 }}
                                                                                disabled={!formData.wilaya}
                                                                            >
                                                                                <option>{getFieldTxt('commune') + (config.fields.commune?.required ? ' *' : '')}</option>
                                                                                {formData.wilaya && <option>Centre Ville</option>}
                                                                            </select>
                                                                            <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 pointer-events-none`} color={config.inputPlaceholderColor || '#94a3b8'} size={16} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {isFreeText && config.fields.address?.visible !== false && (
                                                                <input
                                                                    type="text"
                                                                    value={formData.address}
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
                                                        <input
                                                            key={key}
                                                            type={key === 'phone' ? 'tel' : 'text'}
                                                            value={formData[key as keyof typeof formData] as string}
                                                            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                                            placeholder={getFieldTxt(key) + (field.required ? ' *' : '')}
                                                            className={svxInputClass}
                                                            style={inputStyle}
                                                        />
                                                    );
                                                }

                                                if (key === 'note') {
                                                    return (
                                                        <textarea
                                                            key={key}
                                                            value={formData.note}
                                                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                                            placeholder={getFieldTxt(key) + (field.required ? ' *' : '')}
                                                            className={`${svxInputClass} resize-none`}
                                                            style={inputStyle}
                                                            rows={2}
                                                        />
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    </div>
                                </PreviewSectionWrapper>
                            );
                        }

                        // Delivery Type
                        if (sectionId === 'delivery' && showDeliverySection) {
                            return (
                                <PreviewSectionWrapper
                                    key={sectionId}
                                    sectionId="delivery"
                                    onSelect={handleSectionSelect}
                                    style={marginStyle}
                                    actions={[
                                        { label: 'Edit Design', icon: <Palette size={14} />, onClick: () => setEditingSection('delivery') },
                                        { label: 'Manage Rates', icon: <Truck size={14} />, onClick: () => setEditingSection('shipping_manager') }
                                    ]}
                                >
                                    <DeliverySection
                                        config={config}
                                        lang={lang}
                                        shippingType={formData.shippingType}
                                        onSelect={(type) => setFormData({ ...formData, shippingType: type })}
                                        formatCurrency={formatCurrency}
                                        homePrice={shipping?.standard.home || 0}
                                        deskPrice={shipping?.standard.desk || 0}
                                        showSection={showDeliverySection}
                                        hasWilaya={!!formData.wilaya}
                                    />
                                </PreviewSectionWrapper>
                            );
                        }

                        // Offers
                        if (sectionId === 'offers') {
                            return (
                                <PreviewSectionWrapper
                                    key={sectionId}
                                    sectionId="offers"
                                    onSelect={handleSectionSelect}
                                    style={marginStyle}
                                    actions={[
                                        { label: 'Edit Design', icon: <Palette size={14} />, onClick: () => setEditingSection('offers') },
                                        { label: 'Edit Packs Logic', icon: <Database size={14} />, onClick: () => setEditingSection('packs_manager') }
                                    ]}
                                >
                                    <OffersSection
                                        config={config}
                                        lang={lang}
                                        offers={offers as any}
                                        selectedOfferId={formData.offerId}
                                        onSelect={(id) => setFormData({ ...formData, offerId: id })}
                                        formatCurrency={formatCurrency}
                                        basePrice={2500}
                                    />
                                </PreviewSectionWrapper>
                            );
                        }

                        // Promo Code
                        if (sectionId === 'promoCode' && config.promoCode?.enabled) {
                            return (
                                <PreviewSectionWrapper
                                    key={sectionId}
                                    sectionId="promoCode"
                                    onSelect={handleSectionSelect}
                                    style={marginStyle}
                                    actions={[
                                        { label: 'Edit Design', icon: <Palette size={14} />, onClick: () => setEditingSection('promoCode') },
                                        { label: 'Manage Codes', icon: <Ticket size={14} />, onClick: () => setEditingSection('promo_code_manager') }
                                    ]}
                                >
                                    <PromoCodeSection
                                        config={config}
                                        lang={lang}
                                        promoCodeInput={promoCodeInput}
                                        setPromoCodeInput={setPromoCodeInput}
                                        promoCodeError={promoCodeError}
                                        promoCodeSuccess={promoCodeSuccess}
                                        appliedPromoCode={appliedPromoCode}
                                        onApply={handleApplyPromoCode}
                                        onRemove={handleRemovePromoCode}
                                    />
                                </PreviewSectionWrapper>
                            );
                        }

                        // Summary
                        if (sectionId === 'summary' && config.enableSummarySection) {
                            return (
                                <PreviewSectionWrapper
                                    key={sectionId}
                                    sectionId="summary"
                                    onSelect={handleSectionSelect}
                                    style={marginStyle}
                                    actions={[
                                        { label: 'Edit Summary', icon: <Settings2 size={14} />, onClick: () => setEditingSection('summary') }
                                    ]}
                                >
                                    <SummarySection
                                        config={config}
                                        lang={lang}
                                        offerPrice={calculations.offerPrice}
                                        shippingCost={calculations.shippingCost}
                                        promoDiscount={calculations.promoDiscount}
                                        totalPromoDiscount={calculations.totalPromoDiscount}
                                        displayedTotal={calculations.displayedTotal}
                                        appliedPromoCode={appliedPromoCode}
                                        formatCurrency={formatCurrency}
                                    />
                                </PreviewSectionWrapper>
                            );
                        }

                        // CTA
                        if (sectionId === 'cta') {
                            return (
                                <PreviewSectionWrapper
                                    key={sectionId}
                                    sectionId="cta"
                                    onSelect={handleSectionSelect}
                                    style={marginStyle}
                                    actions={[
                                        { label: 'Edit Button', icon: <Settings2 size={14} />, onClick: () => setEditingSection('cta') }
                                    ]}
                                >
                                    <div ref={ctaRef} className="pt-2">
                                        <CtaButton
                                            config={config}
                                            text={txt('cta')}
                                            onClick={() => setShowThankYou(true)}
                                        />
                                    </div>
                                </PreviewSectionWrapper>
                            );
                        }

                        // Urgency Text
                        if (sectionId === 'urgencyText') {
                            return (
                                <PreviewSectionWrapper
                                    key={sectionId}
                                    sectionId="urgencyText"
                                    onSelect={handleSectionSelect}
                                    style={marginStyle}
                                    actions={[
                                        { label: 'Edit Settings', icon: <Settings2 size={14} />, onClick: () => setEditingSection('urgencyText') }
                                    ]}
                                >
                                    <UrgencyTextSection
                                        config={config}
                                        lang={lang}
                                    />
                                </PreviewSectionWrapper>
                            );
                        }

                        // Urgency Quantity (Stock)
                        if (sectionId === 'urgencyQuantity') {
                            return (
                                <PreviewSectionWrapper
                                    key={sectionId}
                                    sectionId="urgencyQuantity"
                                    onSelect={handleSectionSelect}
                                    style={marginStyle}
                                    actions={[
                                        { label: 'Edit Settings', icon: <Settings2 size={14} />, onClick: () => setEditingSection('urgencyQuantity') }
                                    ]}
                                >
                                    <UrgencyQuantitySection
                                        config={config}
                                        lang={lang}
                                    />
                                </PreviewSectionWrapper>
                            );
                        }

                        // Urgency Timer
                        if (sectionId === 'urgencyTimer') {
                            return (
                                <PreviewSectionWrapper
                                    key={sectionId}
                                    sectionId="urgencyTimer"
                                    onSelect={handleSectionSelect}
                                    style={marginStyle}
                                    actions={[
                                        { label: 'Edit Settings', icon: <Settings2 size={14} />, onClick: () => setEditingSection('urgencyTimer') }
                                    ]}
                                >
                                    <UrgencyTimerSection
                                        config={config}
                                        lang={lang}
                                        countdown={countdown}
                                    />
                                </PreviewSectionWrapper>
                            );
                        }

                        // Trust Badges
                        if (sectionId === 'trustBadges' && config.enableTrustBadges) {
                            return (
                                <PreviewSectionWrapper
                                    key={sectionId}
                                    sectionId="trustBadges"
                                    onSelect={handleSectionSelect}
                                    style={marginStyle}
                                    actions={[
                                        { label: 'Edit Badges', icon: <Settings2 size={14} />, onClick: () => setEditingSection('trustBadges') }
                                    ]}
                                >
                                    <TrustBadgesSection
                                        config={config}
                                        lang={lang}
                                    />
                                </PreviewSectionWrapper>
                            );
                        }

                        return null;
                    })}
                </div>
            </div>

            {/* Sticky CTA */}
            <StickyCTA
                variant={config.ctaStickyVariant}
                visible={showStickyCTA}
                text={txt('cta')}
                onClick={() => ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                ctaStyles={getCtaStyles()}
                formBackground={config.formBackground || '#ffffff'}
                borderColor={config.inputBorderColor || '#e2e8f0'}
                textColor={config.textColor || '#334155'}
                accentColor={config.accentColor}
                productTitle={offers.find((o: any) => o.id === formData.offerId)?.title?.[lang]}
                totalPrice={formatCurrency(calculations.displayedTotal)}
            />
        </div>
    );
};

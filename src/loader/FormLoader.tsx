import { SectionLabel } from '@/components/FormTab/preview/components/SectionLabel';
import { ThankYouPopup } from '@/components/FormTab/preview/components/ThankYouPopup';
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
} from '@/components/FormTab/preview/sections';
// import { WILAYAS } from '@/lib/constants'; // Removed: Static Data
import { buildCtaStyles, buildInputStyles, buildRootStyles, buildSectionMargin, getFontFamilyCSS } from '@/lib/utils/cssEngine';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/formatting';
import { ChevronDown } from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { z } from 'zod'; // Import Zod

import { useCountdownTimer } from '@/components/FormTab/preview/hooks/useCountdownTimer';
import { usePreviewCalculations } from '@/components/FormTab/preview/hooks/usePreviewCalculations';
import { usePromoCode } from '@/components/FormTab/preview/hooks/usePromoCode';
import { useStickyObserver } from '@/components/FormTab/preview/hooks/useStickyObserver';
import { getAdapter } from '@/lib/integrations';
import { Commune, fetchCommunes, fetchWilayas, Wilaya } from '@/lib/location'; // New Location Utility
import { getCookie } from '@/lib/utils/cookies';
import { useProductData } from './hooks/useProductData';
import { useLocationData } from './hooks/useLocationData';
import type { FormConfig, FieldConfig, OrderFormData } from '../types/form';
import type { MetaPixelProfile } from '../types/form';
import { usePixelTracking } from './hooks/usePixelTracking';
import { useFormSubmission } from './hooks/useFormSubmission';
import { ShippingFormFields } from './components/ShippingFormFields';

// Types
export interface Variant {
    id: number;
    title: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    price: number | string;
    featured_image?: { src: string } | null;
}

export interface Product {
    id: number;
    title: string;
    images: string[];
    variants: Variant[];
    options: { name: string; values: string[] }[];
    featuredImage?: { url: string };
    featured_image?: string;
}

import type { Offer } from '../types/offers';
import type { FormShipping } from '../types/form';
export const FormLoader = ({ config, product, offers, shipping, sectionWrapper, previewMode = false, forceShowThankYou = false }: { config: FormConfig, product: Product, offers: Offer[], shipping: FormShipping, sectionWrapper?: (props: { sectionId: string, children: React.ReactNode, style?: React.CSSProperties, elementRef?: React.RefObject<HTMLDivElement> }) => React.ReactNode, previewMode?: boolean, forceShowThankYou?: boolean }) => {
    // --- STATE ---
    const [lang, setLang] = useState<'fr' | 'ar'>(config.header?.defaultLanguage || 'fr');

    const [formData, setFormData] = useState<OrderFormData>({
        name: '',
        phone: '',
        wilaya: '',
        commune: '',
        address: '',
        note: '',
        offerId: offers[0]?.id || '',
        variant: product?.variants?.[0]?.title || '',
        quantity: 1,
        shippingType: 'home' as 'home' | 'desk',
    });

    // Refs
    const ctaRef = useRef<HTMLDivElement>(null);
    const formContainerRef = useRef<HTMLDivElement>(null);

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
        useWindowRoot: !previewMode,
    });

    // --- CUSTOM HOOKS ---
    const { wilayasList, communesList, loadingCommunes, clientIp, getWilayaRawName } = useLocationData(formData.wilaya);

    const {
        selectedVariantId,
        setSelectedVariantId,
        selectedOptions,
        setSelectedOptions,
        basePrice,
        productTitle,
        productImage,
        variants
    } = useProductData(product, (variantTitle) => {
        setFormData(prev => ({ ...prev, variant: variantTitle }));
    });

    usePixelTracking({ config, product, previewMode, formData, basePrice });

    const calculations = usePreviewCalculations({
        offers: offers as any,
        selectedOfferId: formData.offerId,
        shipping: shipping as any,
        selectedWilaya: formData.wilaya,
        shippingType: formData.shippingType,
        appliedPromoCode,
        hideShippingInSummary: config.hideShippingInSummary || false,
        basePricePerUnit: basePrice,
    });

    // --- EFFECTS ---
    useEffect(() => {
        if (offers.length > 0 && !offers.find((o: Offer) => o.id === formData.offerId)) {
            setFormData(prev => ({ ...prev, offerId: offers[0].id }));
        }
    }, [offers, formData.offerId]);

    // Dynamically inject Google Font for typography
    useEffect(() => {
        const fontName = config.fontFamily?.[lang] || (lang === 'fr' ? 'Inter' : 'Cairo');
        const fontId = `ff-font-${fontName.toLowerCase().replace(/\s+/g, '-')}`;

        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
            document.head.appendChild(link);
        }
    }, [config.fontFamily, lang]);



    // --- HELPERS ---
    // Backwards-compat: if config has `settings` wrapper but no top-level fields, unwrap it
    if (config.settings && !config.fields) {
        Object.assign(config, config.settings);
    }

    const translations = config.translations || {};
    // Revert to strict fields from config
    const fields = config.fields as Record<string, any> || ({} as Record<string, any>);
    const sectionSettings = config.sectionSettings || {};

    const txt = (key: string) => translations[key]?.[lang] || translations[key]?.fr || '';
    const getFieldTxt = (fieldKey: string) => fields[fieldKey]?.placeholder?.[lang] || fields[fieldKey]?.placeholder?.fr || '';
    const formatCurrency = (amount: number) => formatCurrencyUtil(amount, lang);
    const fontFamily = getFontFamilyCSS(config.fontFamily?.[lang] || (lang === 'fr' ? 'Inter' : 'Cairo'));

    const getSectionMarginStyle = (isFirst: boolean = false) => buildSectionMargin(config as any, isFirst);

    // Input styling
    const inputSpacing = config.inputSpacing || 12;
    const svxInputClass = `custom-input w-full px-4 py-3.5 text-[13px] font-semibold outline-none transition-all duration-300 border-2 focus:ring-4`;
    const inputStyle = buildInputStyles(config as any, config.inputVariant || 'filled');

    // Validation Schema
    const schema = z.object({
        name: fields.name?.required ? z.string().min(2, lang === 'fr' ? 'Nom obligatoire' : 'الاسم مطلوب') : z.string().optional(),
        phone: fields.phone?.required ? z.string().regex(/^(05|06|07)[0-9]{8}$/, lang === 'fr' ? 'Numéro invalide (05/06/07...)' : 'رقم غير صحيح') : z.string().optional(),
        wilaya: fields.wilaya?.required ? z.string().min(1, lang === 'fr' ? 'Sélectionnez une wilaya' : 'اختر ولاية') : z.string().optional(),
        commune: (fields.commune?.visible && fields.commune?.required && config.locationInputMode !== 'single_dropdown')
            ? z.string().min(1, lang === 'fr' ? 'Sélectionnez une commune' : 'اختر بلدية')
            : z.string().optional(),
    });

    // Field visibility logic
    const getVisibleFields = () => {
        const fieldsToCheck = config.fields as Record<string, unknown> || {};
        const entries = Object.entries(fieldsToCheck)
            .filter(([key, field]) => (field as { visible?: boolean })?.visible && key !== 'location_block')
            .sort(([, a], [, b]) => ((a as { order?: number })?.order || 0) - ((b as { order?: number })?.order || 0));

        const result: [string, any][] = [];
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



    // Delivery section visibility
    const showDeliverySection = shipping &&
        !config.hideDeliveryOption &&
        (config.enableHomeDelivery !== false || config.enableDeskDelivery !== false);

    // CTA styles (for sticky)
    const getCtaStyles = (): React.CSSProperties => {
        return buildCtaStyles({
            ctaColor: config.ctaColor,
            accentColor: config.accentColor,
            borderRadius: config.borderRadius,
            ctaVariant: config.ctaVariant,
            ctaAnimation: config.ctaAnimation
        });
    };

    const {
        formErrors,
        setFormErrors,
        isSubmitting,
        submissionError,
        showThankYou,
        setShowThankYou,
        finalOrderData,
        handleFormSubmit,
        logAbandonedOrder,
        handleInputBlur
    } = useFormSubmission({
        config,
        product,
        lang,
        formData,
        previewMode,
        getWilayaRawName,
        offers,
        selectedVariantId,
        calculations,
        basePrice,
        clientIp,
        appliedPromoCode,
        formContainerRef
    });



    // --- RENDER HELPERS ---
    const renderSectionBlock = (sectionId: string, content: React.ReactNode, index: number, ref?: React.RefObject<HTMLDivElement>) => {
        const style = getSectionMarginStyle(index === 0);

        if (sectionWrapper) {
            return (
                <React.Fragment key={sectionId}>
                    {sectionWrapper({
                        sectionId,
                        children: content,
                        style,
                        elementRef: ref
                    })}
                </React.Fragment>
            );
        }

        return (
            <div key={sectionId} style={style} ref={ref}>
                {content}
            </div>
        );
    };

    // --- RENDER ---
    return (
        <div
            className="ff-root w-full font-sans relative flex flex-col select-none overflow-hidden"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            style={{
                ...buildRootStyles(config as any, lang),
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(226, 232, 240, 0.5)',
                borderRadius: '16px'
            }}
        >
            <style>{`
                .custom-input::placeholder {
                    color: ${config.inputPlaceholderColor || '#94a3b8'} !important;
                    opacity: 1;
                }
                .error-ring {
                    border-color: #ef4444 !important;
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
                }
            `}</style>

            {(showThankYou || forceShowThankYou) && (
                <ThankYouPopup
                    config={config}
                    lang={lang}
                    onClose={() => setShowThankYou(false)}
                    fixed={!previewMode}
                    orderData={finalOrderData}
                />
            )}

            {/* Header Section - Rendered OUTSIDE scroll container ONLY for 'hidden' style (floating language switcher) */}
            {config.header?.style === 'hidden' && (() => {
                const headerContent = (
                    <HeaderSection
                        config={config}
                        lang={lang}
                        onLanguageToggle={() => setLang(l => l === 'fr' ? 'ar' : 'fr')}
                        formatCurrency={formatCurrency}
                        basePrice={basePrice}
                        productTitle={productTitle}
                        productImage={productImage}
                    />
                );

                if (sectionWrapper) {
                    return (
                        <React.Fragment key="header-fixed">
                            {sectionWrapper({
                                sectionId: 'header',
                                children: headerContent,
                                style: { zIndex: 60, position: 'relative' },
                            })}
                        </React.Fragment>
                    );
                }
                return headerContent;
            })()}

            <div className="flex-1 overflow-y-auto custom-scroll relative" ref={formContainerRef}>
                {/* Header Section - Rendered INSIDE scroll container for all other styles (Classic, Centered, etc.) */}
                {config.header?.style !== 'hidden' && (() => {
                    const headerContent = (
                        <HeaderSection
                            config={config}
                            lang={lang}
                            onLanguageToggle={() => setLang(l => l === 'fr' ? 'ar' : 'fr')}
                            formatCurrency={formatCurrency}
                            basePrice={basePrice}
                            productTitle={productTitle}
                            productImage={productImage}
                        />
                    );

                    if (sectionWrapper) {
                        return (
                            <React.Fragment key="header-scroll">
                                {sectionWrapper({
                                    sectionId: 'header',
                                    children: headerContent,
                                    style: { zIndex: 40, position: 'relative' },
                                })}
                            </React.Fragment>
                        );
                    }
                    return headerContent;
                })()}

                <div className="p-6 sm:p-7">
                    {(config.sectionOrder || []).map((sectionId: string, index: number) => {
                        // Variants
                        if (sectionId === 'variants') {
                            const hasEffectiveVariants = product?.variants && (
                                product.variants.length > 1 ||
                                (product.variants.length === 1 && product.variants[0].title !== 'Default Title')
                            );

                            if (!previewMode && product && !hasEffectiveVariants) {
                                return null;
                            }

                            return renderSectionBlock(
                                sectionId,
                                <VariantsSection
                                    config={config}
                                    lang={lang}
                                    variants={variants}
                                    options={(product?.options || []).filter((o: any) => o && o.name)}
                                    selectedOptions={selectedOptions}
                                    onOptionSelect={(optName, val) => {
                                        setSelectedOptions(prev => ({
                                            ...prev,
                                            [optName]: val
                                        }));
                                    }}
                                    selectedVariant={formData.variant}
                                    onSelect={(v) => {
                                        const varObj = product.variants?.find((pv: any) => pv.title === v);
                                        if (varObj) {
                                            setSelectedVariantId(varObj.id);
                                            setFormData({ ...formData, variant: v });
                                        } else {
                                            setFormData({ ...formData, variant: v });
                                        }
                                    }}
                                />,
                                index
                            );
                        }

                        // Shipping Form Fields
                        if (sectionId === 'shipping') {
                            return renderSectionBlock(
                                sectionId,
                                <ShippingFormFields
                                    config={config}
                                    lang={lang}
                                    formData={formData}
                                    setFormData={setFormData}
                                    formErrors={formErrors}
                                    setFormErrors={setFormErrors}
                                    wilayasList={wilayasList}
                                    communesList={communesList}
                                    loadingCommunes={loadingCommunes}
                                    getFieldTxt={getFieldTxt}
                                    txt={txt}
                                    sortedFields={sortedFields}
                                    handleInputBlur={handleInputBlur}
                                    isSingleDropdown={isSingleDropdown}
                                    isDoubleDropdown={isDoubleDropdown}
                                    isFreeText={isFreeText}
                                    showLocationSideBySide={showLocationSideBySide}
                                    svxInputClass={svxInputClass}
                                    inputStyle={inputStyle}
                                    inputSpacing={inputSpacing}
                                />,
                                index
                            );
                        }

                        // Delivery Type
                        if (sectionId === 'delivery' && showDeliverySection) {
                            return renderSectionBlock(
                                sectionId,
                                <DeliverySection
                                    config={{ ...config, sectionSettings }}
                                    lang={lang}
                                    shippingType={formData.shippingType}
                                    onSelect={(type) => setFormData({ ...formData, shippingType: type })}
                                    formatCurrency={formatCurrency}
                                    homePrice={calculations.currentRates.home}
                                    deskPrice={calculations.currentRates.desk}
                                    showSection={showDeliverySection}
                                    hasWilaya={!!formData.wilaya}
                                />,
                                index
                            );
                        }

                        // Offers
                        if (sectionId === 'offers' && config.type !== 'store' && offers.length > 0) {
                            return renderSectionBlock(
                                sectionId,
                                <OffersSection
                                    config={config}
                                    lang={lang}
                                    offers={offers as any}
                                    selectedOfferId={formData.offerId}
                                    onSelect={(id) => setFormData({ ...formData, offerId: id })}
                                    formatCurrency={formatCurrency}
                                    basePrice={basePrice}
                                />,
                                index
                            );
                        }

                        // Promo Code
                        if (sectionId === 'promoCode' && config.promoCode?.enabled) {
                            return renderSectionBlock(
                                sectionId,
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
                                />,
                                index
                            );
                        }

                        // Summary
                        if (sectionId === 'summary' && config.enableSummarySection) {
                            return renderSectionBlock(
                                sectionId,
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
                                />,
                                index
                            );
                        }

                        // CTA
                        if (sectionId === 'cta') {
                            return renderSectionBlock(
                                sectionId,
                                <CtaButton
                                    config={config}
                                    text={txt('cta') || (lang === 'fr' ? 'Commander maintenant' : 'اطلب الآن')}
                                    onClick={handleFormSubmit}
                                    isLoading={isSubmitting}
                                />,
                                index,
                                ctaRef
                            );
                        }

                        // Urgency Text
                        if (sectionId === 'urgencyText') {
                            return renderSectionBlock(
                                sectionId,
                                <UrgencyTextSection
                                    config={config}
                                    lang={lang}
                                />,
                                index
                            );
                        }

                        // Urgency Quantity (Stock)
                        if (sectionId === 'urgencyQuantity') {
                            return renderSectionBlock(
                                sectionId,
                                <UrgencyQuantitySection
                                    config={config}
                                    lang={lang}
                                />,
                                index
                            );
                        }

                        // Urgency Timer
                        if (sectionId === 'urgencyTimer') {
                            return renderSectionBlock(
                                sectionId,
                                <UrgencyTimerSection
                                    config={config}
                                    lang={lang}
                                    countdown={countdown}
                                />,
                                index
                            );
                        }

                        // Trust Badges
                        if (sectionId === 'trustBadges' && config.enableTrustBadges) {
                            return renderSectionBlock(
                                sectionId,
                                <TrustBadgesSection
                                    config={config}
                                    lang={lang}
                                />,
                                index
                            );
                        }

                        return null;
                    })}
                </div>
            </div>

            {/* Sticky CTA */}
            <StickyCTA
                variant={config.ctaStickyVariant as any}
                visible={showStickyCTA}
                text={txt('stickyLabel') || txt('cta')}
                onClick={() => ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                ctaStyles={getCtaStyles()}
                formBackground={config.formBackground || '#ffffff'}
                borderColor={config.inputBorderColor || '#e2e8f0'}
                textColor={config.textColor || '#334155'}
                accentColor={config.accentColor}
                productTitle={productTitle}
                productImage={productImage}
                totalPrice={formatCurrency(calculations.displayedTotal)}
                fixed={!previewMode}
            />
        </div >
    );
};

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
import { WILAYAS } from '@/lib/constants';
import { buildCtaStyles, buildInputStyles, buildRootStyles, buildSectionMargin, getFontFamilyCSS } from '@/lib/utils/cssEngine';
import { formatCurrency as formatCurrencyUtil } from '@/lib/utils/formatting';
import { ChevronDown } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { useCountdownTimer } from '@/components/FormTab/preview/hooks/useCountdownTimer';
import { usePreviewCalculations } from '@/components/FormTab/preview/hooks/usePreviewCalculations';
import { usePromoCode } from '@/components/FormTab/preview/hooks/usePromoCode';
import { useStickyObserver } from '@/components/FormTab/preview/hooks/useStickyObserver';

// Types
interface Variant {
    id: number;
    title: string;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    price: number | string;
    featured_image?: { src: string } | null;
}

interface Product {
    id: number;
    title: string;
    images: string[];
    variants: Variant[];
    options: { name: string; values: string[] }[];
    featuredImage?: { url: string };
    featured_image?: string;
}

export const FormLoader = ({ config, product, offers, shipping, sectionWrapper }: { config: any, product: Product, offers: any[], shipping: any, sectionWrapper?: any }) => {
    // --- STATE ---
    const [lang, setLang] = useState<'fr' | 'ar'>(config.header?.defaultLanguage || 'fr');
    // ... (lines 31-177 unchanged)
    const [formData, setFormData] = useState({
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

    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        product?.variants?.[0]?.id || null
    );

    // Track selected options (e.g. { "Size": "Small", "Color": "Red" })
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        const initialOptions: Record<string, string> = {};
        if (product?.options && product.variants?.length > 0) {
            const firstVariant = product.variants[0];
            product.options.forEach((opt, index) => {
                const optKey = `option${index + 1}` as keyof Variant;
                const val = firstVariant[optKey];
                if (typeof val === 'string') {
                    initialOptions[opt.name] = val;
                }
            });
        }
        return initialOptions;
    });

    // Update variant ID when options change
    useEffect(() => {
        if (!product?.variants || !product.options) return;

        const match = product.variants.find(v => {
            return product.options.every((opt, index) => {
                const optKey = `option${index + 1}` as keyof Variant;
                return v[optKey] === selectedOptions[opt.name];
            });
        });

        if (match) {
            setSelectedVariantId(match.id);
            setFormData(prev => ({ ...prev, variant: match.title }));
        }
    }, [selectedOptions, product]);
    const [showThankYou, setShowThankYou] = useState(false);

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
    });

    // --- PRODUCT DATA HELPERS ---
    // Handle both default Shopify REST API (from .js) and Storefront/GraphQL shapes
    const getProductPrice = () => {
        if (!product) return 2500;
        const v = product.variants?.find(v => v.id === selectedVariantId) || product.variants?.[0];
        if (!v) return 2500;

        // Storefront API shape (price is object { amount, currencyCode })
        if (v.price && typeof v.price === 'object' && 'amount' in v.price) {
            return parseFloat(v.price.amount) * 100;
        }
        // REST API shape (price is number in cents)
        if (v.price && typeof v.price === 'number') {
            return v.price;
        }
        // REST API shape (string representation)
        if (v.price && typeof v.price === 'string') {
            return parseFloat(v.price) * 100;
        }
        return 2500;
    };

    const getProductImage = () => {
        if (!product) return undefined;
        // REST API
        if (product.featured_image) return product.featured_image;
        // Storefront API
        if (product.featuredImage?.url) return product.featuredImage.url;
        // Fallback arrays
        if (product.images?.[0]) {
            return typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as any).src;
        }

        // Variant image
        const currentVariant = product.variants?.find(v => v.id === selectedVariantId);
        if (currentVariant?.featured_image?.src) {
            return currentVariant.featured_image.src;
        }

        return undefined;
    };

    const basePrice = getProductPrice();
    const productTitle = product?.title || 'Produit Demo';
    const productImage = getProductImage();

    const calculations = usePreviewCalculations({
        offers: offers as any,
        selectedOfferId: formData.offerId,
        shipping,
        selectedWilaya: formData.wilaya,
        shippingType: formData.shippingType,
        appliedPromoCode,
        hideShippingInSummary: config.hideShippingInSummary || false,
        basePricePerUnit: basePrice,
    });

    // --- EFFECTS ---
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
    const getSectionMarginStyle = (isFirst: boolean = false) => buildSectionMargin(config as any, isFirst);

    // Input styling
    // Input styling
    const inputSpacing = config.inputSpacing || 12;
    // const isFilled = config.inputVariant === 'filled'; // handled by engine
    const svxInputClass = `custom-input w-full px-4 py-3.5 text-[13px] font-semibold outline-none transition-all duration-200 border-2 focus:ring-4`;
    const inputStyle = buildInputStyles(config as any, config.inputVariant || 'filled');

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

    // Variants (Static for now, should come from product)
    const variants = product?.variants?.map((v: any) => v.title) || ['Modèle A', 'Modèle B', 'Modèle C'];

    // Delivery section visibility
    const showDeliverySection = shipping &&
        !config.hideDeliveryOption &&
        (config.enableHomeDelivery !== false || config.enableDeskDelivery !== false);

    // CTA styles (for sticky)
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

    const handleFormSubmit = async () => {
        // Final validation
        if (!selectedVariantId && product?.variants?.length > 0) {
            console.warn("No variant ID selected (should match options)");
        }

        const payload = {
            ...formData,
            variantId: selectedVariantId, // Use the resolved ID
            totalPrice: calculations.displayedTotal,
            currency: 'DZD',
            productId: product.id,
            shopName: window.location.hostname
        };

        console.log('Submitting Order:', payload);

        // Only if we have a valid variant ID
        if (selectedVariantId) {
            try {
                const formBody = new FormData();
                formBody.append('items[0][id]', selectedVariantId.toString());
                formBody.append('items[0][quantity]', '1');

                // Add properties
                Object.entries(payload).forEach(([key, value]) => {
                    if (key !== 'variantId' && key !== 'quantity' && typeof value === 'string') {
                        formBody.append(`items[0][properties][${key}]`, value);
                    }
                });

                await fetch(window.location.origin + '/cart/add.js', {
                    method: 'POST',
                    body: formBody
                });

                window.location.href = '/checkout';

            } catch (err) {
                console.error("Cart add failed", err);
                setShowThankYou(true); // Fallback
            }
        } else {
            setShowThankYou(true);
        }
    };

    // --- RENDER HELPERS ---
    const renderSectionBlock = (sectionId: string, content: React.ReactNode, index: number, ref?: React.RefObject<HTMLDivElement>) => {
        const style = getSectionMarginStyle(index === 0);

        if (sectionWrapper) {
            return sectionWrapper({
                sectionId,
                children: content,
                style,
                elementRef: ref
            });
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
            className="ff-root w-full font-sans relative flex flex-col shadow-2xl select-none"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            style={buildRootStyles(config as any, lang)}
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
                {(() => {
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
                        return sectionWrapper({
                            sectionId: 'header',
                            children: headerContent,
                            style: {}, // Header usually has no margin
                        });
                    }
                    return headerContent;
                })()}

                <div className="p-5">
                    {config.sectionOrder.map((sectionId: string, index: number) => {
                        // Variants
                        if (sectionId === 'variants') {
                            return renderSectionBlock(
                                sectionId,
                                <VariantsSection
                                    config={config}
                                    lang={lang}
                                    variants={variants}
                                    options={product.options}
                                    selectedOptions={selectedOptions}
                                    onOptionSelect={(optName, val) => {
                                        setSelectedOptions(prev => ({
                                            ...prev,
                                            [optName]: val
                                        }));
                                    }}
                                    // Legacy fallback
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
                                                        readOnly={false}
                                                    />
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                </div>,
                                index
                            );
                        }

                        // Delivery Type
                        if (sectionId === 'delivery' && showDeliverySection) {
                            return renderSectionBlock(
                                sectionId,
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
                                />,
                                index
                            );
                        }

                        // Offers
                        if (sectionId === 'offers') {
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
                                    text={txt('cta')}
                                    onClick={handleFormSubmit}
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
                variant={config.ctaStickyVariant}
                visible={showStickyCTA}
                text={txt('cta')}
                onClick={() => ctaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                ctaStyles={getCtaStyles()}
                formBackground={config.formBackground || '#ffffff'}
                borderColor={config.inputBorderColor || '#e2e8f0'}
                textColor={config.textColor || '#334155'}
                accentColor={config.accentColor}
                productTitle={productTitle}
                productImage={productImage}
                totalPrice={formatCurrency(calculations.displayedTotal)}
            />
        </div>
    );
};

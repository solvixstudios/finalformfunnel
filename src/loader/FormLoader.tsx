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
import React, { useEffect, useRef, useState } from 'react';
import { z } from 'zod'; // Import Zod

import { useCountdownTimer } from '@/components/FormTab/preview/hooks/useCountdownTimer';
import { usePreviewCalculations } from '@/components/FormTab/preview/hooks/usePreviewCalculations';
import { usePromoCode } from '@/components/FormTab/preview/hooks/usePromoCode';
import { useStickyObserver } from '@/components/FormTab/preview/hooks/useStickyObserver';
import { submitOrder } from '@/lib/api'; // New API Function
import { Commune, fetchCommunes, fetchWilayas, Wilaya } from '@/lib/location'; // New Location Utility

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

export const FormLoader = ({ config, product, offers, shipping, sectionWrapper, previewMode = false }: { config: any, product: Product, offers: any[], shipping: any, sectionWrapper?: any, previewMode?: boolean }) => {
    // --- STATE ---
    const [lang, setLang] = useState<'fr' | 'ar'>(config.header?.defaultLanguage || 'fr');

    // Location Data
    const [wilayasList, setWilayasList] = useState<Wilaya[]>([]);
    const [communesList, setCommunesList] = useState<Commune[]>([]);
    const [loadingCommunes, setLoadingCommunes] = useState(false);

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

    const [formErrors, setFormErrors] = useState<Record<string, string>>({}); // Error state

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
    const [finalOrderData, setFinalOrderData] = useState<any>(null); // To pass to popup

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

    // --- PRODUCT DATA HELPERS ---
    // Handle both default Shopify REST API (from .js) and Storefront/GraphQL shapes
    const getProductPrice = () => {
        if (!product) return 2500;
        const v = product.variants?.find(v => v.id === selectedVariantId) || product.variants?.[0];
        if (!v) return 2500;

        if (v.price && typeof v.price === 'object' && 'amount' in (v.price as any) && (v.price as any).amount) {
            return parseFloat((v.price as any).amount) * 100;
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

    // Fetch Wilayas on mount
    useEffect(() => {
        fetchWilayas().then(data => setWilayasList(data));
    }, []);

    // Fetch Communes when Wilaya changes
    useEffect(() => {
        if (formData.wilaya) {
            setLoadingCommunes(true);
            fetchCommunes(formData.wilaya).then(data => {
                setCommunesList(data);
                setLoadingCommunes(false);
            });
        } else {
            setCommunesList([]);
        }
    }, [formData.wilaya]);

    // --- HELPERS ---
    const txt = (key: string) => config.translations[key]?.[lang] || config.translations[key]?.fr || '';
    const getFieldTxt = (fieldKey: string) => config.fields[fieldKey]?.placeholder?.[lang] || config.fields[fieldKey]?.placeholder?.fr || '';
    const formatCurrency = (amount: number) => formatCurrencyUtil(amount, lang);
    const fontFamily = getFontFamilyCSS(config.fontFamily?.[lang] || (lang === 'fr' ? 'Inter' : 'Cairo'));

    // Section margin helper
    const getSectionMarginStyle = (isFirst: boolean = false) => buildSectionMargin(config as any, isFirst);

    // Input styling
    const inputSpacing = config.inputSpacing || 12;
    const svxInputClass = `custom-input w-full px-4 py-3.5 text-[13px] font-semibold outline-none transition-all duration-200 border-2 focus:ring-4`;
    const inputStyle = buildInputStyles(config as any, config.inputVariant || 'filled');

    // Validation Schema
    const schema = z.object({
        name: z.string().min(2, lang === 'fr' ? 'Nom obligatoire' : 'الاسم مطلوب'),
        phone: z.string().regex(/^(05|06|07)[0-9]{8}$/, lang === 'fr' ? 'Numéro invalide (05/06/07...)' : 'رقم غير صحيح'),
        wilaya: z.string().min(1, lang === 'fr' ? 'Sélectionnez une wilaya' : 'اختر ولاية'),
        commune: config.fields?.commune?.visible ? z.string().min(1, lang === 'fr' ? 'Sélectionnez une commune' : 'اختر بلدية') : z.string().optional(),
    });

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
        // Validate with Zod
        const result = schema.safeParse(formData);

        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                errors[issue.path[0] as string] = issue.message;
            });
            setFormErrors(errors);

            // Scroll to first error
            const firstErrorField = Object.keys(errors)[0];
            const el = document.querySelector(`[name="${firstErrorField}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            return;
        }
        setFormErrors({});

        // Optimistic UI Data
        const payload = {
            ...formData,
            variantId: selectedVariantId,
            totalPrice: calculations.displayedTotal,
            currency: 'DZD',
            productId: product.id,
            shopName: window.location.hostname,
            items: [{
                title: product.title,
                variant: formData.variant,
                quantity: formData.quantity,
                price: basePrice,
            }]
        };

        setFinalOrderData(payload); // Pass to popup
        setShowThankYou(true); // Optimistic success

        if (!previewMode) {
            try {
                // Background submission
                await submitOrder(payload);
                console.log("Order submitted successfully to n8n");
            } catch (err) {
                console.error("Submission failed silently:", err);
                // We typically don't show error here if optimistic, unless we want to try again
            }
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
            className="ff-root w-full font-sans relative flex flex-col shadow-2xl select-none rounded-2xl overflow-hidden border border-slate-200/50"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
            style={buildRootStyles(config as any, lang)}
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

            {showThankYou && (
                <ThankYouPopup
                    config={config}
                    lang={lang}
                    onClose={() => setShowThankYou(false)}
                    fixed={!previewMode}
                    orderData={finalOrderData}
                />
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
                                    options={product.options}
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
                                                                        name="wilaya"
                                                                        value={formData.wilaya}
                                                                        onChange={(e) => setFormData({ ...formData, wilaya: e.target.value, commune: '' })}
                                                                        className={`${svxInputClass} appearance-none cursor-pointer ${formErrors.wilaya ? 'error-ring' : ''}`}
                                                                        style={{ ...inputStyle, marginBottom: showLocationSideBySide ? 0 : inputSpacing }}
                                                                    >
                                                                        <option value="">{getFieldTxt('wilaya') + (config.fields.wilaya?.required ? ' *' : '')}</option>
                                                                        {wilayasList.map(w => (
                                                                            <option key={w.id} value={w.id}>
                                                                                {lang === 'ar' ? `${w.id} - ${w.ar_name}` : `${w.id} - ${w.name}`}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 pointer-events-none`} color={config.inputPlaceholderColor || '#94a3b8'} size={16} />
                                                                </div>
                                                                {isDoubleDropdown && config.fields.commune?.visible && (
                                                                    <div className="relative">
                                                                        <select
                                                                            name="commune"
                                                                            value={formData.commune}
                                                                            onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                                                                            className={`${svxInputClass} appearance-none cursor-pointer ${formErrors.commune ? 'error-ring' : ''}`}
                                                                            style={{ ...inputStyle, marginBottom: 0 }}
                                                                            disabled={!formData.wilaya || loadingCommunes}
                                                                        >
                                                                            <option value="">{loadingCommunes ? 'Loading...' : getFieldTxt('commune') + (config.fields.commune?.required ? ' *' : '')}</option>
                                                                            {communesList.map(c => (
                                                                                <option key={c.pk} value={c.fields.name}>{c.fields.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        <ChevronDown className={`absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-4 pointer-events-none`} color={config.inputPlaceholderColor || '#94a3b8'} size={16} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {isFreeText && config.fields.address?.visible !== false && (
                                                            <input
                                                                type="text"
                                                                name="address"
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
                                                    <div key={key} className="relative">
                                                        <input
                                                            name={key}
                                                            type={key === 'phone' ? 'tel' : 'text'}
                                                            value={formData[key as keyof typeof formData] as string}
                                                            onChange={(e) => {
                                                                setFormData({ ...formData, [key]: e.target.value });
                                                                if (formErrors[key]) setFormErrors(prev => ({ ...prev, [key]: '' }));
                                                            }}
                                                            placeholder={getFieldTxt(key) + (field.required ? ' *' : '')}
                                                            className={`${svxInputClass} ${formErrors[key] ? 'error-ring' : ''}`}
                                                            style={inputStyle}
                                                        />
                                                        {formErrors[key] && (
                                                            <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{formErrors[key]}</p>
                                                        )}
                                                    </div>
                                                );
                                            }

                                            if (key === 'note') {
                                                return (
                                                    <textarea
                                                        key={key}
                                                        name="note"
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
        </div>
    );
};

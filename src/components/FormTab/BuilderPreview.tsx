import { FormPreview } from './preview/FormPreview';
import { useFormRules, OfferRule, ShippingRule, CouponRule } from '@/hooks/useFormRules';
import { getStoredUser } from '@/lib/authGoogle';
import { useMemo } from 'react';

interface BuilderPreviewProps {
    formConfig: any;
    previewWidth: number | string;
    containerRef?: any;
}

export const BuilderPreview = ({
    formConfig,
    previewWidth,
    containerRef,
}: BuilderPreviewProps) => {
    const user = getStoredUser();
    const userId = user?.id;

    // Fetch rules only when IDs are set
    const { rules: offerRules } = useFormRules(userId, 'offers');
    const { rules: shippingRules } = useFormRules(userId, 'shipping');
    const { rules: couponRules } = useFormRules(userId, 'coupons');

    // Resolve rule IDs to actual data
    const resolvedOffers = useMemo(() => {
        if (formConfig.offerRuleId) {
            const rule = (offerRules as OfferRule[]).find(r => r.id === formConfig.offerRuleId);
            if (rule?.offers) return rule.offers;
        }
        // No rule assigned = no offers (user must assign an offers rule to show offers)
        return [];
    }, [formConfig.offerRuleId, offerRules]);

    const resolvedShipping = useMemo(() => {
        if (formConfig.shippingRuleId) {
            const rule = (shippingRules as ShippingRule[]).find(r => r.id === formConfig.shippingRuleId);
            if (rule?.shipping) return rule.shipping;
        }
        // No rule assigned = free shipping
        return { standard: { home: 0, desk: 0 }, exceptions: [] as any };
    }, [formConfig.shippingRuleId, shippingRules]);

    const resolvedConfig = useMemo(() => {
        let config = { ...formConfig };

        // Inject coupon rule data into config.promoCode
        if (formConfig.couponRuleId) {
            const rule = (couponRules as CouponRule[]).find(r => r.id === formConfig.couponRuleId);
            if (rule?.coupons) {
                config = {
                    ...config,
                    promoCode: {
                        ...config.promoCode,
                        enabled: true,
                        codes: rule.coupons,
                    },
                };
            }
        }

        return config;
    }, [formConfig, couponRules]);

    return (
        <div className="flex h-full">
            {/* Preview Area with Dots Background */}
            <div
                ref={containerRef}
                className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center p-4 lg:p-6 overflow-hidden relative"
                style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            >
                {/* Phone Frame Container - Responsive sizing */}
                <div className="w-full max-w-[320px] lg:max-w-[360px] h-full flex items-center justify-center">
                    <div
                        className="w-full bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl border-[6px] lg:border-[8px] border-slate-900 overflow-hidden relative flex flex-col ring-1 ring-black/10 transition-all duration-300"
                        style={{
                            height: 'min(calc(100% - 1rem), 640px)',
                            maxHeight: 'calc(100vh - 140px)',
                        }}
                    >
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 lg:w-28 h-5 lg:h-6 bg-slate-900 rounded-b-xl lg:rounded-b-2xl z-50"></div>

                        {/* Status Bar Spacer */}
                        <div className="h-5 lg:h-6 shrink-0 bg-white"></div>

                        {/* Form Preview */}
                        <div className="flex-1 overflow-y-auto relative flex flex-col no-scrollbar">
                            <FormPreview config={resolvedConfig} offers={resolvedOffers} shipping={resolvedShipping} />
                        </div>

                        {/* Bottom Indicator */}
                        <div className="h-5 lg:h-6 shrink-0 bg-white flex items-center justify-center">
                            <div className="w-16 lg:w-20 h-1 bg-slate-200 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

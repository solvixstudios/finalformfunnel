import React, { useState } from 'react';
import { PRICING_PLANS } from '@/data/plans';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CheckCircle2, Info, Loader2, CreditCard, ChevronRight, Clock, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import type { BillingCycle, PaymentMethod, PricingPlan, PlanFeatures } from '@/types/subscription';
import { toast } from 'sonner';

interface SubscriptionTabProps {
    user: any;
}

const featureLabels: Record<keyof PlanFeatures, { label: string; tooltip: string }> = {
    activeFunnels: { label: 'Active Funnels', tooltip: 'Number of active funnels you can run simultaneously.' },
    metaPixels: { label: 'Meta Pixels', tooltip: 'Number of Facebook/Meta pixels you can integrate.' },
    tiktokPixels: { label: 'TikTok Pixels', tooltip: 'Number of TikTok pixels you can integrate.' },
    googleSheets: { label: 'Google Sheets', tooltip: 'Number of Google Sheets integrations.' },
    storeConnections: { label: 'Store Connections', tooltip: 'Number of Shopify/WooCommerce stores you can connect.' },
    brandingRemoved: { label: 'Remove Branding', tooltip: 'FinalForm branding will be removed from your forms.' },
    integrationSupport: { label: 'Priority Support', tooltip: 'Priority support for setting up your integrations.' },
};

export default function SubscriptionTab({ user }: SubscriptionTabProps) {
    const sub = useSubscription(user.id, user.email, user.displayName);
    const [currency, setCurrency] = useState<'USD' | 'DZD'>('DZD');
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [selectedPlanId, setSelectedPlanId] = useState<string>('free');
    
    const [showPaymentFlow, setShowPaymentFlow] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
    const [transactionId, setTransactionId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (sub.isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#FF5A1F]" />
            </div>
        );
    }

    const selectedPlan = PRICING_PLANS.find(p => p.id === selectedPlanId) || PRICING_PLANS[0];
    
    const getPrice = (plan: PricingPlan) => {
        const amount = plan.price[currency.toLowerCase() as 'usd' | 'dzd'][billingCycle];
        return billingCycle === 'annual' ? amount * 12 : amount;
    };

    const formatPrice = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handlePlanSelect = (planId: string) => {
        setSelectedPlanId(planId);
        if (planId === 'free') {
            setShowPaymentFlow(false);
            setPaymentMethod('');
        }
    };

    const calculateEndDate = () => {
        const date = new Date();
        if (billingCycle === 'annual') {
            date.setFullYear(date.getFullYear() + 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleProceedToPayment = () => {
        if (selectedPlanId === 'free') {
            toast.info("You're already on the Free plan.");
            return;
        }
        setShowPaymentFlow(true);
    };

    const handleSubmitRequest = async () => {
        if (!paymentMethod) {
            toast.error("Please select a payment method");
            return;
        }
        if (paymentMethod !== 'whatsapp' && !transactionId) {
            toast.error("Please enter the transaction ID");
            return;
        }

        setIsSubmitting(true);
        try {
            await sub.submitPlanRequest(
                selectedPlanId,
                billingCycle,
                currency,
                paymentMethod,
                transactionId ? { transactionId } : undefined
            );
            toast.success("Upgrade request submitted!", {
                description: "Our team will review and activate your plan shortly."
            });
            setShowPaymentFlow(false);
            setTransactionId('');
            setPaymentMethod('');
        } catch (error: any) {
            toast.error("Failed to submit request", { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderFeatureValue = (key: string, value: any) => {
        if (typeof value === 'boolean') {
            return value ? <CheckCircle2 size={16} className="text-[#137333]" /> : <span className="text-[#A69D8A]">-</span>;
        }
        if (value === -1) return 'Unlimited';
        return value;
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-fade-in w-full items-start">
            {/* Left Content: Plans & Payment Flow */}
            <div className="flex-1 min-w-0 space-y-6">
                
                {sub.pendingRequest && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <Clock className="text-amber-600 mt-0.5 shrink-0" size={18} />
                        <div>
                            <h4 className="text-sm font-bold text-amber-800">Pending Upgrade Request</h4>
                            <p className="text-xs text-amber-700 mt-1 mt-1">
                                Your request for the <span className="font-bold capitalize">{sub.pendingRequest.planId}</span> plan is currently under review. 
                                We'll activate it as soon as we verify the payment.
                            </p>
                        </div>
                    </div>
                )}

                {/* Toggles */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-[#E2DCCF] shadow-sm">
                    <div className="flex items-center gap-1 p-0.5 bg-[#F2EFE8] rounded-lg border border-[#E6E0D3] w-max">
                        <button
                            onClick={() => setCurrency('DZD')}
                            className={cn(
                                "px-4 py-1.5 text-[13px] font-bold rounded-md transition-all",
                                currency === 'DZD' ? "bg-white text-[#4A443A] shadow-sm border border-[#E2DCCF]" : "text-[#908878] hover:text-[#4A443A]"
                            )}
                        >
                            DZD (Algeria)
                        </button>
                        <button
                            onClick={() => setCurrency('USD')}
                            className={cn(
                                "px-4 py-1.5 text-[13px] font-bold rounded-md transition-all",
                                currency === 'USD' ? "bg-white text-[#4A443A] shadow-sm border border-[#E2DCCF]" : "text-[#908878] hover:text-[#4A443A]"
                            )}
                        >
                            USD (Global)
                        </button>
                    </div>

                    <div className="flex items-center gap-1 p-0.5 bg-[#F2EFE8] rounded-lg border border-[#E6E0D3] w-max">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={cn(
                                "px-4 py-1.5 text-[13px] font-bold rounded-md transition-all",
                                billingCycle === 'monthly' ? "bg-white text-[#FF5A1F] shadow-sm border border-[#E2DCCF]" : "text-[#908878] hover:text-[#4A443A]"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('annual')}
                            className={cn(
                                "px-4 py-1.5 text-[13px] font-bold rounded-md transition-all relative",
                                billingCycle === 'annual' ? "bg-white text-[#FF5A1F] shadow-sm border border-[#E2DCCF]" : "text-[#908878] hover:text-[#4A443A]"
                            )}
                        >
                            Annually
                            <span className="absolute -top-2 -right-2 bg-[#137333] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                                SAVE
                            </span>
                        </button>
                    </div>
                </div>

                {!showPaymentFlow ? (
                    /* Plans Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {PRICING_PLANS.map((plan) => {
                            const isCurrent = sub.currentPlan?.id === plan.id;
                            const isSelected = selectedPlanId === plan.id;
                            const price = getPrice(plan);

                            return (
                                <Card 
                                    key={plan.id} 
                                    onClick={() => handlePlanSelect(plan.id)}
                                    className={cn(
                                        "relative cursor-pointer transition-all duration-300 hover:shadow-md border-2",
                                        isSelected ? "border-[#FF5A1F] shadow-md ring-2 ring-[#FF5A1F]/20" : "border-[#E2DCCF] hover:border-[#D1C9B8]",
                                        plan.id === 'pro' && !isSelected ? "border-slate-300 bg-slate-50 border-dashed" : "bg-white"
                                    )}
                                >
                                    {isCurrent && (
                                        <div className="absolute top-0 right-0 bg-[#E6F4EA] text-[#137333] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg rounded-tr-lg border-b border-l border-[#137333]/20">
                                            Current Plan
                                        </div>
                                    )}
                                    {plan.id === 'pro' && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4A443A] text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-sm">
                                            Most Popular
                                        </div>
                                    )}

                                    <CardContent className="p-6">
                                        <div className="mb-4">
                                            <h3 className="text-xl font-black text-[#4A443A] capitalize">{plan.name}</h3>
                                            <p className="text-[11px] text-[#A69D8A] font-medium mt-1">
                                                {plan.id === 'free' ? 'Perfect for trying things out' : `Best for ${plan.name} users`}
                                            </p>
                                        </div>
                                        
                                        <div className="mb-6 flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-[#4A443A]">
                                                {plan.id === 'free' ? 'Free' : formatPrice(price)}
                                            </span>
                                            {plan.id !== 'free' && (
                                                <span className="text-xs text-[#908878] font-semibold">
                                                    /{billingCycle === 'annual' ? 'yr' : 'mo'}
                                                </span>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm py-2 border-b border-[#F2EFE8]">
                                                <span className="text-[#4A443A] font-semibold flex items-center gap-1 cursor-help group relative">
                                                    Monthly Orders
                                                    <Info size={14} className="text-[#C0B9A8]" />
                                                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#4A443A] text-white text-[11px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                                        Number of orders you can process per month.
                                                    </div>
                                                </span>
                                                <span className="font-black text-[#FF5A1F]">
                                                    {plan.monthlyOrders === -1 ? 'Unlimited' : plan.monthlyOrders.toLocaleString()}
                                                </span>
                                            </div>

                                            {Object.entries(plan.features).map(([key, value]) => {
                                                const featureDef = featureLabels[key as keyof PlanFeatures];
                                                if (!featureDef) return null;

                                                return (
                                                    <div key={key} className="flex flex-col">
                                                        <div className="flex items-center justify-between text-[13px]">
                                                            <span className="text-[#7A7365] flex items-center gap-1.5 cursor-help group relative">
                                                                <div className="w-4 h-4 rounded-full bg-[#F2EFE8] flex items-center justify-center shrink-0">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#C0B9A8] group-hover:bg-[#FF5A1F] transition-colors" />
                                                                </div>
                                                                {featureDef.label}
                                                                <Info size={12} className="text-[#D1C9B8] group-hover:text-[#908878] transition-colors" />
                                                                
                                                                <div className="absolute bottom-full left-4 mb-1 w-48 bg-white border border-[#E2DCCF] text-[#4A443A] font-medium text-[11px] p-2.5 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 translate-y-2 group-hover:translate-y-0">
                                                                    {featureDef.tooltip}
                                                                </div>
                                                            </span>
                                                            <span className="font-bold text-[#4A443A]">
                                                                {renderFeatureValue(key, value)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    /* Payment Flow Step */
                    <Card className="rounded-2xl border-[#E2DCCF] shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <button 
                                    onClick={() => setShowPaymentFlow(false)}
                                    className="p-1.5 rounded-md text-[#908878] hover:text-[#4A443A] hover:bg-[#F2EFE8] transition-colors"
                                >
                                    <ChevronRight size={18} className="rotate-180" />
                                </button>
                                <div>
                                    <h3 className="text-xl font-black text-[#4A443A]">Payment Details</h3>
                                    <p className="text-sm text-[#908878] font-medium">Choose how you'd like to pay for your upgrade.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                                {[
                                    { id: 'ccp', label: 'CCP / BaridiMob', icon: CreditCard },
                                    { id: 'redotpay', label: 'Redotpay', icon: CreditCard },
                                    { id: 'whatsapp', label: 'Manual Request', icon: Mail },
                                ].map((method) => {
                                    const Icon = method.icon;
                                    const isSelected = paymentMethod === method.id;
                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                                            className={cn(
                                                "p-4 rounded-xl border-2 text-left transition-all",
                                                isSelected 
                                                    ? "border-[#FF5A1F] bg-[#FF5A1F]/5 ring-2 ring-[#FF5A1F]/20" 
                                                    : "border-[#E2DCCF] hover:border-[#D1C9B8] bg-white"
                                            )}
                                        >
                                            <Icon size={20} className={isSelected ? "text-[#FF5A1F] mb-3" : "text-[#A69D8A] mb-3"} />
                                            <p className={cn("text-sm font-bold", isSelected ? "text-[#FF5A1F]" : "text-[#4A443A]")}>
                                                {method.label}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>

                            {paymentMethod === 'redotpay' && (
                                <div className="bg-[#FAF9F6] border border-[#E2DCCF] rounded-xl p-5 mb-6 animate-fade-in space-y-4">
                                    <h4 className="text-sm font-bold text-[#4A443A] flex items-center gap-2">
                                        <ShieldCheck size={16} className="text-[#137333]" />
                                        Pay securely via Redotpay
                                    </h4>
                                    <p className="text-sm text-[#7A7365]">
                                        Please send <span className="font-black text-[#FF5A1F]">{formatPrice(getPrice(selectedPlan))}</span> to the following Redotpay account:
                                    </p>
                                    <div className="bg-white p-3 rounded-lg border border-[#E2DCCF] flex items-center justify-between">
                                        <code className="text-[13px] font-black text-[#4A443A]">solvixalgerie@gmail.com</code>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 text-xs font-bold text-[#FF5A1F] hover:text-[#E04D1A] hover:bg-[#FF5A1F]/10"
                                            onClick={() => {
                                                navigator.clipboard.writeText('solvixalgerie@gmail.com');
                                                toast.success('Copied to clipboard');
                                            }}
                                        >
                                            Copy
                                        </Button>
                                    </div>
                                    <div className="space-y-2 pt-2 border-t border-[#E2DCCF]">
                                        <label className="text-[12px] font-bold text-[#4A443A]">Transaction ID</label>
                                        <Input 
                                            placeholder="Enter your Redotpay transaction ID" 
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            className="border-[#E2DCCF] focus-visible:ring-[#FF5A1F]"
                                        />
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'ccp' && (
                                <div className="bg-[#FAF9F6] border border-[#E2DCCF] rounded-xl p-5 mb-6 animate-fade-in space-y-4">
                                     <h4 className="text-sm font-bold text-[#4A443A]">Algerie Poste (CCP / BaridiMob)</h4>
                                     <p className="text-sm text-[#7A7365]">
                                        Transfer <span className="font-black text-[#FF5A1F]">{formatPrice(getPrice(selectedPlan))}</span> to:
                                        <br/>CCP: <span className="font-bold text-[#4A443A]">0000 0000 00000</span>
                                        <br/>RIP: <span className="font-bold text-[#4A443A]">007 99999 0000000000 00</span>
                                        <br/>Name: <span className="font-bold text-[#4A443A]">Company Name</span>
                                    </p>
                                    <div className="space-y-2 pt-2 border-t border-[#E2DCCF]">
                                        <label className="text-[12px] font-bold text-[#4A443A]">Transaction Reference</label>
                                        <Input 
                                            placeholder="Enter BaridiMob ref or CCP receipt number" 
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            className="border-[#E2DCCF] focus-visible:ring-[#FF5A1F]"
                                        />
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'whatsapp' && (
                                <div className="bg-[#FAF9F6] border border-[#E2DCCF] rounded-xl p-5 mb-6 animate-fade-in space-y-4 text-center">
                                    <p className="text-sm text-[#7A7365]">
                                        Submit your request and our team will contact you. Or you can contact us directly on WhatsApp to arrange payment.
                                    </p>
                                    <a href="https://wa.me/213000000000" target="_blank" rel="noreferrer" className="inline-block text-[#137333] font-black text-sm hover:underline">
                                        Chat with us on WhatsApp
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

            </div>

            {/* Right Sticky Sidebar: Summary */}
            <div className="w-full lg:w-[320px] xl:w-[380px] shrink-0 sticky top-6">
                <Card className="rounded-2xl border-[#E2DCCF] shadow-xl bg-white sticky top-20">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-black text-[#4A443A] mb-4">Summary</h3>
                        
                        <div className="bg-[#FAF9F6] border border-[#E2DCCF] rounded-xl p-4 space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-[#908878] font-medium">Selected Plan</span>
                                <span className="font-bold text-[#4A443A] capitalize">{selectedPlan.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#908878] font-medium">Billing Cycle</span>
                                <span className="font-bold text-[#4A443A] capitalize">{billingCycle}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-3 border-t border-[#E2DCCF]">
                                <span className="text-[#908878] font-medium">Start Date</span>
                                <span className="font-bold text-[#4A443A]">Today</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-[#908878] font-medium">End Date</span>
                                <span className="font-bold text-[#4A443A]">{calculateEndDate()}</span>
                            </div>
                        </div>

                        <div className="flex items-end justify-between mb-6 pb-6 border-b border-[#E2DCCF]">
                            <div>
                                <p className="text-[11px] font-bold text-[#A69D8A] uppercase tracking-widest mb-1">Total Due</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-[#FF5A1F]">
                                        {formatPrice(getPrice(selectedPlan))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {!showPaymentFlow ? (
                            <Button 
                                className="w-full bg-[#4A443A] hover:bg-[#3A352C] text-white font-bold h-12 rounded-xl shadow-lg shadow-[#4A443A]/20 transition-all flex items-center justify-center gap-2 group"
                                onClick={handleProceedToPayment}
                                disabled={selectedPlanId === 'free'}
                            >
                                {selectedPlanId === 'free' ? 'Current Plan' : 'Proceed to Payment'}
                                {selectedPlanId !== 'free' && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        ) : (
                            <Button 
                                className="w-full bg-[#137333] hover:bg-[#0F5C29] text-white font-bold h-12 rounded-xl shadow-lg shadow-[#137333]/20 transition-all flex items-center justify-center gap-2 group"
                                onClick={handleSubmitRequest}
                                disabled={isSubmitting || !paymentMethod || (paymentMethod !== 'whatsapp' && !transactionId)}
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Payment'}
                                {!isSubmitting && <CheckCircle2 size={18} />}
                            </Button>
                        )}
                        
                        <p className="text-center text-[11px] text-[#A69D8A] mt-4 flex items-center justify-center gap-1.5 font-medium">
                            <ShieldCheck size={14} className="text-[#137333]" /> Secure Offline Payment
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

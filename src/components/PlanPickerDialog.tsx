/**
 * PlanPickerDialog — Full-screen subscription wizard.
 * Steps: plan → configure & payment → proof → success
 * Dashboard-native colors, improved stepper, vertical plan cards in one row.
 */

import { cn } from '@/lib/utils';
import type { BillingCycle, PaymentMethod, PaymentProof } from '@/types/subscription';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Globe,
  ImagePlus,
  Info,
  Loader2,
  Send,
  Sparkles,
  X,
  Wallet,
  CreditCard,
  Zap,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { usePaymentConfig, usePlans } from '@/hooks/usePaymentConfig';

type Step = 'plan' | 'configure' | 'proof' | 'success';

interface PlanPickerDialogProps {
  open: boolean;
  onClose: () => void;
  currentPlanId: string;
  subscriptionStatus?: 'active' | 'pending' | 'expired' | 'cancelled' | null;
  ordersThisMonth?: number;
  monthlyOrderLimit?: number;
  onSubmitPlanRequest: (
    planId: string,
    billingCycle: BillingCycle,
    currency: 'USD' | 'DZD',
    paymentMethod?: PaymentMethod,
    paymentProof?: PaymentProof,
  ) => Promise<void>;
}

const STEPS: Step[] = ['plan', 'configure', 'proof', 'success'];
const STEP_LABELS: Record<Step, string> = {
  plan: 'Select Plan',
  configure: 'Configure & Pay',
  proof: 'Payment Proof',
  success: 'Done',
};

const PlanPickerDialog = ({
  open,
  onClose,
  currentPlanId,
  onSubmitPlanRequest,
}: PlanPickerDialogProps) => {
  const [step, setStep] = useState<Step>('plan');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'DZD'>('DZD');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { config: paymentConfig } = usePaymentConfig();
  const { plans } = usePlans();

  if (!open) return null;

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const paidPlans = plans.filter((p) => p.id !== 'free');
  const stepIdx = STEPS.indexOf(step);

  /* ── Price helpers ── */
  const getMonthlyRate = () => {
    if (!selectedPlan) return 0;
    const p = currency === 'USD' ? selectedPlan.price.usd : selectedPlan.price.dzd;
    return billingCycle === 'monthly' ? p.monthly : p.annual;
  };
  const getTotal = () => {
    const r = getMonthlyRate();
    return billingCycle === 'annual' ? r * 12 : r;
  };
  const endDate = () => {
    const d = new Date();
    billingCycle === 'annual' ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  /* ── Handlers ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setScreenshotFile(file); setScreenshotPreview(URL.createObjectURL(file)); }
  };

  const sendAdminNotification = async () => {
    try {
      // Send notification via Web3Forms
      const adminEmail = 'solvixalgerie@gmail.com'; // Replace with your admin email if needed
      await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
          subject: `🔔 New Subscription Request — ${selectedPlan?.name} Plan`,
          from_name: 'FinalForm Subscriptions',
          to: adminEmail,
          message: `
            New Subscription Request
            Plan: ${selectedPlan?.name}
            Amount: ${getTotal().toLocaleString()} ${currency}
            Billing: ${billingCycle === 'monthly' ? 'Monthly' : 'Annual'}
            Payment Method: ${paymentMethod}
            Transaction ID: ${transactionId || 'N/A'}
            
            Please review in the Admin Dashboard.
          `,
        }),
      });
    } catch {
      // Silently fail — email notification is best-effort
      console.warn('Admin email notification could not be sent.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlanId || !paymentMethod) return;
    setIsSubmitting(true);
    try {
      const proof: PaymentProof = {};
      if (transactionId) proof.transactionId = transactionId;
      if (screenshotFile) proof.screenshotUrl = `screenshot_${Date.now()}_${screenshotFile.name}`;
      await onSubmitPlanRequest(selectedPlanId, billingCycle, currency, paymentMethod, proof);
      // Send admin email notification (best-effort, non-blocking)
      sendAdminNotification();
      setStep('success');
    } catch (error: any) {
      toast.error('Submission failed', { description: error.message || 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => { setStep('plan'); setSelectedPlanId(null); setPaymentMethod(null); setTransactionId(''); setScreenshotFile(null); setScreenshotPreview(''); };
  const close = () => { reset(); onClose(); };
  const canProceed = () => {
    switch (step) {
      case 'plan': return !!selectedPlanId;
      case 'configure': return !!paymentMethod;
      case 'proof': return !!(transactionId || screenshotFile);
      default: return true;
    }
  };
  const goNext = () => { const i = STEPS.indexOf(step); if (i < STEPS.length - 1) setStep(STEPS[i + 1]); };
  const goBack = () => { const i = STEPS.indexOf(step); if (i > 0) setStep(STEPS[i - 1]); };
  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success('Copied!', { duration: 1500 }); };

  /* ── All payment methods — incompatible ones disabled ── */
  const usdMethods: PaymentMethod[] = ['redotpay', 'usdt'];
  const dzdMethods: PaymentMethod[] = ['ccp', 'baridi_pay'];
  const allMethods: { id: PaymentMethod; label: string; desc: string; icon: React.ReactNode; recommended?: boolean; compatible: boolean }[] = [];
  if (paymentConfig.redotpay?.enabled) allMethods.push({ id: 'redotpay', label: 'RedotPay', desc: 'Instant via RedotPay app', icon: <Globe size={16} className="text-emerald-500" />, recommended: currency === 'USD', compatible: usdMethods.includes('redotpay') ? currency === 'USD' : false });
  if (paymentConfig.usdt?.enabled) allMethods.push({ id: 'usdt', label: 'USDT (Binance)', desc: `${paymentConfig.usdt?.network || 'TRC20'} network`, icon: <Wallet size={16} className="text-amber-500" />, compatible: currency === 'USD' });
  if (paymentConfig.ccp?.enabled) allMethods.push({ id: 'ccp', label: 'CCP', desc: 'Algérie Poste transfer', icon: <CreditCard size={16} className="text-blue-500" />, compatible: currency === 'DZD' });
  if (paymentConfig.baridiPay?.enabled) allMethods.push({ id: 'baridi_pay', label: 'BaridiMob', desc: 'Instant RIP transfer', icon: <CreditCard size={16} className="text-violet-500" />, recommended: currency === 'DZD', compatible: currency === 'DZD' });
  // Auto-reset if selected method is no longer compatible
  if (paymentMethod && !allMethods.find((m) => m.id === paymentMethod)?.compatible) setPaymentMethod(null);
  // For proof step — only compatible methods
  const methods = allMethods.filter((m) => m.compatible);

  /* ─────────────────────────── JSX ─────────────────────────── */
  const dialog = (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#FAF9F6] font-sans animate-in fade-in duration-200">

      {/* ═══ TOPBAR ═══ */}
      <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-[#E2DCCF] bg-white z-50">
        {/* Left */}
        <div className="flex items-center gap-3">
          {stepIdx > 0 && step !== 'success' ? (
            <button onClick={goBack} className="flex items-center gap-1.5 text-[11px] font-bold text-[#908878] hover:text-[#4A443A] transition-colors rounded-lg px-2.5 py-1.5 hover:bg-[#F2EFE8]">
              <ArrowLeft size={13} /> Back
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FF5A1F]/10 flex items-center justify-center">
                <Crown className="w-3.5 h-3.5 text-[#FF5A1F]" />
              </div>
              <span className="text-[13px] font-black text-[#4A443A] tracking-tight hidden sm:block">Upgrade Plan</span>
            </div>
          )}
        </div>

        {/* Center: Improved Stepper */}
        <nav className="hidden md:flex items-center gap-0">
          {STEPS.filter((s) => s !== 'success').map((s, i) => {
            const isActive = i === stepIdx;
            const isDone = i < stepIdx;
            return (
              <div key={s} className="flex items-center">
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all',
                  isActive && 'bg-[#4A443A] text-white',
                  isDone && 'text-[#137333]',
                  !isActive && !isDone && 'text-[#A69D8A]',
                )}>
                  {isDone ? (
                    <div className="w-4 h-4 rounded-full bg-[#137333] flex items-center justify-center">
                      <Check size={10} strokeWidth={3} className="text-white" />
                    </div>
                  ) : (
                    <div className={cn(
                      'w-4 h-4 rounded-full border flex items-center justify-center text-[8px] font-black',
                      isActive ? 'bg-white text-[#4A443A] border-white' : 'border-[#D4CFC5] text-[#A69D8A]',
                    )}>
                      {i + 1}
                    </div>
                  )}
                  <span className="text-[11px] font-bold hidden lg:block">{STEP_LABELS[s]}</span>
                </div>
                {i < 2 && (
                  <div className={cn('w-8 h-px mx-0.5', isDone ? 'bg-[#137333]/30' : 'bg-[#E2DCCF]')} />
                )}
              </div>
            );
          })}
        </nav>

        {/* Mobile stepper */}
        <div className="flex md:hidden items-center gap-1.5">
          {STEPS.filter((s) => s !== 'success').map((_, i) => (
            <div key={i} className={cn(
              'h-1 rounded-full transition-all',
              i === stepIdx ? 'w-5 bg-[#FF5A1F]' : i < stepIdx ? 'w-2 bg-[#FF5A1F]/40' : 'w-2 bg-[#E2DCCF]',
            )} />
          ))}
        </div>

        {/* Right */}
        <button onClick={close} className="p-2 rounded-lg text-[#908878] hover:text-[#4A443A] hover:bg-[#F2EFE8] transition-colors">
          <X size={16} />
        </button>
      </header>

      {/* ═══ BODY ═══ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto custom-scroll-thin">

          {/* ─── STEP 1 : SELECT PLAN ─── */}
          {step === 'plan' && (
            <div className="h-full flex flex-col px-4 sm:px-6 py-5">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 shrink-0">
                <p className="text-[13px] font-bold text-[#4A443A]">Select your plan</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex bg-[#F2EFE8] rounded-lg p-0.5 border border-[#E2DCCF]">
                    {(['DZD', 'USD'] as const).map((c) => (
                      <button key={c} onClick={() => setCurrency(c)} className={cn(
                        'px-3 py-1 rounded-md text-[10px] font-bold transition-all',
                        currency === c ? 'bg-white text-[#4A443A] shadow-sm border border-[#E2DCCF]' : 'text-[#908878] hover:text-[#4A443A]',
                      )}>{c}</button>
                    ))}
                  </div>
                  <div className="flex bg-[#F2EFE8] rounded-lg p-0.5 border border-[#E2DCCF]">
                    <button onClick={() => setBillingCycle('monthly')} className={cn(
                      'px-3 py-1 rounded-md text-[10px] font-bold transition-all',
                      billingCycle === 'monthly' ? 'bg-white text-[#4A443A] shadow-sm border border-[#E2DCCF]' : 'text-[#908878] hover:text-[#4A443A]',
                    )}>Monthly</button>
                    <button onClick={() => setBillingCycle('annual')} className={cn(
                      'px-3 py-1 rounded-md text-[10px] font-bold transition-all',
                      billingCycle === 'annual' ? 'bg-white text-[#FF5A1F] shadow-sm border border-[#E2DCCF]' : 'text-[#908878] hover:text-[#4A443A]',
                    )}>
                      Annual <span className="text-[8px] font-black text-[#137333] ml-1">-25%</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Vertical plan cards in one row */}
              <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch min-h-0">
                {paidPlans.map((plan) => {
                  const priceObj = currency === 'USD' ? plan.price.usd : plan.price.dzd;
                  const rate = billingCycle === 'monthly' ? priceObj.monthly : priceObj.annual;
                  const isCurrent = currentPlanId === plan.id;
                  const isPopular = plan.id === 'pro';
                  const isSelected = selectedPlanId === plan.id;
                  const features = [
                    { k: 'Funnels', v: plan.features.activeFunnels },
                    { k: 'Pixels', v: plan.features.metaPixels },
                    { k: 'Stores', v: plan.features.storeConnections },
                    { k: 'Sheets', v: plan.features.googleSheets },
                  ];

                  return (
                    <div
                      key={plan.id}
                      onClick={() => !isCurrent && setSelectedPlanId(plan.id)}
                      className={cn(
                        'flex-1 relative rounded-xl border bg-white p-4 sm:p-5 flex flex-col cursor-pointer transition-all duration-200 group min-w-0',
                        isCurrent && 'opacity-50 cursor-default',
                        isSelected && !isCurrent && 'border-[#FF5A1F] ring-2 ring-[#FF5A1F]/15 shadow-md',
                        isPopular && !isCurrent && !isSelected && 'border-[#FF5A1F]/40 shadow-sm',
                        !isPopular && !isCurrent && !isSelected && 'border-[#E2DCCF] hover:border-[#D4CFC5] hover:shadow-sm',
                      )}
                    >
                      {isPopular && (
                        <div className="absolute -top-2 left-4 px-2 py-0.5 rounded-full bg-[#FF5A1F] text-white text-[8px] font-black uppercase tracking-widest">
                          Popular
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-[14px] font-black text-[#4A443A] leading-tight">{plan.name}</h4>
                          <span className="text-[9px] font-bold text-[#908878] uppercase tracking-wider mt-0.5 inline-flex items-center gap-1">
                            <Zap size={8} className="text-[#FF5A1F]" />
                            {plan.monthlyOrders === -1 ? '∞' : plan.monthlyOrders.toLocaleString()} orders/mo
                          </span>
                        </div>
                        {isSelected && !isCurrent && (
                          <div className="w-5 h-5 rounded-full bg-[#FF5A1F] flex items-center justify-center shrink-0">
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1 mb-4 pb-3 border-b border-[#F2EFE8]">
                        <span className="text-[28px] sm:text-[32px] font-black tracking-tighter text-[#4A443A] leading-none">{rate.toLocaleString()}</span>
                        <div className="flex flex-col pb-0.5">
                          <span className="text-[11px] font-bold text-[#A69D8A] leading-none">{currency}</span>
                          <span className="text-[8px] font-black text-[#A69D8A] uppercase tracking-wider">/mo</span>
                        </div>
                      </div>

                      <ul className="space-y-2 mb-4 flex-1">
                        {features.map((f) => (
                          <li key={f.k} className="flex items-center gap-1.5 text-[11px] text-[#7A7365]">
                            <CheckCircle2 size={12} className="text-[#137333] shrink-0" />
                            <span className="font-black text-[#4A443A]">{f.v === -1 ? '∞' : f.v}</span> {f.k}
                          </li>
                        ))}
                        {plan.features.brandingRemoved && (
                          <li className="flex items-center gap-1.5 text-[11px] text-[#7A7365]">
                            <CheckCircle2 size={12} className="text-[#137333] shrink-0" /> No branding
                          </li>
                        )}
                      </ul>

                      {isCurrent ? (
                        <div className="h-8 rounded-lg bg-[#E6F4EA] text-[#137333] border border-[#137333]/20 text-[10px] font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 size={11} /> Current
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedPlanId(plan.id); goNext(); }}
                          className={cn(
                            'h-8 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all w-full',
                            isSelected
                              ? 'bg-[#4A443A] text-white hover:bg-[#2A2620]'
                              : 'bg-[#F2EFE8] text-[#4A443A] hover:bg-[#4A443A]/10 hover:text-[#4A443A] border border-[#E2DCCF]',
                          )}
                        >
                          Select <ArrowRight size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── STEP 2 : CONFIGURE + PAYMENT (Merged) ─── */}
          {step === 'configure' && selectedPlan && (
            <div className="min-h-full flex items-start sm:items-center justify-center px-4 sm:px-6 py-5 sm:py-8">
              <div className="w-full max-w-2xl space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF5A1F]/10 flex items-center justify-center">
                    <Sparkles size={16} className="text-[#FF5A1F]" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black text-[#4A443A]">Configure & choose payment</h4>
                    <p className="text-[11px] text-[#908878] font-medium">Set your preferences and select how to pay.</p>
                  </div>
                </div>

                {/* Config section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Currency */}
                  <div className="bg-white rounded-xl border border-[#E2DCCF] p-3.5">
                    <p className="text-[9px] font-black text-[#A69D8A] uppercase tracking-widest mb-2">Currency</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['DZD', 'USD'] as const).map((c) => (
                        <button key={c} onClick={() => setCurrency(c)} className={cn(
                          'rounded-lg border py-2 text-center transition-all',
                          currency === c ? 'border-[#FF5A1F] bg-[#FF5A1F]/5 text-[#4A443A]' : 'border-[#E2DCCF] text-[#908878] hover:border-[#D4CFC5]',
                        )}>
                          <span className="text-[14px] font-black block">{c}</span>
                          <span className="text-[8px] font-bold text-[#A69D8A]">{c === 'DZD' ? 'Dinar' : 'Dollar'}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plan */}
                  <div className="bg-white rounded-xl border border-[#E2DCCF] p-3.5">
                    <p className="text-[9px] font-black text-[#A69D8A] uppercase tracking-widest mb-2">Plan</p>
                    <select value={selectedPlanId || ''} onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full text-[13px] font-bold text-[#4A443A] bg-[#FAF9F6] border border-[#E2DCCF] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#FF5A1F]/20">
                      {paidPlans.map((p) => <option key={p.id} value={p.id} disabled={p.id === currentPlanId}>{p.name}</option>)}
                    </select>
                  </div>

                  {/* Billing */}
                  <div className="bg-white rounded-xl border border-[#E2DCCF] p-3.5">
                    <p className="text-[9px] font-black text-[#A69D8A] uppercase tracking-widest mb-2">
                      Billing {billingCycle === 'annual' && <span className="text-[#137333] ml-1">-25%</span>}
                    </p>
                    <select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                      className="w-full text-[13px] font-bold text-[#4A443A] bg-[#FAF9F6] border border-[#E2DCCF] rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#FF5A1F]/20">
                      <option value="monthly">Monthly</option>
                      <option value="annual">Annual (~25% off)</option>
                    </select>
                  </div>
                </div>



                {/* Payment methods — all shown, incompatible ones disabled */}
                <div>
                  <p className="text-[10px] font-black text-[#A69D8A] uppercase tracking-widest mb-3">Payment Method</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {allMethods.map((m) => (
                      <div key={m.id} onClick={() => m.compatible && setPaymentMethod(m.id)} className={cn(
                        'rounded-xl border bg-white p-3.5 flex items-center justify-between transition-all group relative',
                        m.compatible ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
                        m.compatible && paymentMethod === m.id ? 'border-[#FF5A1F] ring-2 ring-[#FF5A1F]/10 shadow-sm' : 'border-[#E2DCCF]',
                        m.compatible && paymentMethod !== m.id ? 'hover:border-[#D4CFC5] hover:shadow-sm' : '',
                      )}>
                        {m.recommended && m.compatible && (
                          <span className="absolute -top-1.5 right-3 px-1.5 py-px rounded-full bg-[#137333] text-white text-[7px] font-black uppercase tracking-widest">Best</span>
                        )}
                        {!m.compatible && (
                          <span className="absolute -top-1.5 right-3 px-1.5 py-px rounded-full bg-[#E2DCCF] text-[#908878] text-[7px] font-black uppercase tracking-widest">{usdMethods.includes(m.id) ? 'USD only' : 'DZD only'}</span>
                        )}
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center border transition-colors',
                            m.compatible && paymentMethod === m.id ? 'bg-[#FF5A1F]/10 border-[#FF5A1F]/20' : 'bg-[#F2EFE8] border-[#E2DCCF]',
                          )}>{m.icon}</div>
                          <div>
                            <p className="text-[12px] font-bold text-[#4A443A]">{m.label}</p>
                            <p className="text-[9px] text-[#A69D8A] font-medium">{m.desc}</p>
                          </div>
                        </div>
                        <div className={cn(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                          m.compatible && paymentMethod === m.id ? 'border-[#FF5A1F] bg-[#FF5A1F]' : 'border-[#D4CFC5]',
                        )}>
                          {m.compatible && paymentMethod === m.id && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3 : PROOF ─── */}
          {step === 'proof' && paymentMethod && (
            <div className="min-h-full flex items-start justify-center px-4 sm:px-6 py-5 sm:py-8">
              <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Transfer details — clear step-by-step */}
                <div className="bg-[#F2EFE8] rounded-xl border border-[#E2DCCF] p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#E2DCCF]">
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#E2DCCF] flex items-center justify-center">
                      {methods.find((m) => m.id === paymentMethod)?.icon || <CreditCard size={14} />}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-[#4A443A]">How to pay via {methods.find((m) => m.id === paymentMethod)?.label}</p>
                    </div>
                  </div>

                  {/* Step 1: Amount */}
                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#FF5A1F] text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">1</div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-[#4A443A] mb-1">Send this exact amount</p>
                      <div className="bg-white rounded-lg p-2.5 border border-[#E2DCCF] flex items-center justify-between">
                        <p className="text-[20px] font-black text-[#4A443A] tracking-tight leading-none">{getTotal().toLocaleString()} <span className="text-[11px] font-bold text-[#908878]">{currency}</span></p>
                        <button onClick={() => copy(getTotal().toString())} className="p-1 rounded-md bg-[#FF5A1F]/10 text-[#FF5A1F] hover:bg-[#FF5A1F]/20 transition-colors">
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Transfer details */}
                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#FF5A1F] text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">2</div>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-[10px] font-bold text-[#4A443A] mb-1">Send to these details</p>
                      {paymentMethod === 'ccp' && (
                        <>
                          <DetailRow label="Account Name" value={paymentConfig.ccp.accountName} onCopy={copy} />
                          <DetailRow label="CCP Number" value={paymentConfig.ccp.accountNumber} onCopy={copy} mono />
                        </>
                      )}
                      {paymentMethod === 'baridi_pay' && (
                        <DetailRow label="RIP Number" value={paymentConfig.baridiPay.rip} onCopy={copy} mono />
                      )}
                      {paymentMethod === 'redotpay' && (
                        <>
                          <DetailRow label="RedotPay Account ID" value={(paymentConfig.redotpay as any)?.id || (paymentConfig.redotpay as any)?.accountId || 'N/A'} onCopy={copy} mono />
                          <DetailRow label="RedotPay Email" value={(paymentConfig.redotpay as any)?.accountEmail || 'solvixalgerie@gmail.com'} onCopy={copy} mono />
                        </>
                      )}
                      {paymentMethod === 'usdt' && (
                        <DetailRow label={`Wallet Address (${paymentConfig.usdt.network})`} value={paymentConfig.usdt.walletAddress} onCopy={copy} mono />
                      )}
                    </div>
                  </div>

                  {/* Step 3: Note */}
                  <div className="flex gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#FF5A1F] text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">3</div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-[#4A443A] mb-0.5">Upload proof on the right</p>
                      <p className="text-[9px] text-[#7A7365] leading-relaxed">
                        {paymentMethod === 'ccp' && (paymentConfig.ccp.instructions || 'Go to your nearest post office or use the BaridiMob app to make a CCP transfer.')}
                        {paymentMethod === 'baridi_pay' && (paymentConfig.baridiPay.instructions || 'Open BaridiMob → Transfer → Enter the RIP number above.')}
                        {paymentMethod === 'redotpay' && 'Open your RedotPay app → Send → Enter the Account ID or Email above. Transfer is usually instant.'}
                        {paymentMethod === 'usdt' && (paymentConfig.usdt.instructions || 'Send USDT using the exact network shown. Double-check the wallet address before sending.')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload proof */}
                <div className="bg-white rounded-xl border border-[#E2DCCF] p-4 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={14} className="text-[#137333]" />
                    <p className="text-[11px] font-black text-[#4A443A]">Upload proof</p>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div>
                      <label className="text-[10px] font-bold text-[#908878] mb-1 block">Transaction ID</label>
                      <Input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="e.g. TXN-123456789" className="h-9 text-[12px] bg-[#FAF9F6] border-[#E2DCCF]" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-[#908878]">Screenshot</label>
                        <span className="text-[8px] text-[#A69D8A] uppercase tracking-widest bg-[#F2EFE8] px-1.5 py-0.5 rounded font-bold">Required if no ID</span>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                      {screenshotPreview ? (
                        <div className="relative rounded-lg overflow-hidden border border-[#E2DCCF] bg-[#FAF9F6] h-28 flex items-center justify-center group">
                          <img src={screenshotPreview} alt="Proof" className="max-h-full max-w-full object-contain" />
                          <button onClick={() => { setScreenshotFile(null); setScreenshotPreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            className="absolute top-1 right-1 p-1 rounded-md bg-black/50 text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100">
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => fileInputRef.current?.click()} className="w-full h-28 rounded-lg border border-dashed border-[#D4CFC5] bg-[#FAF9F6] flex flex-col items-center justify-center gap-1.5 text-[#908878] hover:border-[#FF5A1F]/40 hover:text-[#FF5A1F] transition-colors">
                          <ImagePlus size={18} />
                          <span className="text-[10px] font-bold">Click to upload</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 4 : SUCCESS ─── */}
          {step === 'success' && (
            <div className="min-h-full flex items-center justify-center px-4 sm:px-6 py-8">
              <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 rounded-full bg-[#E6F4EA] flex items-center justify-center mx-auto mb-4 relative">
                    <div className="absolute inset-0 rounded-full bg-[#137333]/10 animate-ping" style={{ animationDuration: '2.5s' }} />
                    <div className="w-9 h-9 rounded-full bg-[#137333] flex items-center justify-center z-10">
                      <Check size={20} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <h4 className="text-[16px] font-black text-[#4A443A] mb-1">Request Submitted!</h4>
                  <p className="text-[12px] text-[#908878] font-medium leading-relaxed">
                    We'll review and activate your plan shortly.
                  </p>
                </div>

                {/* Order summary in success */}
                {selectedPlan && (
                  <div className="bg-white rounded-xl border border-[#E2DCCF] p-4 mb-4">
                    <p className="text-[9px] font-black text-[#A69D8A] uppercase tracking-widest mb-3">Order Summary</p>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between"><span className="text-[#908878]">Plan</span><span className="font-bold text-[#4A443A]">{selectedPlan.name}</span></div>
                      <div className="flex justify-between"><span className="text-[#908878]">Billing</span><span className="font-bold text-[#4A443A] capitalize">{billingCycle}</span></div>
                      <div className="flex justify-between"><span className="text-[#908878]">Currency</span><span className="font-bold text-[#4A443A]">{currency}</span></div>
                      <div className="flex justify-between"><span className="text-[#908878]">Payment</span><span className="font-bold text-[#4A443A]">{methods.find((m) => m.id === paymentMethod)?.label || '—'}</span></div>
                      <div className="flex justify-between pt-2 border-t border-[#F2EFE8]"><span className="font-bold text-[#4A443A]">Total Paid</span><span className="font-black text-[#FF5A1F]">{getTotal().toLocaleString()} {currency}</span></div>
                    </div>
                  </div>
                )}

                <div className="bg-[#F2EFE8] rounded-lg p-3 border border-[#E2DCCF] text-left space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-[11px]">
                    <Clock size={13} className="text-[#A69D8A] shrink-0" />
                    <p><span className="font-bold text-[#4A443A]">Review:</span> <span className="text-[#7A7365]">Usually takes a few minutes.</span></p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <Info size={13} className="text-[#A69D8A] shrink-0" />
                    <p><span className="font-bold text-[#4A443A]">Status:</span> <span className="text-[#7A7365]">Track from your Subscription page.</span></p>
                  </div>
                </div>

                <Button onClick={close} className="w-full h-9 bg-[#4A443A] hover:bg-[#2A2620] text-white text-[11px] font-bold rounded-lg">
                  Back to Dashboard
                </Button>
              </div>
            </div>
          )}

        </main>

        {/* ── Sidebar summary (lg+, hidden on success) ── */}
        {step !== 'success' && (
          <aside className="hidden lg:flex w-64 border-l border-[#E2DCCF] bg-white flex-col shrink-0">
            <div className="flex-1 p-4 flex flex-col">
              <p className="text-[9px] font-black uppercase tracking-widest text-[#A69D8A] mb-4">Order Summary</p>

              {selectedPlan ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="bg-[#FAF9F6] rounded-lg p-3 border border-[#E2DCCF]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Crown size={12} className="text-[#FF5A1F]" />
                      <p className="text-[12px] font-black text-[#4A443A]">{selectedPlan.name}</p>
                    </div>
                    <div className="space-y-1 text-[10px]">
                      <div className="flex justify-between"><span className="text-[#908878]">Cycle</span><span className="font-bold text-[#4A443A] capitalize">{billingCycle}</span></div>
                      <div className="flex justify-between"><span className="text-[#908878]">Start</span><span className="font-bold text-[#4A443A]">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div>
                      <div className="flex justify-between"><span className="text-[#908878]">End</span><span className="font-bold text-[#4A443A]">{endDate()}</span></div>
                    </div>
                  </div>

                  {paymentMethod && (
                    <div className="bg-[#FAF9F6] rounded-lg p-2.5 border border-[#E2DCCF] flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-white border border-[#E2DCCF] flex items-center justify-center">
                        {methods.find((m) => m.id === paymentMethod)?.icon}
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-[#A69D8A] uppercase tracking-wider">Method</p>
                        <p className="text-[11px] font-bold text-[#4A443A]">{methods.find((m) => m.id === paymentMethod)?.label}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#FAF9F6] rounded-lg p-3 border border-[#E2DCCF]">
                    <p className="text-[8px] font-black text-[#A69D8A] uppercase tracking-widest mb-1">Total</p>
                    <p className="text-[24px] font-black text-[#FF5A1F] tracking-tighter leading-none">{getTotal().toLocaleString()}</p>
                    <p className="text-[11px] font-bold text-[#908878] mt-0.5">{currency}</p>
                    {billingCycle === 'annual' && (
                      <p className="text-[9px] font-bold text-[#137333] mt-1">({getMonthlyRate().toLocaleString()} {currency}/mo)</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                  <Crown size={20} className="text-[#A69D8A] mb-2" />
                  <p className="text-[10px] font-bold text-[#908878]">Select a plan</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#E2DCCF]">
              <p className="text-[9px] font-bold text-[#A69D8A] flex items-center justify-center gap-1"><ShieldCheck size={11} /> Secure processing</p>
            </div>
          </aside>
        )}
      </div>

      {/* ═══ FOOTER NAV ═══ */}
      {step !== 'success' && (
        <footer className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 lg:pr-[calc(16rem+1.5rem)] border-t border-[#E2DCCF] bg-white z-50">
          <p className="text-[10px] text-[#908878] font-medium hidden sm:block">
            {step === 'plan' && 'Pick the right plan for your needs.'}
            {step === 'configure' && 'Set preferences and payment.'}
            {step === 'proof' && 'Almost done — verify the transfer.'}
          </p>

          <div className="flex items-center gap-3 ml-auto">
            {step === 'proof' ? (
              <Button onClick={handleSubmit} disabled={!canProceed() || isSubmitting}
                className="h-9 bg-[#4A443A] hover:bg-[#2A2620] text-white text-[11px] font-bold rounded-lg px-5 gap-1.5 shadow-sm">
                {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {isSubmitting ? 'Submitting…' : 'Submit Request'}
              </Button>
            ) : (
              <Button onClick={goNext} disabled={!canProceed()}
                className="h-9 bg-[#4A443A] hover:bg-[#2A2620] text-white text-[11px] font-bold rounded-lg px-5 gap-1.5">
                Continue <ArrowRight size={13} />
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );

  return createPortal(dialog, document.body);
};

/* ── DetailRow ── */
function DetailRow({ label, value, onCopy, mono }: { label: string; value: string; onCopy: (v: string) => void; mono?: boolean }) {
  return (
    <div className="bg-white rounded-lg p-2 border border-[#E2DCCF] flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-black uppercase tracking-widest text-[#A69D8A] mb-0.5">{label}</p>
        <p className={cn('text-[11px] font-bold text-[#4A443A] truncate', mono && 'font-mono text-[10px]')}>{value}</p>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onCopy(value); }} className="p-1 rounded-md text-[#FF5A1F] hover:bg-[#FF5A1F]/10 transition-colors shrink-0">
        <Copy size={12} />
      </button>
    </div>
  );
}

export default PlanPickerDialog;

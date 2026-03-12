/**
 * SubscriptionPage — Dedicated page for subscription management.
 * Compact current plan card, single upgrade CTA, cancel subscription, and transaction history.
 */

import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Crown, Loader2, CheckCircle2, Clock, XCircle, Zap, FileText, ShoppingCart, ArrowRight, Ban } from 'lucide-react';
import { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { GoogleUser } from '../lib/authGoogle';
import { PRICING_PLANS } from '@/data/plans';
import PlanPickerDialog from '@/components/PlanPickerDialog';
import { toast } from 'sonner';

interface SubscriptionPageProps {
    user: GoogleUser;
}

const SubscriptionPage = ({ user }: SubscriptionPageProps) => {
    const sub = useSubscription(user.id, user.email, user.displayName);
    const [showPlanPicker, setShowPlanPicker] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const canUpgrade = !sub.subscription || sub.subscription.status === 'expired' || sub.subscription.status === 'cancelled';
    const canCancel = sub.subscription?.status === 'active';
    const isPending = sub.subscription?.status === 'pending';

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            await sub.cancelSubscription('User requested cancellation');
            toast.success('Subscription cancelled', { description: 'Your subscription has been cancelled.' });
            setShowCancelConfirm(false);
        } catch (error: any) {
            toast.error('Failed to cancel', { description: error.message });
        } finally {
            setIsCancelling(false);
        }
    };

    const statusBadge = () => {
        if (sub.isLoading) return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Loading</span>;
        if (sub.subscription?.status === 'active') return <span className="px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] border border-[#137333]/20 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1"><CheckCircle2 size={10} /> Active</span>;
        if (sub.subscription?.status === 'pending') return <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1"><Clock size={10} /> Pending</span>;
        if (sub.subscription?.status === 'expired') return <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1"><XCircle size={10} /> Expired</span>;
        if (sub.subscription?.status === 'cancelled') return <span className="px-2 py-0.5 rounded-full bg-[#F2EFE8] text-[#908878] border border-[#E2DCCF] text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1"><Ban size={10} /> Cancelled</span>;
        return <span className="px-2 py-0.5 rounded-full bg-[#F2EFE8] text-[#908878] border border-[#E2DCCF] text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1"><Zap size={10} /> Free</span>;
    };

    return (
        <div className="flex flex-col font-sans w-full pb-12">
            <PageHeader
                title="Subscription"
                breadcrumbs={[{ label: 'Subscription' }]}
            />

            <div className="flex-1 w-full mt-4 sm:mt-6 space-y-5">

                {/* Compact Current Plan Card */}
                <Card className="rounded-xl border-[#E2DCCF] bg-white shadow-sm overflow-hidden">
                    <CardContent className="p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-[#FF5A1F]/10 flex items-center justify-center shrink-0">
                                    <Crown className="w-3.5 h-3.5 text-[#FF5A1F]" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[13px] font-black text-[#4A443A]">{sub.currentPlan.name} Plan</h3>
                                        {statusBadge()}
                                    </div>
                                    <p className="text-[10px] text-[#908878] font-medium mt-0.5">
                                        {sub.ordersThisMonth}/{sub.currentPlan.monthlyOrders === -1 ? '∞' : sub.currentPlan.monthlyOrders} orders this month
                                        {sub.subscription?.status === 'active' && sub.subscription.endDate && (
                                            <> · Expires {new Date(sub.subscription.endDate).toLocaleDateString()}</>
                                        )}
                                        {isPending && <> · Payment under review</>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {canCancel && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowCancelConfirm(true)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 text-[11px] font-bold h-8 px-2.5"
                                    >
                                        Cancel Plan
                                    </Button>
                                )}
                                {canUpgrade && (
                                    <Button
                                        onClick={() => setShowPlanPicker(true)}
                                        className="text-[11px] font-bold rounded-lg gap-1.5 shadow-sm h-8"
                                        size="sm"
                                    >
                                        Upgrade <ArrowRight size={12} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Transaction History */}
                <Card className="rounded-xl border-[#E2DCCF] shadow-sm bg-white overflow-hidden">
                    <CardHeader className="bg-white border-b border-[#E2DCCF] pb-3 pt-4 px-4 sm:px-5">
                        <CardTitle className="text-[13px] font-bold text-[#4A443A]">Transaction History</CardTitle>
                        <CardDescription className="text-[10px] text-[#908878] font-medium mt-0.5">Your subscription and payment records.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {sub.history.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-[#FAF9F6]">
                                        <TableRow className="border-[#E2DCCF] hover:bg-transparent">
                                            <TableHead className="font-bold text-[#A69D8A] text-[9px] tracking-wider uppercase pl-4 py-2.5">Plan</TableHead>
                                            <TableHead className="font-bold text-[#A69D8A] text-[9px] tracking-wider uppercase py-2.5">Billing</TableHead>
                                            <TableHead className="font-bold text-[#A69D8A] text-[9px] tracking-wider uppercase py-2.5">Period</TableHead>
                                            <TableHead className="font-bold text-[#A69D8A] text-[9px] tracking-wider uppercase py-2.5">Amount</TableHead>
                                            <TableHead className="font-bold text-[#A69D8A] text-[9px] tracking-wider uppercase py-2.5 text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sub.history.map((trx) => {
                                            const plan = PRICING_PLANS.find(p => p.id === trx.planId);
                                            return (
                                                <TableRow key={trx.id} className="border-b border-[#E2DCCF]/60 last:border-0 hover:bg-[#FAF9F6] transition-colors">
                                                    <TableCell className="pl-4 py-2.5">
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#F2EFE8] text-[#4A443A] text-[10px] font-bold border border-[#E2DCCF]">
                                                            {plan?.name || trx.planId}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-2.5">
                                                        <span className="text-[11px] font-medium text-[#7A7365] capitalize">{trx.billingCycle}</span>
                                                    </TableCell>
                                                    <TableCell className="py-2.5">
                                                        <div className="flex flex-col gap-0.5 text-[11px] font-medium text-[#7A7365]">
                                                            {trx.startDate ? (
                                                                <span>{new Date(trx.startDate).toLocaleDateString()} → {trx.endDate ? new Date(trx.endDate).toLocaleDateString() : '—'}</span>
                                                            ) : (
                                                                <span className="text-[#A69D8A] italic">Pending</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2.5">
                                                        <span className="font-bold text-[12px] text-[#4A443A]">
                                                            {trx.amountPaid != null ? `${trx.amountPaid.toLocaleString()} ${trx.currency}` : '—'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-center">
                                                        <span className={cn(
                                                            "inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest min-w-[50px]",
                                                            trx.status === 'active' ? "bg-[#E6F4EA] text-[#137333] border border-[#137333]/20"
                                                                : trx.status === 'pending' ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                                : trx.status === 'expired' ? "bg-red-50 text-red-600 border border-red-200"
                                                                : "bg-[#F2EFE8] text-[#A69D8A] border border-[#E2DCCF]"
                                                        )}>{trx.status}</span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-9 h-9 bg-[#F2EFE8] rounded-xl flex items-center justify-center mx-auto mb-2 border border-[#E2DCCF]">
                                    <FileText className="text-[#A69D8A]" size={16} />
                                </div>
                                <h3 className="text-[11px] font-bold text-[#4A443A]">No transactions yet</h3>
                                <p className="text-[10px] text-[#908878] mt-0.5">Your subscription history will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Plan Picker Popup */}
            <PlanPickerDialog
                open={showPlanPicker}
                onClose={() => setShowPlanPicker(false)}
                currentPlanId={sub.currentPlan.id}
                subscriptionStatus={sub.subscription?.status}
                ordersThisMonth={sub.ordersThisMonth}
                monthlyOrderLimit={sub.currentPlan.monthlyOrders}
                onSubmitPlanRequest={sub.submitPlanRequest}
            />

            {/* Cancel Confirmation Dialog */}
            {showCancelConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center font-sans">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden border border-[#E2DCCF]">
                        <div className="px-5 py-5 text-center">
                            <div className="w-11 h-11 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-3 border border-red-200">
                                <Ban className="text-red-500" size={20} />
                            </div>
                            <h3 className="text-[14px] font-bold text-[#4A443A] mb-1">Cancel Subscription?</h3>
                            <p className="text-[11px] text-[#908878] font-medium leading-relaxed">
                                Your <strong className="text-[#4A443A]">{sub.currentPlan.name}</strong> plan will be cancelled immediately. You'll be downgraded to the Free plan.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-5 py-3 border-t border-[#E2DCCF] bg-[#FAF9F6]">
                            <Button
                                variant="ghost"
                                onClick={() => setShowCancelConfirm(false)}
                                disabled={isCancelling}
                                className="flex-1 text-[11px] font-bold text-[#908878] hover:text-[#4A443A]"
                                size="sm"
                            >
                                Keep Plan
                            </Button>
                            <Button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold gap-1 shadow-sm"
                                size="sm"
                            >
                                {isCancelling ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                                {isCancelling ? 'Cancelling…' : 'Cancel Plan'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPage;

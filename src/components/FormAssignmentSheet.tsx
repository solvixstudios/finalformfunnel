
import { useEffect, useMemo, useState } from 'react';
import { useConnectedStores, useFormAssignments, useSavedForms } from '@/lib/firebase/hooks';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, ChevronRight, FileText, LayoutTemplate, Loader2, Search, Store as StoreIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FormAssignmentSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    storeId: string;
    products?: any[];
    initialProductIds?: string[];
    initialFormId?: string; // Auto-select form
    scope?: 'store' | 'product'; // Optional override, otherwise inferred
}

export function FormAssignmentSheet({
    open,
    onOpenChange,
    userId,
    storeId,
    products = [],
    initialProductIds = [],
    initialFormId
}: FormAssignmentSheetProps) {
    const { forms, loading: formsLoading } = useSavedForms(userId);
    const { stores } = useConnectedStores(userId);
    const { assignments, assignForm, deleteAssignment, refetch } = useFormAssignments(userId);

    const [step, setStep] = useState<'form' | 'confirm'>('form');
    const [selectedFormId, setSelectedFormId] = useState<string>('');
    const [formSearch, setFormSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Infer scope: if products provided -> product, else store
    const scope = initialProductIds.length > 0 ? 'product' : 'store';
    const store = stores.find(s => s.id === storeId);

    const availableForms = useMemo(() => {
        return forms.filter(f =>
            f.status !== 'draft' &&
            f.name.toLowerCase().includes(formSearch.toLowerCase())
        );
    }, [forms, formSearch]);

    useEffect(() => {
        if (open) {
            setStep(initialFormId ? 'confirm' : 'form');
            setSelectedFormId(initialFormId || '');
            setFormSearch('');
        }
    }, [open, initialFormId]);

    const handleFormSelect = (formId: string) => {
        setSelectedFormId(formId);
        setStep('confirm'); // Go to confirmation immediately
    };

    const handleAssign = async () => {
        if (!selectedFormId || !store) return;
        if (!store.clientId || !store.clientSecret) {
            toast.error("Store credentials missing. Please reconnect the store.");
            return;
        }
        setIsSubmitting(true);
        try {
            const form = forms.find(f => f.id === selectedFormId);
            if (!form) throw new Error("Form not found");

            const formConfig = { formId: form.id, name: form.name, ...form.config };

            if (scope === 'store') {
                // Delete existing store-level assignment if different form
                const existing = assignments.find(a =>
                    a.storeId === storeId && a.assignmentType === 'store' && a.isActive
                );
                if (existing) {
                    if (existing.formId === selectedFormId) {
                        toast.info("This form is already assigned to the store");
                        setIsSubmitting(false);
                        return;
                    }
                    await deleteAssignment(existing.id!);
                }

                // assignForm handles: adapter push to n8n + refetch for UI sync
                await assignForm({
                    formId: selectedFormId,
                    storeId,
                    type: 'store',
                    formName: form.name,
                    formConfig,
                    shopifyDomain: store.url,
                });
                toast.success(`Assigned "${form.name}" to entire store`);
            } else {
                if (initialProductIds.length === 0) {
                    toast.error("No products selected");
                    setIsSubmitting(false);
                    return;
                }

                // Delete existing product-level assignments for these products (prevents duplicates)
                const existingProductAssignments = assignments.filter(a =>
                    a.storeId === storeId &&
                    a.assignmentType === 'product' &&
                    a.productId &&
                    initialProductIds.includes(a.productId)
                );
                // Delete old assignments (n8n cleanup happens inside deleteAssignment)
                await Promise.all(
                    existingProductAssignments
                        .filter(a => a.formId !== selectedFormId)
                        .map(a => deleteAssignment(a.id!))
                );

                // Filter out products that already have this exact form assigned
                const alreadyAssignedProductIds = new Set(
                    existingProductAssignments
                        .filter(a => a.formId === selectedFormId)
                        .map(a => a.productId)
                );
                const newProductIds = initialProductIds.filter(pid => !alreadyAssignedProductIds.has(pid));

                if (newProductIds.length === 0) {
                    toast.info("This form is already assigned to all selected products");
                    setIsSubmitting(false);
                    return;
                }

                // assignForm handles: adapter push to n8n + refetch for UI sync
                for (const productId of newProductIds) {
                    await assignForm({
                        formId: selectedFormId,
                        storeId,
                        type: 'product',
                        productId,
                        productHandle: products.find(p => String(p.id) === productId)?.handle,
                        formName: form.name,
                        formConfig,
                        shopifyDomain: store.url,
                        skipRefetch: true,
                    });
                }

                await refetch();
                toast.success(`Assigned "${form.name}" to ${newProductIds.length} products`);
            }
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to assign form");
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedForm = forms.find(f => f.id === selectedFormId);

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[440px] flex flex-col h-full p-0 gap-0 border-l-0 shadow-2xl bg-white">
                {/* ─── Header ─── */}
                <SheetHeader className="px-6 pt-6 pb-5 border-b border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-bold tracking-tight text-slate-900">Assign Form</SheetTitle>
                        {/* Simplified Step Indicator */}
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Step {step === 'form' ? '1' : '2'} of 2
                                </span>
                            </div>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-slate-900 transition-all duration-500 ease-out rounded-full"
                                    style={{ width: step === 'form' ? '50%' : '100%' }}
                                />
                            </div>
                        </div>
                    </div>
                    <SheetDescription className="text-xs text-slate-500">
                        {step === 'form'
                            ? `Select a form to assign to ${scope === 'store' ? 'your store' : 'selected products'}.`
                            : `Confirm assignment details.`}
                    </SheetDescription>
                    {store && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 w-fit">
                            <StoreIcon size={13} className="text-slate-500" />
                            <span className="text-xs font-semibold text-slate-700">{store.name}</span>
                        </div>
                    )}
                </SheetHeader>

                {/* ─── Content ─── */}
                <div className="flex-1 overflow-y-auto">
                    {step === 'form' ? (
                        <div className="p-5 space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                                <Input
                                    className="pl-10 h-10 bg-slate-50 border-slate-200/80 rounded-xl text-sm focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 transition-all shadow-sm"
                                    placeholder="Search published forms..."
                                    value={formSearch}
                                    onChange={e => setFormSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {formsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />)}
                                </div>
                            ) : availableForms.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-2xl flex items-center justify-center">
                                        <FileText size={24} className="text-slate-300" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">No forms found</p>
                                    <p className="text-xs text-slate-400 mt-1">Create and publish a form first</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {availableForms.map(form => {
                                        const isSelected = selectedFormId === form.id;
                                        const accentColor = form.config?.accentColor || '#6366f1';
                                        return (
                                            <div
                                                key={form.id}
                                                className={cn(
                                                    "group flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer",
                                                    isSelected
                                                        ? "border-slate-900 bg-slate-50 shadow-sm"
                                                        : "border-slate-100 bg-white hover:border-slate-300 hover:shadow-sm"
                                                )}
                                                onClick={() => handleFormSelect(form.id)}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-black/[0.04]"
                                                    style={{ background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}22)` }}
                                                >
                                                    <LayoutTemplate size={16} style={{ color: accentColor }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">{form.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] text-slate-400 font-medium">Published</span>
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-6 flex flex-col items-center text-center h-full justify-center animate-in fade-in zoom-in-95 duration-200">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 ring-1 ring-slate-100">
                                <CheckCircle2 size={40} className="text-emerald-500 drop-shadow-sm" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Assignment</h3>
                            <p className="text-sm text-slate-500 max-w-[280px] mb-8 leading-relaxed">
                                You are about to assign <strong>{selectedForm?.name}</strong> to{' '}
                                <span className="font-semibold text-slate-900">
                                    {scope === 'store' ? 'your entire store' : `${initialProductIds.length} products`}
                                </span>.
                            </p>

                            <div className="w-full space-y-3">
                                <Button
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 font-bold shadow-lg shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={handleAssign}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...</> : 'Confirm Assignment'}
                                </Button>

                                <Button
                                    variant="ghost"
                                    className="w-full text-slate-400 hover:text-slate-600 font-medium h-10 rounded-xl hover:bg-slate-50"
                                    onClick={() => setStep('form')}
                                    disabled={isSubmitting}
                                >
                                    Back to selection
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── Footer for Step 1 ─── */}
                {step === 'form' && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 mt-auto">
                        <p className="text-xs text-slate-400 text-center font-medium">Select a form to continue</p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

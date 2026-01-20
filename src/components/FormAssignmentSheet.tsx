import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { assignFormToShopify } from '@/lib/api';
import { useConnectedStores, useFormAssignments, useSavedForms } from '@/lib/firebase/hooks';
import { getProductsFromCache, notifyProductSyncComplete, Product, syncProductsFromShopify } from '@/lib/products';
import { cn } from '@/lib/utils';
import {
    Check,
    ChevronRight,
    FileText,
    Loader2,
    Package,
    RefreshCw,
    Search,
    Store,
    Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FormAssignmentSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    initialFormId?: string;
    initialStoreId?: string;
}

export function FormAssignmentSheet({
    open,
    onOpenChange,
    userId,
    initialFormId,
    initialStoreId,
}: FormAssignmentSheetProps) {
    const { forms, loading: formsLoading } = useSavedForms(userId);
    const { stores, loading: storesLoading } = useConnectedStores(userId);
    const { assignments, assignForm, deleteAssignment, loading: assignmentsLoading } = useFormAssignments(userId);

    const [selectedFormId, setSelectedFormId] = useState<string>(initialFormId || '');
    const [assignmentType, setAssignmentType] = useState<'store' | 'product'>('store');
    const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId || '');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Product loading
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [syncingProducts, setSyncingProducts] = useState(false);

    // Filter only published forms
    const publishedForms = forms.filter(f => f.status === 'published');

    // Reset when dialog opens
    useEffect(() => {
        if (open) {
            if (initialFormId) setSelectedFormId(initialFormId);
            if (initialStoreId) setSelectedStoreId(initialStoreId);
            setAssignmentType('store');
            setSelectedProductIds([]);
            setProductSearch('');
        }
    }, [open, initialFormId, initialStoreId]);

    // Load products when store changes
    useEffect(() => {
        const loadProducts = async () => {
            if (!selectedStoreId) return;
            setLoadingProducts(true);
            try {
                const cached = await getProductsFromCache(selectedStoreId);
                if (cached?.products) {
                    setProducts(cached.products);
                } else {
                    setProducts([]);
                }
            } catch (e) {
                console.error('Failed to load products', e);
                setProducts([]);
            } finally {
                setLoadingProducts(false);
            }
        };

        if (selectedStoreId) {
            loadProducts();
        }
    }, [selectedStoreId]);

    const handleSyncProducts = async () => {
        if (!selectedStoreId) return;
        const store = stores.find(s => s.id === selectedStoreId);
        if (!store) return;

        setSyncingProducts(true);
        try {
            const synced = await syncProductsFromShopify(store);
            setProducts(synced);
            notifyProductSyncComplete(store.id, synced);
            toast.success(`Synced ${synced.length} products!`);
        } catch (e) {
            toast.error('Failed to sync products');
        } finally {
            setSyncingProducts(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(productSearch.toLowerCase())
    );

    const selectedStore = stores.find(s => s.id === selectedStoreId);
    const selectedForm = forms.find(f => f.id === selectedFormId);

    const canSubmit = selectedFormId && selectedStoreId && (assignmentType === 'store' || selectedProductIds.length > 0);

    const handleAssign = async () => {
        if (!selectedFormId || !selectedStoreId) {
            toast.error('Please select both a form and a store.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (assignmentType === 'store') {
                await assignForm({
                    formId: selectedFormId,
                    storeId: selectedStoreId,
                    type: 'store',
                });

                // Sync to Shopify Metafield (Shop Level)
                console.log('[FormAssignment] Store sync check:', {
                    hasConfig: !!selectedForm?.config,
                    hasClientId: !!selectedStore?.clientId,
                    hasClientSecret: !!selectedStore?.clientSecret,
                    storeId: selectedStore?.id,
                    storeName: selectedStore?.name,
                });

                if (!selectedStore?.clientId || !selectedStore?.clientSecret) {
                    console.warn('[FormAssignment] Missing clientId or clientSecret - master-sync will NOT be called!');
                    toast.warning('Saved locally but missing store credentials for Shopify sync');
                } else if (selectedForm?.config) {
                    const subdomain = selectedStore.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');
                    console.log('[FormAssignment] Calling master-sync for store:', subdomain);
                    await assignFormToShopify(
                        subdomain,
                        selectedStore.clientId,
                        selectedStore.clientSecret,
                        selectedForm.config,
                        undefined, // No ownerId means Shop Level
                        {
                            formId: selectedFormId,
                            formName: selectedForm.name,
                            assignmentType: 'shop',
                            storeId: selectedStoreId,
                            storeName: selectedStore.name,
                            shopifyDomain: selectedStore.url,
                        }
                    ).catch(err => {
                        console.error('Failed to sync to Shopify:', err);
                        toast.error('Saved to app but failed to sync to Shopify');
                    });
                }

                toast.success(`Form assigned to ${selectedStore?.name || 'store'}!`);
            } else {
                if (selectedProductIds.length === 0) {
                    toast.error('Please select at least one product.');
                    setIsSubmitting(false);
                    return;
                }

                const productIdList = [];

                for (const productId of selectedProductIds) {
                    await assignForm({
                        formId: selectedFormId,
                        storeId: selectedStoreId,
                        type: 'product',
                        productId,
                        productHandle: products.find(p => p.id.toString() === productId)?.handle,
                    });

                    productIdList.push(productId);
                }

                // Sync to Shopify Metafields (in parallel for speed)
                console.log('[FormAssignment] Product sync check:', {
                    hasConfig: !!selectedForm?.config,
                    hasClientId: !!selectedStore?.clientId,
                    hasClientSecret: !!selectedStore?.clientSecret,
                    productCount: productIdList.length,
                    storeId: selectedStore?.id,
                });

                if (!selectedStore?.clientId || !selectedStore?.clientSecret) {
                    console.warn('[FormAssignment] Missing clientId or clientSecret - master-sync will NOT be called for products!');
                    toast.warning('Saved locally but missing store credentials for Shopify sync');
                } else if (selectedForm?.config) {
                    const subdomain = selectedStore.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');
                    console.log(`[FormAssignment] Syncing ${productIdList.length} products to Shopify...`);

                    // Sync each product in parallel
                    await Promise.all(productIdList.map(pid => {
                        const productInfo = products.find(p => p.id.toString() === pid);
                        return assignFormToShopify(
                            subdomain,
                            selectedStore.clientId!,
                            selectedStore.clientSecret!,
                            selectedForm.config,
                            pid, // Passing Product ID (numeric)
                            {
                                formId: selectedFormId,
                                formName: selectedForm.name,
                                assignmentType: 'product',
                                storeId: selectedStoreId,
                                storeName: selectedStore.name,
                                shopifyDomain: selectedStore.url,
                                productId: pid,
                                productHandle: productInfo?.handle,
                            }
                        ).catch(err => {
                            console.error(`Failed to sync product ${pid}:`, err);
                            // Don't toast for every failure to avoid spam, maybe just log
                        });
                    }));
                    toast.success('Synced assignments to Shopify!');
                }

                toast.success(`Form assigned to ${selectedProductIds.length} product(s)!`);
            }

            // Reset and close
            setSelectedProductIds([]);
            setAssignmentType('store');
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to assign form');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveAssignment = async (assignmentId: string) => {
        try {
            // First find the assignment to get details
            const assignment = assignments.find(a => a.id === assignmentId);
            if (assignment) {
                const store = stores.find(s => s.id === assignment.storeId);
                if (store && store.clientId && store.clientSecret) {
                    const subdomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');

                    // Determine ownerId: if product type, use productId. If store type, use undefined (Shop)
                    const ownerId = assignment.assignmentType === 'product' ? assignment.productId : undefined;

                    // Call API to remove metafield
                    await import('@/lib/api').then(mod =>
                        mod.removeFormFromShopify(
                            subdomain,
                            store.clientId!,
                            store.clientSecret!,
                            undefined, // metafieldId unknown
                            ownerId
                        )
                    ).catch(err => {
                        console.error("Failed to remove from Shopify:", err);
                        toast.error("Removed from app, but failed to remove from Shopify");
                    });
                }
            }

            await deleteAssignment(assignmentId);
            toast.success('Assignment removed');
        } catch (e) {
            toast.error('Failed to remove assignment');
        }
    };

    const toggleProduct = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    // Determine current step for minimal progress indicator
    const currentStep = !selectedFormId ? 1 : !selectedStoreId ? 2 : 3;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[520px] w-full flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header */}
                <SheetHeader className="px-5 py-4 border-b bg-white shrink-0">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                                <Package size={16} />
                            </div>
                            Assign Form
                        </SheetTitle>
                        {/* Minimal Step Indicator */}
                        <div className="flex items-center gap-1">
                            {[1, 2, 3].map(step => (
                                <div
                                    key={step}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        step <= currentStep ? "bg-indigo-600" : "bg-slate-200"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                </SheetHeader>

                <Tabs defaultValue="assign" className="flex-1 flex flex-col min-h-0">
                    <div className="px-5 pt-4 shrink-0">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-0.5 rounded-lg h-9">
                            <TabsTrigger
                                value="assign"
                                className="rounded-md text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                New Assignment
                            </TabsTrigger>
                            <TabsTrigger
                                value="active"
                                className="rounded-md text-xs font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                            >
                                Active ({assignments.length})
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* NEW ASSIGNMENT TAB */}
                    <TabsContent value="assign" className="flex-1 flex flex-col mt-0 min-h-0 data-[state=active]:flex">
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {/* FORM SELECTION */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    1. Select Form
                                </label>
                                {publishedForms.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                                        No published forms
                                    </div>
                                ) : (
                                    <div className="grid gap-1.5">
                                        {publishedForms.slice(0, 5).map(form => (
                                            <button
                                                key={form.id}
                                                onClick={() => setSelectedFormId(form.id)}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                                                    selectedFormId === form.id
                                                        ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/20"
                                                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                                                    selectedFormId === form.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                                                )}>
                                                    <FileText size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn(
                                                        "text-sm font-medium truncate",
                                                        selectedFormId === form.id ? "text-indigo-900" : "text-slate-700"
                                                    )}>
                                                        {form.name}
                                                    </p>
                                                </div>
                                                {selectedFormId === form.id && (
                                                    <Check size={16} className="text-indigo-600 shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* STORE SELECTION */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                    2. Select Store
                                </label>
                                <div className="grid gap-1.5">
                                    {stores.map(store => (
                                        <button
                                            key={store.id}
                                            onClick={() => setSelectedStoreId(store.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                                                selectedStoreId === store.id
                                                    ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/20"
                                                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                                                selectedStoreId === store.id ? "bg-indigo-100 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                                            )}>
                                                <Store size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm font-medium truncate",
                                                    selectedStoreId === store.id ? "text-indigo-900" : "text-slate-700"
                                                )}>
                                                    {store.name}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate">{store.url}</p>
                                            </div>
                                            {selectedStoreId === store.id && (
                                                <Check size={16} className="text-indigo-600 shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ASSIGNMENT SCOPE */}
                            {selectedStoreId && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                        3. Assignment Scope
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all",
                                                assignmentType === 'store'
                                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                            )}
                                            onClick={() => setAssignmentType('store')}
                                        >
                                            <Store size={16} />
                                            Entire Store
                                        </button>
                                        <button
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all",
                                                assignmentType === 'product'
                                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                            )}
                                            onClick={() => setAssignmentType('product')}
                                        >
                                            <Package size={16} />
                                            Specific Products
                                        </button>
                                    </div>

                                    {/* PRODUCT SELECTION (inline, compact) */}
                                    {assignmentType === 'product' && (
                                        <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        placeholder="Search products..."
                                                        value={productSearch}
                                                        onChange={(e) => setProductSearch(e.target.value)}
                                                        className="h-8 pl-8 text-sm bg-white"
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                    onClick={handleSyncProducts}
                                                    disabled={syncingProducts}
                                                >
                                                    <RefreshCw size={12} className={cn("mr-1", syncingProducts && "animate-spin")} />
                                                    Refresh
                                                </Button>
                                            </div>

                                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-[180px] overflow-y-auto">
                                                {loadingProducts ? (
                                                    <div className="flex items-center justify-center py-8 text-slate-400">
                                                        <Loader2 size={18} className="animate-spin" />
                                                    </div>
                                                ) : products.length === 0 ? (
                                                    <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs gap-1">
                                                        <Package size={18} className="text-slate-300" />
                                                        <span>No products found</span>
                                                    </div>
                                                ) : (
                                                    filteredProducts.slice(0, 30).map(product => {
                                                        const isSelected = selectedProductIds.includes(product.id.toString());
                                                        return (
                                                            <div
                                                                key={product.id}
                                                                onClick={() => toggleProduct(product.id.toString())}
                                                                className={cn(
                                                                    "flex items-center gap-3 px-3 py-2 cursor-pointer border-b last:border-b-0 transition-colors",
                                                                    isSelected ? "bg-indigo-50/60" : "hover:bg-slate-50"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                                                                    isSelected
                                                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                                                        : "border-slate-300 bg-white"
                                                                )}>
                                                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                                                </div>
                                                                <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden shrink-0">
                                                                    {product.image?.src ? (
                                                                        <img src={product.image.src} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                            <Package size={12} className="text-slate-400" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <p className={cn(
                                                                    "text-xs font-medium truncate flex-1",
                                                                    isSelected ? "text-indigo-900" : "text-slate-700"
                                                                )}>
                                                                    {product.title}
                                                                </p>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                            {selectedProductIds.length > 0 && (
                                                <p className="text-[11px] text-indigo-600 font-medium">
                                                    {selectedProductIds.length} product(s) selected
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ACTION FOOTER */}
                        <div className="px-5 py-4 border-t bg-slate-50 shrink-0">
                            <Button
                                className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-sm font-medium shadow-sm"
                                onClick={handleAssign}
                                disabled={!canSubmit || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin mr-2" size={16} />
                                ) : (
                                    <ChevronRight className="mr-1" size={16} />
                                )}
                                Assign Form
                            </Button>
                        </div>
                    </TabsContent>

                    {/* ACTIVE ASSIGNMENTS TAB */}
                    <TabsContent value="active" className="flex-1 mt-0 min-h-0 data-[state=active]:flex flex-col">
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {assignments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                                    <Package size={32} className="text-slate-300" />
                                    <p className="font-medium text-slate-600">No assignments yet</p>
                                    <p className="text-xs text-slate-400">Create one in the "New Assignment" tab</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {assignments.map(assignment => {
                                        const form = forms.find(f => f.id === assignment.formId);
                                        const store = stores.find(s => s.id === assignment.storeId);
                                        return (
                                            <div
                                                key={assignment.id}
                                                className="group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-all"
                                            >
                                                <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                    <FileText size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">
                                                        {form?.name || 'Unknown Form'}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                                            {store?.name || 'Unknown'}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[10px] px-1.5 py-0 h-4",
                                                                assignment.assignmentType === 'store'
                                                                    ? "bg-blue-50 text-blue-600 border-blue-200"
                                                                    : "bg-purple-50 text-purple-600 border-purple-200"
                                                            )}
                                                        >
                                                            {assignment.assignmentType === 'store' ? 'Store' : 'Product'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => handleRemoveAssignment(assignment.id!)}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}

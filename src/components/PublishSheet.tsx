import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { assignFormToShopify, removeFormFromShopify } from '@/lib/api';
import { useConnectedStores, useFormAssignments } from '@/lib/firebase/hooks';
import { getProductsFromCache, notifyProductSyncComplete, Product, syncProductsFromShopify } from '@/lib/products';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    Check,
    ChevronRight,
    Loader2,
    Package,
    RefreshCw,
    Search,
    Store,
    Trash2,
    UploadCloud
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PublishSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    formId: string;
    formName: string;
    formConfig: any;
    onPublishSuccess?: () => void;
}

export function PublishSheet({
    open,
    onOpenChange,
    userId,
    formId,
    formName,
    formConfig,
    onPublishSuccess,
}: PublishSheetProps) {
    const { stores, loading: storesLoading } = useConnectedStores(userId);
    const { assignForm, deleteAssignment, assignments, loading: assignmentsLoading } = useFormAssignments(userId);

    const [activeTab, setActiveTab] = useState<'publish' | 'manage'>('publish');

    // Publish State
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [assignmentType, setAssignmentType] = useState<'store' | 'product'>('store');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [conflictAssignment, setConflictAssignment] = useState<any>(null);

    // Product loading
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [syncingProducts, setSyncingProducts] = useState(false);

    // Active Assignments for this form
    const currentFormAssignments = assignments.filter(a => a.formId === formId && a.isActive);

    // Reset when sheet opens
    useEffect(() => {
        if (open) {
            setStep(1);
            setSelectedStoreId('');
            setAssignmentType('store');
            setSelectedProductIds([]);
            setProductSearch('');
            setIsPublishing(false);
            setActiveTab('publish');

            // If already published, maybe default to Manage tab?
            // User requirement: "show published to inside the form card", 
            // "easy to see 'published to' tab inside the publish popup".
            // Let's stick to default 'publish' but if user opens a published form, they might want to see 'Manage'.
            // Actually, if active assignments exist, it's nice to let them verify.
            // But let's keep it simple: default to Publish, user can switch.
            if (currentFormAssignments.length > 0) {
                setActiveTab('manage');
            }
        }
    }, [open, currentFormAssignments.length]);

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

    const toggleProduct = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handlePublish = async () => {
        if (!selectedStoreId) {
            toast.error('Please select a store.');
            return;
        }

        const store = stores.find(s => s.id === selectedStoreId);
        if (!store) return;

        if (!store.clientId || !store.clientSecret) {
            toast.error('Store credentials missing. Please reconnect the store.');
            return;
        }

        setIsPublishing(true);
        try {
            if (assignmentType === 'store') {
                // Check Global Conflict
                const existingGlobalAssignment = assignments.find(a =>
                    a.storeId === selectedStoreId &&
                    a.assignmentType === 'store' &&
                    a.isActive
                );

                if (existingGlobalAssignment) {
                    if (existingGlobalAssignment.formId === formId) {
                        // Same form, just update
                        await executeStorePublish();
                    } else {
                        // Conflict
                        setConflictAssignment(existingGlobalAssignment);
                        return; // Wait for user confirmation
                    }
                } else {
                    await executeStorePublish();
                }
            } else {
                // Product Level
                if (selectedProductIds.length === 0) {
                    toast.error('Please select at least one product.');
                    setIsPublishing(false);
                    return;
                }
                await executeProductPublish();
            }

            if (onPublishSuccess) onPublishSuccess();
            // Don't close immediately, maybe show success state? 
            // Or change to Manage tab?
            setActiveTab('manage');
            toast.success('Published successfully!');
        } catch (error: any) {
            console.error('Publish failed:', error);
            toast.error('Failed to publish: ' + (error.message || 'Unknown error'));
        } finally {
            setIsPublishing(false);
        }
    };

    const executeStorePublish = async () => {
        const store = stores.find(s => s.id === selectedStoreId);
        if (!store) return;
        const subdomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');

        if (conflictAssignment) {
            await deleteAssignment(conflictAssignment.id!);
        }

        // Firebase
        await assignForm({
            formId,
            storeId: selectedStoreId,
            type: 'store',
        });

        // Shopify
        await assignFormToShopify(
            subdomain,
            store.clientId!,
            store.clientSecret!,
            formConfig,
            undefined,
            {
                formId,
                formName,
                assignmentType: 'shop',
                storeId: selectedStoreId,
                storeName: store.name,
                shopifyDomain: store.url,
            }
        );
    };

    const executeProductPublish = async () => {
        const store = stores.find(s => s.id === selectedStoreId);
        if (!store) return;
        const subdomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');

        const promises = selectedProductIds.map(async (pid) => {
            const product = products.find(p => p.id.toString() === pid);

            // Clean up existing assignment for this product (if any)
            const existingProductAssignment = assignments.find(a =>
                a.storeId === selectedStoreId &&
                a.assignmentType === 'product' &&
                a.productId === pid
            );
            if (existingProductAssignment && existingProductAssignment.formId !== formId) {
                await deleteAssignment(existingProductAssignment.id!);
            }

            // Firebase Add (if not duplicate of THIS form)
            const alreadyAssigned = assignments.find(a =>
                a.storeId === selectedStoreId &&
                a.assignmentType === 'product' &&
                a.productId === pid &&
                a.formId === formId
            );

            if (!alreadyAssigned) {
                await assignForm({
                    formId,
                    storeId: selectedStoreId,
                    type: 'product',
                    productId: pid,
                    productHandle: product?.handle
                });
            }

            // Shopify Push
            return assignFormToShopify(
                subdomain,
                store.clientId!,
                store.clientSecret!,
                formConfig,
                pid,
                {
                    formId,
                    formName,
                    assignmentType: 'product',
                    storeId: selectedStoreId,
                    storeName: store.name,
                    shopifyDomain: store.url,
                    productId: pid,
                    productHandle: product?.handle,
                }
            );
        });

        await Promise.all(promises);
    };

    const handleUnpublish = async (assignment: any) => {
        const store = stores.find(s => s.id === assignment.storeId);
        if (!store || !store.clientId || !store.clientSecret) {
            toast.error('Store credentials missing');
            return;
        }

        const subdomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');
        const loadingToast = toast.loading('Unpublishing...');

        try {
            // 1. Remove from Shopify (Metafield)
            // Product or Shop level
            const ownerId = assignment.assignmentType === 'product' ? assignment.productId : undefined;
            await removeFormFromShopify(subdomain, store.clientId, store.clientSecret, undefined, ownerId);

            // 2. Remove Assignment from Firebase
            await deleteAssignment(assignment.id);

            toast.success('Unpublished successfully');
        } catch (e: any) {
            console.error('Unpublish error:', e);
            toast.error('Failed to unpublish');
        } finally {
            toast.dismiss(loadingToast);
        }
    };


    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(productSearch.toLowerCase())
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md w-full flex flex-col p-0">
                <SheetHeader className="px-6 py-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-indigo-600" />
                        Publish Form
                    </SheetTitle>
                    <SheetDescription>
                        Manage where your form appears on your store.
                    </SheetDescription>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-4">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="publish">Publish New</TabsTrigger>
                            <TabsTrigger value="manage" className="relative">
                                Manage Active
                                {currentFormAssignments.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="publish" className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {/* Step 1: Store Selection */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-slate-900">Select a Store</h3>
                                {storesLoading ? (
                                    <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
                                ) : stores.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 border border-dashed rounded-lg">No connected stores</div>
                                ) : (
                                    <div className="grid gap-2">
                                        {stores.map(store => (
                                            <button
                                                key={store.id}
                                                onClick={() => {
                                                    setSelectedStoreId(store.id);
                                                    setStep(2);
                                                }}
                                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                                            >
                                                <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                                                    <Store size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-slate-900 group-hover:text-indigo-900">{store.name}</p>
                                                    <p className="text-xs text-slate-500">{store.url}</p>
                                                </div>
                                                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Scope Selection */}
                        {step === 2 && (
                            <div className="space-y-4 flex flex-col h-full">
                                <div className="flex items-center justify-between shrink-0">
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-900">Publishing Target</h3>
                                        <p className="text-xs text-slate-500">Store: {stores.find(s => s.id === selectedStoreId)?.name}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs h-7">Change Store</Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 shrink-0">
                                    <button
                                        onClick={() => setAssignmentType('store')}
                                        className={cn(
                                            "p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-2",
                                            assignmentType === 'store'
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                        )}
                                    >
                                        <Store />
                                        Entire Store
                                    </button>
                                    <button
                                        onClick={() => setAssignmentType('product')}
                                        className={cn(
                                            "p-3 rounded-lg border text-sm font-medium transition-all flex flex-col items-center gap-2",
                                            assignmentType === 'product'
                                                ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                        )}
                                    >
                                        <Package />
                                        Specific Products
                                    </button>
                                </div>

                                {assignmentType === 'product' && (
                                    <div className="flex-1 flex flex-col min-h-[300px] border rounded-lg overflow-hidden">
                                        <div className="p-2 border-b bg-slate-50 flex gap-2">
                                            <div className="relative flex-1">
                                                <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    placeholder="Search..."
                                                    value={productSearch}
                                                    onChange={e => setProductSearch(e.target.value)}
                                                    className="h-8 pl-8 text-xs bg-white"
                                                />
                                            </div>
                                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={handleSyncProducts} disabled={syncingProducts}>
                                                <RefreshCw size={12} className={cn(syncingProducts && "animate-spin")} />
                                            </Button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto bg-white p-1">
                                            {loadingProducts ? (
                                                <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
                                            ) : (
                                                filteredProducts.map(product => {
                                                    const isSelected = selectedProductIds.includes(product.id.toString());
                                                    return (
                                                        <div
                                                            key={product.id}
                                                            onClick={() => toggleProduct(product.id.toString())}
                                                            className={cn(
                                                                "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                                                                isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                                                                isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                                                            )}>
                                                                {isSelected && <Check size={10} />}
                                                            </div>
                                                            <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden shrink-0">
                                                                {product.image?.src && <img src={product.image.src} className="w-full h-full object-cover" />}
                                                            </div>
                                                            <p className="text-xs truncate flex-1">{product.title}</p>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 mt-auto">
                                    <Button
                                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                                        onClick={handlePublish}
                                        disabled={isPublishing || (assignmentType === 'product' && selectedProductIds.length === 0)}
                                    >
                                        {isPublishing ? <Loader2 className="animate-spin mr-2" /> : <UploadCloud className="mr-2" size={16} />}
                                        Publish
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Conflict Confirmation UI */}
                        {conflictAssignment && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shrink-0">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-amber-900 text-sm">Conflict Detected</h3>
                                        <p className="text-xs text-amber-700 mt-1 mb-3">
                                            Store <strong>{stores.find(s => s.id === selectedStoreId)?.name}</strong> already has a global form published. Publishing this will replace it.
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="bg-white text-xs h-7"
                                                onClick={() => {
                                                    setConflictAssignment(null);
                                                    setIsPublishing(false);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7"
                                                onClick={() => {
                                                    setIsPublishing(true);
                                                    executeStorePublish().then(() => {
                                                        if (onPublishSuccess) onPublishSuccess();
                                                        setActiveTab('manage');
                                                        setConflictAssignment(null);
                                                    }).finally(() => {
                                                        setIsPublishing(false);
                                                    });
                                                }}
                                            >
                                                Replace & Publish
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="manage" className="flex-1 overflow-y-auto px-6 py-4">
                        {currentFormAssignments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                    <UploadCloud className="text-slate-400" />
                                </div>
                                <h3 className="text-sm font-medium text-slate-900">No active publications</h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                                    This form is not currently published to any store or product.
                                </p>
                                <Button variant="link" size="sm" onClick={() => setActiveTab('publish')} className="mt-2 text-indigo-600">
                                    Publish now
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {currentFormAssignments.map(assignment => {
                                    const store = stores.find(s => s.id === assignment.storeId);
                                    return (
                                        <div key={assignment.id} className="border border-slate-200 rounded-lg p-3 bg-white hover:border-indigo-200 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                                                        {assignment.assignmentType === 'store' ? <Store size={14} /> : <Package size={14} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {store?.name || 'Unknown Store'}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {assignment.assignmentType === 'store' ? 'Entire Store' : 'Specific Product'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-medium border border-green-200 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        Active
                                                    </div>
                                                </div>
                                            </div>

                                            {assignment.assignmentType === 'product' && (
                                                <div className="mb-3 px-2 py-1 bg-slate-50 rounded text-xs text-slate-600 truncate">
                                                    Product ID: {assignment.productId}
                                                </div>
                                            )}

                                            <div className="flex justify-end pt-2 border-t border-slate-50">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handleUnpublish(assignment)}
                                                >
                                                    <Trash2 size={12} className="mr-2" />
                                                    Unpublish
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
}


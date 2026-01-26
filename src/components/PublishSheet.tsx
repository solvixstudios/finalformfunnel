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

    // Manage State
    const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
    const [isUnpublishing, setIsUnpublishing] = useState(false);

    // Product fetching for Manage Tab
    const [fetchedProductsMap, setFetchedProductsMap] = useState<Record<string, Product>>({});

    // Product loading
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [syncingProducts, setSyncingProducts] = useState(false);

    // Active Assignments for this form
    const currentFormAssignments = assignments.filter(a => a.formId === formId && a.isActive);

    // Fetch products for active assignments in Manage tab
    useEffect(() => {
        if (activeTab !== 'manage') return;

        const loadAssignmentProducts = async () => {
            const newMap: Record<string, Product> = { ...fetchedProductsMap };
            let hasUpdates = false;

            // Group by store to minimize cache reads
            const assignmentsByStore: Record<string, string[]> = {};
            currentFormAssignments.forEach(a => {
                if (a.assignmentType === 'product' && a.productId) {
                    const key = `${a.storeId}_${a.productId}`;
                    // Skip if already in map
                    if (fetchedProductsMap[key]) return;

                    if (!assignmentsByStore[a.storeId]) assignmentsByStore[a.storeId] = [];
                    assignmentsByStore[a.storeId].push(a.productId);
                }
            });

            for (const storeId in assignmentsByStore) {
                try {
                    const cache = await getProductsFromCache(storeId);
                    if (cache && cache.products) {
                        assignmentsByStore[storeId].forEach(pid => {
                            const p = cache.products.find(prod => prod.id.toString() === pid);
                            if (p) {
                                newMap[`${storeId}_${pid}`] = p;
                                hasUpdates = true;
                            }
                        });
                    }
                } catch (e) {
                    console.error("Failed to load products for assignment", e);
                }
            }

            if (hasUpdates) setFetchedProductsMap(newMap);
        };

        loadAssignmentProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, currentFormAssignments.length]); // Optimized dependencies

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
            setSelectedAssignmentIds([]);

            if (currentFormAssignments.length > 0) {
                setActiveTab('manage');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

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

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(productSearch.toLowerCase())
    );

    const handleSelectAllProducts = () => {
        const ids = filteredProducts.map(p => p.id.toString());
        // Merge unique
        const newSet = new Set([...selectedProductIds, ...ids]);
        setSelectedProductIds(Array.from(newSet));
        toast.success(`Selected ${ids.length} visible products`);
    };

    const handleDeselectAllProducts = () => {
        setSelectedProductIds([]);
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
            toast.success('Published successfully!');

            // Clear selection and move to manage tab
            setSelectedProductIds([]);
            setActiveTab('manage');
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

    // Bulk Management
    const toggleAssignmentSelection = (id: string) => {
        setSelectedAssignmentIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkUnpublish = async () => {
        if (selectedAssignmentIds.length === 0) return;

        setIsUnpublishing(true);
        const loadingToast = toast.loading(`Unpublishing ${selectedAssignmentIds.length} items...`);

        try {
            const promises = selectedAssignmentIds.map(async (assignId) => {
                const assignment = currentFormAssignments.find(a => a.id === assignId);
                if (!assignment) return;

                const store = stores.find(s => s.id === assignment.storeId);
                if (!store || !store.clientId || !store.clientSecret) return; // Skip if cant find store creds

                const subdomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');
                const ownerId = assignment.assignmentType === 'product' ? assignment.productId : undefined;

                // 1. Remove from Shopify
                await removeFormFromShopify(subdomain, store.clientId, store.clientSecret, undefined, ownerId)
                    .catch(e => console.warn(`Failed to remove from shopify for ${assignId}`, e));

                // 2. Remove from Firebase
                await deleteAssignment(assignId);
            });

            await Promise.allSettled(promises);
            toast.success("Bulk unpublish complete");
            setSelectedAssignmentIds([]);

        } catch (error) {
            console.error("Bulk unpublish error", error);
            toast.error("Some items failed to unpublish");
        } finally {
            toast.dismiss(loadingToast);
            setIsUnpublishing(false);
        }
    };

    const handleSingleUnpublish = async (assignment: any) => {
        const store = stores.find(s => s.id === assignment.storeId);
        if (!store || !store.clientId || !store.clientSecret) {
            toast.error('Store credentials missing');
            return;
        }

        const subdomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');
        const loadingToast = toast.loading('Unpublishing...');

        try {
            // 1. Remove from Shopify (Metafield)
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0 bg-slate-50">
                <SheetHeader className="px-6 py-4 bg-white border-b sticky top-0 z-10">
                    <SheetTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <UploadCloud size={18} />
                        </div>
                        Publish Form
                    </SheetTitle>
                    <SheetDescription>
                        Manage where your form appears on your store.
                    </SheetDescription>
                </SheetHeader>

                <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 pt-4 bg-white border-b">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="publish">Publish New</TabsTrigger>
                            <TabsTrigger value="manage" className="relative group">
                                Manage Active
                                {currentFormAssignments.length > 0 && (
                                    <span className="ml-2 bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        {currentFormAssignments.length}
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="publish" className="flex-1 overflow-y-auto p-6 space-y-4 focus:outline-none">
                        {/* Step 1: Store Selection */}
                        {step === 1 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <h3 className="text-sm font-semibold text-slate-900">Select a Store</h3>
                                {storesLoading ? (
                                    <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-slate-300" /></div>
                                ) : stores.length === 0 ? (
                                    <div className="text-center py-12 px-4 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                        <Store className="mx-auto mb-2 opacity-50" size={32} />
                                        <p>No connected stores found.</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {stores.map(store => (
                                            <button
                                                key={store.id}
                                                onClick={() => {
                                                    setSelectedStoreId(store.id);
                                                    setStep(2);
                                                }}
                                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-500 hover:bg-slate-50 hover:shadow-sm transition-all text-left group relative overflow-hidden"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                                    <Store size={20} />
                                                </div>
                                                <div className="flex-1 z-10">
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-900">{store.name}</p>
                                                    <p className="text-xs text-slate-500 font-mono mt-0.5">{store.url}</p>
                                                </div>
                                                <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Scope Selection */}
                        {step === 2 && (
                            <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between shrink-0 mb-4 bg-white p-3 rounded-lg border shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Store size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-900">{stores.find(s => s.id === selectedStoreId)?.name}</h3>
                                            <p className="text-[10px] text-slate-500">Target Store</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs h-7 hover:bg-slate-50">Change</Button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 shrink-0 mb-4">
                                    <button
                                        onClick={() => setAssignmentType('store')}
                                        className={cn(
                                            "p-4 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-2 relative overflow-hidden",
                                            assignmentType === 'store'
                                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <Store size={20} className={cn("mb-1", assignmentType === 'store' ? "text-indigo-600" : "text-slate-400")} />
                                        Entire Store
                                        {assignmentType === 'store' && <div className="absolute inset-0 bg-indigo-500/5" />}
                                    </button>
                                    <button
                                        onClick={() => setAssignmentType('product')}
                                        className={cn(
                                            "p-4 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center gap-2 relative overflow-hidden",
                                            assignmentType === 'product'
                                                ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <Package size={20} className={cn("mb-1", assignmentType === 'product' ? "text-indigo-600" : "text-slate-400")} />
                                        Specific Products
                                        {assignmentType === 'product' && <div className="absolute inset-0 bg-indigo-500/5" />}
                                    </button>
                                </div>

                                {assignmentType === 'product' && (
                                    <div className="flex-1 flex flex-col min-h-[300px] border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                        <div className="p-3 border-b bg-slate-50/50 flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        placeholder="Search products..."
                                                        value={productSearch}
                                                        onChange={e => setProductSearch(e.target.value)}
                                                        className="h-9 pl-9 text-xs bg-white border-slate-200 focus:border-indigo-500"
                                                    />
                                                </div>
                                                <Button size="icon" variant="outline" className="h-9 w-9 bg-white" onClick={handleSyncProducts} disabled={syncingProducts} title="Sync Products">
                                                    <RefreshCw size={14} className={cn(syncingProducts && "animate-spin")} />
                                                </Button>
                                            </div>

                                            {/* Bulk Actions */}
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                    {selectedProductIds.length} Selected
                                                </p>
                                                <div className="flex gap-2">
                                                    <button onClick={handleSelectAllProducts} className="text-[10px] font-semibold text-indigo-600 hover:underline hover:text-indigo-700">
                                                        Select All Visible
                                                    </button>
                                                    <span className="text-slate-300">|</span>
                                                    <button onClick={handleDeselectAllProducts} className="text-[10px] font-semibold text-slate-500 hover:underline hover:text-slate-700">
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto bg-white p-2 space-y-1">
                                            {loadingProducts ? (
                                                <div className="flex flex-col items-center justify-center h-40 gap-3">
                                                    <Loader2 className="animate-spin text-indigo-500" />
                                                    <p className="text-xs text-slate-400">Loading products...</p>
                                                </div>
                                            ) : filteredProducts.length === 0 ? (
                                                <div className="text-center py-12 text-slate-400 text-xs">No products found</div>
                                            ) : (
                                                filteredProducts.map(product => {
                                                    const isSelected = selectedProductIds.includes(product.id.toString());
                                                    return (
                                                        <div
                                                            key={product.id}
                                                            onClick={() => toggleProduct(product.id.toString())}
                                                            className={cn(
                                                                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border",
                                                                isSelected
                                                                    ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                                                    : "hover:bg-slate-50 border-transparent hover:border-slate-100"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors",
                                                                isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                                                            )}>
                                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                                            </div>
                                                            <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                                                                {product.image?.src ? (
                                                                    <img src={product.image.src} className="w-full h-full object-cover" loading="lazy" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><Package size={16} /></div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={cn("text-xs font-medium truncate", isSelected ? "text-indigo-900" : "text-slate-700")}>{product.title}</p>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 mt-auto">
                                    <Button
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 font-bold shadow-lg shadow-indigo-200"
                                        onClick={handlePublish}
                                        disabled={isPublishing || (assignmentType === 'product' && selectedProductIds.length === 0)}
                                    >
                                        {isPublishing ? <Loader2 className="animate-spin mr-2" /> : <UploadCloud className="mr-2" size={18} />}
                                        Publish Now
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Conflict Confirmation UI */}
                        {conflictAssignment && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mt-4 animate-in slide-in-from-bottom-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-amber-900 text-sm">Conflict Detected</h3>
                                        <p className="text-xs text-amber-800 mt-1 mb-4 leading-relaxed">
                                            The store <strong>{stores.find(s => s.id === selectedStoreId)?.name}</strong> already has a global form published. Publishing this will replace it.
                                        </p>
                                        <div className="flex gap-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="bg-white border-amber-200 hover:bg-amber-100 text-amber-800"
                                                onClick={() => {
                                                    setConflictAssignment(null);
                                                    setIsPublishing(false);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-amber-600 hover:bg-amber-700 text-white border-0"
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

                    <TabsContent value="manage" className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50 focus:outline-none">
                        {currentFormAssignments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 border border-slate-100">
                                    <UploadCloud className="text-slate-300" size={32} />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900">No active publications</h3>
                                <p className="text-xs text-slate-500 mt-2 max-w-[200px]">
                                    This form is not currently published to any store or product.
                                </p>
                                <Button variant="link" size="sm" onClick={() => setActiveTab('publish')} className="mt-4 text-indigo-600 font-semibold">
                                    Start Publishing
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 pb-16">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Active Assignments ({currentFormAssignments.length})
                                    </h3>
                                    {selectedAssignmentIds.length > 0 && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs px-2"
                                                onClick={() => setSelectedAssignmentIds([])}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="h-7 text-xs px-3"
                                                onClick={handleBulkUnpublish}
                                                disabled={isUnpublishing}
                                            >
                                                {isUnpublishing ? <Loader2 className="animate-spin mr-1" size={12} /> : <Trash2 className="mr-1" size={12} />}
                                                Unpublish ({selectedAssignmentIds.length})
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {currentFormAssignments.map(assignment => {
                                    const store = stores.find(s => s.id === assignment.storeId);
                                    const isSelected = selectedAssignmentIds.includes(assignment.id!);
                                    const product = assignment.assignmentType === 'product' && assignment.productId
                                        ? fetchedProductsMap[`${assignment.storeId}_${assignment.productId}`]
                                        : null;

                                    return (
                                        <div
                                            key={assignment.id}
                                            onClick={() => toggleAssignmentSelection(assignment.id!)}
                                            className={cn(
                                                "cursor-pointer border rounded-xl p-4 bg-white transition-all shadow-sm group hover:shadow-md",
                                                isSelected ? "border-indigo-500 ring-1 ring-indigo-500/20 bg-indigo-50/10" : "border-slate-200 hover:border-indigo-300"
                                            )}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Checkbox */}
                                                <div
                                                    className={cn(
                                                        "w-5 h-5 rounded border mt-0.5 flex items-center justify-center cursor-pointer transition-colors shrink-0",
                                                        isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white group-hover:border-slate-400"
                                                    )}
                                                >
                                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between mb-2 gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            {assignment.assignmentType === 'store' ? (
                                                                <div className='flex items-center gap-2 mb-1'>
                                                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                                                        <Store size={16} />
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-sm text-slate-900">Entire Store</h4>
                                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                                            <Store size={10} />
                                                                            <span className="truncate">{store?.name || 'Unknown Store'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className='flex items-start gap-3'>
                                                                    <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                                        {product?.image?.src ? (
                                                                            <img src={product.image.src} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-slate-400"><Package size={18} /></div>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-bold text-sm text-slate-900 truncate leading-tight mb-1">
                                                                            {product?.title || `Product #${assignment.productId}`}
                                                                        </h4>
                                                                        {product && (
                                                                            <div className="flex items-center gap-3 text-xs text-slate-500 mb-1">
                                                                                <span className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                                    {product.price}
                                                                                </span>
                                                                                {/* variants count? product doesn't expose variants in simplified view unless we look at types */}
                                                                                {/* Assuming product type has id, title, image, handle. Price is often missing in simplified view. */}
                                                                                {/* Let's verify Product type in lib/products if possible, but for now this is mockup data or best effort */}
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                                            <Store size={10} />
                                                                            <span className="truncate max-w-[150px]">{store?.name || 'Unknown Store'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col items-end gap-2">
                                                            <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                Active
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end mt-2 pt-2 border-t border-slate-100">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Don't trigger select
                                                                handleSingleUnpublish(assignment);
                                                            }}
                                                            className="text-xs text-slate-400 hover:text-red-600 font-medium transition-colors flex items-center gap-1 px-2 py-1 hover:bg-red-50 rounded"
                                                        >
                                                            <Trash2 size={12} /> Remove Assignment
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    );
};


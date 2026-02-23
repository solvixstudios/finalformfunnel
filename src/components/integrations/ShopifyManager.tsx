import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useConnectedStores } from '@/lib/firebase/hooks';
import { getAdapter, LOADER_VERSION } from '@/lib/integrations';
import { cn } from '@/lib/utils';
import {
    Activity,
    Check,
    ExternalLink,
    Loader2,
    MoreVertical,
    Plus,
    RotateCw,
    Trash2
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { notifyProductSyncComplete, syncProductsFromShopify } from '@/lib/products';

const CURRENT_LOADER_VERSION = LOADER_VERSION;

interface ShopifyManagerProps {
    userId: string;
    onAddStore?: () => void;
    showHeader?: boolean;
    viewMode?: 'list' | 'grid' | 'horizontal';
    className?: string;
}

export function ShopifyManager({ userId, onAddStore, showHeader = true, viewMode = 'list', className }: ShopifyManagerProps) {
    const { stores, updateStore, deleteStore, loading } = useConnectedStores(userId);

    const [processingStoreId, setProcessingStoreId] = useState<string | null>(null);
    const [storeToDelete, setStoreToDelete] = useState<string | null>(null);

    // Filter only shopify stores just in case
    const shopifyStores = stores.filter(s => s.platform === 'shopify');

    const handleEnableLoader = async (store: any) => {
        setProcessingStoreId(store.id);
        const loadingToast = toast.loading('Enabling loader...');

        try {
            const subdomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');
            if (!store.clientId || !store.clientSecret) {
                toast.error('Store credentials missing. Please reconnect.');
                setProcessingStoreId(null);
                return;
            }
            const shopifyAdapter = getAdapter('shopify');
            const result = await shopifyAdapter.enableLoader(subdomain, {
                clientId: store.clientId,
                clientSecret: store.clientSecret
            });

            toast.dismiss(loadingToast);

            if (result.success) {
                await updateStore(store.id, {
                    loaderInstalled: true,
                    loaderVersion: result.version || CURRENT_LOADER_VERSION,
                    loaderScriptTagId: result.scriptId,
                    loaderInstalledAt: new Date().toISOString()
                });

                if (result.upgraded) {
                    toast.success(`Loader upgraded to v${result.version}!`);
                } else if (result.alreadyInstalled) {
                    toast.info(`Loader is already enabled (v${result.version || 'unknown'}).`);
                } else {
                    toast.success(`Loader v${result.version || CURRENT_LOADER_VERSION} enabled successfully!`);
                }
            } else {
                toast.error(result.error || 'Failed to enable loader.');
            }
        } catch (error: any) {
            toast.dismiss(loadingToast);
            toast.error('Failed to enable loader.');
            console.error(error);
        } finally {
            setProcessingStoreId(null);
        }
    };




    const handleDisconnect = (storeId: string) => {
        setStoreToDelete(storeId);
    };

    const handleDeleteStore = async () => {
        if (!storeToDelete) return;
        setProcessingStoreId(storeToDelete);

        try {
            await deleteStore(storeToDelete);
            toast.success('Store disconnected successfully');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to disconnect store');
        } finally {
            setProcessingStoreId(null);
            setStoreToDelete(null);
        }
    };

    const handleSyncAssignments = async (store: any) => {
        setProcessingStoreId(store.id);
        const loadingToast = toast.loading('Syncing assignments...');

        try {
            // We need to fetch all assignments for this store that have empty domain
            // Since we can't easily query "empty" or "missing" efficiently without an index sometimes,
            // let's just query all assignments for this storeId.
            // We need to import db, collection, query, where, getDocs, updateDoc from FIREBASE SDK (not lite)
            // But we are in a component. We can use the firebase hooks exports if available or import from firebase.ts directly?
            // Accessing 'db' from '@/lib/firebase' (exports getFirestore(app))

            // Dynamic import to avoid messing with top level imports if needed, or just standard import.
            // Let's use the 'api.ts' or 'hooks.ts' but those are hooks.
            // We'll implemented it here inline with imports from 'firebase/firestore'.

            const { collection, query, where, getDocs, writeBatch, doc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const q = query(collection(db, "assignments"), where("storeId", "==", store.id));
            const snapshot = await getDocs(q);

            const batch = writeBatch(db);
            let updates = 0;

            const domain = store.url; // Ensure this is the correct domain format (myshopify)

            snapshot.docs.forEach(d => {
                const data = d.data();
                if (!data.shopifyDomain || data.shopifyDomain !== domain) {
                    batch.update(doc(db, "assignments", d.id), { shopifyDomain: domain });
                    updates++;
                }
            });

            if (updates > 0) {
                await batch.commit();
                toast.success(`Synced ${updates} assignments.`);
            } else {
                toast.info('All assignments already synced.');
            }

        } catch (e) {
            console.error(e);
            toast.error('Failed to sync assignments.');
        } finally {
            toast.dismiss(loadingToast);
            setProcessingStoreId(null);
        }
    }

    const handleRefreshProducts = async (store: any) => {
        setProcessingStoreId(store.id);
        const loadingToast = toast.loading('Refreshing products...');

        try {
            const syncedProducts = await syncProductsFromShopify(store);
            notifyProductSyncComplete(store.id, syncedProducts);
            toast.success(`Successfully refreshed ${syncedProducts.length} products`);
        } catch (error: any) {
            console.error("Refresh failed:", error);
            toast.error(error.message || 'Failed to refresh products');
        } finally {
            toast.dismiss(loadingToast);
            setProcessingStoreId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {!showHeader && (
                <div className="flex items-center justify-between">
                    {/* Header Action for 'Hub' Style removed to avoid duplication */}
                </div>
            )}

            {shopifyStores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                        <span className="text-2xl grayscale opacity-50">🛍️</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">No stores connected yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Connect your Shopify store to sync products and orders.</p>
                    {onAddStore && (
                        <Button
                            className="mt-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-100 px-5 h-9 text-xs font-medium rounded-full transition-all hover:scale-105"
                            onClick={onAddStore}
                        >
                            Connect First Store
                        </Button>
                    )}
                </div>
            ) : (
                <div className={cn(
                    viewMode === 'grid'
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        : viewMode === 'horizontal'
                            ? "flex overflow-x-auto pb-4 gap-4 snap-x pr-4"
                            : "flex flex-col gap-3"
                )}>
                    {shopifyStores.map(store => {
                        const isLoaderActive = store.loaderInstalled;
                        const isProcessing = processingStoreId === store.id;

                        if (viewMode === 'grid' || viewMode === 'horizontal') {
                            return (
                                <div
                                    key={store.id}
                                    className={cn(
                                        "group relative bg-white border border-slate-200 rounded-3xl p-5 hover:shadow-lg transition-all duration-300 hover:border-indigo-100 flex flex-col justify-between min-h-[180px]",
                                        viewMode === 'horizontal' && "min-w-[300px] w-[300px] shrink-0 snap-center"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none rounded-3xl" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none" />

                                    {/* Top Row: Icon + Settings */}
                                    <div className="flex items-start justify-between relative z-10 w-full">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#95BF47]/10 to-[#5E8E3E]/10 flex items-center justify-center text-2xl shadow-sm border border-[#95BF47]/20">
                                            <span>🛍️</span>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 -mr-2 -mt-1">
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl">

                                                <DropdownMenuItem onClick={() => window.open(`https://${store.url}`, '_blank')}>
                                                    <ExternalLink size={14} className="mr-2" /> Visit Store
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => handleRefreshProducts(store)}>
                                                    <RotateCw size={14} className="mr-2" /> Refresh Products
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSyncAssignments(store)}>
                                                    <Activity size={14} className="mr-2" /> Sync Assignments
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => handleDisconnect(store.id)}>
                                                    <Trash2 size={14} className="mr-2" /> Disconnect
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Info Section */}
                                    <div className="mt-4 relative z-10 space-y-2">
                                        <h3 className="text-base font-bold text-slate-900 truncate tracking-tight">{store.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <div className={cn(
                                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border w-fit",
                                                isLoaderActive
                                                    ? "bg-green-50 text-green-700 border-green-200"
                                                    : "bg-slate-100 text-slate-500 border-slate-200"
                                            )}>
                                                {isLoaderActive ? 'Active' : 'Inactive'}
                                            </div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={isProcessing || isLoaderActive}
                                                            onClick={() => handleEnableLoader(store)}
                                                            className={cn(
                                                                "h-7 px-2 text-[10px] font-medium transition-colors ml-auto",
                                                                isLoaderActive
                                                                    ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                                                                    : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                            )}
                                                        >
                                                            {isProcessing ? (
                                                                <Loader2 size={12} className="animate-spin mr-1.5" />
                                                            ) : isLoaderActive ? (
                                                                <Check size={12} className="mr-1.5" />
                                                            ) : (
                                                                <Activity size={12} className="mr-1.5" />
                                                            )}
                                                            {isLoaderActive ? 'Installed' : 'Enable'}
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {isLoaderActive ? "Loader Script v" + store.loaderVersion : "Install Tracking Script"}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Default LIST View
                        return (
                            <div
                                key={store.id}
                                className="group flex items-center justify-between p-4 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-lg shrink-0">
                                        🛍️
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-slate-900 truncate">{store.name}</h4>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100/50">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-semibold text-emerald-700">Active</span>
                                            </div>
                                        </div>
                                        <a
                                            href={`https://${store.url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-slate-500 hover:text-indigo-600 truncate max-w-[200px] block mt-0.5"
                                        >
                                            {store.url || store.shopifyDomain}
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                                <MoreVertical size={16} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-200 shadow-xl p-1">
                                            <DropdownMenuItem className="rounded-lg text-xs font-medium" onClick={() => window.open(`https://${store.url}`, '_blank')}>
                                                <ExternalLink size={14} className="mr-2" /> Visit Store
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg text-xs font-medium" onClick={() => handleRefreshProducts(store)}>
                                                <RotateCw size={14} className="mr-2" /> Refresh Products
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg text-xs font-medium" onClick={() => handleSyncAssignments(store)}>
                                                <Activity size={14} className="mr-2" /> Sync Assignments
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-lg text-xs font-medium text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => handleDisconnect(store.id)}>
                                                <Trash2 size={14} className="mr-2" /> Disconnect
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!storeToDelete} onOpenChange={(open) => !open && !processingStoreId && setStoreToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Store?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to disconnect this store? This will stop product syncing/tracking and PERMANENTLY DELETE all form assignments associated with this store. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={!!processingStoreId}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteStore();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={!!processingStoreId}
                        >
                            {processingStoreId === storeToDelete ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Disconnecting...
                                </>
                            ) : (
                                'Disconnect'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

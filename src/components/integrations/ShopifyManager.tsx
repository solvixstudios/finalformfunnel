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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { disableLoader, enableLoader, LOADER_VERSION } from '@/lib/api';
import { useConnectedStores } from '@/lib/firebase/hooks';
import { notifyProductSyncComplete, syncProductsFromShopify } from '@/lib/products';
import { cn } from '@/lib/utils';
import {
    ArrowUpCircle,
    CheckCircle2,
    ExternalLink,
    Globe,
    Loader2,
    Plus,
    RefreshCw,
    Settings,
    Store,
    Trash2,
    XCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

// import { useI18n } from '@/lib/i18n/i18nContext'; // Not strictly needed if direction passes from parent or isn't used deeply

const CURRENT_LOADER_VERSION = LOADER_VERSION;

interface ShopifyManagerProps {
    userId: string;
    onAddStore?: () => void;
    showHeader?: boolean;
}

export function ShopifyManager({ userId, onAddStore, showHeader = true }: ShopifyManagerProps) {
    const { stores, updateStore, deleteStore, loading } = useConnectedStores(userId);

    const [processingStoreId, setProcessingStoreId] = useState<string | null>(null);
    const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
    const [syncingStoreId, setSyncingStoreId] = useState<string | null>(null);
    const [syncProgress, setSyncProgress] = useState(0);

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
            const result = await enableLoader(subdomain, store.clientId, store.clientSecret);

            toast.dismiss(loadingToast);

            if (result.success) {
                await updateStore(store.id, {
                    loaderInstalled: true,
                    loaderVersion: result.version || CURRENT_LOADER_VERSION,
                    loaderInstalledAt: new Date().toISOString()
                });

                if (result.alreadyInstalled) {
                    toast.info('Loader is already enabled.');
                } else {
                    toast.success('Loader enabled successfully!');
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

    const handleDisableLoader = async (store: any) => {
        setProcessingStoreId(store.id);
        const loadingToast = toast.loading('Disabling loader...');

        try {
            const subdomain = store.url.replace('.myshopify.com', '').replace(/https?:\/\//, '');
            if (!store.clientId || !store.clientSecret) {
                toast.error('Store credentials missing. Please reconnect.');
                setProcessingStoreId(null);
                return;
            }
            const result = await disableLoader(subdomain, store.clientId, store.clientSecret);

            toast.dismiss(loadingToast);

            if (result.success) {
                await updateStore(store.id, {
                    loaderInstalled: false,
                    loaderVersion: null,
                    loaderInstalledAt: null
                });
                toast.success('Loader disabled successfully!');
            } else {
                toast.error(result.error || 'Failed to disable loader.');
            }
        } catch (error: any) {
            toast.dismiss(loadingToast);
            toast.error('Failed to disable loader.');
            console.error(error);
        } finally {
            setProcessingStoreId(null);
        }
    };

    const handleUpgradeLoader = async (store: any) => {
        await handleEnableLoader(store);
    };

    const handleSyncProducts = async (store: any) => {
        setSyncingStoreId(store.id);
        setSyncProgress(0);

        try {
            const products = await syncProductsFromShopify(store, {
                onProgress: (count) => setSyncProgress(count),
            });

            // Notify other components about the sync
            notifyProductSyncComplete(store.id, products);
            toast.success(`Synced ${products.length} products!`);
        } catch (error) {
            toast.error('Failed to sync products.');
            console.error(error);
        } finally {
            setSyncingStoreId(null);
            setSyncProgress(0);
        }
    };



    const handleDeleteStore = async () => {
        if (!storeToDelete) return;

        try {
            await deleteStore(storeToDelete);
            toast.success('Store disconnected successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to disconnect store');
        } finally {
            setStoreToDelete(null);
        }
    };

    const isLatestVersion = (version?: string) => version === CURRENT_LOADER_VERSION;
    const needsUpgrade = (store: any) => store.loaderInstalled && !isLatestVersion(store.loaderVersion);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-6">
                {showHeader && (
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Connected Stores</h3>
                            <p className="text-sm text-slate-500">Manage your Shopify stores and settings.</p>
                        </div>
                        {onAddStore && (
                            <Button onClick={onAddStore} className="bg-[#95BF47] hover:bg-[#85AB3E] text-white">
                                <Plus size={16} className="mr-2" />
                                Connect Store
                            </Button>
                        )}
                    </div>
                )}

                {shopifyStores.length === 0 ? (
                    showHeader ? (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-12">
                            <Store size={48} className="text-slate-300" />
                            <div className="text-center">
                                <p className="font-medium text-slate-600">No Shopify stores connected</p>
                                <p className="text-sm">Connect a store to start syncing products.</p>
                            </div>
                        </div>
                    ) : null
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {shopifyStores.map(store => {


                            return (
                                <Card key={store.id} className="relative overflow-hidden bg-white border-slate-200 hover:shadow-lg transition-all duration-300 group">
                                    {/* Loader Status Indicator Bar */}
                                    <div className={cn(
                                        "absolute top-0 left-0 right-0 h-1",
                                        store.loaderInstalled ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-slate-200"
                                    )} />

                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 min-w-0">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#95BF47]/20 to-[#5E8E3E]/20 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                                                    🛍️
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-900 truncate text-base mb-1">{store.name}</h3>
                                                    <a
                                                        href={`https://${store.url}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 group/link w-fit"
                                                    >
                                                        <Globe size={11} />
                                                        <span className="truncate max-w-[150px] group-hover/link:underline">{store.url}</span>
                                                        <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                    </a>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-slate-600 -mr-2 -mt-2"
                                                    >
                                                        <Settings size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem disabled className="text-xs font-semibold text-slate-500 bg-slate-50 opacity-100 py-1.5">
                                                        Store Actions
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleSyncProducts(store)} disabled={syncingStoreId === store.id}>
                                                        <RefreshCw size={14} className={cn("mr-2", syncingStoreId === store.id && "animate-spin")} />
                                                        Sync Products
                                                    </DropdownMenuItem>

                                                    <div className="h-px bg-slate-100 my-1" />
                                                    <DropdownMenuItem disabled className="text-xs font-semibold text-slate-500 bg-slate-50 opacity-100 py-1.5">
                                                        Loader Settings
                                                    </DropdownMenuItem>

                                                    {store.loaderInstalled ? (
                                                        <>
                                                            {needsUpgrade(store) && (
                                                                <DropdownMenuItem onClick={() => handleUpgradeLoader(store)} disabled={processingStoreId === store.id} className="text-amber-600 focus:text-amber-700 focus:bg-amber-50">
                                                                    <ArrowUpCircle size={14} className="mr-2" />
                                                                    Upgrade Loader
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem onClick={() => handleDisableLoader(store)} disabled={processingStoreId === store.id} className="text-red-600 focus:text-red-700 focus:bg-red-50">
                                                                <XCircle size={14} className="mr-2" />
                                                                Disable Loader
                                                            </DropdownMenuItem>
                                                        </>
                                                    ) : (
                                                        <DropdownMenuItem onClick={() => handleEnableLoader(store)} disabled={processingStoreId === store.id} className="text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                                                            <CheckCircle2 size={14} className="mr-2" />
                                                            Enable Loader
                                                        </DropdownMenuItem>
                                                    )}

                                                    <div className="h-px bg-slate-100 my-1" />

                                                    <DropdownMenuItem
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        onClick={() => setStoreToDelete(store.id)}
                                                    >
                                                        <Trash2 size={14} className="mr-2" />
                                                        Disconnect
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="mt-4 flex items-center gap-2">
                                            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
                                                Connected
                                            </Badge>

                                            {store.loaderInstalled ? (
                                                <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-none font-medium">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                                                    Loader Active v{store.loaderInstalled ? store.loaderVersion : ''}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] text-slate-400 border-dashed">
                                                    Loader Inactive
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}



                {/* Delete Confirmation Dialog */}
                <AlertDialog open={!!storeToDelete} onOpenChange={(open) => !open && setStoreToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect Store?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to disconnect this store? This will stop product syncing and disable the loader.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteStore}
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                                Disconnect
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}

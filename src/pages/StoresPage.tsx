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
import { notifyProductSyncComplete, syncProductsFromShopify } from '@/lib/products';
import { cn } from '@/lib/utils';
import {
    ArrowUpCircle,
    CheckCircle2,
    ExternalLink,
    Globe,
    Loader2,
    Package,
    Plug,
    RefreshCw,
    Settings,
    Store,
    Trash2,
    XCircle
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { FormAssignmentSheet } from '../components/FormAssignmentSheet';
import { useConnectedStores } from '../lib/firebase/hooks';
import { useI18n } from '../lib/i18n/i18nContext';

// Current loader version - from centralized API config
const CURRENT_LOADER_VERSION = LOADER_VERSION;

interface StoresPageProps {
    userId: string;
}

export default function StoresPage({ userId }: StoresPageProps) {
    const { t, dir } = useI18n();
    const { stores, updateStore, deleteStore, loading } = useConnectedStores(userId);
    const [processingStoreId, setProcessingStoreId] = useState<string | null>(null);
    const [activeAssignmentStoreId, setActiveAssignmentStoreId] = useState<string | null>(null);
    const [storeToDelete, setStoreToDelete] = useState<string | null>(null);
    const [syncingStoreId, setSyncingStoreId] = useState<string | null>(null);
    const [syncProgress, setSyncProgress] = useState(0);

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
            <div className="max-w-[1600px] mx-auto p-6 flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-6 h-full flex flex-col" dir={dir}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 shrink-0">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Store className="text-indigo-600" />
                        Connected Stores
                        <Badge variant="secondary" className="ml-2 font-mono text-xs">
                            {stores.length}
                        </Badge>
                    </h1>
                    <p className="text-sm text-slate-500 max-w-2xl">
                        Manage your connected stores, enable the loader, sync products, and assign forms.
                    </p>
                </div>
            </div>

            {/* Stores Grid */}
            {stores.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-12">
                    <Store size={48} className="text-slate-300" />
                    <div className="text-center">
                        <p className="font-medium text-slate-600">No stores connected</p>
                        <p className="text-sm">Go to Integrations to connect your first store.</p>
                    </div>
                    <Button variant="outline" onClick={() => window.location.href = '/dashboard/integrations'}>
                        <Plug size={16} className="mr-2" />
                        Go to Integrations
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                    {stores.map(store => (
                        <Card key={store.id} className="relative overflow-hidden bg-white border-slate-200 hover:shadow-lg transition-all duration-300 group">
                            {/* Loader Status Indicator Bar */}
                            <div className={cn(
                                "absolute top-0 left-0 right-0 h-1",
                                store.loaderInstalled ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-slate-200"
                            )} />

                            <CardContent className="p-5 pt-6">
                                {/* Store Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#95BF47]/20 to-[#5E8E3E]/20 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                                        🛍️
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate text-base">{store.name}</h3>
                                        <a
                                            href={`https://${store.url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 group/link"
                                        >
                                            <Globe size={11} />
                                            <span className="truncate group-hover/link:underline">{store.url}</span>
                                            <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                        </a>
                                    </div>
                                </div>

                                {/* Status Badges */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                                        <CheckCircle2 size={10} className="mr-1" />
                                        Connected
                                    </Badge>

                                    {store.loaderInstalled ? (
                                        <>
                                            <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                                                <CheckCircle2 size={10} className="mr-1" />
                                                Loader Enabled
                                            </Badge>
                                            {isLatestVersion(store.loaderVersion) ? (
                                                <Badge variant="outline" className="text-[10px] text-slate-500">
                                                    v{store.loaderVersion}
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                                                    <ArrowUpCircle size={10} className="mr-1" />
                                                    Update Available
                                                </Badge>
                                            )}
                                        </>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] text-slate-400">
                                            <XCircle size={10} className="mr-1" />
                                            Loader Disabled
                                        </Badge>
                                    )}
                                </div>

                                {/* Primary Actions */}
                                <div className="space-y-2">
                                    {store.loaderInstalled ? (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="flex-1 h-9 text-xs bg-indigo-600 hover:bg-indigo-700"
                                                onClick={() => setActiveAssignmentStoreId(store.id)}
                                            >
                                                <Package size={14} className="mr-1.5" />
                                                Assign Forms
                                            </Button>
                                            {needsUpgrade(store) && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                                                    onClick={() => handleUpgradeLoader(store)}
                                                    disabled={processingStoreId === store.id}
                                                >
                                                    {processingStoreId === store.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <>
                                                            <ArrowUpCircle size={14} className="mr-1" />
                                                            Upgrade
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            className="w-full h-9 text-xs bg-green-600 hover:bg-green-700"
                                            onClick={() => handleEnableLoader(store)}
                                            disabled={processingStoreId === store.id}
                                        >
                                            {processingStoreId === store.id ? (
                                                <Loader2 size={14} className="animate-spin mr-1.5" />
                                            ) : (
                                                <CheckCircle2 size={14} className="mr-1.5" />
                                            )}
                                            Enable Loader
                                        </Button>
                                    )}

                                    {/* Secondary Actions */}
                                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="flex-1 h-8 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                                            onClick={() => handleSyncProducts(store)}
                                            disabled={syncingStoreId === store.id}
                                        >
                                            <RefreshCw size={12} className={cn("mr-1.5", syncingStoreId === store.id && "animate-spin")} />
                                            {syncingStoreId === store.id ? `Syncing (${syncProgress})...` : 'Sync Products'}
                                        </Button>

                                        {store.loaderInstalled && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDisableLoader(store)}
                                                disabled={processingStoreId === store.id}
                                            >
                                                {processingStoreId === store.id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <XCircle size={12} className="mr-1" />
                                                        Disable
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                                                >
                                                    <Settings size={14} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                    onClick={() => setStoreToDelete(store.id)}
                                                >
                                                    <Trash2 size={14} className="mr-2" />
                                                    Disconnect Store
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Assignment Sheet */}
            {activeAssignmentStoreId && (
                <FormAssignmentSheet
                    open={!!activeAssignmentStoreId}
                    onOpenChange={(open) => !open && setActiveAssignmentStoreId(null)}
                    userId={userId}
                    initialStoreId={activeAssignmentStoreId}
                />
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
    );
}

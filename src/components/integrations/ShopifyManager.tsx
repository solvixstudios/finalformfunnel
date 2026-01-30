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
import { enableLoader, LOADER_VERSION } from '@/lib/api';
import { useConnectedStores } from '@/lib/firebase/hooks';
import { cn } from '@/lib/utils';
import {
    Activity,
    Check,
    ExternalLink,
    Loader2,
    MoreVertical,
    Plus,
    RefreshCw,
    Settings2,
    Trash2
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
            const result = await enableLoader(subdomain, store.clientId, store.clientSecret);

            toast.dismiss(loadingToast);

            if (result.success) {
                await updateStore(store.id, {
                    loaderInstalled: true,
                    loaderVersion: result.version || CURRENT_LOADER_VERSION,
                    loaderScriptTagId: result.scriptTagId,
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

    const handleReinstall = async (store: any) => {
        await handleEnableLoader(store);
    };

    const handleDisconnect = (storeId: string) => {
        setStoreToDelete(storeId);
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

                    {/* Header Action for 'Hub' Style */}
                    {onAddStore && (
                        <Button onClick={onAddStore} className="rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-orange-500/25 px-5 h-10 transition-all hover:scale-105">
                            <Plus size={18} className="mr-2" />
                            Connect New Store
                        </Button>
                    )}
                </div>
            )}

            {shopifyStores.length === 0 ? (
                // Empty State remains clean but uses no-scroll principles (if needed, but usually this is small)
                <div className="text-center py-12 rounded-[2rem] border border-slate-200/60 border-dashed bg-slate-50/30">
                    <p className="text-slate-400 font-medium">No stores connected yet.</p>
                    {onAddStore && (
                        <Button variant="link" onClick={onAddStore} className="mt-2 text-indigo-600">
                            Connect your first store
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
                                                <DropdownMenuItem onClick={() => handleReinstall(store)}>
                                                    <RefreshCw size={14} className="mr-2" /> Re-install Script
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => window.open(`https://${store.url}`, '_blank')}>
                                                    <ExternalLink size={14} className="mr-2" /> Visit Store
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
                                className="group relative flex items-center gap-6 p-4 pr-6 bg-white border border-slate-200/60 rounded-[2rem] hover:bg-slate-50/50 hover:border-slate-300 transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

                                {/* Icon / Logo Area */}
                                <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#95BF47]/10 to-[#5E8E3E]/10 flex items-center justify-center text-3xl shrink-0 shadow-sm border border-[#95BF47]/20 group-hover:scale-105 transition-transform">
                                    <span className="drop-shadow-sm">🛍️</span>
                                    {/* Connection Dot on Logo */}
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm">
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                    </div>
                                </div>

                                {/* Main Info */}
                                <div className="flex-1 min-w-0 relative z-10 flex flex-col justify-center h-full">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-slate-900 truncate tracking-tight">{store.name}</h3>
                                        {/* Status Pill */}
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider backdrop-blur-md",
                                            isLoaderActive
                                                ? "bg-green-50/50 border-green-200 text-green-700"
                                                : "bg-slate-100/50 border-slate-200 text-slate-500"
                                        )}>
                                            {isLoaderActive && (
                                                <span className="relative flex h-2 w-2 mr-0.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                            )}
                                            {isLoaderActive ? `Loader v${store.loaderVersion || '?'}` : 'Loader Inactive'}
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium truncate mt-0.5 flex items-center gap-2">
                                        <span className="opacity-70">URL:</span>
                                        {store.url}
                                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 -mt-0.5" />
                                    </p>
                                </div>

                                {/* Actions Area - Right Side */}
                                <div className="relative z-10 flex items-center gap-2 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={isProcessing || isLoaderActive}
                                                    onClick={() => handleEnableLoader(store)}
                                                    className={cn(
                                                        "h-10 w-10 rounded-full border",
                                                        isLoaderActive
                                                            ? "bg-green-50/50 text-green-600 border-green-100 cursor-default hover:bg-green-50"
                                                            : "bg-white text-slate-400 border-slate-200 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50"
                                                    )}
                                                >
                                                    {isProcessing ? (
                                                        <Loader2 size={18} className="animate-spin text-indigo-600" />
                                                    ) : isLoaderActive ? (
                                                        <Check size={18} />
                                                    ) : (
                                                        <Activity size={18} />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {isLoaderActive ? "Script Installed" : "Install Tracking Script"}
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300">
                                                <Settings2 size={18} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl">
                                            <DropdownMenuItem onClick={() => handleReinstall(store)}>
                                                <RefreshCw size={14} className="mr-2" /> Re-install Script
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => handleDisconnect(store.id)}>
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
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Disconnect
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

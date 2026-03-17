import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import {
    ArrowRight,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    Download,
    ExternalLink,
    KeyRound,
    Loader2,
    MoreHorizontal,
    Plus,
    Radio,
    RotateCw,
    Trash2,
    XCircle,
    Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConnectedStores } from '@/lib/firebase/hooks';
import { syncProductsFromStore } from '@/lib/products';
import { cn } from '@/lib/utils';

// Custom Icon
const WooIcon = () => (
    <FontAwesomeIcon icon={faBoxOpen} className="text-[#96588a] text-xl md:text-2xl" />
);

interface WoocommerceIntegrationProps {
    userId: string;
    onBack?: () => void;
}

// __APP_VERSION__ is injected by Vite during build
declare const __APP_VERSION__: string;
const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

const PLUGIN_DOWNLOAD_URL = `/finalform-woocommerce-${appVersion}.zip`;

// ─── Wizard Step Components ──────────────────────────────────────────────────

function StepDownload({ onNext }: { onNext: () => void }) {
    return (
        <div className="flex flex-col items-center text-center max-w-lg mx-auto py-8 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#96588a]/20 to-[#96588a]/5 border border-[#96588a]/20 flex items-center justify-center mb-6">
                <Download size={36} className="text-[#96588a]" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Install the Plugin</h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-md">
                Download the Final Form plugin and install it on your WordPress site.
                Go to <strong className="text-slate-700">Plugins → Add New → Upload Plugin</strong>, then activate it.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <Button
                    asChild
                    variant="outline"
                    className="h-12 rounded-xl text-sm font-semibold border-slate-200 hover:bg-slate-50 hover:text-slate-900 w-full sm:w-auto px-6"
                >
                    <a href={PLUGIN_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                        <Download size={16} className="mr-2" /> Download Plugin (.zip)
                    </a>
                </Button>

                <Button
                    onClick={onNext}
                    className="h-12 rounded-xl text-sm font-bold bg-[#96588a] hover:bg-[#7a4670] text-white shadow-sm w-full sm:w-auto px-6"
                >
                    I Already Installed It <ArrowRight size={16} className="ml-2" />
                </Button>
            </div>

            <p className="text-xs text-slate-400 mt-6">
                Plugin version: <span className="font-mono">{appVersion}</span>
            </p>
        </div>
    );
}

function StepGenerateKey({
    generatedKey,
    keyCopied,
    onGenerate,
    onCopy,
    onNext,
    isGenerating,
}: {
    generatedKey: string;
    keyCopied: boolean;
    onGenerate: () => void;
    onCopy: () => void;
    onNext: () => void;
    isGenerating: boolean;
}) {
    // Auto-generate key on mount if not already generated
    useEffect(() => {
        if (!generatedKey) {
            onGenerate();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-col items-center text-center max-w-lg mx-auto py-8 animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 flex items-center justify-center mb-6">
                <KeyRound size={36} className="text-amber-600" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Copy Your Secure Key</h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-md">
                Copy this key, then go to your WordPress sidebar → <strong className="text-slate-700">Final Form</strong> → paste it in the <strong className="text-slate-700">Installation Key</strong> field, and hit <strong className="text-slate-700">Save Settings</strong>.
            </p>

            {generatedKey ? (
                <div className="w-full space-y-4">
                    <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-lg">
                        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                            Your Installation Key
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-black/40 rounded-lg px-4 py-3 font-mono text-sm text-emerald-400 select-all overflow-x-auto ring-1 ring-white/10 break-all">
                                {generatedKey}
                            </div>
                            <Button
                                variant="secondary"
                                onClick={onCopy}
                                className={cn(
                                    "h-11 px-5 rounded-lg text-sm font-bold shrink-0 transition-all",
                                    keyCopied
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                        : "bg-white hover:bg-slate-100 text-slate-900"
                                )}
                            >
                                {keyCopied ? <Check size={16} className="mr-1.5" /> : <Copy size={16} className="mr-1.5" />}
                                {keyCopied ? 'Copied' : 'Copy'}
                            </Button>
                        </div>
                    </div>

                    <Button
                        onClick={onNext}
                        className="h-12 rounded-xl text-sm font-bold w-full bg-[#96588a] hover:bg-[#7a4670] text-white shadow-sm transition-all"
                    >
                        I've Pasted It in WordPress <ArrowRight size={16} className="ml-2" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 size={16} className="animate-spin" /> Generating key...
                </div>
            )}
        </div>
    );
}

function StepVerify({ isSuccess, storeDomain }: { isSuccess: boolean; storeDomain: string | null }) {
    return (
        <div className="flex flex-col items-center text-center max-w-lg mx-auto py-8 animate-in fade-in duration-300">
            {isSuccess ? (
                <>
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-100 to-green-50 border border-green-200 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                        <CheckCircle2 size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Connection Established!</h2>
                    <p className="text-sm text-green-700 font-medium mb-2">
                        {storeDomain ? `${storeDomain} is now securely linked.` : 'Your store is now securely linked.'}
                    </p>
                    <p className="text-xs text-slate-400">
                        Redirecting you back to integrations...
                    </p>
                </>
            ) : (
                <>
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-50 border border-blue-200 flex items-center justify-center mb-6">
                        <Radio size={36} className="text-blue-600 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Listening for your store...</h2>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-md">
                        We're waiting for WordPress to confirm the connection. Make sure you click <strong className="text-slate-700">Save Settings</strong> inside the Final Form page on your WordPress site.
                    </p>

                    <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-5 py-3">
                        <Loader2 size={18} className="text-blue-600 animate-spin" />
                        <span className="text-sm font-medium text-blue-700">Waiting for webhook ping...</span>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function WoocommerceIntegration({ userId, onBack }: WoocommerceIntegrationProps) {
    const { stores, addStore, deleteStore } = useConnectedStores(userId);

    const [view, setView] = useState<'list' | 'add'>('list');
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [generatedKey, setGeneratedKey] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [processingStoreId, setProcessingStoreId] = useState<string | null>(null);
    const [keyCopied, setKeyCopied] = useState(false);
    const [connectedDomain, setConnectedDomain] = useState<string | null>(null);

    // Get all connected WooCommerce stores
    const wooStores = useMemo(() => stores.filter((s) => s.platform === 'woocommerce'), [stores]);

    const handleCancel = useCallback(() => {
        setView('list');
        setStep(1);
        setGeneratedKey('');
        setKeyCopied(false);
        setConnectedDomain(null);
    }, []);

    // Generate key locally encoded with userId
    const handleGenerateKey = useCallback(() => {
        setIsGenerating(true);
        try {
            const randomHex = crypto.randomUUID().replace(/-/g, '');
            const key = `ff_wc_${userId}_${randomHex}`;
            setGeneratedKey(key);
            toast.success('Installation key generated!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to generate key.');
        } finally {
            setIsGenerating(false);
        }
    }, [userId]);

    // Copy key to clipboard
    const handleCopyKey = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(generatedKey);
            setKeyCopied(true);
            toast.success('Key copied to clipboard!');
            setTimeout(() => setKeyCopied(false), 5000);
        } catch {
            toast.error('Failed to copy key.');
        }
    }, [generatedKey]);

    // Auto-listen for connection on steps 2 AND 3 (passive Firestore listener)
    // The useConnectedStores hook has a real-time onSnapshot, so wooStores updates instantly
    useEffect(() => {
        if (generatedKey && view === 'add' && (step === 2 || step === 3)) {
            const foundStore = wooStores.find(
                (s: any) => s.accessToken === generatedKey && s.status === 'connected'
            );
            if (foundStore) {
                setConnectedDomain(foundStore.url || foundStore.storeDomain || foundStore.name || null);
                // Jump to step 3 if not already there (auto-advance from step 2)
                if (step !== 3) {
                    setStep(3);
                }
                toast.success('🎉 Connection verified!');

                // Immediately trigger background sync for the newly connected store
                syncProductsFromStore(foundStore).catch((err) => {
                    console.error('Failed to sync products on connect:', err);
                });

                // Auto-redirect after a moment
                setTimeout(() => {
                    handleCancel();
                }, 3500);
            }
        }
    }, [wooStores, generatedKey, view, step, handleCancel]);

    const handleDeleteStore = async (storeId: string) => {
        if (confirm('Are you sure you want to disconnect this store? All linked configurations will be lost.')) {
            setProcessingStoreId(storeId);
            try {
                await deleteStore(storeId);
                toast.success('Store disconnected.');
            } catch (error: any) {
                console.error(error);
                toast.error(error.message || 'Failed to disconnect the store.');
            } finally {
                setProcessingStoreId(null);
            }
        }
    };

    const handleSyncProducts = async (store: any) => {
        setProcessingStoreId(store.id);
        const loadingToast = toast.loading('Syncing products...');
        try {
            const products = await syncProductsFromStore(store);
            toast.success(`${products.length} products synced!`);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Product sync failed.');
        } finally {
            toast.dismiss(loadingToast);
            setProcessingStoreId(null);
        }
    };

    // ─── ADD STORE VIEW (page-style wizard) ─────────────────────────────────
    if (view === 'add') {
        const isSuccess = !!(connectedDomain || wooStores.find(
            (s: any) => s.accessToken === generatedKey && s.status === 'connected'
        ));

        return (
            <div className="flex-1 flex flex-col h-full bg-slate-50/50">
                <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                    <PageHeader
                        title="Connect WooCommerce Store"
                        breadcrumbs={[
                            { label: 'Integrations', href: '/integrations', onClick: onBack },
                            { label: 'Connect Store', href: '#' }
                        ]}
                        icon={WooIcon}
                        onBack={handleCancel}
                    />
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-2xl mx-auto">

                        {/* Progress indicator */}
                        <div className="flex items-center justify-center gap-2 mb-8">
                            {[1, 2, 3].map((s) => (
                                <React.Fragment key={s}>
                                    <div className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                                        step > s
                                            ? "bg-green-500 text-white shadow-md shadow-green-500/20"
                                            : step === s
                                                ? "bg-[#96588a] text-white shadow-md shadow-[#96588a]/30 scale-110"
                                                : "bg-slate-100 text-slate-400"
                                    )}>
                                        {step > s ? <Check size={14} /> : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={cn(
                                            "w-16 h-0.5 rounded-full transition-all duration-500",
                                            step > s ? "bg-green-500" : "bg-slate-200"
                                        )} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Wizard content — single page at a time */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
                            {step === 1 && (
                                <StepDownload onNext={() => setStep(2)} />
                            )}

                            {step === 2 && (
                                <StepGenerateKey
                                    generatedKey={generatedKey}
                                    keyCopied={keyCopied}
                                    onGenerate={handleGenerateKey}
                                    onCopy={handleCopyKey}
                                    onNext={() => setStep(3)}
                                    isGenerating={isGenerating}
                                />
                            )}

                            {step === 3 && (
                                <StepVerify isSuccess={isSuccess} storeDomain={connectedDomain} />
                            )}
                        </div>

                        {/* Step labels */}
                        <div className="flex items-center justify-center gap-8 mt-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            <span className={cn(step === 1 && "text-[#96588a]")}>Download</span>
                            <span className={cn(step === 2 && "text-[#96588a]")}>Generate Key</span>
                            <span className={cn(step === 3 && (isSuccess ? "text-green-600" : "text-blue-600"))}>Verify</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── LIST VIEW ────────────────────────────────────────────────────────────

    const headerActions = (
        <Button
            size="sm"
            variant="default"
            onClick={() => setView('add')}
            className="h-8 rounded-lg text-xs px-4 shadow-sm"
        >
            <Plus size={13} className="mr-1.5" />
            Connect Store
        </Button>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                <PageHeader
                    title="WooCommerce"
                    breadcrumbs={[
                        { label: 'Integrations', href: '/integrations', onClick: onBack },
                        { label: 'WooCommerce', href: '#' }
                    ]}
                    count={wooStores.length}
                    icon={WooIcon}
                    onBack={onBack}
                    actions={headerActions}
                />
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto w-full">
                    {wooStores.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#96588a]/10 border border-[#96588a]/20 text-[#96588a] flex items-center justify-center mx-auto mb-4">
                                <WooIcon />
                            </div>
                            <h3 className="text-base font-bold text-slate-700 mb-1">No stores connected</h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                                Connect your WooCommerce store to sync products and serve custom order forms.
                            </p>
                            <Button
                                variant="default"
                                onClick={() => setView('add')}
                                className="h-10 rounded-xl text-sm px-6 shadow-sm"
                            >
                                <Plus size={16} className="mr-2" /> Connect Your First Store
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pl-5">Store</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Status</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pr-5 w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {wooStores.map((store) => (
                                        <TableRow
                                            key={store.id}
                                            className="group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                        >
                                            <TableCell className="py-4 pl-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-[#96588a]/10 border border-[#96588a]/20 flex items-center justify-center shrink-0">
                                                        <WooIcon />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 mb-0.5">{store.name}</div>
                                                        {store.url ? (
                                                            <a
                                                                href={`https://${store.url}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 group/link"
                                                            >
                                                                {store.url}
                                                                <ExternalLink size={10} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Waiting for plugin activation...</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {store.status === 'connected' ? (
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 font-semibold gap-1">
                                                        <Check size={12} /> Connected
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 font-semibold gap-1">
                                                        <Clock size={12} /> Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4 pr-5 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                                        {store.url && (
                                                            <DropdownMenuItem className="text-xs font-medium" onClick={() => window.open(`https://${store.url}`, '_blank')}>
                                                                <ExternalLink size={14} className="mr-2" /> Open Store
                                                            </DropdownMenuItem>
                                                        )}
                                                        {store.status === 'connected' && (
                                                            <DropdownMenuItem
                                                                className="text-xs font-medium"
                                                                disabled={processingStoreId === store.id}
                                                                onClick={() => handleSyncProducts(store)}
                                                            >
                                                                <RotateCw size={14} className={cn("mr-2", processingStoreId === store.id && "animate-spin")} />
                                                                Sync Products
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-700 focus:bg-red-50 text-xs font-medium"
                                                            onClick={() => handleDeleteStore(store.id)}
                                                        >
                                                            <Trash2 size={14} className="mr-2" /> Disconnect Store
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

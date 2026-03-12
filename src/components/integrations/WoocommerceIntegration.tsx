import React, { useState, useMemo } from 'react';
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
    Check,
    Clock,
    Copy,
    Download,
    ExternalLink,
    KeyRound,
    Loader2,
    MoreHorizontal,
    Plus,
    RotateCw,
    Trash2,
    Zap,
    CheckCircle2,
    XCircle,
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

// ─── Guide content ────────────────────────────────────────────────────────────
const PLUGIN_DOWNLOAD_URL = '/finalform-woocommerce.zip';

export function WoocommerceIntegration({ userId, onBack }: WoocommerceIntegrationProps) {
    const { stores, addStore, deleteStore } = useConnectedStores(userId);

    const [view, setView] = useState<'list' | 'add'>('list');
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [generatedKey, setGeneratedKey] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [processingStoreId, setProcessingStoreId] = useState<string | null>(null);
    const [keyCopied, setKeyCopied] = useState(false);

    // Get all connected WooCommerce stores
    const wooStores = useMemo(() => stores.filter((s) => s.platform === 'woocommerce'), [stores]);

    const handleCancel = () => {
        setView('list');
        setStep(1);
        setGeneratedKey('');
        setKeyCopied(false);
    };

    // STEP 2: Generate key locally (no store created yet)
    const handleGenerateKey = () => {
        setIsGenerating(true);
        try {
            const key = `ff_wc_${crypto.randomUUID()}`;
            setGeneratedKey(key);
            setStep(2);
            toast.success('Installation key generated!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to generate key.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Copy key to clipboard
    const handleCopyKey = async () => {
        try {
            await navigator.clipboard.writeText(generatedKey);
            setKeyCopied(true);
            toast.success('Key copied to clipboard!');
            setTimeout(() => setKeyCopied(false), 3000);
        } catch {
            toast.error('Failed to copy key.');
        }
    };

    // STEP 3: Verify connection, then create the store on success
    const handleTestConnection = async () => {
        setIsVerifying(true);
        try {
            const { getAdapter } = await import('@/lib/integrations');
            const adapter = getAdapter('woocommerce');
            const result = await adapter.connect('', { accessToken: generatedKey }, userId);

            // Connection succeeded — now create the store in Firestore
            await addStore({
                name: result.store?.name || 'WooCommerce Store',
                platform: 'woocommerce',
                url: result.store?.domain || '',
                storeDomain: result.store?.domain || '',
                accessToken: generatedKey,
            });

            toast.success('Connection verified! Your store is now connected.');
            setStep(3);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Connection test failed. Make sure you pasted the key in the plugin settings.');
        } finally {
            setIsVerifying(false);
        }
    };

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

    // ─── ADD STORE VIEW (3-step) ────────────────────────────────────────────

    if (view === 'add') {
        return (
            <div className="flex-1 flex flex-col h-full bg-slate-50/50">
                <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                    <PageHeader
                        title="Connect WooCommerce Store"
                        breadcrumbs={[
                            { label: 'Integrations', href: '/integrations', onClick: onBack },
                            { label: 'WooCommerce', href: '#' }
                        ]}
                        icon={WooIcon}
                        onBack={handleCancel}
                    />
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-2xl mx-auto space-y-6">

                        {/* Progress dots */}
                        <div className="flex items-center justify-center gap-3">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                                        step >= s
                                            ? "bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/30"
                                            : "bg-slate-200 text-slate-500"
                                    )}>
                                        {step > s ? <Check size={14} /> : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={cn(
                                            "w-12 h-0.5 rounded-full transition-all",
                                            step > s ? "bg-[#FF5A1F]" : "bg-slate-200"
                                        )} />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* STEP 1: Download Plugin */}
                        <div className={cn(
                            "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all",
                            step >= 1 ? "opacity-100" : "opacity-50 pointer-events-none"
                        )}>
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#96588a]/10 border border-[#96588a]/20 flex items-center justify-center">
                                        <Download size={18} className="text-[#96588a]" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">1. Download & Install Plugin</h3>
                                        <p className="text-xs text-slate-500">Upload to WordPress → Plugins → Add New → Upload</p>
                                    </div>
                                    {step > 1 && <CheckCircle2 size={20} className="text-green-500 ml-auto" />}
                                </div>

                                <Button
                                    asChild
                                    variant="default"
                                    className="px-5 py-2.5 rounded-xl text-sm shadow-sm h-auto"
                                >
                                    <a
                                        href={PLUGIN_DOWNLOAD_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2"
                                    >
                                        <Download size={14} />
                                        Download Plugin (.zip)
                                    </a>
                                </Button>

                                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-1.5">
                                    <p className="font-semibold text-slate-700">Installation steps:</p>
                                    <ol className="list-decimal list-inside space-y-1 ml-1">
                                        <li>In your WordPress admin, go to <strong>Plugins → Add New → Upload Plugin</strong></li>
                                        <li>Choose the downloaded <code className="bg-slate-200 px-1 py-0.5 rounded">finalform-woocommerce.zip</code> file</li>
                                        <li>Click <strong>Install Now</strong>, then <strong>Activate</strong></li>
                                    </ol>
                                </div>

                                {step === 1 && (
                                    <Button
                                        size="sm"
                                        onClick={handleGenerateKey}
                                        disabled={isGenerating}
                                        variant="default"
                                        className="mt-4 h-9 rounded-lg text-xs px-5 shadow-sm"
                                    >
                                        {isGenerating ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Zap size={13} className="mr-1.5" />}
                                        {isGenerating ? 'Generating...' : "I've installed it — Generate Key"}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* STEP 2: Copy Key */}
                        <div className={cn(
                            "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all",
                            step >= 2 ? "opacity-100" : "opacity-50 pointer-events-none"
                        )}>
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                                        <KeyRound size={18} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">2. Copy Key & Paste in Plugin</h3>
                                        <p className="text-xs text-slate-500">Go to WooCommerce → Final Form in your WordPress admin</p>
                                    </div>
                                    {step > 2 && <CheckCircle2 size={20} className="text-green-500 ml-auto" />}
                                </div>

                                {generatedKey ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-slate-900 rounded-lg px-4 py-3 font-mono text-sm text-slate-200 select-all overflow-auto">
                                                {generatedKey}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyKey}
                                                className={cn(
                                                    "h-11 px-4 rounded-lg text-xs font-bold shrink-0 transition-all",
                                                    keyCopied && "bg-green-50 text-green-700 border-green-200"
                                                )}
                                            >
                                                {keyCopied ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
                                                {keyCopied ? 'Copied!' : 'Copy'}
                                            </Button>
                                        </div>

                                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2 items-start">
                                            <span className="mt-0.5 text-base leading-none">💡</span>
                                            <span>
                                                Paste this key in the <strong>Installation Key</strong> field in your WordPress admin under
                                                <strong> WooCommerce → Final Form</strong>, then click <strong>Save Settings</strong>.
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-slate-400">Complete step 1 first to generate your key.</p>
                                )}
                            </div>
                        </div>

                        {/* STEP 3: Verify Connection */}
                        <div className={cn(
                            "bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all",
                            step >= 2 ? "opacity-100" : "opacity-50 pointer-events-none"
                        )}>
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                                        <Zap size={18} className="text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">3. Verify Connection</h3>
                                        <p className="text-xs text-slate-500">Click below after pasting the key in your plugin</p>
                                    </div>
                                    {step === 3 && <CheckCircle2 size={20} className="text-green-500 ml-auto" />}
                                </div>

                                {step === 3 ? (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle2 size={20} className="text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-green-800">Connection Verified!</p>
                                            <p className="text-xs text-green-600">Your WooCommerce store is now connected to Final Form.</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={handleCancel}
                                            className="ml-auto h-9 rounded-lg text-xs font-bold px-5 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            Done
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={handleTestConnection}
                                        disabled={isVerifying || step < 2}
                                        className="h-9 rounded-lg text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white"
                                    >
                                        {isVerifying ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Zap size={13} className="mr-1.5" />}
                                        {isVerifying ? 'Verifying...' : 'Verify Connection'}
                                    </Button>
                                )}
                            </div>
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

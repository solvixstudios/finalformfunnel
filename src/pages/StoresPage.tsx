import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useConnectedStores, useFormAssignments, useSavedForms } from '@/lib/firebase/hooks';
import {
    getProductsFromCache,
    syncProductsFromShopify,
    subscribeToProductSync,
    Product,
} from '@/lib/products';
import { cn } from '@/lib/utils';
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    CloudDownload,
    ExternalLink,
    FileText,
    Globe,
    Image as ImageIcon,
    Loader2,
    Package,
    Search,
    Store,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Constants ───
const ITEMS_PER_PAGE = 25;
type SortField = 'name';

export default function StoresPage({ userId }: { userId: string }) {
    const navigate = useNavigate();
    const { stores, loading: storesLoading } = useConnectedStores(userId);
    const { assignments } = useFormAssignments(userId);
    const { forms } = useSavedForms(userId);

    const shopifyStores = useMemo(() => stores.filter(s => s.platform === 'shopify'), [stores]);
    const [activeStoreId, setActiveStoreId] = useState<string>('');

    // Product state per store
    const [productMap, setProductMap] = useState<Record<string, Product[]>>({});
    const [syncingMap, setSyncingMap] = useState<Record<string, boolean>>({});
    const [syncProgressMap, setSyncProgressMap] = useState<Record<string, number>>({});
    const [lastSyncedMap, setLastSyncedMap] = useState<Record<string, number>>({});

    // Table state
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Auto-select first store
    useEffect(() => {
        if (shopifyStores.length > 0 && !activeStoreId) {
            setActiveStoreId(shopifyStores[0].id);
        }
    }, [shopifyStores, activeStoreId]);

    // Cache load
    useEffect(() => {
        shopifyStores.forEach(async (store) => {
            try {
                const cached = await getProductsFromCache(store.id);
                if (cached) {
                    setProductMap(prev => ({ ...prev, [store.id]: cached.products }));
                    setLastSyncedMap(prev => ({ ...prev, [store.id]: cached.lastSynced }));
                }
            } catch (e) { console.error('Cache load failed', e); }
        });
    }, [shopifyStores]);

    // Subscriptions
    useEffect(() => {
        const unsub = subscribeToProductSync((storeId, products) => {
            setProductMap(prev => ({ ...prev, [storeId]: products }));
            setLastSyncedMap(prev => ({ ...prev, [storeId]: Date.now() }));
        });
        return () => { unsub(); };
    }, []);

    // Reset table on store change
    useEffect(() => {
        setCurrentPage(1);
        setSearchTerm('');
    }, [activeStoreId]);

    const activeStore = shopifyStores.find(s => s.id === activeStoreId);
    const activeProducts = productMap[activeStoreId] || [];
    const isSyncing = syncingMap[activeStoreId] || false;
    const syncProgress = syncProgressMap[activeStoreId] || 0;
    const lastSynced = lastSyncedMap[activeStoreId] || null;

    // ─── Sync ───
    const syncStoreProducts = useCallback(async (storeId: string) => {
        const store = shopifyStores.find(s => s.id === storeId);
        if (!store) return;

        setSyncingMap(prev => ({ ...prev, [storeId]: true }));
        setSyncProgressMap(prev => ({ ...prev, [storeId]: 0 }));
        toast.info(`Syncing ${store.name}...`);

        try {
            const products = await syncProductsFromShopify(store, {
                onProgress: (count) => setSyncProgressMap(prev => ({ ...prev, [storeId]: count })),
            });
            setProductMap(prev => ({ ...prev, [storeId]: products }));
            setLastSyncedMap(prev => ({ ...prev, [storeId]: Date.now() }));
            toast.success(`${products.length} products synced for ${store.name}`);
        } catch (e) {
            console.error(e);
            toast.error(`Sync failed for ${store.name}`);
        } finally {
            setSyncingMap(prev => ({ ...prev, [storeId]: false }));
            setSyncProgressMap(prev => ({ ...prev, [storeId]: 0 }));
        }
    }, [shopifyStores]);

    // ─── Assignments ───
    const storeAssignment = useMemo(() =>
        assignments.find(a => a.storeId === activeStoreId && a.assignmentType === 'store' && a.isActive),
        [assignments, activeStoreId]
    );

    const productAssignments = useMemo(() =>
        assignments.filter(a => a.storeId === activeStoreId && a.assignmentType === 'product' && a.isActive),
        [assignments, activeStoreId]
    );

    const globalForm = storeAssignment ? forms.find(f => f.id === storeAssignment.formId) || null : null;

    const getProductAssignment = useCallback((productId: string | number) =>
        productAssignments.find(a => String(a.productId) === String(productId)),
        [productAssignments]
    );

    const getEffectiveForm = useCallback((productId: string | number) => {
        const pa = getProductAssignment(productId);
        if (pa) return forms.find(f => f.id === pa.formId) || null;
        return globalForm;
    }, [getProductAssignment, globalForm, forms]);

    // Navigate to form editor Publish tab
    const handleOpenForm = (formId: string) => {
        navigate(`/dashboard/forms/edit/${formId}?tab=publish`);
    };

    // ─── Filter & Sort ───
    const filteredProducts = useMemo(() => {
        return activeProducts.filter(p => {
            const q = searchTerm.toLowerCase();
            const matchesSearch = !searchTerm || p.title.toLowerCase().includes(q) || p.vendor?.toLowerCase().includes(q) || p.handle?.toLowerCase().includes(q);
            return matchesSearch;
        }).sort((a, b) => {
            const dir = sortDirection === 'asc' ? 1 : -1;
            switch (sortField) {
                case 'name': return (a.title || '').localeCompare(b.title || '') * dir;
                default: return 0;
            }
        });
    }, [activeProducts, searchTerm, sortField, sortDirection]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDirection('asc'); }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-300 ml-1.5" />;
        return sortDirection === 'asc'
            ? <ArrowUp size={12} className="text-violet-500 ml-1.5" />
            : <ArrowDown size={12} className="text-violet-500 ml-1.5" />;
    };

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedProducts = filteredProducts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

    // ─── Render ───
    if (storesLoading) {
        return (
            <div className="max-w-[1400px] mx-auto w-full space-y-6 pt-4 pb-8">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-12 w-[300px] rounded-lg" />
                <TableSkeleton columns={3} rows={10} className="w-full" />
            </div>
        );
    }

    if (shopifyStores.length === 0) {
        return (
            <div className="max-w-[1400px] mx-auto w-full pt-4 pb-8">
                <PageHeader title="Stores Dashboard" breadcrumbs={[{ label: 'Stores' }]} icon={Store} />
                <div className="flex items-center justify-center py-32">
                    <EmptyState
                        icon={<Store size={32} />}
                        title="No stores connected"
                        description="Connect your Shopify store using the extension to see product mappings."
                        action={{ label: 'Connect Store', onClick: () => navigate('/dashboard/integrations?open=shopify&add=true') }}
                        variant="ghost"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto w-full flex flex-col pt-2 md:pt-4 pb-8 h-[calc(100vh-theme(spacing.14))]">
            <PageHeader
                title="Stores Dashboard"
                breadcrumbs={[{ label: 'Stores' }]}
                icon={Store}
                actions={
                    <Link
                        to="/dashboard/integrations?open=shopify&add=true"
                        className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]"
                    >
                        <Store size={14} /> Connect New Store
                    </Link>
                }
            />

            {shopifyStores.length > 1 && (
                <div className="mt-4 mb-2">
                    <Tabs value={activeStoreId} onValueChange={setActiveStoreId} className="w-fit">
                        <TabsList className="bg-slate-100/80 p-1 border border-slate-200 shadow-sm rounded-lg h-10">
                            {shopifyStores.map(store => (
                                <TabsTrigger
                                    key={store.id}
                                    value={store.id}
                                    className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm text-slate-500 font-semibold px-4 text-xs h-full rounded-md transition-all"
                                >
                                    {store.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            )}

            {activeStore && (
                <div className="flex-1 flex flex-col gap-4 mt-6">
                    {/* ─── Global Form Banner ─── */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center shrink-0">
                                <Globe size={18} className="text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Global Store Form</h3>
                                <p className="text-xs text-slate-500 mt-0.5 max-w-[400px]">
                                    Default fallback form applied to all products without specific overrides.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center shrink-0">
                            {globalForm ? (
                                <button
                                    onClick={() => handleOpenForm(globalForm.id)}
                                    className="group flex items-center gap-3 bg-white border border-emerald-200 hover:border-emerald-300 rounded-lg pl-3 pr-2 py-1.5 shadow-sm transition-all hover:shadow-md"
                                >
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} className="text-emerald-600" />
                                        <span className="text-xs font-bold text-slate-900 truncate max-w-[160px]">{globalForm.name}</span>
                                    </div>
                                    <div className="w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 transition-colors">
                                        <ExternalLink size={12} />
                                    </div>
                                </button>
                            ) : (
                                <div className="text-xs font-medium text-slate-400 italic px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                                    No global form assigned
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ─── Toolbar ─── */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="relative max-w-sm w-full group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={14} />
                                <Input
                                    className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-lg text-xs shadow-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 placeholder:text-slate-400 font-medium"
                                    placeholder="Search products by name or SKU..."
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                                {searchTerm && (
                                    <button onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600">
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap hidden sm:block">
                                Last synced: {lastSynced ? new Date(lastSynced).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-lg text-xs font-bold border-slate-200 shadow-sm hover:bg-slate-50"
                                onClick={() => syncStoreProducts(activeStore.id)}
                                disabled={isSyncing}
                            >
                                {isSyncing ? (
                                    <><Loader2 size={12} className="mr-1.5 animate-spin" />{syncProgress > 0 ? `${syncProgress} imported...` : 'Syncing'}</>
                                ) : (
                                    <><CloudDownload size={13} className="mr-1.5" /> Sync Catalog</>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* ─── Data Table ─── */}
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-auto custom-scroll min-h-[400px]">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-sm">
                                    <tr>
                                        <th className="w-[80px] py-4 pl-6 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Image</th>
                                        <th
                                            className="text-[10px] font-bold text-slate-600 uppercase tracking-wider py-4 cursor-pointer hover:text-slate-900 transition-colors group"
                                            onClick={() => toggleSort('name')}
                                        >
                                            <div className="flex items-center">Product <SortIcon field="name" /></div>
                                        </th>
                                        <th className="text-[10px] font-bold text-slate-600 uppercase tracking-wider py-4 text-right pr-6">Assigned Form Mapping</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedProducts.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="h-[400px] p-0 align-middle">
                                                {isSyncing ? (
                                                    <div className="w-full opacity-50 pointer-events-none p-4"><TableSkeleton columns={3} rows={6} className="border-0 shadow-none bg-transparent" /></div>
                                                ) : activeProducts.length === 0 ? (
                                                    <EmptyState
                                                        icon={<Package size={28} />}
                                                        title="No products found"
                                                        description="Your product catalog is empty. Run a sync to import products from Shopify."
                                                        action={{ label: 'Sync Catalog', onClick: () => syncStoreProducts(activeStore.id) }}
                                                        variant="ghost"
                                                    />
                                                ) : (
                                                    <EmptyState
                                                        icon={<Search size={28} />}
                                                        title="No match found"
                                                        description="Try adjusting your search criteria."
                                                        variant="ghost"
                                                        compact
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedProducts.map(product => {
                                            const pa = getProductAssignment(product.id);
                                            const effectiveForm = getEffectiveForm(product.id);
                                            const hasOwnForm = !!pa;

                                            return (
                                                <tr key={product.id} className="group transition-colors hover:bg-slate-50/70">
                                                    <td className="py-4 pl-6">
                                                        <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
                                                            {product.image?.src ? (
                                                                <img src={product.image.src} alt="" className="w-full h-full object-cover" loading="lazy" />
                                                            ) : (
                                                                <ImageIcon size={16} className="text-slate-300" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 pr-4 align-middle">
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors cursor-pointer">{product.title}</span>
                                                            <span className="text-[11px] font-medium text-slate-500 mt-0.5">{product.vendor} {product.variants?.length ? `· ${product.variants.length} variant${product.variants.length > 1 ? 's' : ''}` : ''}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 pr-6 align-middle text-right">
                                                        {effectiveForm ? (
                                                            <div className="flex justify-end">
                                                                <button
                                                                    onClick={() => handleOpenForm(effectiveForm.id)}
                                                                    className="flex items-center gap-3 bg-white border border-slate-200 hover:border-slate-300 rounded-lg pl-3 pr-2 py-1.5 shadow-sm hover:shadow transition-all group/btn"
                                                                >
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[11px] font-bold text-slate-900 truncate max-w-[160px] leading-tight">{effectiveForm.name}</span>
                                                                        <span className={cn(
                                                                            "text-[9px] font-bold uppercase tracking-wider leading-tight",
                                                                            hasOwnForm ? "text-[#FF5A1F]" : "text-slate-400"
                                                                        )}>
                                                                            {hasOwnForm ? 'Specific Override' : 'Global Fallback'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="w-7 h-7 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover/btn:text-slate-700 group-hover/btn:bg-slate-100 transition-colors shrink-0">
                                                                        <ExternalLink size={12} />
                                                                    </div>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic font-medium pr-2">Not mapped</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100 bg-slate-50/50 shrink-0">
                                <p className="text-xs text-slate-500 font-medium tabular-nums">
                                    Showing {(safePage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(safePage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} items
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm bg-white" disabled={safePage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                                        <ChevronLeft size={14} />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shadow-sm bg-white" disabled={safePage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                                        <ChevronRight size={14} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

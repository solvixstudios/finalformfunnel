import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConnectedStores } from '@/lib/firebase/hooks';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CloudDownload, ExternalLink, Image as ImageIcon, LayoutGrid, List, Loader2, Package, Search, ShoppingBag, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// --- Types ---

interface ProductVariant {
    id: number;
    product_id: number;
    title: string;
    price: string;
    sku: string | null;
    position: number;
    inventory_policy: string;
    compare_at_price: string | null;
    fulfillment_service: string;
    inventory_management: string | null;
    created_at: string;
    updated_at: string;
    barcode: string;
    requires_shipping: boolean;
}

interface Product {
    id: number;
    title: string;
    body_html: string;
    vendor: string;
    product_type: string;
    created_at: string;
    handle: string;
    updated_at: string;
    published_at: string;
    status: string;
    tags: string;
    variants: ProductVariant[];
    options: { id: number; product_id: number; name: string; position: number; values: string[] }[];
    images: { id: number; product_id: number; src: string; alt: string | null }[];
    image: { id: number; product_id: number; src: string; alt: string | null } | null;
}

interface StoreCache {
    storeId: string;
    products: Product[];
    lastSynced: number; // timestamp
}

// --- IndexedDB Helper ---

const DB_NAME = 'AddressSyncStudioDB';
const STORE_NAME = 'productsCatalog'; // Changed name to reflect full catalog nature
const DB_VERSION = 2; // Bump version for new store

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            // Create store if not exists
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'storeId' });
            }
        };
    });
};

const saveToCache = async (storeId: string, products: Product[]) => {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const data: StoreCache = {
            storeId,
            products,
            lastSynced: Date.now()
        };
        const request = store.put(data);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
};

const getFromCache = async (storeId: string): Promise<StoreCache | undefined> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(storeId);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

// --- Component ---

const ITEMS_PER_PAGE = 25;

export default function ProductsPage({ userId }: { userId: string }) {
    const { stores, loading: storesLoading } = useConnectedStores(userId);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [products, setProducts] = useState<Product[]>([]);

    // Status State
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0); // Count of fetched items
    const [lastSynced, setLastSynced] = useState<number | null>(null);

    // Local Pagination & Search
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Auto-select first store & Load from Cache
    useEffect(() => {
        if (stores.length > 0 && !selectedStoreId) {
            setSelectedStoreId(stores[0].id);
        }
    }, [stores, selectedStoreId]);

    // Initial Load
    useEffect(() => {
        if (selectedStoreId) {
            loadFromDB(selectedStoreId);
        } else {
            setProducts([]);
            setLastSynced(null);
        }
    }, [selectedStoreId]);

    // Subscribe to sync events from other components (e.g., StoresPage)
    useEffect(() => {
        // Import dynamically to avoid circular deps
        const handleSyncEvent = (storeId: string, syncedProducts: Product[]) => {
            if (storeId === selectedStoreId) {
                setProducts(syncedProducts);
                setLastSynced(Date.now());
            }
        };

        // Listen for custom sync events
        const listener = (e: CustomEvent) => {
            handleSyncEvent(e.detail.storeId, e.detail.products);
        };

        window.addEventListener('productSyncComplete' as any, listener);
        return () => window.removeEventListener('productSyncComplete' as any, listener);
    }, [selectedStoreId]);

    const loadFromDB = async (storeId: string) => {
        try {
            const cached = await getFromCache(storeId);
            if (cached) {
                setProducts(cached.products);
                setLastSynced(cached.lastSynced);
            } else {
                setProducts([]);
                setLastSynced(null);
            }
        } catch (e) {
            console.error("Failed to load cache", e);
        }
    };

    // --- Full Sync Logic ---
    const syncAllProducts = async () => {
        if (!selectedStoreId) return;
        const store = stores.find(s => s.id === selectedStoreId);
        if (!store) return;

        setSyncing(true);
        setSyncProgress(0);
        const allFetchedProducts: Product[] = [];
        let nextPageInfo: string | undefined = undefined;
        let hasMore = true;
        const cleanSubdomain = store.url.replace('.myshopify.com', '').replace('https://', '').replace(/\/$/, '');
        const n8nHost = import.meta.env.VITE_N8N_BACKEND_URL;
        try {
            toast.info("Starting product sync...");

            while (hasMore) {
                const response = await fetch(`${n8nHost}/webhook/shopify/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subdomain: cleanSubdomain,
                        clientId: store.clientId,
                        clientSecret: store.clientSecret,
                        limit: 250, // Max batch size to minimize requests
                        page_info: nextPageInfo,
                        // No search param -> fetch all
                    })
                });

                if (!response.ok) throw new Error('Fetch failed');

                const data = await response.json();

                let batch: Product[] = [];
                if (data.products) {
                    batch = typeof data.products === 'string' ? JSON.parse(data.products) : data.products;
                    if ((batch as any).products) batch = (batch as any).products;
                }

                allFetchedProducts.push(...batch);
                setSyncProgress(prev => prev + batch.length);

                // Check pagination
                if (data.next_page_info) {
                    nextPageInfo = data.next_page_info;
                } else {
                    hasMore = false;
                }

                // Safety break for extremely large catalogs (optional, maybe 50k?)
                if (allFetchedProducts.length > 50000) {
                    toast.warning("Stopped at 50,000 products for safety.");
                    hasMore = false;
                }
            }

            // Save complete list
            await saveToCache(selectedStoreId, allFetchedProducts);
            setProducts(allFetchedProducts);
            setLastSynced(Date.now());
            toast.success(`Sync complete! ${allFetchedProducts.length} products loaded.`);

        } catch (error) {
            console.error(error);
            toast.error("Sync failed. Check connection or try again.");
        } finally {
            setSyncing(false);
            setSyncProgress(0);
        }
    };

    // --- Derived Logic ---

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));

    // Safety check for current page
    if (currentPage > totalPages && currentPage > 1) {
        setCurrentPage(totalPages);
    }

    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Handlers
    const goToNextPage = () => setCurrentPage(p => Math.min(totalPages, p + 1));
    const goToPrevPage = () => setCurrentPage(p => Math.max(1, p - 1));

    const formatLastSynced = (ms: number) => {
        const date = new Date(ms);
        return date.toLocaleString();
    };

    // Create Header Actions
    const headerActions = (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger className="w-full sm:w-[200px] bg-white h-9 border-slate-200">
                    <SelectValue placeholder="Select Store" />
                </SelectTrigger>
                <SelectContent>
                    {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>
                            {store.platform === 'shopify' ? '🛍️' : '📦'} {store.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button
                variant={lastSynced ? "outline" : "default"}
                size="sm"
                className={cn(!lastSynced && "bg-indigo-600 hover:bg-indigo-700", "h-9")}
                onClick={syncAllProducts}
                disabled={syncing || !selectedStoreId}
                title="Sync All Products"
            >
                {syncing ? (
                    <>
                        <Loader2 size={14} className="mr-2 animate-spin" />
                        {syncProgress > 0 ? `${syncProgress}..` : 'Syncing'}
                    </>
                ) : (
                    <>
                        <CloudDownload size={14} className="mr-2" />
                        {lastSynced ? 'Sync' : 'Start Sync'}
                    </>
                )}
            </Button>
        </div>
    );

    // Create Title Component with Sync Status
    const titleComponent = (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Products
                <div className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {products.length}
                </div>
            </h1>
            {(lastSynced || filteredProducts.length !== products.length) && (
                <div className="hidden sm:block h-4 w-px bg-slate-200" />
            )}
            <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
                {lastSynced ? (
                    <span className="text-green-600 flex items-center gap-1 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        <span className="hidden sm:inline">Synced: {formatLastSynced(lastSynced)}</span>
                        <span className="sm:hidden">Synced</span>
                    </span>
                ) : (
                    <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Sync required</span>
                )}
                {filteredProducts.length !== products.length && (
                    <span className="text-slate-400 font-medium">Found {filteredProducts.length} matches</span>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6 h-full flex flex-col">
            <PageHeader
                title="Products"
                breadcrumbs={[
                    { label: 'Products' }
                ]}
                count={products.length}
                icon={Package}
                actions={headerActions}
            />

            {/* Toolbox & Pagination Top */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shrink-0 px-1 py-2">
                <div className="relative w-full sm:w-[280px] lg:w-[320px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search products..."
                        className="pl-10 bg-white border-0 shadow-sm rounded-full h-10 ring-1 ring-slate-200 focus-visible:ring-indigo-500 transition-all hover:ring-slate-300"
                        disabled={products.length === 0}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-7 px-3 rounded-full transition-all", viewMode === 'list' && "bg-slate-100 text-slate-900 font-medium")}
                            onClick={() => setViewMode('list')}
                            title="List View"
                        >
                            <List size={16} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-7 px-3 rounded-full transition-all", viewMode === 'grid' && "bg-slate-100 text-slate-900 font-medium")}
                            onClick={() => setViewMode('grid')}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </Button>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 ml-1">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1 || products.length === 0}
                            className="h-8 w-8 p-0 hidden sm:inline-flex"
                            title="First Page"
                        >
                            <ChevronsLeft size={14} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPrevPage}
                            disabled={currentPage === 1 || products.length === 0}
                            className="h-8 w-8 p-0"
                            title="Previous Page"
                        >
                            <ChevronLeft size={16} />
                        </Button>

                        <div className="text-xs font-medium text-slate-600 min-w-[70px] text-center">
                            Page {products.length > 0 ? currentPage : 0} / {totalPages}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages || products.length === 0}
                            className="h-8 w-8 p-0"
                            title="Next Page"
                        >
                            <ChevronRight size={16} />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages || products.length === 0}
                            className="h-8 w-8 p-0 hidden sm:inline-flex"
                            title="Last Page"
                        >
                            <ChevronsRight size={14} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Products Content */}
            <div className="flex-1 overflow-y-auto min-h-0 -mr-2 pr-2">
                {products.length === 0 && !syncing ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                        {selectedStoreId ? (
                            <>
                                <ShoppingBag size={48} className="text-slate-200" />
                                <p className="text-slate-500">No products synced locally.</p>
                                <Button onClick={syncAllProducts} className="bg-indigo-600 hover:bg-indigo-700">
                                    <CloudDownload size={16} className="mr-2" /> Start First Sync
                                </Button>
                            </>
                        ) : (
                            <>
                                <Store size={48} className="text-slate-200" />
                                <p className="text-slate-500">Select a store to view products.</p>
                            </>
                        )}
                    </div>
                ) : paginatedProducts.length > 0 ? (
                    <>
                        {viewMode === 'list' ? (
                            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                            <TableHead className="w-[80px]">Image</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Vendor</TableHead>
                                            <TableHead className="text-right">Variants</TableHead>
                                            <TableHead className="text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedProducts.map((product) => (
                                            <TableRow key={product.id} className="cursor-pointer hover:bg-slate-50/50 group transition-colors">
                                                <TableCell className="py-2">
                                                    <div className="w-10 h-10 rounded-md bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                                                        {product.images?.[0]?.src || product.image?.src ? (
                                                            <img
                                                                src={product.images?.[0]?.src || product.image?.src}
                                                                alt={product.title}
                                                                className="w-full h-full object-cover"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <ImageIcon className="text-slate-300 w-5 h-5" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-900 py-2">
                                                    <div className="line-clamp-1 max-w-[350px]" title={product.title}>{product.title}</div>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                    <Badge
                                                        variant="secondary"
                                                        className={cn(
                                                            "uppercase text-[9px] tracking-wider font-bold border-0 h-5 px-1.5",
                                                            product.status === 'active' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                                        )}
                                                    >
                                                        {product.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-500 text-sm py-2">{product.product_type || '—'}</TableCell>
                                                <TableCell className="text-slate-500 text-sm py-2 max-w-[200px] truncate" title={product.vendor}>{product.vendor}</TableCell>
                                                <TableCell className="text-right font-mono text-xs py-2">{product.variants?.length || 0}</TableCell>
                                                <TableCell className="text-right py-2">
                                                    {stores.length > 0 && selectedStoreId && (
                                                        <a
                                                            href={`https://${stores.find(s => s.id === selectedStoreId)?.url}/products/${product.handle}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                                {paginatedProducts.map((product, index) => (
                                    <div key={product.id} className={`group flex flex-col gap-2 sm:gap-3 cursor-pointer animate-fade-up stagger-${Math.min(index + 1, 8)}`}>
                                        {/* Image Container */}
                                        <div className="aspect-[4/5] bg-slate-50 rounded-xl sm:rounded-2xl overflow-hidden relative border border-slate-100 shadow-sm group-hover:shadow-lg group-hover:border-slate-200 transition-all duration-300 card-hover">
                                            {product.images?.[0]?.src || product.image?.src ? (
                                                <img
                                                    src={product.images?.[0]?.src || product.image?.src}
                                                    alt={product.title}
                                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <ImageIcon size={32} strokeWidth={1.5} />
                                                </div>
                                            )}

                                            {/* Floating Badge */}
                                            <div className="absolute top-3 left-3">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border",
                                                    product.status === 'active'
                                                        ? "bg-white/90 text-green-700 border-green-100"
                                                        : "bg-slate-100/90 text-slate-600 border-slate-200"
                                                )}>
                                                    {product.status}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content info */}
                                        <div className="space-y-0.5 sm:space-y-1">
                                            <h3 className="font-medium text-slate-900 leading-snug line-clamp-2 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors">
                                                {product.title}
                                            </h3>
                                            <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
                                                <span className="truncate">{product.vendor}</span>
                                                <span className="font-mono hidden sm:inline">{product.variants?.length || 0} vars</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer Pagination */}
                        <div className="flex items-center justify-between border-t border-slate-200 pt-4 pb-8">
                            <div className="text-xs text-slate-500 hidden sm:block">
                                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} entries
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <Button variant="outline" size="sm" onClick={goToPrevPage} disabled={currentPage === 1}>
                                    <ChevronLeft size={16} className="mr-1" /> Previous
                                </Button>
                                <div className="text-xs font-medium text-slate-600 px-2 sm:hidden">
                                    {currentPage}/{totalPages}
                                </div>
                                <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                                    Next <ChevronRight size={16} className="ml-1" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                        <ShoppingBag size={48} className="text-slate-200" />
                        <p>No products match your search.</p>
                        <Button variant="outline" onClick={() => setSearchTerm('')}>
                            Clear Filter
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

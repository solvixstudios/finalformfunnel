
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useConnectedStores, useFormAssignments, useSavedForms } from '@/lib/firebase/hooks';
import { cn } from '@/lib/utils';
import {
    ArrowUpDown,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CloudDownload,
    ExternalLink,
    FileText,
    Filter,
    Image as ImageIcon,
    LayoutTemplate,
    Loader2,
    MoreHorizontal,
    Package,
    Search,
    Store,
    Trash2,
    X
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { FormAssignmentSheet } from '../components/FormAssignmentSheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    lastSynced: number;
}

// --- IndexedDB Helper ---
const DB_NAME = 'AddressSyncStudioDB';
const STORE_NAME = 'productsCatalog';
const DB_VERSION = 2;

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
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
        const data: StoreCache = { storeId, products, lastSynced: Date.now() };
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
    const navigate = useNavigate();
    const { stores, loading: storesLoading } = useConnectedStores(userId);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [products, setProducts] = useState<Product[]>([]);

    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);
    const [lastSynced, setLastSynced] = useState<number | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');

    // Assignment Logic
    const { assignments, deleteAssignment } = useFormAssignments(userId);
    const { forms } = useSavedForms(userId);
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [assignDialogProductIds, setAssignDialogProductIds] = useState<string[]>([]);
    const [dialogInitialFormId, setDialogInitialFormId] = useState<string | undefined>(undefined);

    const [searchParams, setSearchParams] = useSearchParams();

    // Bulk Selection
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

    const currentStore = stores.find(s => s.id === selectedStoreId);

    // Split assignments by type
    const storeAssignment = assignments.find(a => a.storeId === selectedStoreId && a.assignmentType === 'store' && a.isActive);
    const productAssignments = useMemo(() => {
        return assignments.filter(a => a.storeId === selectedStoreId && a.assignmentType === 'product' && a.isActive);
    }, [assignments, selectedStoreId]);

    // Derived State
    const currentStoreForm = storeAssignment ? forms.find(f => f.id === storeAssignment.formId) : null;

    useEffect(() => {
        if (stores.length > 0 && !selectedStoreId) setSelectedStoreId(stores[0].id);
    }, [stores, selectedStoreId]);

    useEffect(() => {
        if (selectedStoreId) {
            loadFromDB(selectedStoreId);
            setSelectedProductIds([]); // Clear selection on store change
        } else {
            setProducts([]);
            setLastSynced(null);
        }
    }, [selectedStoreId]);

    // Handle initial form assignment from URL
    useEffect(() => {
        const assignFormId = searchParams.get('assignForm');
        if (assignFormId && forms.length > 0 && selectedStoreId) {
            const form = forms.find(f => f.id === assignFormId);
            if (form) {
                // Auto-open for Store Form assignment (Unified: Any form can be global)
                setAssignDialogProductIds([]);
                setDialogInitialFormId(assignFormId);
                setShowAssignDialog(true);
                // Clear param so it doesn't re-trigger
                setSearchParams(params => {
                    params.delete('assignForm');
                    return params;
                });
            }
        }
    }, [searchParams, forms, selectedStoreId, setSearchParams]);

    useEffect(() => {
        const listener = (e: CustomEvent) => {
            if (e.detail.storeId === selectedStoreId) {
                setProducts(e.detail.products);
                setLastSynced(Date.now());
            }
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

                // Background cache invalidation (5 minutes)
                const CACHE_EXPIRY_MS = 5 * 60 * 1000;
                if (Date.now() - cached.lastSynced > CACHE_EXPIRY_MS) {
                    console.log("[ProductsPage] Cache stale, triggering background sync...");
                    // trigger sync silently (without resetting UI/progress)
                    syncAllProducts(true);
                }
            } else {
                setProducts([]);
                setLastSynced(null);
            }
        } catch (e) { console.error("Failed to load cache", e); }
    };

    const syncAllProducts = async (isBackground = false) => {
        if (!selectedStoreId) return;
        const store = stores.find(s => s.id === selectedStoreId);
        if (!store) return;

        if (!isBackground) {
            setSyncing(true);
            setSyncProgress(0);
            toast.info("Starting product sync...");
        }

        const allFetchedProducts: Product[] = [];
        let nextPageInfo: string | undefined = undefined;
        let hasMore = true;
        const cleanSubdomain = store.url.replace('.myshopify.com', '').replace('https://', '').replace(/\/$/, '');
        const backendHost = import.meta.env.VITE_BACKEND_URL;
        try {
            while (hasMore) {
                const response = await fetch(`${backendHost}/webhook/shopify/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subdomain: cleanSubdomain,
                        clientId: store.clientId,
                        clientSecret: store.clientSecret,
                        limit: 250,
                        page_info: nextPageInfo,
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

                if (!isBackground) {
                    setSyncProgress(prev => prev + batch.length);
                }

                if (data.next_page_info) nextPageInfo = data.next_page_info;
                else hasMore = false;

                if (allFetchedProducts.length > 50000) {
                    if (!isBackground) toast.warning("Stopped at 50,000 products.");
                    hasMore = false;
                }
            }

            await saveToCache(selectedStoreId, allFetchedProducts);
            setProducts(allFetchedProducts);
            setLastSynced(Date.now());

            if (!isBackground) {
                toast.success(`Sync complete! ${allFetchedProducts.length} products loaded.`);
            }

        } catch (error) {
            console.error(error);
            if (!isBackground) {
                toast.error("Sync failed. Check connection or try again.");
            }
        } finally {
            if (!isBackground) {
                setSyncing(false);
                setSyncProgress(0);
            }
        }
    };

    const handleBulkSelect = (checked: boolean) => {
        if (checked) {
            setSelectedProductIds(paginatedProducts.map(p => p.id.toString()));
        } else {
            setSelectedProductIds([]);
        }
    };

    const handleSelectProduct = (productId: string, checked: boolean) => {
        if (checked) {
            setSelectedProductIds(prev => [...prev, productId]);
        } else {
            setSelectedProductIds(prev => prev.filter(id => id !== productId));
        }
    };

    const handleBulkAssign = () => {
        setAssignDialogProductIds(selectedProductIds);
        setDialogInitialFormId(undefined);
        setShowAssignDialog(true);
    };

    const handleBulkUnlink = async () => {
        const toastId = toast.loading("Reverting selected products to global form...");
        let successCount = 0;
        let failCount = 0;

        try {
            // Find all assignments for the selected products
            const assignmentsToRemove = productAssignments.filter(a =>
                a.productId && selectedProductIds.includes(String(a.productId))
            );

            if (assignmentsToRemove.length === 0) {
                toast.dismiss(toastId);
                toast.info("No specialized assignments to remove for the selected products.");
                return;
            }

            // Execute deletions sequentially to avoid rate limits/overload
            // Backend sync could be batched later if needed
            for (const assignment of assignmentsToRemove) {
                try {
                    await deleteAssignment(assignment.id);
                    successCount++;
                } catch (e) {
                    failCount++;
                    console.error("Failed to delete assignment:", assignment.id, e);
                }
            }

            toast.dismiss(toastId);
            if (failCount === 0) {
                toast.success(`Successfully reverted ${successCount} product(s) to the global form.`);
                setSelectedProductIds([]); // Clear selection on success
            } else if (successCount > 0) {
                toast.warning(`Reverted ${successCount} product(s) to global form, but ${failCount} failed.`);
            } else {
                toast.error(`Failed to revert ${failCount} product(s) to global form.`);
            }
        } catch (error) {
            toast.dismiss(toastId);
            toast.error("An error occurred during bulk operation.");
            console.error(error);
        }
    };

    const filteredProducts = useMemo(() => {
        let filtered = products;

        if (searchTerm) {
            const lowerQuery = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(lowerQuery) ||
                p.vendor?.toLowerCase().includes(lowerQuery)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        return filtered;
    }, [products, searchTerm, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages && currentPage > 1) setCurrentPage(totalPages);
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // ─── Header Rendering ───
    const headerActions = (
        <div className="flex items-center gap-3">
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                <SelectTrigger className="w-[200px] h-9 bg-white border-slate-200/80 rounded-lg text-xs font-semibold shadow-sm text-slate-700 hover:bg-slate-50 transition-colors">
                    <Store size={14} className="mr-2 text-slate-400" />
                    <SelectValue placeholder="Select Store" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                    {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button
                variant={lastSynced ? "outline" : "default"}
                size="sm"
                onClick={() => syncAllProducts(false)}
                disabled={syncing || !selectedStoreId}
                className={cn(
                    "h-9 rounded-lg text-xs font-bold px-4 shadow-sm transition-all relative overflow-hidden",
                    !lastSynced && "bg-[#FF5A1F] hover:bg-[#E04D1A] text-white border-0",
                    lastSynced && "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300"
                )}
            >
                {syncing ? (
                    <><Loader2 size={13} className="mr-1.5 animate-spin" />{syncProgress > 0 ? `${syncProgress} imported` : 'Syncing...'}</>
                ) : (
                    <><CloudDownload size={14} className="mr-1.5" />{lastSynced ? 'Sync Products' : 'Start Sync'}</>
                )}
            </Button>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto w-full space-y-6 flex flex-col pt-2 md:pt-4 pb-8 relative">
            <PageHeader
                title="Store Management"
                breadcrumbs={[{ label: 'Store Management' }]}
                icon={Store}
                actions={headerActions}
            />

            <div className="flex flex-col gap-8">

                {/* 1. Global Store Form Hero Card */}
                <div className="relative group rounded-xl p-1 bg-gradient-to-br from-slate-200/50 via-slate-100 to-slate-200/50">
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-xl" />
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-white/50">
                        <div className="flex items-start gap-5">
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-lg shadow-slate-900/20 shrink-0">
                                <Store size={28} />
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Global Store Form</h2>
                                    <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
                                        This form serves as the default checkout experience for your entire store.
                                        Any product without a specific assignment will use this form.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 pt-1">
                                    <Badge variant="outline" className="bg-slate-100/50 border-slate-200 text-slate-600 font-medium px-2.5 py-0.5">
                                        {products.length ? products.length.toLocaleString() : '0'} Products Active
                                    </Badge>
                                    <Badge variant="outline" className="bg-emerald-50/50 border-emerald-100 text-emerald-600 font-medium px-2.5 py-0.5">
                                        Synced {lastSynced ? new Date(lastSynced).toLocaleDateString() : 'Never'}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="w-full sm:w-auto flex flex-col items-end gap-3 min-w-[280px]">
                            {currentStoreForm ? (
                                <div className="w-full p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex items-center justify-between gap-4 group/card hover:bg-indigo-50 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/forms/edit/${currentStoreForm.id}`)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-md bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-900 group-hover/card:text-indigo-700 transition-colors">{currentStoreForm.name}</h4>
                                            <span className="text-[10px] uppercase font-semibold text-emerald-600 tracking-wider">Active</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-md text-slate-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-red-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteAssignment(storeAssignment!.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center text-slate-400 text-sm font-medium">
                                    No global form assigned
                                </div>
                            )}

                            <Button
                                className="w-full bg-slate-950 hover:bg-black text-white shadow-sm rounded-lg h-10 font-bold transition-all"
                                onClick={() => {
                                    setAssignDialogProductIds([]);
                                    setDialogInitialFormId(undefined);
                                    setShowAssignDialog(true);
                                }}
                            >
                                {currentStoreForm ? 'Replace Global Form' : 'Assign Global Form'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* 2. Products Table Section */}
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="relative max-w-sm w-full group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
                                <Input
                                    className="pl-9 h-10 bg-white border-slate-200 rounded-lg text-sm shadow-sm focus:ring-1 focus:ring-slate-400 focus:border-slate-400 placeholder:text-slate-400 font-medium"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
                            <Select value={statusFilter} onValueChange={(val: 'all' | 'active' | 'draft') => setStatusFilter(val)}>
                                <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 rounded-lg text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                                    <Filter size={14} className="mr-2 text-slate-400" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="draft">Draft</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-400">
                                {filteredProducts.length} products
                            </span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-[#EFEBE0]/40 border-b border-slate-200 hover:bg-[#EFEBE0]/60">
                                    <TableHead className="w-[40px] pl-6 py-4">
                                        <Checkbox
                                            checked={paginatedProducts.length > 0 && selectedProductIds.length === paginatedProducts.length}
                                            onCheckedChange={handleBulkSelect}
                                            className="translate-y-[2px]"
                                        />
                                    </TableHead>
                                    <TableHead className="w-[60px] text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Image</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Product Name</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4 hidden md:table-cell">Status</TableHead>
                                    <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-4">Assigned Form</TableHead>
                                    <TableHead className="w-[50px] py-4 pr-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedProducts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-[300px] text-center p-0 align-middle">
                                            {syncing ? (
                                                <div className="w-full pointer-events-none p-4 opacity-50">
                                                    <TableSkeleton columns={6} rows={5} className="w-full border-0 shadow-none bg-transparent" />
                                                </div>
                                            ) : (
                                                <EmptyState
                                                    icon={<Package size={28} />}
                                                    title={searchTerm ? "No matching products found" : "No products available"}
                                                    description={searchTerm ? "Try adjusting your search query or filters." : "Sync your Shopify products to get started."}
                                                    variant="ghost"
                                                    compact
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedProducts.map(product => {
                                        const assignment = productAssignments.find(a => String(a.productId) === String(product.id));
                                        const assignedForm = assignment ? forms.find(f => f.id === assignment.formId) : null;
                                        const isSelected = selectedProductIds.includes(String(product.id));

                                        return (
                                            <TableRow key={product.id} className={cn("group transition-colors hover:bg-slate-50/50", isSelected && "bg-[#FF5A1F]/5")}>
                                                <TableCell className="pl-6 py-4">
                                                    <Checkbox
                                                        checked={isSelected}
                                                        onCheckedChange={(c) => handleSelectProduct(String(product.id), !!c)}
                                                        className="translate-y-[2px]"
                                                    />
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-sm">
                                                        {product.image?.src ? (
                                                            <img src={product.image.src} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <ImageIcon size={18} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-900 line-clamp-1">{product.title}</span>
                                                        <span className="text-xs font-semibold text-slate-500">{product.vendor}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell py-4">
                                                    <Badge variant="outline" className={cn(
                                                        "text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider border rounded-md shadow-none",
                                                        product.status === 'active'
                                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                                            : "bg-slate-50 text-slate-500 border-slate-200"
                                                    )}>
                                                        {product.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    {assignedForm ? (
                                                        <div className="flex items-center gap-2.5 group/form cursor-pointer" onClick={() => navigate(`/dashboard/forms/edit/${assignedForm.id}`)}>
                                                            <div className="w-8 h-8 rounded-md bg-[#FF5A1F]/10 border border-[#FF5A1F]/20 flex items-center justify-center">
                                                                <FileText size={14} className="text-[#FF5A1F]" />
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-900 group-hover/form:text-[#FF5A1F] transition-colors truncate max-w-[150px]">
                                                                {assignedForm.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic flex items-center gap-1.5 font-semibold">
                                                            <Store size={14} />
                                                            Using Global Form
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="py-4 pr-6 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreHorizontal size={16} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="rounded-xl shadow-md w-44">
                                                            <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => {
                                                                setAssignDialogProductIds([String(product.id)]);
                                                                setDialogInitialFormId(undefined);
                                                                setShowAssignDialog(true);
                                                            }}>
                                                                <LayoutTemplate size={13} className="mr-2" /> Assign Form
                                                            </DropdownMenuItem>
                                                            {assignedForm && (
                                                                <DropdownMenuItem
                                                                    className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                                    onClick={() => deleteAssignment(assignment!.id)}
                                                                >
                                                                    <Trash2 size={13} className="mr-2" /> Revert to Global
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem>
                                                                <ExternalLink size={13} className="mr-2" /> View on Store
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between py-2">
                            <p className="text-xs text-slate-400">
                                Page {currentPage} of {totalPages}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                                    <ChevronLeft size={14} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                                    <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sticky Bulk Action Bar */}
            {
                selectedProductIds.length > 0 && (
                    <div className="sticky bottom-6 z-40 flex justify-center pointer-events-none animate-in slide-in-from-bottom-5">
                        <div className="pointer-events-auto relative overflow-hidden bg-slate-900 border border-slate-800 text-white pl-5 pr-3 py-3 rounded-xl shadow-xl shadow-slate-900/10 flex items-center gap-4">

                            {/* Selection count */}
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center text-xs font-semibold border border-slate-700">
                                    {selectedProductIds.length}
                                </div>
                                <span className="text-sm font-semibold text-white">
                                    {selectedProductIds.length === 1 ? 'Product' : 'Products'} selected
                                </span>
                            </div>

                            {/* Divider */}
                            <div className="h-6 w-px bg-slate-800 mx-2" />

                            {/* Revert to Global button - Only show if at least one selected product has a specific assignment */}
                            {selectedProductIds.some(id => productAssignments.some(a => String(a.productId) === id)) && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-800 hover:bg-slate-800 hover:text-white text-slate-300 font-semibold h-9 rounded-lg px-4 transition-all"
                                    onClick={handleBulkUnlink}
                                >
                                    <Trash2 size={14} className="mr-1.5" />
                                    Revert to Global
                                </Button>
                            )}

                            {/* Assign Form button */}
                            <Button
                                size="sm"
                                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold h-9 rounded-lg px-5 shadow-sm transition-all"
                                onClick={handleBulkAssign}
                            >
                                <LayoutTemplate size={14} className="mr-1.5" />
                                Assign Form
                            </Button>

                            {/* Clear button */}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors ml-1"
                                onClick={() => setSelectedProductIds([])}
                            >
                                <X size={15} />
                            </Button>
                        </div>
                    </div>
                )
            }

            {/* Assignment Sheet */}
            <FormAssignmentSheet
                open={showAssignDialog}
                onOpenChange={setShowAssignDialog}
                userId={userId}
                storeId={selectedStoreId}
                products={products.filter(p => assignDialogProductIds.includes(String(p.id)))}
                initialProductIds={assignDialogProductIds}
                initialFormId={dialogInitialFormId}
            />
        </div >
    );
}

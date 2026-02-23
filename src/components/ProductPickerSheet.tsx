import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { getProductsFromCache, Product, syncProductsFromShopify, notifyProductSyncComplete } from '@/lib/products';
import { useConnectedStores } from '@/lib/firebase/hooks';
import { cn } from '@/lib/utils';
import { Check, Loader2, Package, RefreshCw, Search, X } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';

interface ProductPickerSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    storeId: string;
    userId: string;
    selectedProductIds: string[];
    onSave: (productIds: string[]) => void;
}

export function ProductPickerSheet({
    open,
    onOpenChange,
    storeId,
    userId,
    selectedProductIds: initialSelected,
    onSave,
}: ProductPickerSheetProps) {
    const { stores } = useConnectedStores(userId);
    const store = stores.find(s => s.id === storeId);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>(initialSelected);

    // Reset selection when sheet opens
    useEffect(() => {
        if (open) {
            setSelected(initialSelected);
            setSearch('');
        }
    }, [open, initialSelected]);

    // Load products from cache
    useEffect(() => {
        if (!open || !storeId) return;
        const load = async () => {
            setLoading(true);
            try {
                const cached = await getProductsFromCache(storeId);
                setProducts(cached?.products || []);
            } catch {
                setProducts([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [open, storeId]);

    const handleSync = async () => {
        if (!store) return;
        setSyncing(true);
        try {
            const synced = await syncProductsFromShopify(store);
            setProducts(synced);
            notifyProductSyncComplete(store.id, synced);
            toast.success(`Synced ${synced.length} products`);
        } catch {
            toast.error('Failed to sync products');
        } finally {
            setSyncing(false);
        }
    };

    const filtered = useMemo(() =>
        products.filter(p => p.title.toLowerCase().includes(search.toLowerCase())),
        [products, search]
    );

    const toggle = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const selectAll = () => {
        const ids = filtered.map(p => p.id.toString());
        setSelected(prev => Array.from(new Set([...prev, ...ids])));
    };

    const clearAll = () => setSelected([]);

    const hasChanges = JSON.stringify([...selected].sort()) !== JSON.stringify([...initialSelected].sort());

    const handleSave = () => {
        onSave(selected);
        onOpenChange(false);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-lg w-full flex flex-col p-0 bg-white">
                {/* Header with Save */}
                <SheetHeader className="px-5 py-3.5 border-b bg-white sticky top-0 z-10 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                            <Package size={16} className="text-indigo-600" />
                        </div>
                        <div>
                            <SheetTitle className="text-sm font-bold text-slate-900 leading-tight">
                                Select Products
                            </SheetTitle>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                {store?.name || 'Store'} · {selected.length} selected
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-4 text-xs font-bold shadow-sm transition-all active:scale-95"
                        onClick={handleSave}
                        disabled={selected.length === 0}
                    >
                        <Check size={14} className="mr-1" />
                        Done{selected.length > 0 ? ` (${selected.length})` : ''}
                    </Button>
                </SheetHeader>

                {/* Search + Actions */}
                <div className="px-4 py-3 border-b bg-slate-50/80 space-y-2">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search products..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="h-8 pl-8 text-xs bg-white border-slate-200 focus:border-indigo-400 rounded-lg"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 bg-white shrink-0"
                            onClick={handleSync}
                            disabled={syncing}
                            title="Refresh products from Shopify"
                        >
                            <RefreshCw size={12} className={cn(syncing && "animate-spin")} />
                        </Button>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={selectAll} className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                                Select All
                            </button>
                            <span className="text-slate-300">·</span>
                            <button onClick={clearAll} className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 hover:underline">
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                {/* Product List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2">
                            <Loader2 className="animate-spin text-indigo-400" size={20} />
                            <p className="text-[11px] text-slate-400">Loading products...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2">
                            <Package size={24} className="text-slate-200" />
                            <p className="text-[11px] text-slate-400">
                                {products.length === 0 ? 'No products — tap refresh to sync from Shopify' : 'No products match your search'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {filtered.map(product => {
                                const id = product.id.toString();
                                const isSelected = selected.includes(id);
                                return (
                                    <button
                                        key={id}
                                        onClick={() => toggle(id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left",
                                            isSelected
                                                ? "bg-indigo-50 border border-indigo-200"
                                                : "hover:bg-slate-50 border border-transparent"
                                        )}
                                    >
                                        {/* Checkbox */}
                                        <div className={cn(
                                            "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                            isSelected
                                                ? "bg-indigo-600 border-indigo-600 text-white scale-105"
                                                : "border-slate-300 bg-white"
                                        )}>
                                            {isSelected && <Check size={12} strokeWidth={3} />}
                                        </div>

                                        {/* Image */}
                                        <div className="w-10 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                                            {product.image?.src ? (
                                                <img src={product.image.src} className="w-full h-full object-cover" loading="lazy" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Package size={14} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Title + Price */}
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-xs font-medium truncate",
                                                isSelected ? "text-indigo-900 font-bold" : "text-slate-700"
                                            )}>
                                                {product.title}
                                            </p>
                                            {product.price && (
                                                <p className="text-[10px] text-slate-400 mt-0.5">{product.price} DA</p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

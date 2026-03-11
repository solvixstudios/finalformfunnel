import { useOrders } from '@/hooks/useOrders';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Search, Filter, ShoppingCart, DollarSign, X, ChevronDown, TrendingUp,
    Calendar, MapPin, Download, ArrowUpDown, ArrowUp, ArrowDown, CheckSquare, FileText, Truck, Send
} from 'lucide-react';
import { toast } from 'sonner';
import { useDeliveryProfiles } from '../lib/firebase/deliveryHooks';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useHeaderActions } from '../contexts/HeaderActionsContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow, subDays, isAfter, startOfDay } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { StateWrapper } from '@/components/ui/StateWrapper';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { DashboardHeader } from '@/components/DashboardHeader';
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DateRange as DayPickerDateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { getStoredUser } from '@/lib/authGoogle';
import { useNavigate } from 'react-router-dom';

interface OrdersPageProps {
    userId: string;
}

type SortField = 'date' | 'value' | 'status' | 'name';
type SortDirection = 'asc' | 'desc';
type DateRange = 'all' | 'today' | '7d' | '30d' | 'custom';

export default function OrdersPage({ userId }: OrdersPageProps) {
    const { orders, loading, error, updateOrderStatus } = useOrders(userId);
    const { profiles: devProfiles } = useDeliveryProfiles(userId);
    const activeDevProfiles = devProfiles.filter(p => p.isActive);
    const navigate = useNavigate();
    const user = getStoredUser();

    // Filters
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dateRange, setDateRange] = useState<string>('all');
    const [wilayaFilter, setWilayaFilter] = useState<string>('all');
    const [storeFilter, setStoreFilter] = useState<string>('all');
    const [productFilter, setProductFilter] = useState<string>('all');
    const [formFilter, setFormFilter] = useState<string>('all');
    const [customDateFrom, setCustomDateFrom] = useState('');
    const [customDateTo, setCustomDateTo] = useState('');
    const [calendarRange, setCalendarRange] = useState<DayPickerDateRange | undefined>();
    const [datePopoverOpen, setDatePopoverOpen] = useState(false);

    // Sorting
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Derived Metrics
    const metrics = useMemo(() => {
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => {
            if (['completed', 'confirmed', 'shipped'].includes(order.status || '')) {
                return sum + (Number(order.totalPrice) || 0);
            }
            return sum;
        }, 0);
        const aov = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
        return { totalOrders, totalRevenue, aov };
    }, [orders]);

    // Unique wilayas from order data
    const wilayas = useMemo(() => {
        const map = new Map<string, number>();
        orders.forEach(o => {
            if (o.wilaya) {
                map.set(o.wilaya, (map.get(o.wilaya) || 0) + 1);
            }
        });
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1]);
    }, [orders]);

    const storesList = useMemo(() => {
        const map = new Map<string, number>();
        orders.forEach(o => {
            const sl = o.shopDomain || o.shopName || 'Manual';
            map.set(sl, (map.get(sl) || 0) + 1);
        });
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    }, [orders]);

    const productsList = useMemo(() => {
        const map = new Map<string, number>();
        orders.forEach(o => {
            const pr = o.productTitle || o.selectedProduct || 'Other';
            map.set(pr, (map.get(pr) || 0) + 1);
        });
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    }, [orders]);

    const formsList = useMemo(() => {
        const map = new Map<string, number>();
        orders.forEach(o => {
            const fr = o.formName || o.formId || 'Direct';
            map.set(fr, (map.get(fr) || 0) + 1);
        });
        return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    }, [orders]);

    // Active filters count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (statusFilter !== 'all') count++;
        if (dateRange !== 'all') count++;
        if (wilayaFilter !== 'all') count++;
        if (storeFilter !== 'all') count++;
        if (productFilter !== 'all') count++;
        if (formFilter !== 'all') count++;
        if (searchTerm) count++;
        return count;
    }, [statusFilter, dateRange, wilayaFilter, storeFilter, productFilter, formFilter, searchTerm]);

    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setDateRange('all');
        setWilayaFilter('all');
        setStoreFilter('all');
        setProductFilter('all');
        setFormFilter('all');
        setCustomDateFrom('');
        setCustomDateTo('');
        setCalendarRange(undefined);
        setSelectedOrders([]);
    };

    // Filtering
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // Search
            const matchesSearch = !searchTerm || [
                order.name, order.phone, order.orderId, order.id,
                order.selectedProduct, order.email, order.wilaya, order.commune,
            ].some(field => field?.toString().toLowerCase().includes(searchTerm.toLowerCase()));

            // Status
            const normalizedStatus = (order.status || 'New').toLowerCase();
            const matchesStatus = statusFilter === 'all' || normalizedStatus === statusFilter.toLowerCase();

            // Date range
            let matchesDate = true;
            if (dateRange !== 'all' && order.createdAt) {
                const orderDate = new Date(order.createdAt);
                if (dateRange === 'today') {
                    matchesDate = isAfter(orderDate, startOfDay(new Date()));
                } else if (dateRange === '7d') {
                    matchesDate = isAfter(orderDate, subDays(new Date(), 7));
                } else if (dateRange === '30d') {
                    matchesDate = isAfter(orderDate, subDays(new Date(), 30));
                } else if (dateRange === 'custom') {
                    if (customDateFrom) matchesDate = matchesDate && isAfter(orderDate, new Date(customDateFrom));
                    if (customDateTo) matchesDate = matchesDate && !isAfter(orderDate, new Date(customDateTo + 'T23:59:59'));
                }
            }

            // Wilaya
            const matchesWilaya = wilayaFilter === 'all' || order.wilaya === wilayaFilter;

            // Extra Filters
            const store = order.shopDomain || order.shopName || 'Manual';
            const matchesStore = storeFilter === 'all' || store === storeFilter;

            const product = order.productTitle || order.selectedProduct || 'Other';
            const matchesProduct = productFilter === 'all' || product === productFilter;

            const form = order.formName || order.formId || 'Direct';
            const matchesForm = formFilter === 'all' || form === formFilter;

            return matchesSearch && matchesStatus && matchesDate && matchesWilaya && matchesStore && matchesProduct && matchesForm;
        }).sort((a, b) => {
            const dir = sortDirection === 'asc' ? 1 : -1;
            switch (sortField) {
                case 'date': {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return (dateA - dateB) * dir;
                }
                case 'value':
                    return ((Number(a.totalPrice) || 0) - (Number(b.totalPrice) || 0)) * dir;
                case 'status':
                    return (a.status || '').localeCompare(b.status || '') * dir;
                case 'name':
                    return (a.name || '').localeCompare(b.name || '') * dir;
                default:
                    return 0;
            }
        });
    }, [orders, searchTerm, statusFilter, dateRange, wilayaFilter, storeFilter, productFilter, formFilter, customDateFrom, customDateTo, sortField, sortDirection]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={12} className="text-slate-300" />;
        return sortDirection === 'asc'
            ? <ArrowUp size={12} className="text-violet-500" />
            : <ArrowDown size={12} className="text-violet-500" />;
    };

    const getStatusStyle = (status: string) => {
        const styles: Record<string, string> = {
            completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
            pending: 'bg-amber-50 text-amber-700 border-amber-200',
            shipped: 'bg-violet-50 text-violet-700 border-violet-200',
            abandoned: 'bg-slate-100 text-slate-500 border-slate-200',
            cancelled: 'bg-red-50 text-red-700 border-red-200',
        };
        return styles[status] || 'bg-slate-100 text-slate-600 border-slate-200';
    };

    // CSV Export
    const exportCSV = useCallback(() => {
        const headers = ['Order ID', 'Date', 'Customer', 'Phone', 'Wilaya', 'Commune', 'Product', 'Variant', 'Qty', 'Value', 'Status'];
        const rows = filteredOrders.map(o => [
            o.orderId || o.id,
            o.createdAt ? new Date(o.createdAt).toISOString() : '',
            o.name || '',
            o.phone || '',
            o.wilaya || '',
            o.commune || '',
            o.productTitle || o.selectedProduct || '',
            o.variant || '',
            o.quantity || 1,
            Number(o.totalPrice) || 0,
            o.status || 'completed',
        ]);

        const csv = [headers, ...rows].map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [filteredOrders]);

    const toggleOrderSelection = (id: string) => {
        setSelectedOrders(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleAllSelection = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id));
        }
    };

    const handleDispatch = (profileId: string) => {
        const profile = devProfiles.find(p => p.id === profileId);
        if (!profile) return;
        toast.success(`Dispatched ${selectedOrders.length} orders to ${profile.name}!`);
        setSelectedOrders([]);
    };

    const headerActions = (
        <div className="flex items-center gap-2">
            {selectedOrders.length > 0 && activeDevProfiles.length > 0 && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            className="h-8 rounded-lg text-xs font-semibold px-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-1.5"
                        >
                            <Truck size={14} className="opacity-80" />
                            Dispatch ({selectedOrders.length})
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-md">
                        <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Select Partner</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {activeDevProfiles.map(p => (
                            <DropdownMenuItem key={p.id} onClick={() => handleDispatch(p.id)} className="cursor-pointer">
                                <Send size={14} className="mr-2 text-indigo-500" /> {p.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            <Button
                size="sm"
                onClick={exportCSV}
                className="h-8 rounded-lg text-xs font-semibold px-4 bg-slate-900 hover:bg-slate-800 text-white shadow-sm gap-1.5"
                disabled={filteredOrders.length === 0}
            >
                <Download size={14} className="opacity-80" />
                Export CSV
            </Button>
        </div>
    );

    if (loading) {
        return (
            <div className="max-w-[1600px] mx-auto w-full space-y-5 h-full flex flex-col pt-2">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 space-y-5">
                    <Skeleton className="h-6 w-48" />
                    <div className="grid grid-cols-4 gap-3">
                        <Skeleton className="h-[68px] rounded-lg" />
                        <Skeleton className="h-[68px] rounded-lg" />
                        <Skeleton className="h-[68px] rounded-lg" />
                        <Skeleton className="h-[68px] rounded-lg" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 flex-1 max-w-md rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>
                <TableSkeleton columns={6} rows={8} className="bg-white rounded-xl border border-slate-200 shadow-sm" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-[1600px] mx-auto w-full pt-2">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 mt-4">
                    <h3 className="font-bold mb-1">Error Loading Orders</h3>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto w-full space-y-5 h-full flex flex-col pt-2 md:pt-4">
            <PageHeader
                title="Orders"
                breadcrumbs={[{ label: 'Orders' }]}
                count={orders.length}
                icon={ShoppingCart}
                actions={headerActions}
            />

            {/* Stats Header */}
            <DashboardHeader
                userName={user?.displayName || 'there'}
                greeting={false}
                stats={[
                    { label: 'Orders', value: metrics.totalOrders, icon: <ShoppingCart size={16} />, color: 'violet' },
                    { label: 'Revenue', value: metrics.totalRevenue, icon: <DollarSign size={16} />, color: 'emerald', format: (n) => n.toLocaleString(), suffix: 'DZD' },
                    { label: 'Avg Value', value: Math.round(metrics.aov), icon: <TrendingUp size={16} />, color: 'blue', format: (n) => n.toLocaleString(), suffix: 'DZD' },
                ]}
            />

            {/* Filters Bar */}
            <div className="flex flex-col gap-3 shrink-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={16} />
                        <Input
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 bg-white border-slate-200 rounded-lg text-sm shadow-sm focus:ring-1 focus:ring-slate-900/5 focus:border-slate-300 placeholder:text-slate-400 font-medium"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Advanced Date Range */}
                        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn(
                                    "h-10 rounded-lg text-xs font-medium px-4 border-slate-200 shadow-sm gap-1.5 transition-colors",
                                    dateRange !== 'all' ? "bg-slate-900 text-white hover:bg-slate-800 border-transparent" : "hover:bg-slate-50 text-slate-700"
                                )}>
                                    <Calendar size={14} className={dateRange !== 'all' ? "text-slate-300" : "text-slate-400"} />
                                    {dateRange === 'all' ? 'All Time' :
                                        dateRange === 'today' ? 'Today' :
                                            dateRange === '7d' ? 'Last 7 Days' :
                                                dateRange === '30d' ? 'Last 30 Days' :
                                                    (calendarRange?.from ? (
                                                        calendarRange.to ? `${format(calendarRange.from, "LLL dd")} - ${format(calendarRange.to, "LLL dd")}` : format(calendarRange.from, "LLL dd")
                                                    ) : 'Custom')}
                                    <ChevronDown size={12} className={dateRange !== 'all' ? "text-slate-400" : "text-slate-400"} />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 rounded-xl shadow-lg border-slate-200" align="start">
                                <div className="flex flex-col sm:flex-row">
                                    <div className="flex flex-col gap-1 p-3 border-b sm:border-b-0 sm:border-r border-slate-100 min-w-[140px]">
                                        <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Presets</p>
                                        {[
                                            { id: 'all', label: 'All Time' },
                                            { id: 'today', label: 'Today' },
                                            { id: '7d', label: 'Last 7 Days' },
                                            { id: '30d', label: 'Last 30 Days' },
                                        ].map((preset) => (
                                            <button
                                                key={preset.id}
                                                onClick={() => {
                                                    setDateRange(preset.id);
                                                    setCalendarRange(undefined);
                                                    setCustomDateFrom('');
                                                    setCustomDateTo('');
                                                    setDatePopoverOpen(false);
                                                }}
                                                className={cn(
                                                    "px-3 py-2 text-xs font-medium rounded-md text-left transition-colors",
                                                    dateRange === preset.id ? "bg-violet-50 text-violet-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                )}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="p-3">
                                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Custom Range</p>
                                        <CalendarComponent
                                            mode="range"
                                            selected={calendarRange}
                                            onSelect={(range) => {
                                                setCalendarRange(range);
                                                setDateRange('custom');
                                                if (range?.from) setCustomDateFrom(format(range.from, 'yyyy-MM-dd'));
                                                else setCustomDateFrom('');

                                                if (range?.to) setCustomDateTo(format(range.to, 'yyyy-MM-dd'));
                                                else setCustomDateTo('');
                                            }}
                                            numberOfMonths={1}
                                            className="rounded-md border-0"
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Wilaya Filter */}
                        {wilayas.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className={cn(
                                        "h-10 rounded-lg text-xs font-medium px-4 border-slate-200 shadow-sm gap-1.5 transition-colors",
                                        wilayaFilter !== 'all' ? "bg-slate-900 text-white hover:bg-slate-800 border-transparent" : "hover:bg-slate-50 text-slate-700"
                                    )}>
                                        <MapPin size={14} className={wilayaFilter !== 'all' ? "text-slate-300" : "text-slate-400"} />
                                        {wilayaFilter === 'all' ? 'All Wilayas' : wilayaFilter}
                                        <ChevronDown size={12} className={wilayaFilter !== 'all' ? "text-slate-400" : "text-slate-400"} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl max-h-72 overflow-auto p-2 shadow-md">
                                    <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Wilaya</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setWilayaFilter('all')}>
                                        <span className="flex-1">All Wilayas</span>
                                        <span className="text-[10px] font-bold text-slate-400">{orders.length}</span>
                                    </DropdownMenuItem>
                                    {wilayas.map(([name, count]) => (
                                        <DropdownMenuItem key={name} onClick={() => setWilayaFilter(name)}>
                                            <span className="flex-1 truncate">{name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">{count}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Custom Filters (Store, Product, Form) */}
                        {storesList.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className={cn(
                                        "h-10 rounded-lg text-xs font-medium px-4 border-slate-200 shadow-sm gap-1.5 transition-colors",
                                        storeFilter !== 'all' ? "bg-slate-900 text-white hover:bg-slate-800 border-transparent" : "hover:bg-slate-50 text-slate-700"
                                    )}>
                                        <ShoppingCart size={14} className={storeFilter !== 'all' ? "text-slate-300" : "text-slate-400"} />
                                        {storeFilter === 'all' ? 'All Stores' : storeFilter}
                                        <ChevronDown size={12} className={storeFilter !== 'all' ? "text-slate-400" : "text-slate-400"} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl max-h-72 overflow-auto p-2 shadow-md">
                                    <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Store</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setStoreFilter('all')}>
                                        <span className="flex-1">All Stores</span>
                                    </DropdownMenuItem>
                                    {storesList.map(([name, count]) => (
                                        <DropdownMenuItem key={name} onClick={() => setStoreFilter(name)}>
                                            <span className="flex-1 truncate">{name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">{count}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {productsList.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className={cn(
                                        "h-10 rounded-lg text-xs font-medium px-4 border-slate-200 shadow-sm gap-1.5 transition-colors",
                                        productFilter !== 'all' ? "bg-slate-900 text-white hover:bg-slate-800 border-transparent" : "hover:bg-slate-50 text-slate-700"
                                    )}>
                                        <Filter size={14} className={productFilter !== 'all' ? "text-slate-300" : "text-slate-400"} />
                                        {productFilter === 'all' ? 'All Products' : (productFilter.length > 10 ? productFilter.slice(0, 10) + '...' : productFilter)}
                                        <ChevronDown size={12} className={productFilter !== 'all' ? "text-slate-400" : "text-slate-400"} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl max-h-72 overflow-auto p-2 shadow-md">
                                    <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Product</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setProductFilter('all')}>
                                        <span className="flex-1">All Products</span>
                                    </DropdownMenuItem>
                                    {productsList.map(([name, count]) => (
                                        <DropdownMenuItem key={name} onClick={() => setProductFilter(name)}>
                                            <span className="flex-1 truncate">{name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">{count}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {formsList.length > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className={cn(
                                        "h-10 rounded-lg text-xs font-medium px-4 border-slate-200 shadow-sm gap-1.5 transition-colors",
                                        formFilter !== 'all' ? "bg-slate-900 text-white hover:bg-slate-800 border-transparent" : "hover:bg-slate-50 text-slate-700"
                                    )}>
                                        <FileText size={14} className={formFilter !== 'all' ? "text-slate-300" : "text-slate-400"} />
                                        {formFilter === 'all' ? 'All Forms' : (formFilter.length > 10 ? formFilter.slice(0, 10) + '...' : formFilter)}
                                        <ChevronDown size={12} className={formFilter !== 'all' ? "text-slate-400" : "text-slate-400"} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl max-h-72 overflow-auto p-2 shadow-md">
                                    <DropdownMenuLabel className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Form</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setFormFilter('all')}>
                                        <span className="flex-1">All Forms</span>
                                    </DropdownMenuItem>
                                    {formsList.map(([name, count]) => (
                                        <DropdownMenuItem key={name} onClick={() => setFormFilter(name)}>
                                            <span className="flex-1 truncate">{name}</span>
                                            <span className="text-[10px] font-bold text-slate-400 tabular-nums">{count}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* Status Pills */}
                        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 hide-scrollbar overflow-x-auto">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'New', label: 'New' },
                                { key: 'Confirmed', label: 'Confirmed' },
                                { key: 'Cancelled', label: 'Cancelled' },
                                { key: 'Shipped', label: 'Shipped' },
                                { key: 'Returned', label: 'Returned' },
                                { key: 'No Answer', label: 'No Answer' },
                                { key: 'Wrong Number', label: 'Wrong Number' },
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setStatusFilter(item.key)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap",
                                        statusFilter === item.key
                                            ? "bg-[#FF5A1F] text-white shadow-sm"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        <div className="hidden sm:block h-5 w-px bg-slate-200" />
                    </div>
                </div>

                {/* Active Filter Chips */}
                {activeFilterCount > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Filters:</span>
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 hover:bg-slate-200/60 transition-colors">
                                Search: "{searchTerm.length > 15 ? searchTerm.slice(0, 15) + '...' : searchTerm}"
                                <X size={12} className="text-slate-400" />
                            </button>
                        )}
                        {statusFilter !== 'all' && (
                            <button onClick={() => setStatusFilter('all')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 hover:bg-slate-200/60 transition-colors">
                                Status: {statusFilter}
                                <X size={12} className="text-slate-400" />
                            </button>
                        )}
                        {dateRange !== 'all' && (
                            <button onClick={() => { setDateRange('all'); setCustomDateFrom(''); setCustomDateTo(''); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 hover:bg-slate-200/60 transition-colors">
                                Date: {dateRange === 'today' ? 'Today' : dateRange === '7d' ? '7 Days' : dateRange === '30d' ? '30 Days' : 'Custom'}
                                <X size={12} className="text-slate-400" />
                            </button>
                        )}
                        {wilayaFilter !== 'all' && (
                            <button onClick={() => setWilayaFilter('all')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 hover:bg-slate-200/60 transition-colors">
                                Wilaya: {wilayaFilter}
                                <X size={12} className="text-slate-400" />
                            </button>
                        )}
                        {storeFilter !== 'all' && (
                            <button onClick={() => setStoreFilter('all')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 hover:bg-slate-200/60 transition-colors">
                                Store: {storeFilter}
                                <X size={12} className="text-slate-400" />
                            </button>
                        )}
                        {productFilter !== 'all' && (
                            <button onClick={() => setProductFilter('all')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 hover:bg-slate-200/60 transition-colors">
                                Product: {productFilter}
                                <X size={12} className="text-slate-400" />
                            </button>
                        )}
                        {formFilter !== 'all' && (
                            <button onClick={() => setFormFilter('all')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 hover:bg-slate-200/60 transition-colors">
                                Form: {formFilter}
                                <X size={12} className="text-slate-400" />
                            </button>
                        )}
                        <button onClick={clearAllFilters} className="text-xs font-medium text-slate-400 hover:text-slate-900 transition-colors ml-1 border-b border-transparent hover:border-slate-900 pb-0.5">
                            Clear all
                        </button>
                        <span className="text-xs text-slate-400 ml-auto tabular-nums">{filteredOrders.length} result{filteredOrders.length !== 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>

            {/* Table or Empty State */}
            {(orders.length === 0) ? (
                <StateWrapper>
                    <EmptyState
                        icon={<ShoppingCart size={32} />}
                        title="No orders yet"
                        description="When customers submit your forms, their orders will appear here automatically."
                        variant="ghost"
                    />
                </StateWrapper>
            ) : (filteredOrders.length === 0) ? (
                <StateWrapper>
                    <EmptyState
                        icon={<Filter size={32} />}
                        title="No matching orders"
                        description="We couldn't find any orders matching your filters."
                        action={{ label: 'Clear Filters', onClick: clearAllFilters }}
                        variant="ghost"
                    />
                </StateWrapper>
            ) : (
                <div className="flex-1 pb-16 overflow-y-auto pr-1 flex flex-col">
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-300">
                        <div className="overflow-auto custom-scroll">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-50/50 border-b border-slate-200">
                                        <th className="py-3 px-4 w-10 text-center">
                                            <Checkbox
                                                checked={filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length}
                                                onCheckedChange={toggleAllSelection}
                                            />
                                        </th>
                                        <th className="py-3 px-6 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Order ID</th>
                                        <th className="py-3 px-6 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => toggleSort('date')}>
                                            <span className="inline-flex items-center gap-1">Date <SortIcon field="date" /></span>
                                        </th>
                                        <th className="py-3 px-6 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => toggleSort('name')}>
                                            <span className="inline-flex items-center gap-1">Customer <SortIcon field="name" /></span>
                                        </th>
                                        <th className="py-3 px-6 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => toggleSort('value')}>
                                            <span className="inline-flex items-center gap-1">Value <SortIcon field="value" /></span>
                                        </th>
                                        <th className="py-3 px-6 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                                        <th className="py-3 px-6 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap text-right cursor-pointer select-none hover:text-slate-900 transition-colors" onClick={() => toggleSort('status')}>
                                            <span className="inline-flex items-center gap-1">Status <SortIcon field="status" /></span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOrders.map((order, idx) => (
                                        <tr key={order.id} className="hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-b-0">
                                            <td className="py-3.5 px-4 align-top w-10 text-center">
                                                <Checkbox
                                                    checked={selectedOrders.includes(order.id)}
                                                    onCheckedChange={() => toggleOrderSelection(order.id)}
                                                />
                                            </td>
                                            <td className="py-3.5 px-6 align-top">
                                                <div className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100/70 px-2 py-1 rounded-md inline-block border border-slate-200">
                                                    {order.orderId ? order.orderId.replace('ORD-', '') : order.id.slice(0, 8)}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-6 align-top text-sm">
                                                <div className="font-semibold text-slate-900">
                                                    {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : 'Unknown'}
                                                </div>
                                                <div className="text-slate-500 font-medium text-[11px] mt-0.5">
                                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-6 align-top">
                                                <div className="font-semibold text-slate-900 text-sm line-clamp-1">{order.name || 'Anonymous'}</div>
                                                <div className="text-slate-500 font-medium text-xs">{order.phone || ''}</div>
                                                {(order.wilaya || order.commune) && (
                                                    <div className="text-slate-400 font-medium text-[10px] mt-1 truncate max-w-[170px] uppercase tracking-wider">
                                                        {order.wilaya} {order.commune && `› ${order.commune}`}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-6 align-top">
                                                <div className="font-bold text-slate-900 text-sm tabular-nums">{(Number(order.totalPrice) || 0).toLocaleString()} DZD</div>
                                                {order.quantity && order.quantity > 1 && (
                                                    <div className="text-slate-500 font-semibold text-[10px] mt-0.5 uppercase tracking-wider">Qty: {order.quantity}</div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-6 align-top max-w-xs">
                                                <div className="line-clamp-1 text-sm text-slate-900 font-semibold">
                                                    {order.productTitle || 'Unknown Product'}
                                                </div>
                                                {order.variant && order.variant !== 'Default Title' && (
                                                    <div className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded border border-slate-200">
                                                        {order.variant}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-6 align-top text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                                            <Badge variant="outline" className={cn(
                                                                "cursor-pointer border text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1.5 flex items-center gap-1.5 rounded-md transition-colors",
                                                                getStatusStyle(order.status || 'completed'),
                                                                order.status === 'pending' && "animate-pulse"
                                                            )}>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                                                {(order.status || 'completed')}
                                                                <ChevronDown size={10} className="opacity-50 ml-0.5" />
                                                            </Badge>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-md">
                                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'completed')}>Completed</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'pending')}>Pending</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'confirmed')}>Confirmed</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'shipped')}>Shipped</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'abandoned')}>Abandoned</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'cancelled')} className="text-red-600 focus:text-red-700">Cancelled</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

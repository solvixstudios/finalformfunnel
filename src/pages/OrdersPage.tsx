import { useOrders } from '@/hooks/useOrders';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, ShoppingCart, DollarSign, Activity, Settings2, X, RotateCw, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { formatDistanceToNow } from 'date-fns';

interface OrdersPageProps {
    userId: string;
}

export default function OrdersPage({ userId }: OrdersPageProps) {
    const { orders, loading, error, updateOrderStatus } = useOrders(userId);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Derived Metrics
    const metrics = useMemo(() => {
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => {
            // Only count completed or confirmed orders for revenue
            if (['completed', 'confirmed', 'shipped'].includes(order.status || '')) {
                return sum + (Number(order.totalPrice) || 0);
            }
            return sum;
        }, 0);

        const aov = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

        return { totalOrders, totalRevenue, aov };
    }, [orders]);

    // Filtering
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch =
                (order.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.phone || '').includes(searchTerm) ||
                (order.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (order.productTitle || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || (order.status || 'completed') === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [orders, searchTerm, statusFilter]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'confirmed': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'shipped': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'abandoned': return 'bg-slate-100 text-slate-600 border-slate-200';
            case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 h-full">
                <div className="flex flex-col items-center gap-4 text-slate-500">
                    <RotateCw className="w-8 h-8 animate-spin text-orange-500" />
                    <p className="font-medium animate-pulse">Loading orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 p-8">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                    <h3 className="font-bold mb-2">Error Loading Orders</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden w-full max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Orders</h1>
                    <p className="text-slate-500 mt-1 font-medium">Track your form submissions in real-time.</p>
                </div>
            </header>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200/60 relative overflow-hidden group hover:border-orange-500/30 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                            <ShoppingCart size={24} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-sm font-semibold mb-1">Total Orders</div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">
                                {metrics.totalOrders}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200/60 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <DollarSign size={24} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-sm font-semibold mb-1">Total Revenue</div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">
                                {metrics.totalRevenue.toLocaleString()} DZD
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200/60 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Activity size={24} className="stroke-[2.5]" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-sm font-semibold mb-1">Avg Order Value</div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">
                                {metrics.aov.toLocaleString(undefined, { maximumFractionDigits: 0 })} DZD
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 pb-2 shrink-0">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 transition-colors">
                        <Search size={18} />
                    </div>
                    <Input
                        placeholder="Search by name, phone, order ID, product..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 bg-white border-slate-200/60 shadow-sm rounded-xl"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-11 bg-white border-slate-200/60 shadow-sm rounded-xl gap-2 min-w-[140px] justify-between">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-slate-500" />
                                <span className="font-medium">
                                    {statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                                </span>
                            </div>
                            <ChevronDown size={14} className="text-slate-400" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Orders</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('confirmed')}>Confirmed</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('shipped')}>Shipped</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('abandoned')}>Abandoned</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>Cancelled</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm flex flex-col overflow-hidden relative flex-1">
                {(orders.length === 0) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                            <ShoppingCart size={28} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No orders yet</h3>
                        <p className="max-w-sm">When customers submit your forms, their orders will appear here automatically.</p>
                    </div>
                ) : (filteredOrders.length === 0) ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No matching orders</h3>
                        <p>Try adjusting your search or status filter.</p>
                        <Button variant="link" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} className="mt-2">
                            Clear filters
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-auto custom-scroll flex-1">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead className="sticky top-0 bg-slate-50 z-10 before:absolute before:inset-0 before:border-b before:border-slate-200/60 before:pointer-events-none">
                                <tr>
                                    <th className="py-4 px-5 text-sm font-semibold text-slate-600 whitespace-nowrap">Order ID</th>
                                    <th className="py-4 px-5 text-sm font-semibold text-slate-600 whitespace-nowrap">Date</th>
                                    <th className="py-4 px-5 text-sm font-semibold text-slate-600 whitespace-nowrap">Customer</th>
                                    <th className="py-4 px-5 text-sm font-semibold text-slate-600 whitespace-nowrap">Value</th>
                                    <th className="py-4 px-5 text-sm font-semibold text-slate-600">Product</th>
                                    <th className="py-4 px-5 text-sm font-semibold text-slate-600 whitespace-nowrap text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-5 align-top">
                                            <div className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded inline-block">
                                                {order.orderId ? order.orderId.replace('ORD-', '') : order.id.slice(0, 8)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 align-top text-sm">
                                            <div className="font-medium text-slate-900">
                                                {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : 'Unknown'}
                                            </div>
                                            <div className="text-slate-500 text-xs mt-0.5">
                                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 align-top">
                                            <div className="font-medium text-slate-900 line-clamp-1">{order.name || 'Anonymous'}</div>
                                            <div className="text-slate-500 text-sm">{order.phone || ''}</div>
                                            {(order.wilaya || order.commune) && (
                                                <div className="text-slate-400 text-xs mt-1 truncate max-w-[150px]">
                                                    {order.wilaya} {order.commune && `> ${order.commune}`}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 align-top">
                                            <div className="font-bold text-slate-900">{(Number(order.totalPrice) || 0).toLocaleString()} DZD</div>
                                            {order.quantity && order.quantity > 1 && (
                                                <div className="text-slate-500 text-xs mt-0.5">Qty: {order.quantity}</div>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 align-top max-w-xs">
                                            <div className="line-clamp-2 text-sm text-slate-800 font-medium">
                                                {order.productTitle || 'Unknown Product'}
                                            </div>
                                            {order.variant && order.variant !== 'Default Title' && (
                                                <div className="text-slate-500 text-xs mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded">
                                                    {order.variant}
                                                </div>
                                            )}
                                            {order.shopDomain && (
                                                <div className="text-slate-400 text-xs mt-1">
                                                    Store: {order.shopDomain}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 align-top text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                                                        <Badge variant="outline" className={cn("cursor-pointer border text-xs px-2.5 py-1 flex items-center gap-1.5", getStatusStyle(order.status || 'completed'))}>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                                            {(order.status || 'completed').toUpperCase()}
                                                            <ChevronDown size={12} className="opacity-50 ml-1" />
                                                        </Badge>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg">
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
                )}
            </div>
        </div>
    );
}

function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

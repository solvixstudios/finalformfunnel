import { DashboardHeader } from '@/components/DashboardHeader';
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { getStoredUser } from '@/lib/authGoogle';
import { useConnectedStores, useFormAssignments, useSavedForms } from '@/lib/firebase/hooks';
import { useOrders } from '@/hooks/useOrders';
import { FolderOpen, Globe2, ShoppingCart, DollarSign, Activity, FileText, LayoutGrid, X, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

interface HomePageProps {
    userId: string;
}

export default function HomePage({ userId }: HomePageProps) {
    const user = getStoredUser();
    const navigate = useNavigate();

    // Fetch data
    const { forms, loading: formsLoading } = useSavedForms(userId);
    const { assignments: allAssignments, loading: assignmentsLoading } = useFormAssignments(userId);
    const { orders, loading: ordersLoading } = useOrders(userId);
    const { stores, loading: storesLoading } = useConnectedStores(userId);

    const isLoading = formsLoading || assignmentsLoading || ordersLoading || storesLoading;

    // Getting Started Dismissal State
    const [hideGettingStarted, setHideGettingStarted] = useState(() => {
        return localStorage.getItem('hide-getting-started') === 'true';
    });

    const dismissGettingStarted = () => {
        setHideGettingStarted(true);
        localStorage.setItem('hide-getting-started', 'true');
    };

    const stats = useMemo(() => {
        const totalForms = forms.length;
        const liveForms = forms.filter(f =>
            allAssignments.some(a => a.formId === f.id && a.isActive)
        ).length;

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => {
            if (['completed', 'confirmed', 'shipped'].includes(order.status || '')) {
                return sum + (Number(order.totalPrice) || 0);
            }
            return sum;
        }, 0);

        const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
        const abandonedCheckouts = orders.filter(o => o.status === 'abandoned').length;

        // Unique customers by phone number or name
        const uniqueCustomers = new Set(orders.map(o => o.phone || o.name).filter(Boolean)).size;

        return { totalForms, liveForms, totalOrders, totalRevenue, aov, abandonedCheckouts, uniqueCustomers };
    }, [forms, allAssignments, orders]);

    // Recent Activity (Last 5 orders)
    const recentOrders = useMemo(() => {
        return [...orders]
            .sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 5);
    }, [orders]);

    if (isLoading) {
        return (
            <div className="max-w-[1600px] mx-auto w-full space-y-6 h-full flex flex-col pt-2">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto w-full space-y-8 h-full flex flex-col pt-2 pb-16">
            <PageHeader
                title="Home"
                breadcrumbs={[{ label: 'Home' }]}
                icon={LayoutGrid}
            />

            {/* The Big Welcome Header */}
            <DashboardHeader
                userName={user?.displayName || 'there'}
                greeting={true}
                stats={[
                    { label: 'Total Revenue', value: stats.totalRevenue, icon: <DollarSign size={16} />, color: 'amber', format: (n) => n.toLocaleString(), suffix: 'DZD' },
                    { label: 'Total Orders', value: stats.totalOrders, icon: <ShoppingCart size={16} />, color: 'blue' },
                    { label: 'AOV', value: stats.aov, icon: <TrendingUp size={16} />, color: 'emerald', format: (n) => n.toLocaleString(), suffix: 'DZD' },
                    { label: 'Abandoned Carts', value: stats.abandonedCheckouts, icon: <ShoppingCart size={16} />, color: 'amber' },
                    { label: 'Unique Customers', value: stats.uniqueCustomers, icon: <Users size={16} />, color: 'violet' },
                    { label: 'Total Forms', value: stats.totalForms, icon: <FolderOpen size={16} />, color: 'violet' },
                    { label: 'Active Funnels', value: stats.liveForms, icon: <Globe2 size={16} />, color: 'emerald' },
                ]}
                plan={{ name: 'Pro Plan', daysLeft: 28, totalDays: 30 }}
                onPlanClick={() => navigate('/dashboard/settings?tab=subscription')}
            />

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Orders Stream */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="text-slate-400" size={18} />
                            <h2 className="text-lg font-bold tracking-tight text-slate-900">Recent Activity</h2>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/orders')} className="rounded-lg h-8 px-4 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50">
                            View all orders
                        </Button>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 overflow-hidden">
                        {recentOrders.length === 0 ? (
                            <div className="p-8 text-center bg-[#F8F5F1] rounded-xl border border-dashed border-slate-200">
                                <ShoppingCart className="mx-auto text-slate-300 mb-3" size={32} />
                                <h3 className="text-sm font-bold text-slate-900 mb-1">No orders yet</h3>
                                <p className="text-xs font-medium text-slate-500">Your recent orders will appear here automatically.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5">
                                {recentOrders.map(order => (
                                    <div key={order.id} className="p-3 sm:p-4 rounded-xl flex items-center justify-between hover:bg-[#F8F5F1] border border-transparent transition-all group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 border border-slate-200 shadow-sm group-hover:border-slate-300 transition-colors">
                                                <ShoppingCart size={16} className="text-slate-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    Order {order.orderId ? `#${order.orderId.replace('ORD-', '')}` : 'placed'}
                                                    <span className="font-medium text-slate-500 ml-1">from {order.name || 'Anonymous'}</span>
                                                </p>
                                                <div className="flex items-center gap-2 mt-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                    <span>{order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : 'Recently'}</span>
                                                    <span>&bull;</span>
                                                    <span className="truncate max-w-[150px] text-slate-500">{order.productTitle || order.selectedProduct || 'Unknown Product'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-900 tabular-nums">{(Number(order.totalPrice) || 0).toLocaleString()} DZD</p>
                                            <div className="mt-1 flex justify-end">
                                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">{order.status || 'completed'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions / Tips */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileText className="text-slate-400" size={18} />
                        Quick Actions
                    </h2>

                    <div className="bg-[#FF5A1F] rounded-2xl p-6 shadow-md shadow-[#FF5A1F]/20 relative overflow-hidden group transition-all hover:-translate-y-1 border-0">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none group-hover:bg-white/30 transition-all duration-700" />
                        <h3 className="text-lg font-bold text-white tracking-tight mb-2 relative z-10">Create a new form</h3>
                        <p className="text-sm font-medium text-white/90 mb-6 relative z-10">Start building your next high-converting sales funnel in seconds.</p>
                        <Button
                            className="w-full bg-white text-slate-900 hover:bg-slate-50 hover:text-black rounded-lg h-10 font-bold shadow-sm relative z-10 transition-colors"
                            onClick={() => navigate('/dashboard/forms')}
                        >
                            Open Form Builder
                        </Button>
                    </div>

                    {/* Getting Started Applet */}
                    <AnimatePresence>
                        {!hideGettingStarted && (
                            <motion.div
                                initial={{ opacity: 1, height: 'auto', scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.95, marginTop: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                                className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative group overflow-hidden"
                            >
                                <button
                                    onClick={dismissGettingStarted}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                    title="Dismiss"
                                >
                                    <X size={14} />
                                </button>

                                <h3 className="text-xl font-black text-slate-900 mb-1 tracking-tight">Getting Started</h3>
                                <p className="text-sm font-medium text-slate-400 mb-5">Complete these steps to unlock the full power of Final Form.</p>

                                {/* Interactive Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                        <span>Task Progress</span>
                                        <span className="text-[#FF5A1F]">
                                            {[stores.length > 0, forms.length > 0, stats.liveForms > 0, orders.length > 0].filter(Boolean).length} / 4
                                        </span>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-[#FF5A1F] to-[#E04812] rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${([stores.length > 0, forms.length > 0, stats.liveForms > 0, orders.length > 0].filter(Boolean).length / 4) * 100}%` }}
                                            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                                        />
                                    </div>
                                </div>

                                <ul className="space-y-1 relative">
                                    {[
                                        { text: 'Connect your store domain', done: stores.length > 0, action: () => navigate('/dashboard/settings') },
                                        { text: 'Create your first form', done: forms.length > 0, action: () => navigate('/dashboard/forms') },
                                        { text: 'Launch a campaign', done: stats.liveForms > 0, action: () => navigate('/dashboard/forms') },
                                        { text: 'Receive your first order', done: orders.length > 0, action: () => navigate('/dashboard/orders') },
                                    ]
                                        .sort((a, b) => (a.done === b.done) ? 0 : a.done ? 1 : -1)
                                        .map((task, i, arr) => {
                                            const isNextTask = !task.done && (i === 0 || arr[i - 1]?.done);

                                            return (
                                                <motion.li
                                                    key={task.text}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: i * 0.08 }}
                                                    className={cn(
                                                        "flex items-center gap-3.5 text-sm font-medium group/item cursor-pointer p-3 -mx-3 rounded-xl transition-all duration-300",
                                                        task.done ? "opacity-50 hover:opacity-80 hover:bg-slate-50" : "hover:bg-[#FF5A1F]/5"
                                                    )}
                                                    onClick={task.action}
                                                >
                                                    <div className={cn(
                                                        "shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300",
                                                        task.done
                                                            ? "bg-slate-100 border-slate-200 text-slate-400 scale-90"
                                                            : isNextTask
                                                                ? "bg-[#FF5A1F]/10 border-[#FF5A1F]/30 text-[#FF5A1F] group-hover/item:border-[#FF5A1F] group-hover/item:shadow-md group-hover/item:scale-110"
                                                                : "bg-white border-slate-200 text-transparent group-hover/item:border-slate-300 group-hover/item:scale-105"
                                                    )}>
                                                        <CheckCircle2 size={12} className={cn("stroke-[3px]", task.done && "text-slate-400")} />
                                                    </div>

                                                    <div className="flex-1 flex items-center justify-between">
                                                        <span className={cn(
                                                            "transition-colors duration-200",
                                                            task.done ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700 group-hover/item:text-[#FF5A1F]"
                                                        )}>
                                                            {task.text}
                                                        </span>

                                                        {isNextTask && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FF5A1F]/10 text-[#FF5A1F] px-2.5 py-1 rounded-lg border border-[#FF5A1F]/20 shadow-sm opacity-0 group-hover/item:opacity-100 transition-all duration-300 translate-x-2 group-hover/item:translate-x-0">
                                                                Start Step
                                                            </span>
                                                        )}
                                                    </div>
                                                </motion.li>
                                            );
                                        })}
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}

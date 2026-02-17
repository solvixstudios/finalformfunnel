// DesktopSidebar.tsx
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    FolderOpen,
    LogOut,
    Plug,
    Settings,
    Store,
    User,
    Zap
} from 'lucide-react';
import React, { useMemo } from 'react';
import { GoogleUser } from '../../lib/authGoogle';
import { useI18n } from '../../lib/i18n/i18nContext';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
}

interface DesktopSidebarProps {
    user: GoogleUser;
    currentPage: string;
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

/**
 * Desktop sidebar - Always expanded
 */
const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
    user,
    currentPage,
    onNavigate,
    onLogout,
}) => {
    const { language } = useI18n();

    const navItems: NavItem[] = useMemo(() => [
        {
            id: 'forms',
            label: 'Forms',
            icon: <FolderOpen size={20} />,
            path: '/dashboard/forms',
        },
        {
            id: 'integrations',
            label: 'Integrations',
            icon: <Plug size={20} />,
            path: '/dashboard/integrations',
        },
        {
            id: 'stores',
            label: 'Stores',
            icon: <Store size={20} />,
            path: '/dashboard/stores',
        },
    ], []);

    const isActive = (path: string) => {
        if (path === '/dashboard/forms') {
            return currentPage.startsWith('/dashboard/forms');
        }
        return currentPage === path;
    };

    return (
        <aside className="hidden lg:flex relative z-50 bg-[#0F172A]/95 backdrop-blur-2xl text-white rounded-[2rem] shadow-2xl flex-col py-6 overflow-hidden m-4 h-[calc(100vh-2rem)] shrink-0 w-64">
            {/* Logo Area */}
            <div className="flex items-center gap-3 mb-8 h-10 px-4 shrink-0">
                <motion.div
                    className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 cursor-pointer"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                    <Zap size={20} className="text-white fill-white" />
                </motion.div>

                <span className="font-bold text-lg tracking-tight whitespace-nowrap">
                    {language === 'ar' ? 'فاينل' : 'Final Form'}
                </span>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 flex flex-col gap-1.5 w-full px-3">
                {navItems.map((item) => (
                    <motion.button
                        key={item.id}
                        onClick={() => onNavigate(item.path)}
                        className={cn(
                            "flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-medium relative overflow-hidden w-full",
                            isActive(item.path)
                                ? "bg-white/10 text-white"
                                : "text-slate-400"
                        )}
                        whileHover={{
                            scale: 1.02,
                            backgroundColor: isActive(item.path) ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    >
                        {/* Active indicator background */}
                        {isActive(item.path) && (
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5"
                                layoutId="activeNav"
                                transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            />
                        )}

                        <span className={cn(
                            "shrink-0 relative z-10 transition-colors duration-150",
                            isActive(item.path) && "text-orange-400"
                        )}>
                            {item.icon}
                        </span>

                        <span className="whitespace-nowrap overflow-hidden relative z-10">
                            {item.label}
                        </span>

                        {isActive(item.path) && (
                            <motion.div
                                className="absolute right-3 w-1 h-1 bg-orange-400 rounded-full"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            />
                        )}
                    </motion.button>
                ))}
            </nav>

            {/* Footer Area: User + Plan */}
            <div className="mt-auto flex flex-col w-full px-3">
                <div
                    className="relative overflow-visible bg-white/5 rounded-2xl p-3"
                >
                    <div className="w-full flex items-center gap-3 mb-3">
                        <div className="relative shrink-0 flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 overflow-hidden relative z-20">
                                {user.photoURL ? (
                                    <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <User size={16} className="m-2 text-slate-500" />
                                )}
                            </div>
                        </div>

                        <div className="text-left whitespace-nowrap flex-1 overflow-hidden">
                            <div className="text-sm font-medium truncate text-white">{user.displayName}</div>
                            <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                        </div>

                        {/* Settings Icon */}
                        <div className="shrink-0 flex gap-1">
                            <motion.button
                                onClick={() => onNavigate('/dashboard/settings')}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                title="Settings"
                            >
                                <Settings size={16} />
                            </motion.button>
                            <motion.button
                                onClick={onLogout}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                title="Logout"
                            >
                                <LogOut size={16} />
                            </motion.button>
                        </div>
                    </div>


                    {/* Plan Details */}
                    <div>
                        <div className="h-px w-full bg-white/5 my-2" />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-white">Pro Plan</span>
                                    <span className="text-[10px] text-slate-400">Renews Feb 28</span>
                                </div>
                                <span className="text-[10px] font-mono text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">
                                    Active
                                </span>
                            </div>

                            <div className="space-y-4">
                                {/* Orders Progress */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] text-slate-400 font-medium">Orders</span>
                                        <span className="text-xs font-bold text-white">824 <span className="text-slate-500 font-normal">/ 1000</span></span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "82%" }}
                                            transition={{ delay: 0.1, duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>

                                {/* Days Left Progress */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] text-slate-400 font-medium">Days Left</span>
                                        <span className="text-xs font-bold text-white">28 <span className="text-slate-500 font-normal">/ 30</span></span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                                            initial={{ width: "0%" }}
                                            animate={{ width: "93%" }}
                                            transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                onClick={() => onNavigate('/dashboard/settings?tab=subscription')}
                                className="w-full py-1.5 mt-1 bg-white/5 text-slate-200 rounded-lg text-[10px] font-medium border border-white/5"
                                whileHover={{
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                    borderColor: "rgba(255,255,255,0.1)",
                                    scale: 1.02
                                }}
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                                Manage Subscription
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default DesktopSidebar;
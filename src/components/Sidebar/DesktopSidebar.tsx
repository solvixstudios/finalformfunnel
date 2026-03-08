import { cn } from '@/lib/utils';
import {
    Activity,
    ChevronLeft,
    ChevronRight,
    Crown,
    FolderOpen,
    Globe2,
    LayoutGrid,
    LogOut,
    MessageSquare,
    Settings,
    ShoppingCart,
    Tag,
    Ticket,
    Truck,
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

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
    user,
    currentPage,
    onNavigate,
    onLogout,
}) => {
    const { language } = useI18n();

    const navGroups = [
        {
            title: "YOUR SPACE",
            items: [
                { id: 'home', label: 'Home', icon: <LayoutGrid size={18} strokeWidth={2.5} />, path: '/dashboard/home' },
                { id: 'forms', label: 'Forms', icon: <FolderOpen size={18} strokeWidth={2.5} />, path: '/dashboard/forms' },
                { id: 'orders', label: 'Orders', icon: <ShoppingCart size={18} strokeWidth={2.5} />, path: '/dashboard/orders' },
            ]
        },
        {
            title: "RULES",
            items: [
                { id: 'offers', label: 'Offers', icon: <Tag size={18} strokeWidth={2.5} />, path: '/dashboard/rules/offers' },
                { id: 'shipping', label: 'Shipping', icon: <Truck size={18} strokeWidth={2.5} />, path: '/dashboard/rules/shipping' },
                { id: 'coupons', label: 'Coupons', icon: <Ticket size={18} strokeWidth={2.5} />, path: '/dashboard/rules/coupons' },
            ]
        },
        {
            title: "ADMIN",
            items: [
                { id: 'settings', label: 'Settings', icon: <Settings size={18} strokeWidth={2.5} />, path: '/dashboard/settings' },
            ]
        }
    ];

    const isActive = (path: string) => {
        if (path === '/dashboard/forms') return currentPage.startsWith('/dashboard/forms');
        if (path === '/dashboard/orders') return currentPage.startsWith('/dashboard/orders');
        if (path === '/dashboard/settings') return currentPage.startsWith('/dashboard/settings');
        if (path === '/dashboard/rules/offers') return currentPage.startsWith('/dashboard/rules/offers');
        if (path === '/dashboard/rules/shipping') return currentPage.startsWith('/dashboard/rules/shipping');
        if (path === '/dashboard/rules/coupons') return currentPage.startsWith('/dashboard/rules/coupons');
        return currentPage === path;
    };

    return (
        <aside className="hidden lg:flex w-[260px] shrink-0 bg-[#EFEBE0] flex-col h-screen border-r border-[#E2DCCF]">
            {/* Logo */}
            <div className="flex items-center h-[88px] px-8 shrink-0">
                <span className="font-black text-2xl text-[#FF5A1F] tracking-tighter uppercase">
                    {language === 'ar' ? 'فاينل فورم' : 'FINAL FORM'}
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 flex flex-col gap-10 px-8 pt-8 overflow-y-auto scrollbar-hide">
                {navGroups.map((group, idx) => (
                    <div key={idx} className="flex flex-col gap-3">
                        <h4 className="text-[10px] font-bold text-[#A69D8A] tracking-widest uppercase mb-1">
                            {group.title}
                        </h4>
                        {group.items.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onNavigate(item.path)}
                                    className="group flex items-center gap-3 py-1.5 text-[13px] font-bold transition-colors w-full relative text-left"
                                >
                                    <span className={cn(
                                        "shrink-0 transition-colors",
                                        active ? "text-[#FF5A1F]" : "text-[#B4AD9E] group-hover:text-[#FF5A1F]"
                                    )}>
                                        {item.icon}
                                    </span>
                                    <span className={cn(
                                        active ? "text-[#FF5A1F]" : "text-[#908878] group-hover:text-[#FF5A1F]"
                                    )}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Bottom: User */}
            <div className="px-6 pb-6 pt-4">
                <div className="flex items-center gap-3 px-3 py-2 bg-[#E6E0D3] rounded-xl border border-[#D9D1C3]">
                    <div className="w-8 h-8 rounded-lg bg-white overflow-hidden shrink-0 border border-[#E2DCCF]">
                        {user.photoURL ? (
                            <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <User size={14} className="m-2 text-[#908878]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#4A443A] truncate">{user.displayName}</p>
                        <p className="text-[10px] font-medium text-[#908878] truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-1.5 rounded-md text-[#A69D8A] hover:text-[#FF5A1F] transition-colors shrink-0"
                        title="Sign out"
                    >
                        <LogOut size={14} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default DesktopSidebar;
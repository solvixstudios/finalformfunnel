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
    Save,
    Settings,
    ShoppingCart,
    Tag,
    Ticket,
    Truck,
    User,
    Zap,
    Plug
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { NavGroup } from '../DashboardLayout';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { GoogleUser } from '../../lib/authGoogle';
import { useI18n } from '../../lib/i18n/i18nContext';

interface DesktopSidebarProps {
    user: GoogleUser;
    currentPage: string;
    onNavigate: (path: string) => void;
    onLogout: () => void;
    navGroups: NavGroup[];
}

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
    user,
    currentPage,
    onNavigate,
    onLogout,
    navGroups,
}) => {
    const { language } = useI18n();

    const isActive = (path: string) => {
        if (path === '/dashboard/forms') return currentPage.startsWith('/dashboard/forms');
        if (path === '/dashboard/orders') return currentPage.startsWith('/dashboard/orders');
        if (path === '/dashboard/settings') return currentPage.startsWith('/dashboard/settings');
        if (path === '/dashboard/rules/offers') return currentPage.startsWith('/dashboard/rules/offers');
        if (path === '/dashboard/rules/shipping') return currentPage.startsWith('/dashboard/rules/shipping');
        if (path === '/dashboard/rules/coupons') return currentPage.startsWith('/dashboard/rules/coupons');
        if (path === '/dashboard/integrations') return currentPage.startsWith('/dashboard/integrations');
        return currentPage === path;
    };

    return (
        <aside className="hidden lg:flex w-[240px] shrink-0 bg-[#EFEBE0] flex-col h-screen border-r border-[#E2DCCF]">
            {/* Logo */}
            <div className="flex items-center h-14 px-6 shrink-0 border-b border-[#E2DCCF]/60">
                <span className="font-black text-xl text-[#FF5A1F] tracking-tighter uppercase">
                    {language === 'ar' ? 'فاينل فورم' : 'FINAL FORM'}
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 flex flex-col px-4 pt-5 pb-2 overflow-y-auto scrollbar-hide">
                {navGroups.map((group, idx) => {
                    const groupHasActiveItem = group.items.some(item => isActive(item.path));

                    return (
                        <div key={idx} className={cn("flex flex-col", idx > 0 && "mt-2 pt-2 border-t border-[#DDD7C8]")}>
                            {group.collapsible ? (
                                <Collapsible defaultOpen={groupHasActiveItem || group.defaultExpanded} className="w-full">
                                    <CollapsibleTrigger className="flex w-full items-center justify-between mb-1.5 px-2.5 hover:opacity-80 transition-opacity [&[data-state=open]>svg]:rotate-90">
                                        <h4 className="text-[9px] font-bold text-[#A69D8A] tracking-[0.12em] uppercase">
                                            {group.title}
                                        </h4>
                                        <ChevronRight size={14} className="text-[#A69D8A] transition-transform duration-200" strokeWidth={2.5} />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                                        <div className="flex flex-col gap-0.5">
                                            {group.items.map((item) => {
                                                const active = isActive(item.path);
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => onNavigate(item.path)}
                                                        className={cn(
                                                            "group flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] font-semibold transition-all w-full relative text-left rounded-lg",
                                                            active
                                                                ? "bg-[#E6E0D3] text-[#FF5A1F]"
                                                                : "text-[#908878] hover:bg-[#E6E0D3]/60 hover:text-[#FF5A1F]"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "shrink-0 transition-colors",
                                                            active ? "text-[#FF5A1F]" : "text-[#B4AD9E] group-hover:text-[#FF5A1F]"
                                                        )}>
                                                            {React.cloneElement(item.icon as React.ReactElement, { size: 17, strokeWidth: 2.5 })}
                                                        </span>
                                                        <span>{item.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ) : (
                                <>
                                    <h4 className="text-[9px] font-bold text-[#A69D8A] tracking-[0.12em] uppercase mb-1.5 px-2.5">
                                        {group.title}
                                    </h4>
                                    <div className="flex flex-col gap-0.5">
                                        {group.items.map((item) => {
                                            const active = isActive(item.path);
                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => onNavigate(item.path)}
                                                    className={cn(
                                                        "group flex items-center gap-2.5 px-2.5 py-[7px] text-[13px] font-semibold transition-all w-full relative text-left rounded-lg",
                                                        active
                                                            ? "bg-[#E6E0D3] text-[#FF5A1F]"
                                                            : "text-[#908878] hover:bg-[#E6E0D3]/60 hover:text-[#FF5A1F]"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "shrink-0 transition-colors",
                                                        active ? "text-[#FF5A1F]" : "text-[#B4AD9E] group-hover:text-[#FF5A1F]"
                                                    )}>
                                                        {React.cloneElement(item.icon as React.ReactElement, { size: 17, strokeWidth: 2.5 })}
                                                    </span>
                                                    <span>{item.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom: User */}
            <div className="px-4 pb-4 pt-2">
                <div className="flex items-center gap-2.5 px-2.5 py-2 bg-[#E6E0D3] rounded-xl border border-[#D9D1C3]">
                    <div className="w-7 h-7 rounded-lg bg-white overflow-hidden shrink-0 border border-[#E2DCCF]">
                        {user.photoURL ? (
                            <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <User size={14} className="m-1.5 text-[#908878]" />
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
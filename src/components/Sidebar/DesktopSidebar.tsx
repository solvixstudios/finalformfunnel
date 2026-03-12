import { cn } from '@/lib/utils';
import {
    ChevronRight,
    LogOut,
    User,
} from 'lucide-react';
import React from 'react';
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
        if (path === '/dashboard/subscription') return currentPage.startsWith('/dashboard/subscription');
        if (path === '/dashboard/rules/offers') return currentPage.startsWith('/dashboard/rules/offers');
        if (path === '/dashboard/rules/shipping') return currentPage.startsWith('/dashboard/rules/shipping');
        if (path === '/dashboard/rules/coupons') return currentPage.startsWith('/dashboard/rules/coupons');
        if (path === '/dashboard/integrations') return currentPage.startsWith('/dashboard/integrations');
        return currentPage === path;
    };

    const mainGroups = navGroups.filter(g => !g.pinBottom);
    const bottomGroups = navGroups.filter(g => g.pinBottom);

    const renderNavItem = (item: NavGroup['items'][0]) => {
        const active = isActive(item.path);
        return (
            <button
                key={item.id}
                onClick={() => onNavigate(item.path)}
                className={cn(
                    "group flex items-center gap-2 px-2 py-[6px] text-[12px] font-semibold transition-all w-full relative text-left rounded-lg",
                    active
                        ? "bg-[#E6E0D3] text-[#FF5A1F]"
                        : "text-[#4A443A] hover:bg-[#E6E0D3]/60 hover:text-[#FF5A1F]"
                )}
            >
                <span className={cn(
                    "shrink-0 transition-colors",
                    active ? "text-[#FF5A1F]" : "text-[#7A7365] group-hover:text-[#FF5A1F]"
                )}>
                    {React.cloneElement(item.icon as React.ReactElement, { size: 15, strokeWidth: 2.5 })}
                </span>
                <span className="truncate">{item.label}</span>
            </button>
        );
    };

    return (
        <aside className="hidden lg:flex w-[180px] shrink-0 bg-[#EFEBE0] flex-col h-screen border-r border-[#E2DCCF]">
            {/* Logo */}
            <div className="flex items-center h-14 px-5 shrink-0 border-b border-[#E2DCCF]/60">
                <span className="font-black text-lg text-[#FF5A1F] tracking-tighter uppercase">
                    {language === 'ar' ? 'فاينل فورم' : 'FINAL FORM'}
                </span>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 flex flex-col px-3 pt-4 pb-2 overflow-y-auto scrollbar-hide">
                {mainGroups.map((group, idx) => {
                    const groupHasActiveItem = group.items.some(item => isActive(item.path));

                    return (
                        <div key={idx} className={cn("flex flex-col", idx > 0 && "mt-1.5 pt-1.5 border-t border-[#DDD7C8]")}>
                            {group.collapsible ? (
                                <Collapsible defaultOpen={groupHasActiveItem || group.defaultExpanded} className="w-full">
                                    <CollapsibleTrigger className="flex w-full items-center justify-between mb-1 px-2 hover:opacity-80 transition-opacity [&[data-state=open]>svg]:rotate-90">
                                        <h4 className="text-[8px] font-bold text-[#A69D8A] tracking-[0.12em] uppercase">
                                            {group.title}
                                        </h4>
                                        <ChevronRight size={12} className="text-[#A69D8A] transition-transform duration-200" strokeWidth={2.5} />
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="overflow-hidden">
                                        <div className="flex flex-col gap-0.5">
                                            {group.items.map(renderNavItem)}
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ) : (
                                <>
                                    <h4 className="text-[8px] font-bold text-[#A69D8A] tracking-[0.12em] uppercase mb-1 px-2">
                                        {group.title}
                                    </h4>
                                    <div className="flex flex-col gap-0.5">
                                        {group.items.map(renderNavItem)}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom pinned items + user block */}
            <div className="px-3 pb-3 pt-1 shrink-0 border-t border-[#DDD7C8]">
                {bottomGroups.map((group, gIdx) => (
                    <div key={gIdx} className="flex flex-col gap-0.5 mb-2">
                        {group.items.map(renderNavItem)}
                    </div>
                ))}
                <div className="flex items-center gap-2 px-2 py-1.5 bg-[#E6E0D3] rounded-xl border border-[#D9D1C3]">
                    <div className="w-6 h-6 rounded-lg bg-white overflow-hidden shrink-0 border border-[#E2DCCF]">
                        {user.photoURL ? (
                            <img src={user.photoURL} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <User size={12} className="m-1.5 text-[#908878]" />
                        )}
                    </div>
                    <p className="text-[11px] font-bold text-[#4A443A] truncate flex-1 min-w-0">{user.displayName}</p>
                    <button
                        onClick={onLogout}
                        className="p-1 rounded-md text-[#A69D8A] hover:text-[#FF5A1F] transition-colors shrink-0"
                        title="Sign out"
                    >
                        <LogOut size={12} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default DesktopSidebar;
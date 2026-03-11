import { cn } from '@/lib/utils';
import { LogOut, X, ChevronRight } from 'lucide-react';
import React from 'react';
import { NavGroup } from '../DashboardLayout';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    navGroups: NavGroup[];
    currentPage: string;
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
    isOpen,
    onClose,
    navGroups,
    currentPage,
    onNavigate,
    onLogout,
}) => {
    if (!isOpen) return null;

    const isActive = (path: string) => {
        if (path === '/dashboard/forms') return currentPage.startsWith('/dashboard/forms');
        return currentPage === path;
    };

    const handleNavClick = (path: string) => {
        onNavigate(path);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-y-0 left-0 w-64 bg-white p-4 shadow-xl flex flex-col animate-scale-in">
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
                    <span className="font-bold text-sm text-slate-900">Final Form</span>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto">
                    {navGroups.map((group, idx) => {
                        const groupHasActiveItem = group.items.some(item => isActive(item.path));

                        return (
                            <div key={idx} className={cn("flex flex-col", idx > 0 && "pt-3 border-t border-slate-100")}>
                                {group.collapsible ? (
                                    <Collapsible defaultOpen={groupHasActiveItem || group.defaultExpanded} className="w-full">
                                        <CollapsibleTrigger className="flex w-full items-center justify-between mb-2 px-1 hover:opacity-80 transition-opacity [&[data-state=open]>svg]:rotate-90">
                                            <h4 className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase">
                                                {group.title}
                                            </h4>
                                            <ChevronRight size={14} className="text-slate-400 transition-transform duration-200" />
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                                            <div className="flex flex-col gap-0.5">
                                                {group.items.map(item => (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => handleNavClick(item.path)}
                                                        className={cn(
                                                            "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors relative text-left",
                                                            isActive(item.path)
                                                                ? "bg-slate-100 text-slate-900 font-semibold"
                                                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                                        )}
                                                    >
                                                        {isActive(item.path) && (
                                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-slate-900 rounded-r" />
                                                        )}
                                                        <span className={cn("shrink-0", isActive(item.path) && "text-slate-900")}>
                                                            {item.icon}
                                                        </span>
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                ) : (
                                    <>
                                        <h4 className="text-[10px] font-bold text-slate-400 tracking-[0.1em] uppercase mb-2 px-1">
                                            {group.title}
                                        </h4>
                                        <div className="flex flex-col gap-0.5">
                                            {group.items.map(item => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => handleNavClick(item.path)}
                                                    className={cn(
                                                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors relative text-left",
                                                        isActive(item.path)
                                                            ? "bg-slate-100 text-slate-900 font-semibold"
                                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                                    )}
                                                >
                                                    {isActive(item.path) && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-slate-900 rounded-r" />
                                                    )}
                                                    <span className={cn("shrink-0", isActive(item.path) && "text-slate-900")}>
                                                        {item.icon}
                                                    </span>
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="pt-3 border-t border-slate-100">
                    <button onClick={onLogout} className="flex items-center gap-2.5 text-slate-500 font-medium text-[13px] px-3 py-2.5 hover:text-red-500 hover:bg-red-50 rounded-lg w-full transition-colors">
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;

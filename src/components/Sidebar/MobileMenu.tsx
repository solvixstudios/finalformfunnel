import { cn } from '@/lib/utils';
import { LogOut, X } from 'lucide-react';
import React from 'react';

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    path: string;
}

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    navItems: NavItem[];
    currentPage: string;
    onNavigate: (path: string) => void;
    onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
    isOpen,
    onClose,
    navItems,
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
                <div className="space-y-0.5 flex-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.path)}
                            className={cn(
                                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors relative",
                                isActive(item.path)
                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
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

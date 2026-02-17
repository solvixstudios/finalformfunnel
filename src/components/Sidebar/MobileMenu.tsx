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
        if (path === '/dashboard/forms') {
            return currentPage.startsWith('/dashboard/forms');
        }
        return currentPage === path;
    };

    const handleNavClick = (path: string) => {
        onNavigate(path);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="absolute inset-y-0 left-0 w-72 bg-[#0F172A] text-white p-5 shadow-2xl flex flex-col animate-scale-in">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                    <div className="font-bold text-lg tracking-tight">Final Form</div>
                    <button onClick={onClose} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="space-y-1.5">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.path)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all",
                                isActive(item.path)
                                    ? "bg-white/10 text-white"
                                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                            )}
                        >
                            <span className={cn(
                                "shrink-0",
                                isActive(item.path) && "text-orange-400"
                            )}>
                                {item.icon}
                            </span>
                            <span className="text-sm font-medium">{item.label}</span>
                            {isActive(item.path) && (
                                <div className="ml-auto w-1 h-1 bg-orange-400 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>
                <div className="mt-auto pt-6 border-t border-white/10">
                    <button onClick={onLogout} className="flex items-center gap-3 text-red-400 font-medium text-sm px-4 py-3.5 hover:bg-red-500/10 rounded-xl w-full transition-colors">
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;

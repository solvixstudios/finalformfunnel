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
            <div className="absolute inset-y-0 left-0 w-72 bg-slate-900 text-white p-5 shadow-2xl flex flex-col safe-area-inset-top safe-area-inset-bottom animate-scale-in">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                    <div className="font-bold text-lg">Final Form</div>
                    <button onClick={onClose} className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors touch-target">
                        <X size={18} />
                    </button>
                </div>
                <div className="space-y-1.5">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.path)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all touch-target",
                                isActive(item.path)
                                    ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                                    : "text-slate-400 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {item.icon} {item.label}
                        </button>
                    ))}
                </div>
                <div className="mt-auto pt-6 border-t border-white/10">
                    <button onClick={onLogout} className="flex items-center gap-3 text-red-400 font-medium px-4 py-3.5 hover:bg-red-500/10 rounded-xl w-full transition-colors touch-target">
                        <LogOut size={18} /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;

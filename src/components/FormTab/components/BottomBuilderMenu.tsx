import {
    CheckCircle,
    LayoutGrid,
    Palette,
    Tag,
    Ticket,
    Truck
} from "lucide-react";
import { useFormStore } from "../../../stores";

export const SideBuilderNavigation = () => {
    const setEditingSection = useFormStore((state) => state.setEditingSection);
    const editingSection = useFormStore((state) => state.editingSection);

    const menuItems = [
        {
            id: "global_design",
            label: "Global Design",
            icon: Palette,
        },
        {
            id: "sections_list",
            label: "Sections Editor",
            icon: LayoutGrid,
        },
        {
            id: "packs_manager",
            label: "Packs & Offers",
            icon: Tag,
        },
        {
            id: "shipping_manager",
            label: "Shipping Rates",
            icon: Truck,
        },
        {
            id: "promo_code_manager",
            label: "Promo Code",
            icon: Ticket,
        },

        {
            id: "thank_you",
            label: "Thank you Page",
            icon: CheckCircle,
        },
    ];

    return (
        <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-6 gap-3 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10">
            {menuItems.map((item) => {
                const isActive = editingSection === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setEditingSection(item.id)}
                        className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 w-16`}
                        title={item.label}
                    >
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm
                                ${isActive
                                    ? 'bg-slate-900 text-white shadow-slate-900/20 scale-105'
                                    : 'bg-white border border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600 group-hover:bg-slate-50'
                                }
                            `}
                        >
                            <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider text-center transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-500'}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

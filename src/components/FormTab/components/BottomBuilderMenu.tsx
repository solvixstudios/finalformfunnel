/**
 * Side Builder Navigation Component
 * Vertical navigation menu positioned on the left side
 */

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
            gradient: "from-indigo-500 to-violet-600",
        },
        {
            id: "sections_list",
            label: "Sections Editor",
            icon: LayoutGrid,
            gradient: "from-blue-500 to-cyan-600",
        },
        {
            id: "packs_manager",
            label: "Packs & Offers",
            icon: Tag,
            gradient: "from-amber-500 to-orange-600",
        },
        {
            id: "shipping_manager",
            label: "Shipping Rates",
            icon: Truck,
            gradient: "from-emerald-500 to-teal-600",
        },
        {
            id: "promo_code_manager",
            label: "Promo Code",
            icon: Ticket,
            gradient: "from-violet-500 to-purple-600",
        },

        {
            id: "thank_you",
            label: "Thank you Page",
            icon: CheckCircle,
            gradient: "from-green-500 to-emerald-600",
        },
    ];

    return (
        <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-3">
            {menuItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setEditingSection(item.id)}
                    className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-300 hover:bg-slate-50 active:scale-95 w-16 ${editingSection === item.id ? 'bg-slate-100' : ''
                        }`}
                    title={item.label}
                >
                    <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}
                    >
                        <item.icon size={18} />
                    </div>
                    <span className="text-[8px] font-bold text-slate-600 uppercase tracking-wide text-center">
                        {item.label}
                    </span>
                </button>
            ))}
        </div>
    );
};

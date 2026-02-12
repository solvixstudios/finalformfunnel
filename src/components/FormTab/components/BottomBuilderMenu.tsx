import {
    CheckCircle,
    LayoutGrid,
    Palette,
    Puzzle,
    Tag,
    Ticket,
    Truck
} from "lucide-react";
import { useFormStore } from "../../../stores";

export const SideBuilderNavigation = () => {
    const setEditingSection = useFormStore((state) => state.setEditingSection);
    const editingSection = useFormStore((state) => state.editingSection);

    const menuItems = [
        { id: "global_design", label: "Design", icon: Palette },
        { id: "sections_list", label: "Sections", icon: LayoutGrid },
        { id: "packs_manager", label: "Packs", icon: Tag },
        { id: "shipping_manager", label: "Shipping", icon: Truck },
        { id: "promo_code_manager", label: "Promo", icon: Ticket },
        { id: "thank_you", label: "Thanks", icon: CheckCircle },
        { id: "addons", label: "Addons", icon: Puzzle },
    ];

    return (
        <div className="w-16 lg:w-[4.5rem] bg-white border-r border-slate-200 flex flex-col items-center py-2 lg:py-4 gap-0.5 lg:gap-1 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 overflow-y-auto overflow-x-hidden custom-scroll shrink-0">
            {menuItems.map((item) => {
                const isActive = editingSection === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setEditingSection(item.id)}
                        className="group relative flex flex-col items-center gap-0.5 lg:gap-1 p-1 lg:p-1.5 rounded-lg lg:rounded-xl transition-all duration-200 w-12 lg:w-14 shrink-0"
                        title={item.label}
                    >
                        <div
                            className={`w-7 h-7 lg:w-9 lg:h-9 rounded-lg lg:rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm
                                ${isActive
                                    ? 'bg-slate-900 text-white shadow-slate-900/20 scale-105'
                                    : 'bg-white border border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600 group-hover:bg-slate-50'
                                }
                            `}
                        >
                            <item.icon size={14} className="lg:w-4 lg:h-4" strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className={`text-[7px] lg:text-[8px] font-bold uppercase tracking-wide text-center transition-colors leading-tight ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-500'}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

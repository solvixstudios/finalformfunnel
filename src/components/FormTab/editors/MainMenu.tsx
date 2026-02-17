import {
  CheckCircle,
  LayoutGrid,
  Palette,
  Puzzle,
  Settings,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
  Truck
} from "lucide-react";
import { useFormStore } from "../../../stores";

// Reusable Menu Card Component
const MenuCard = ({
  icon: Icon,
  label,
  description,
  onClick,
  accentClass = "from-indigo-500 to-violet-600",
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  accentClass?: string;
}) => (
  <button
    onClick={onClick}
    className="
      group relative flex flex-col items-start gap-3 p-4 
      bg-white border border-slate-200 rounded-2xl 
      hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 
      active:scale-[0.98] transition-all duration-300 cursor-pointer text-left h-full
      overflow-hidden
    "
  >
    <div className={`
      absolute inset-0 bg-gradient-to-br ${accentClass} opacity-0 
      group-hover:opacity-[0.03] transition-opacity duration-300
    `} />

    <div
      className={`
        w-10 h-10 rounded-xl bg-gradient-to-br ${accentClass}
        flex items-center justify-center text-white shadow-sm shrink-0
        group-hover:scale-110 group-hover:shadow-md transition-all duration-300
      `}
    >
      <Icon size={18} strokeWidth={2} />
    </div>

    <div className="relative z-10">
      <span className="block text-[13px] font-bold text-slate-800 leading-tight group-hover:text-indigo-900 transition-colors">
        {label}
      </span>
      <span className="block text-[11px] text-slate-400 font-medium leading-tight mt-1">
        {description}
      </span>
    </div>
  </button>
);

export const MainMenu = ({ onLoadClick }: { onLoadClick?: () => void }) => {
  const setEditingSection = useFormStore((state) => state.setEditingSection);

  return (
    <div className="pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ═══ TEMPLATE HERO CARD ═══ */}
      {onLoadClick && (
        <button
          onClick={onLoadClick}
          className="
            w-full mb-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700
            p-5 rounded-2xl flex items-center gap-4 
            shadow-lg shadow-indigo-200/40 hover:shadow-xl hover:shadow-indigo-300/50
            hover:-translate-y-0.5 active:scale-[0.99]
            transition-all duration-300 cursor-pointer relative overflow-hidden
            text-left group
          "
        >
          {/* Noise overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 pointer-events-none" />

          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform duration-300 shrink-0 relative z-10">
            <Sparkles size={22} />
          </div>

          <div className="flex-1 min-w-0 relative z-10">
            <span className="block text-sm font-extrabold text-white tracking-tight">
              Start with a Template
            </span>
            <span className="block text-xs text-indigo-200 mt-0.5 font-medium">
              Import a high-converting pre-built design
            </span>
          </div>
        </button>
      )}

      {/* FLAT GRID - No Section Headers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MenuCard
          icon={Palette}
          label="Design Global"
          description="Colors, shapes, and styles"
          accentClass="from-indigo-500 to-violet-600"
          onClick={() => setEditingSection("global_design")}
        />

        <MenuCard
          icon={LayoutGrid}
          label="Form Sections"
          description="Order and visibility of blocks"
          accentClass="from-blue-500 to-cyan-600"
          onClick={() => setEditingSection("sections_list")}
        />

        {/* Hide Offers for Store Forms */}
        {useFormStore((state) => state.formConfig.type) !== 'store' && (
          <MenuCard
            icon={Tag}
            label="Packs & Offers"
            description="Manage your product offers"
            accentClass="from-amber-500 to-orange-600"
            onClick={() => setEditingSection("packs_manager")}
          />
        )}

        <MenuCard
          icon={Truck}
          label="Shipping Rates"
          description="National fees and exceptions"
          accentClass="from-emerald-500 to-teal-600"
          onClick={() => setEditingSection("shipping_manager")}
        />

        <MenuCard
          icon={Ticket}
          label="Promo Codes"
          description="Discounts and special offers"
          accentClass="from-violet-500 to-purple-600"
          onClick={() => setEditingSection("promo_code_manager")}
        />

        <MenuCard
          icon={CheckCircle}
          label="Confirmation Page"
          description="Thank you page & redirect"
          accentClass="from-green-500 to-emerald-600"
          onClick={() => setEditingSection("thank_you")}
        />

        <MenuCard
          icon={Puzzle}
          label="Addons"
          description="Integrations & Extras"
          accentClass="from-pink-500 to-rose-600"
          onClick={() => setEditingSection("addons")}
        />
      </div>

    </div>
  );
};

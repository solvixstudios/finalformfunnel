import {
  CheckCircle,
  ChevronRight,
  LayoutGrid,
  Palette,
  Puzzle,
  Tag,
  Ticket,
  Truck
} from "lucide-react";
import { useFormStore } from "../../../stores";

export const MainMenu = () => {
  const setEditingSection = useFormStore((state) => state.setEditingSection);

  return (
    <div className="space-y-8">
      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* DESIGN CARD */}
        <div
          onClick={() => setEditingSection("global_design")}
          className="group bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50 active:scale-[0.98] transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200/50 group-hover:scale-110 transition-transform duration-300">
              <Palette size={22} />
            </div>
            <ChevronRight
              size={18}
              className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
            />
          </div>
          <div className="relative">
            <span className="block text-sm font-bold text-slate-800">Design Global</span>
            <span className="block text-xs text-slate-400 mt-0.5">
              Colors, shapes, and styles
            </span>
          </div>
        </div>

        {/* PACKS CARD */}
        <div
          onClick={() => setEditingSection("packs_manager")}
          className="group bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-100/50 active:scale-[0.98] transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-200/50 group-hover:scale-110 transition-transform duration-300">
              <Tag size={22} />
            </div>
            <ChevronRight
              size={18}
              className="text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all"
            />
          </div>
          <div className="relative">
            <span className="block text-sm font-bold text-slate-800">
              Packs & Offers
            </span>
            <span className="block text-xs text-slate-400 mt-0.5">
              Manage your product offers
            </span>
          </div>
        </div>

        {/* SHIPPING CARD */}
        <div
          onClick={() => setEditingSection("shipping_manager")}
          className="group bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-100/50 active:scale-[0.98] transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200/50 group-hover:scale-110 transition-transform duration-300">
              <Truck size={22} />
            </div>
            <ChevronRight
              size={18}
              className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"
            />
          </div>
          <div className="relative">
            <span className="block text-sm font-bold text-slate-800">
              Shipping Rates
            </span>
            <span className="block text-xs text-slate-400 mt-0.5">
              National fees and exceptions
            </span>
          </div>
        </div>

        {/* PROMO CODE CARD */}
        <div
          onClick={() => setEditingSection("promo_code_manager")}
          className="group bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/50 active:scale-[0.98] transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-200/50 group-hover:scale-110 transition-transform duration-300">
              <Ticket size={22} />
            </div>
            <ChevronRight
              size={18}
              className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all"
            />
          </div>
          <div className="relative">
            <span className="block text-sm font-bold text-slate-800">
              Promo Codes
            </span>
            <span className="block text-xs text-slate-400 mt-0.5">
              Discounts and special offers
            </span>
          </div>
        </div>

        {/* SECTIONS CARD */}
        <div
          onClick={() => setEditingSection("sections_list")}
          className="group bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/50 active:scale-[0.98] transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-200/50 group-hover:scale-110 transition-transform duration-300">
              <LayoutGrid size={22} />
            </div>
            <ChevronRight
              size={18}
              className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
            />
          </div>
          <div className="relative">
            <span className="block text-sm font-bold text-slate-800">
              Form Sections
            </span>
            <span className="block text-xs text-slate-400 mt-0.5">
              Order and visibility of blocks
            </span>
          </div>
        </div>

        {/* THANK YOU CARD */}
        <div
          onClick={() => setEditingSection("thank_you")}
          className="group bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 hover:border-green-300 hover:shadow-xl hover:shadow-green-100/50 active:scale-[0.98] transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-200/50 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle size={22} />
            </div>
            <ChevronRight
              size={18}
              className="text-slate-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all"
            />
          </div>
          <div className="relative">
            <span className="block text-sm font-bold text-slate-800">
              Confirmation Page
            </span>
            <span className="block text-xs text-slate-400 mt-0.5">
              Thank you message
            </span>
          </div>
        </div>

        {/* ADDONS CARD */}
        <div
          onClick={() => setEditingSection("addons")}
          className="group bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 hover:border-pink-300 hover:shadow-xl hover:shadow-pink-100/50 active:scale-[0.98] transition-all duration-300 cursor-pointer relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-start justify-between relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-200/50 group-hover:scale-110 transition-transform duration-300">
              <Puzzle size={22} />
            </div>
            <ChevronRight
              size={18}
              className="text-slate-300 group-hover:text-pink-500 group-hover:translate-x-1 transition-all"
            />
          </div>
          <div className="relative">
            <span className="block text-sm font-bold text-slate-800">
              Addons
            </span>
            <span className="block text-xs text-slate-400 mt-0.5">
              WhatsApp, Sheets & more
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPalette,
  faTableCells,
  faTags,
  faTicket,
  faTruck,
  faCircleCheck,
  faPlug,
  faWandMagicSparkles,
  faBolt,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import {
  faWhatsapp,
  faTiktok,
  faFacebookF,
  faGoogle,
  faShopify,
  faWordpress,
} from "@fortawesome/free-brands-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { useFormStore } from "../../../stores";
import { BuilderSearchInput, useBuilderSearch } from "../components/BuilderSearch";

/* ─── Compact MenuCard (icon + short title only) ─── */
const MenuCard = ({
  icon,
  label,
  onClick,
  accentClass = "from-indigo-500 to-violet-600",
  comingSoon = false,
}: {
  icon: IconDefinition;
  label: string;
  onClick: () => void;
  accentClass?: string;
  comingSoon?: boolean;
}) => {
  const iconColorClass = accentClass.replace('from-', 'text-').split(' ')[0] || 'text-slate-600';

  return (
    <button
      onClick={comingSoon ? undefined : onClick}
      disabled={comingSoon}
      className={`
        group relative flex flex-col items-center justify-center gap-1.5 p-2.5
        bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-xl
        ${comingSoon ? "opacity-50 cursor-not-allowed bg-slate-50/50" : "hover:bg-white hover:border-slate-300/80 hover:shadow-lg hover:shadow-slate-200/40 active:scale-[0.95] cursor-pointer"}
        transition-all duration-300 text-center w-full aspect-square
        overflow-hidden
      `}
    >
      {!comingSoon && (
        <div className={`
          absolute inset-0 bg-gradient-to-r ${accentClass} opacity-0 
          group-hover:opacity-[0.05] transition-opacity duration-300
        `} />
      )}

      <div
        className={`
          flex items-center justify-center shrink-0
          ${comingSoon ? "text-slate-400" : `${iconColorClass} group-hover:scale-110 group-hover:rotate-3`} transition-transform duration-300
        `}
      >
        <FontAwesomeIcon icon={icon} style={{ fontSize: 24 }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-0.5">
        <span className={`block text-[12px] font-bold leading-tight ${comingSoon ? 'text-slate-400' : 'text-slate-700 group-hover:text-slate-900'} transition-colors`}>
          {label}
        </span>
        {comingSoon && (
          <span className="px-1.5 py-px rounded bg-slate-100 text-[8px] font-bold text-slate-400 uppercase tracking-wider border border-slate-200 mt-0.5">
            Soon
          </span>
        )}
      </div>
    </button>
  );
};

/* ─── Category Header ─── */
const CategoryHeader = ({
  icon,
  title,
  accentClass = "text-slate-900",
}: {
  icon: IconDefinition;
  title: string;
  accentClass?: string;
}) => (
  <div className="flex items-center gap-2 pt-5 pb-2 first:pt-0">
    <FontAwesomeIcon icon={icon} className={accentClass} style={{ fontSize: 12 }} />
    <span className="text-[10px] font-black uppercase text-slate-900 tracking-[0.15em]">
      {title}
    </span>
    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent ml-2" />
  </div>
);

export const MainMenu = ({ onLoadClick }: { onLoadClick?: () => void }) => {
  const setEditingSection = useFormStore((state) => state.setEditingSection);
  const formType = useFormStore((state) => state.formConfig.type);
  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = useBuilderSearch(searchQuery);

  return (
    <div className="pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">

      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50/50 rounded-full blur-[80px] opacity-60 pointer-events-none translate-x-1/2 -translate-y-1/2" />

      {/* ═══ STICKY HEADER: SEARCH + TEMPLATE BUTTON ═══ */}
      <div className="sticky top-0 z-50 -mt-5 sm:-mt-6 lg:-mt-8 -mx-5 sm:-mx-6 lg:-mx-8 px-5 sm:px-6 lg:px-8 pt-5 sm:pt-6 lg:pt-8 bg-[#F8F5F1]/90 backdrop-blur-xl border-b border-transparent transition-all mb-5">
        <div className="flex items-center gap-2.5">
          <div className="relative group flex-1">
            <BuilderSearchInput query={searchQuery} onChange={setSearchQuery} />
          </div>
          {onLoadClick && (
            <button
              onClick={onLoadClick}
              className="
                shrink-0 flex items-center gap-2 px-4 py-2.5
                bg-[#FF5A1F] text-white rounded-xl text-[12px] font-bold
                shadow-md shadow-[#FF5A1F]/20 hover:shadow-lg hover:shadow-[#FF5A1F]/30
                hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97]
                transition-all duration-300 cursor-pointer border-0
                whitespace-nowrap
              "
            >
              <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 13 }} />
              Templates
            </button>
          )}
        </div>
      </div>

      {searchQuery.trim() ? (
        <div className="space-y-4 relative z-10 min-h-[300px] mt-2">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-white/50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FontAwesomeIcon icon={faSearch} className="text-slate-400 text-xl" />
              </div>
              <p className="text-slate-800 font-bold text-[15px]">Aucun résultat trouvé</p>
              <p className="text-slate-500 text-sm mt-1 font-medium">Essayez d'autres mots-clés pour "{searchQuery}"</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {searchResults.map((item) => (
                <MenuCard
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  accentClass={item.accentClass}
                  onClick={() => {
                    setEditingSection(item.id);
                    setSearchQuery("");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4 relative z-10">

            {/* ═══════ CATEGORY: DESIGN & LAYOUT ═══════ */}
            <CategoryHeader icon={faPalette} title="Design & Layout" accentClass="text-indigo-500" />
            <div className="grid grid-cols-4 gap-2">
              <MenuCard
                icon={faPalette}
                label="Design"
                accentClass="from-indigo-500 to-violet-600"
                onClick={() => setEditingSection("global_design")}
              />
              <MenuCard
                icon={faTableCells}
                label="Sections"
                accentClass="from-blue-500 to-cyan-600"
                onClick={() => setEditingSection("sections_list")}
              />
              <MenuCard
                icon={faCircleCheck}
                label="Thank You"
                accentClass="from-green-500 to-emerald-600"
                onClick={() => setEditingSection("thank_you")}
              />
            </div>

            {/* ═══════ CATEGORY: PRODUCTS & OFFERS ═══════ */}
            <CategoryHeader icon={faTags} title="Products & Offers" accentClass="text-amber-500" />
            <div className="grid grid-cols-4 gap-2">
              {formType !== 'store' && (
                <MenuCard
                  icon={faTags}
                  label="Packs"
                  accentClass="from-amber-500 to-orange-600"
                  onClick={() => setEditingSection("packs_manager")}
                />
              )}
              <MenuCard
                icon={faTruck}
                label="Shipping"
                accentClass="from-emerald-500 to-teal-600"
                onClick={() => setEditingSection("shipping_manager")}
              />
              <MenuCard
                icon={faTicket}
                label="Coupons"
                accentClass="from-violet-500 to-purple-600"
                onClick={() => setEditingSection("promo_code_manager")}
              />
            </div>



            {/* ═══════ CATEGORY: INTEGRATIONS ═══════ */}
            <CategoryHeader icon={faPlug} title="Integrations" accentClass="text-blue-500" />
            <div className="grid grid-cols-4 gap-2">
              <MenuCard
                icon={faWhatsapp}
                label="WhatsApp"
                accentClass="from-emerald-400 to-green-600"
                onClick={() => setEditingSection("whatsapp")}
              />
              <MenuCard
                icon={faGoogle}
                label="Sheets"
                accentClass="from-green-500 to-emerald-700"
                onClick={() => setEditingSection("google_sheets")}
              />
              <MenuCard
                icon={faFacebookF}
                label="Meta Pixel"
                accentClass="from-blue-600 to-indigo-700"
                onClick={() => setEditingSection("meta_pixel")}
              />
              <MenuCard
                icon={faTiktok}
                label="TikTok"
                accentClass="from-slate-700 to-slate-900"
                onClick={() => setEditingSection("tiktok_pixel")}
              />
              <MenuCard
                icon={faShopify}
                label="Shopify"
                accentClass="from-green-500 to-emerald-600"
                onClick={() => setEditingSection("shopify")}
              />
              <MenuCard
                icon={faWordpress}
                label="WooCommerce"
                accentClass="from-purple-500 to-indigo-600"
                comingSoon={true}
                onClick={() => setEditingSection("woocommerce")}
              />
              <MenuCard
                icon={faBolt}
                label="Webhook"
                accentClass="from-amber-400 to-yellow-600"
                comingSoon={true}
                onClick={() => setEditingSection("webhook")}
              />
            </div>


          </div>
        </>
      )}
    </div>
  );
};

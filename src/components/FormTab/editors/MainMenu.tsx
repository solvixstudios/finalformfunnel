import React from "react";
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
  faTruckFast,
  faBox,
  faBriefcase,
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
import { BuilderSearch } from "../components/BuilderSearch";

/* ─── Reusable MenuCard (FontAwesome) ─── */
const MenuCard = ({
  icon,
  label,
  description,
  onClick,
  accentClass = "from-indigo-500 to-violet-600",
  comingSoon = false,
}: {
  icon: IconDefinition;
  label: string;
  description: string;
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
        group relative flex items-center gap-3.5 p-3 sm:p-3.5
        bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-2xl
        ${comingSoon ? "opacity-60 cursor-not-allowed bg-slate-50/50" : "hover:bg-white hover:border-slate-300/80 hover:shadow-lg hover:shadow-slate-200/40 active:scale-[0.97] cursor-pointer"}
        transition-all duration-300 text-left w-full
        overflow-hidden
      `}
    >
      {!comingSoon && (
        <div className={`
          absolute inset-0 bg-gradient-to-r ${accentClass} opacity-0 
          group-hover:opacity-[0.04] transition-opacity duration-300
        `} />
      )}

      <div
        className={`
          flex items-center justify-center shrink-0 w-8
          ${comingSoon ? "text-slate-400" : `${iconColorClass} group-hover:scale-110 group-hover:rotate-3`} transition-transform duration-300
        `}
      >
        <FontAwesomeIcon icon={icon} style={{ fontSize: 22 }} />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-between gap-2">
        <div>
          <span className={`block text-[13px] sm:text-[14px] font-bold ${comingSoon ? 'text-slate-500' : 'text-slate-800 group-hover:text-slate-900'} leading-tight transition-colors`}>
            {label}
          </span>
          <span className="block text-[11px] sm:text-[12px] text-slate-500 font-medium leading-tight mt-1">
            {description}
          </span>
        </div>
        {comingSoon && (
          <span className="shrink-0 px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider border border-slate-200">
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
  accentClass = "text-slate-500",
}: {
  icon: IconDefinition;
  title: string;
  accentClass?: string;
}) => (
  <div className="flex items-center gap-2 pt-6 pb-2.5 first:pt-0">
    <FontAwesomeIcon icon={icon} className={accentClass} style={{ fontSize: 13 }} />
    <span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.15em]">
      {title}
    </span>
    <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent ml-2" />
  </div>
);

export const MainMenu = ({ onLoadClick }: { onLoadClick?: () => void }) => {
  const setEditingSection = useFormStore((state) => state.setEditingSection);
  const formType = useFormStore((state) => state.formConfig.type);

  return (
    <div className="pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-x-clip">

      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

      {/* ═══ SMART SEARCH ═══ */}
      <div className="relative z-10 mb-6 group">
        <BuilderSearch onNavigate={(id) => setEditingSection(id)} />
        <div className="absolute inset-0 -z-10 bg-indigo-50/30 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* ═══ TEMPLATE HERO CARD ═══ */}
      {onLoadClick && (
        <button
          onClick={onLoadClick}
          className="
            w-full mb-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700
            p-5 rounded-2xl flex items-center gap-4 
            shadow-[0_8px_30px_rgb(79,70,229,0.2)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.35)]
            hover:-translate-y-1 active:translate-y-0.5 active:scale-[0.98]
            transition-all duration-300 cursor-pointer relative overflow-hidden
            text-left group z-10
          "
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

          <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity duration-500" />

          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shrink-0 relative z-10 border border-white/10">
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 20 }} />
          </div>

          <div className="flex-1 min-w-0 relative z-10">
            <span className="block text-[15px] font-extrabold text-white tracking-tight">
              Start with a Template
            </span>
            <span className="block text-sm text-indigo-100/90 mt-0.5 font-medium">
              Import a high-converting design
            </span>
          </div>
        </button>
      )}

      <div className="space-y-6 relative z-10">

        {/* ═══════ CATEGORY: DESIGN & LAYOUT ═══════ */}
        <CategoryHeader icon={faPalette} title="Design & Mise en page" accentClass="text-indigo-500" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mb-2">
          <MenuCard
            icon={faPalette}
            label="Design Global"
            description="Couleurs, formes & styles"
            accentClass="from-indigo-500 to-violet-600"
            onClick={() => setEditingSection("global_design")}
          />
          <MenuCard
            icon={faTableCells}
            label="Sections"
            description="Ordre et visibilité"
            accentClass="from-blue-500 to-cyan-600"
            onClick={() => setEditingSection("sections_list")}
          />
        </div>

        {/* ═══════ CATEGORY: PRODUCTS & OFFERS ═══════ */}
        <CategoryHeader icon={faTags} title="Produits & Offres" accentClass="text-amber-500" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mb-2">
          {formType !== 'store' && (
            <MenuCard
              icon={faTags}
              label="Packs & Offres"
              description="Gérer les offres produits"
              accentClass="from-amber-500 to-orange-600"
              onClick={() => setEditingSection("packs_manager")}
            />
          )}
          <MenuCard
            icon={faTruck}
            label="Tarifs Livraison"
            description="Frais & règles nationales"
            accentClass="from-emerald-500 to-teal-600"
            onClick={() => setEditingSection("shipping_manager")}
          />
          <MenuCard
            icon={faTicket}
            label="Codes Promo"
            description="Réductions & offres spéciales"
            accentClass="from-violet-500 to-purple-600"
            onClick={() => setEditingSection("promo_code_manager")}
          />
        </div>

        {/* ═══════ CATEGORY: CONVERSION ═══════ */}
        <CategoryHeader icon={faCircleCheck} title="Conversion" accentClass="text-green-500" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mb-2">
          <MenuCard
            icon={faCircleCheck}
            label="Confirmation"
            description="Page de remerciement"
            accentClass="from-green-500 to-emerald-600"
            onClick={() => setEditingSection("thank_you")}
          />
        </div>

        {/* ═══════ CATEGORY: INTEGRATIONS ═══════ */}
        <CategoryHeader icon={faPlug} title="Intégrations" accentClass="text-blue-500" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
          <MenuCard
            icon={faWhatsapp}
            label="WhatsApp"
            description="Connecter profils WhatsApp"
            accentClass="from-emerald-400 to-green-600"
            onClick={() => setEditingSection("whatsapp")}
          />
          <MenuCard
            icon={faGoogle}
            label="Google Sheets"
            description="Exporter commandes"
            accentClass="from-green-500 to-emerald-700"
            onClick={() => setEditingSection("google_sheets")}
          />
          <MenuCard
            icon={faFacebookF}
            label="Meta Pixel"
            description="Conversions Facebook"
            accentClass="from-blue-600 to-indigo-700"
            onClick={() => setEditingSection("meta_pixel")}
          />
          <MenuCard
            icon={faTiktok}
            label="TikTok Pixel"
            description="Conversions TikTok"
            accentClass="from-slate-700 to-slate-900"
            onClick={() => setEditingSection("tiktok_pixel")}
          />
          <MenuCard
            icon={faShopify}
            label="Shopify"
            description="Connecter boutique Shopify"
            accentClass="from-green-500 to-emerald-600"
            onClick={() => setEditingSection("shopify")}
          />
          <MenuCard
            icon={faWordpress}
            label="WooCommerce"
            description="Connecter WooCommerce"
            accentClass="from-purple-500 to-indigo-600"
            comingSoon={true}
            onClick={() => setEditingSection("woocommerce")}
          />
          <MenuCard
            icon={faBolt}
            label="Webhook"
            description="Créer automatisation"
            accentClass="from-amber-400 to-yellow-600"
            comingSoon={true}
            onClick={() => setEditingSection("webhook")}
          />
        </div>

        {/* ═══════ CATEGORY: DELIVERY & SHIPPING ═══════ */}
        <CategoryHeader icon={faTruckFast} title="Services de Livraison" accentClass="text-amber-500" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
          <MenuCard
            icon={faTruckFast}
            label="Maystro Delivery"
            description="Livraison Maystro"
            accentClass="from-blue-500 to-indigo-600"
            comingSoon={true}
            onClick={() => setEditingSection("maystro")}
          />
          <MenuCard
            icon={faTruckFast}
            label="ZR Delivery"
            description="Livraison ZR Delivery"
            accentClass="from-orange-400 to-red-500"
            comingSoon={true}
            onClick={() => setEditingSection("zr_delivery")}
          />
          <MenuCard
            icon={faBox}
            label="Yalidine"
            description="Livraison Yalidine Express"
            accentClass="from-rose-500 to-red-600"
            comingSoon={true}
            onClick={() => setEditingSection("yalidine")}
          />
          <MenuCard
            icon={faBox}
            label="Anderson"
            description="Livraison Anderson"
            accentClass="from-zinc-500 to-neutral-600"
            comingSoon={true}
            onClick={() => setEditingSection("anderson")}
          />
          <MenuCard
            icon={faBriefcase}
            label="Ecommanager"
            description="Intégration Ecommanager"
            accentClass="from-cyan-500 to-blue-600"
            comingSoon={true}
            onClick={() => setEditingSection("ecommanager")}
          />
        </div>
      </div>
    </div>
  );
};

import { useBuilderContext } from "../contexts/BuilderContext";
import { useFormStore } from "../../../stores";
import { useConnectedStores } from "@/lib/firebase/hooks";

import { ProductPickerSheet } from "@/components/ProductPickerSheet";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback } from "react";
import {
  Store,
  Globe,
  Package,
  Unlink,
  Plus,
  ChevronRight,
  Link2,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export const ShopifyEditor = () => {
  const { userId } = useBuilderContext();
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  const formId = useFormStore((state) => state.formId);
  const formName = useFormStore((state) => state.formName) || "Untitled Form";

  const { stores, loading: storesLoading } = useConnectedStores(userId);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStoreId, setPickerStoreId] = useState<string>("");
  const [pickingLinkType, setPickingLinkType] = useState<string | null>(null);

  const shopifyStores = stores.filter((s) => s.platform === "shopify");

  // Current links from form config
  const storeLinks: {
    storeId: string;
    type: "store" | "product";
    productIds?: string[];
  }[] = formConfig.addons?.shopifyStoreLinks || [];

  const linkedStoreIds = useMemo(
    () => new Set(storeLinks.map((l) => l.storeId)),
    [storeLinks],
  );
  const unlinkedStores = shopifyStores.filter((s) => !linkedStoreIds.has(s.id));

  // ─── Local state actions (instant, marks dirty) ───

  const updateLinks = useCallback(
    (newLinks: typeof storeLinks) => {
      setFormConfig({
        ...formConfig,
        addons: { ...formConfig.addons, shopifyStoreLinks: newLinks },
      });
    },
    [formConfig, setFormConfig],
  );

  const linkStore = useCallback(
    (storeId: string, type: "store" | "product", productIds?: string[]) => {
      const filtered = storeLinks.filter((l) => l.storeId !== storeId);
      updateLinks([
        ...filtered,
        { storeId, type, ...(productIds ? { productIds } : {}) },
      ]);
      setPickingLinkType(null);
      if (type === "store") toast.success("Linked to all products");
    },
    [storeLinks, updateLinks],
  );

  const unlinkStore = useCallback(
    (storeId: string) => {
      updateLinks(storeLinks.filter((l) => l.storeId !== storeId));
      toast.success("Store unlinked");
    },
    [storeLinks, updateLinks],
  );

  const openProductPicker = (storeId: string) => {
    setPickerStoreId(storeId);
    setPickerOpen(true);
    setPickingLinkType(null);
  };

  const handleProductsSaved = (productIds: string[]) => {
    if (productIds.length === 0) {
      // If no products selected, remove the link entirely
      updateLinks(storeLinks.filter((l) => l.storeId !== pickerStoreId));
      toast.success("Link removed");
    } else {
      linkStore(pickerStoreId, "product", productIds);
      toast.success(
        `${productIds.length} product${productIds.length !== 1 ? "s" : ""} selected`,
      );
    }
  };

  // Get currently selected product IDs for a store
  const getProductIds = (storeId: string) => {
    const link = storeLinks.find((l) => l.storeId === storeId);
    return link?.productIds || [];
  };

  // ─── Sub-components ───

  const ConnectStoreBtn = ({ title, variant = "ghost" }: { title: string, variant?: "primary" | "ghost" }) => (
    <button
      type="button"
      onClick={() => window.open("/dashboard/settings?tab=integrations&open=shopify", "_blank")}
      className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between group transition-all duration-200 outline-none
        ${variant === 'primary' 
          ? 'bg-[#FF5A1F] border-[#FF5A1F] hover:bg-[#E04812] shadow-sm hover:shadow-md' 
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-[#F8F5F1] shadow-sm'
        }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
          ${variant === 'primary' ? 'bg-white/20' : 'bg-[#F8F5F1] group-hover:bg-white border border-slate-200'}`}>
          <Store size={14} className={variant === 'primary' ? 'text-white' : 'text-slate-600'} />
        </div>
        <div>
          <h4 className={`text-[13px] font-bold leading-tight ${variant === 'primary' ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </h4>
        </div>
      </div>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-0.5
        ${variant === 'primary' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-[#FF5A1F] group-hover:text-white'}`}>
        <ChevronRight size={14} />
      </div>
    </button>
  );

  return (
    <div className="relative z-50 pointer-events-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] flex items-center gap-2 px-1">
        <Store size={14} className="text-emerald-500" /> Shopify
      </h3>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-[#F8F5F1] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
            <Link2 size={16} className="text-[#FF5A1F]" />
          </div>
          <div className="flex-1">
            <h4 className="text-[13px] font-black text-slate-900 tracking-tight leading-tight">
              Store Deployments
            </h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              {storeLinks.length > 0
                ? `${storeLinks.length} active link${storeLinks.length !== 1 ? "s" : ""}`
                : "No stores linked"}
            </p>
          </div>
          {storeLinks.length > 0 && (
            <div className="w-2 h-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
          )}
        </div>

        {/* Body */}
        <div className="p-3">
          {storesLoading ? (
            <div className="space-y-2">
              <div className="h-14 bg-slate-50 rounded-xl animate-pulse" />
              <div className="h-14 bg-slate-50 rounded-xl animate-pulse opacity-60" />
            </div>
          ) : shopifyStores.length === 0 ? (
            <ConnectStoreBtn title="Connect a Shopify Store" variant="primary" />
          ) : (
            <div className="space-y-2">
              {/* Linked stores */}
              {storeLinks.map((link) => {
                const store = shopifyStores.find((s) => s.id === link.storeId);
                return (
                  <div key={link.storeId} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-[#FF5A1F]/30 hover:shadow-sm transition-all duration-300 group">
                    <div className="w-9 h-9 rounded-lg bg-[#FF5A1F]/5 border border-[#FF5A1F]/10 flex items-center justify-center shrink-0">
                      <Check size={16} className="text-[#FF5A1F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-slate-900 truncate">
                        {store?.name || "Store"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {link.type === "store" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded-md">
                            <Globe size={10} /> Entire Store
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#FF5A1F] uppercase tracking-widest bg-[#FF5A1F]/10 px-1.5 py-0.5 rounded-md">
                            <Package size={10} /> {link.productIds?.length || 0} product{(link.productIds?.length || 0) !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {link.type === "product" && (
                        <button
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          onClick={() => openProductPicker(link.storeId)}
                          title="Edit Products"
                        >
                          <Package size={14} />
                        </button>
                      )}
                      <button
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => unlinkStore(link.storeId)}
                        title="Unlink Store"
                      >
                        <Unlink size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Unlinked stores */}
              {unlinkedStores.map((store) => (
                <div key={store.id} className="relative w-full block">
                  {pickingLinkType === store.id ? (
                    <div className="relative z-10 pointer-events-auto bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-3.5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#FF5A1F]/10 border border-[#FF5A1F]/20 flex items-center justify-center">
                            <Store size={14} className="text-[#FF5A1F]" />
                          </div>
                          <span className="text-[13px] font-bold text-slate-900 truncate">
                            {store.name}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPickingLinkType(null); }}
                          className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 mb-3 font-semibold">
                        Where should this form appear?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-[#FF5A1F] hover:bg-[#FF5A1F]/5 transition-all duration-200 cursor-pointer shadow-sm"
                          onClick={() => linkStore(store.id, "store")}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:border-[#FF5A1F]/30 transition-colors">
                            <Globe size={18} className="text-slate-400 group-hover:text-[#FF5A1F] transition-colors" />
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] font-bold text-slate-900 group-hover:text-[#FF5A1F]">Entire Store</p>
                          </div>
                        </button>
                        <button
                          className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:border-[#FF5A1F] hover:bg-[#FF5A1F]/5 transition-all duration-200 cursor-pointer shadow-sm"
                          onClick={() => openProductPicker(store.id)}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-white group-hover:border-[#FF5A1F]/30 transition-colors">
                            <Package size={18} className="text-slate-400 group-hover:text-[#FF5A1F] transition-colors" />
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] font-bold text-slate-900 group-hover:text-[#FF5A1F]">Specific Items</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPickingLinkType(store.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#FF5A1F]/30 hover:bg-[#FF5A1F]/5 transition-all duration-200 cursor-pointer text-left active:scale-[0.98] outline-none group`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-[#FF5A1F]/20 transition-colors">
                          <Store size={14} className="text-slate-500 group-hover:text-[#FF5A1F] transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-[12px] font-bold text-slate-900 group-hover:text-[#FF5A1F] truncate transition-colors">{store.name}</p>
                          <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{store.url}</p>
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#FF5A1F] group-hover:text-white transition-colors shrink-0">
                        <Link2 size={12} strokeWidth={2.5} />
                      </div>
                    </button>
                  )}
                </div>
              ))}

              {/* All linked — offer to connect new */}
              {unlinkedStores.length === 0 && storeLinks.length > 0 && (
                <div className="pt-2">
                  <ConnectStoreBtn title="Connect Another Store" />
                </div>
              )}

              {unlinkedStores.length > 0 && (
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <ConnectStoreBtn title="Connect New Store" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Guide */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-3.5 flex items-center gap-2 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs font-bold text-slate-600">How it Works</span>
        </div>
        <div className="p-3.5 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-px">
              <Globe size={12} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-800">
                All Products
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                Form appears on every product in the store.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-px">
              <Package size={12} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-800">
                Pick Products
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                Form only appears on products you choose.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 pt-1 border-t border-slate-100">
            <div className="w-6 h-6 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-px">
              <AlertCircle size={12} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Changes apply when you{" "}
                <span className="font-bold text-slate-700">Save</span> the form.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProductPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        storeId={pickerStoreId}
        userId={userId}
        selectedProductIds={getProductIds(pickerStoreId)}
        onSave={handleProductsSaved}
      />
    </div>
  );
};

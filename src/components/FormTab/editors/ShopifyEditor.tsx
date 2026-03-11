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

  const ConnectStoreBtn = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <button
      type="button"
      onClick={() => window.open("/dashboard/integrations?open=shopify&add=true", "_blank")}
      className="w-full text-left p-4 rounded-xl border border-dashed border-emerald-300 bg-gradient-to-r from-emerald-50/50 to-white hover:border-emerald-400 hover:from-emerald-50 hover:to-emerald-50/80 transition-all duration-200 cursor-pointer flex items-center gap-3 group shadow-sm hover:shadow-md outline-none"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/60 flex items-center justify-center shadow-sm shrink-0 transition-all group-hover:scale-105">
        <Store size={18} className="text-emerald-600" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
          {title}
        </h4>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5 group-hover:text-slate-600 transition-colors">
          {subtitle}
        </p>
      </div>
      <div className="w-6 h-6 rounded-full bg-emerald-100/50 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
        <Plus size={14} className="text-emerald-600" />
      </div>
    </button>
  );

  return (
    <div className="relative z-50 pointer-events-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] flex items-center gap-2 px-1">
        <Store size={14} className="text-emerald-500" /> Shopify
      </h3>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/60 flex items-center justify-center shadow-sm shrink-0">
            <Link2 size={18} className="text-emerald-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              Store Links
            </h4>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              {storeLinks.length > 0
                ? `${storeLinks.length} store${storeLinks.length !== 1 ? "s" : ""} linked`
                : "Link a store to deploy this form"}
            </p>
          </div>
          {storeLinks.length > 0 && (
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check size={12} className="text-emerald-600" />
            </div>
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
            <ConnectStoreBtn
              title="Connect Store"
              subtitle="Add a Shopify store to deploy this form"
            />
          ) : (
            <div className="space-y-2">
              {/* Linked stores */}
              {storeLinks.map((link) => {
                const store = shopifyStores.find((s) => s.id === link.storeId);
                return (
                  <div key={link.storeId} className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/60 to-white transition-all duration-300">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Check size={16} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {store?.name || "Store"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {link.type === "store" ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-px rounded-full">
                            <Globe size={8} /> All Products
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-px rounded-full">
                            <Package size={8} /> {link.productIds?.length || 0} product{(link.productIds?.length || 0) !== 1 ? "s" : ""} linked
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {link.type === "product" && (
                        <button
                          className="flex items-center gap-1 h-7 px-2.5 text-[10px] font-bold text-indigo-600 hover:text-white hover:bg-indigo-500 border border-indigo-200 hover:border-indigo-500 rounded-lg transition-all duration-200"
                          onClick={() => openProductPicker(link.storeId)}
                        >
                          <Package size={10} />
                          Edit
                        </button>
                      )}
                      <button
                        className="flex items-center gap-1 h-7 px-2.5 text-[10px] font-bold text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-lg transition-all duration-200"
                        onClick={() => unlinkStore(link.storeId)}
                      >
                        <Unlink size={10} />
                        Unlink
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
                          <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                            <Store size={12} className="text-emerald-600" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate">
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
                          className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-slate-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                          onClick={() => linkStore(store.id, "store")}
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                            <Globe size={18} className="text-blue-500 group-hover:text-white transition-colors" />
                          </div>
                          <div className="text-center">
                            <p className="text-[12px] font-bold text-slate-800 group-hover:text-blue-700">All Products</p>
                            <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Entire store</p>
                          </div>
                        </button>
                        <button
                          className="group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
                          onClick={() => openProductPicker(store.id)}
                        >
                          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                            <Package size={18} className="text-indigo-500 group-hover:text-white transition-colors" />
                          </div>
                          <div className="text-center">
                            <p className="text-[12px] font-bold text-slate-800 group-hover:text-indigo-700">Pick Products</p>
                            <p className="text-[9px] text-slate-500 mt-0.5 font-medium">Specific items</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPickingLinkType(store.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border ${storeLinks.length > 0
                        ? "border-dashed border-slate-300 bg-slate-50"
                        : "border-slate-200 bg-white shadow-sm"
                        } hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-md transition-all duration-200 cursor-pointer text-left active:scale-[0.98] outline-none focus:ring-2 focus:ring-emerald-500`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${storeLinks.length > 0
                          ? "bg-white text-emerald-500 border border-slate-200"
                          : "bg-emerald-100/50 text-emerald-600 border border-emerald-100"
                          }`}>
                          {storeLinks.length > 0 ? <Plus size={16} /> : <Store size={18} />}
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="text-[13px] font-bold text-slate-900 truncate">{store.name}</p>
                          <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{store.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold text-[11px] shadow-sm hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors shrink-0">
                        <Link2 size={12} strokeWidth={2.5} /> Link Store
                      </div>
                    </button>
                  )}
                </div>
              ))}

              {/* All linked — offer to connect new */}
              {unlinkedStores.length === 0 && storeLinks.length > 0 && (
                <div className="pt-2">
                  <ConnectStoreBtn
                    title="Connect Another Store"
                    subtitle="Link an additional Shopify store"
                  />
                </div>
              )}

              {unlinkedStores.length > 0 && (
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <ConnectStoreBtn
                    title="Connect New Store"
                    subtitle="Add another Shopify store to your account"
                  />
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

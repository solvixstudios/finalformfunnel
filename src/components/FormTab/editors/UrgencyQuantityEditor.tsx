import { Info, Package } from "lucide-react";
import {
  URGENCY_COLOR_PRESETS,
  URGENCY_STYLE_PRESETS,
} from "../../../lib/constants";
import { useFormStore } from "../../../stores";

export const UrgencyQuantityEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  return (
    <div className="space-y-4">
      {" "}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        {" "}
        <div className="flex items-center gap-3 mb-4">
          {" "}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg">
            {" "}
            <Package size={20} />{" "}
          </div>{" "}
          <div>
            {" "}
            <h4 className="text-sm font-bold text-slate-800">
              Urgence Stock
            </h4>{" "}
            <p className="text-[10px] text-slate-400">
              Affiche la quantité restante en stock
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          {" "}
          <div>
            {" "}
            <span className="text-xs font-bold text-slate-700 block">
              Activer
            </span>{" "}
            <span className="text-[10px] text-slate-400">
              Affiche le compteur de stock
            </span>{" "}
          </div>{" "}
          <button
            onClick={() =>
              setFormConfig({
                ...formConfig,
                urgencyQuantity: {
                  ...formConfig.urgencyQuantity,
                  enabled: !formConfig.urgencyQuantity?.enabled,
                },
              })
            }
            className={`w-12 h-6 rounded-full relative transition-colors ${formConfig.urgencyQuantity?.enabled ? "bg-indigo-600" : "bg-slate-200"}`}
          >
            {" "}
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.urgencyQuantity?.enabled ? "translate-x-6" : ""}`}
            />{" "}
          </button>{" "}
        </div>{" "}
        {formConfig.urgencyQuantity?.enabled && (
          <div className="space-y-4">
            {" "}
            {/* Style Selector */}{" "}
            <div className="space-y-3">
              {" "}
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Style d'affichage
              </label>{" "}
              <div className="grid grid-cols-4 gap-2">
                {" "}
                {URGENCY_STYLE_PRESETS.quantity.map((style) => (
                  <button
                    key={style.id}
                    onClick={() =>
                      setFormConfig({
                        ...formConfig,
                        urgencyQuantity: {
                          ...formConfig.urgencyQuantity,
                          style: style.id,
                        },
                      })
                    }
                    className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${(formConfig.urgencyQuantity?.style || "progress") === style.id ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
                  >
                    {" "}
                    <span className="text-[10px] font-bold">
                      {style.name}
                    </span>{" "}
                  </button>
                ))}{" "}
              </div>{" "}
            </div>{" "}
            {/* Color Preset Selector */}{" "}
            <div className="space-y-3">
              {" "}
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Couleur
              </label>{" "}
              <div className="flex flex-wrap gap-2">
                {" "}
                {URGENCY_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() =>
                      setFormConfig({
                        ...formConfig,
                        urgencyQuantity: {
                          ...formConfig.urgencyQuantity,
                          colorPreset: preset.id,
                        },
                      })
                    }
                    className={`p-2 rounded-lg border-2 flex items-center gap-2 transition-all ${(formConfig.urgencyQuantity?.colorPreset || "dynamic") === preset.id ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    {" "}
                    {preset.id === "default" && (
                      <div
                        className="w-4 h-4 rounded-full border-2 border-dashed border-indigo-400"
                        style={{ backgroundColor: `${formConfig.accentColor}50` }}
                      />
                    )}{" "}
                    {preset.id === "dynamic" && (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500" />
                    )}{" "}
                    {preset.id !== "dynamic" && preset.id !== "custom" && preset.id !== "default" && (
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.color }}
                      />
                    )}{" "}
                    {preset.id === "custom" && (
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
                    )}{" "}
                    <span className="text-[10px] font-bold text-slate-600">
                      {preset.name}
                    </span>{" "}
                  </button>
                ))}{" "}
              </div>{" "}
              {formConfig.urgencyQuantity?.colorPreset === "custom" && (
                <input
                  type="color"
                  value={formConfig.urgencyQuantity?.customColor || "#ef4444"}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      urgencyQuantity: {
                        ...formConfig.urgencyQuantity,
                        customColor: e.target.value,
                      },
                    })
                  }
                  className="w-full h-10 rounded-lg cursor-pointer border border-slate-200"
                />
              )}{" "}
            </div>{" "}
            {/* Stock Count */}{" "}
            <div className="space-y-3">
              {" "}
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Quantité en stock
              </label>{" "}
              <div className="flex items-center gap-4">
                {" "}
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={formConfig.urgencyQuantity?.stockCount || 7}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      urgencyQuantity: {
                        ...formConfig.urgencyQuantity,
                        stockCount: parseInt(e.target.value),
                      },
                    })
                  }
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />{" "}
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={formConfig.urgencyQuantity?.stockCount || 7}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      urgencyQuantity: {
                        ...formConfig.urgencyQuantity,
                        stockCount: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-16 text-xs border border-slate-200 rounded-lg p-2 text-center font-bold"
                />{" "}
              </div>{" "}
            </div>{" "}
            {/* Options */}{" "}
            <div className="grid grid-cols-2 gap-3">
              {" "}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                {" "}
                <span className="text-[11px] font-bold text-slate-600">
                  Icône
                </span>{" "}
                <button
                  onClick={() =>
                    setFormConfig({
                      ...formConfig,
                      urgencyQuantity: {
                        ...formConfig.urgencyQuantity,
                        showIcon: !formConfig.urgencyQuantity?.showIcon,
                      },
                    })
                  }
                  className={`w-10 h-5 rounded-full relative transition-colors ${formConfig.urgencyQuantity?.showIcon !== false ? "bg-indigo-600" : "bg-slate-200"}`}
                >
                  {" "}
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.urgencyQuantity?.showIcon !== false ? "translate-x-5" : ""}`}
                  />{" "}
                </button>{" "}
              </div>{" "}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                {" "}
                <span className="text-[11px] font-bold text-slate-600">
                  Animation
                </span>{" "}
                <button
                  onClick={() =>
                    setFormConfig({
                      ...formConfig,
                      urgencyQuantity: {
                        ...formConfig.urgencyQuantity,
                        animate: !formConfig.urgencyQuantity?.animate,
                      },
                    })
                  }
                  className={`w-10 h-5 rounded-full relative transition-colors ${formConfig.urgencyQuantity?.animate !== false ? "bg-indigo-600" : "bg-slate-200"}`}
                >
                  {" "}
                  <div
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.urgencyQuantity?.animate !== false ? "translate-x-5" : ""}`}
                  />{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
            {/* Custom Text */}
            <div className="space-y-3">
              {" "}
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Texte personnalisé (optionnel)
              </label>{" "}
              <div className="grid grid-cols-2 gap-3">
                {" "}
                <div className="space-y-1">
                  {" "}
                  <span className="text-[9px] font-bold text-slate-400">
                    Français
                  </span>{" "}
                  <input
                    type="text"
                    value={formConfig.urgencyQuantity?.customText?.fr || ""}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        urgencyQuantity: {
                          ...formConfig.urgencyQuantity,
                          customText: {
                            ...formConfig.urgencyQuantity?.customText,
                            fr: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    placeholder="Laissez vide pour texte par défaut"
                  />{" "}
                </div>{" "}
                <div className="space-y-1">
                  {" "}
                  <span className="text-[9px] font-bold text-slate-400">
                    العربية
                  </span>{" "}
                  <input
                    type="text"
                    dir="rtl"
                    value={formConfig.urgencyQuantity?.customText?.ar || ""}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        urgencyQuantity: {
                          ...formConfig.urgencyQuantity,
                          customText: {
                            ...formConfig.urgencyQuantity?.customText,
                            ar: e.target.value,
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    placeholder="اتركه فارغاً للنص الافتراضي"
                  />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        {" "}
        <p className="text-[11px] font-medium text-amber-700 flex gap-2 items-start">
          {" "}
          <Info size={14} className="mt-0.5 flex-shrink-0" /> Le mode
          "Dynamique" change la couleur selon le stock: vert (8+), orange (4-7),
          rouge (1-3).{" "}
        </p>{" "}
      </div>{" "}
    </div>
  );
};

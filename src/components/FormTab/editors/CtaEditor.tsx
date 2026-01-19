import { MousePointerClick, Sparkles, Zap } from "lucide-react";
import { useFormStore } from "../../../stores";

export const CtaEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);

  return (
    <div className="space-y-4">
      {/* Button Text Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          Texte du bouton
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400">Français</span>
            <input
              type="text"
              value={formConfig.translations.cta.fr}
              onChange={(e) =>
                setFormConfig({
                  ...formConfig,
                  translations: {
                    ...formConfig.translations,
                    cta: { ...formConfig.translations.cta, fr: e.target.value },
                  },
                })
              }
              className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
              placeholder="Commander Maintenant"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400">العربية</span>
            <input
              type="text"
              dir="rtl"
              value={formConfig.translations.cta.ar}
              onChange={(e) =>
                setFormConfig({
                  ...formConfig,
                  translations: {
                    ...formConfig.translations,
                    cta: { ...formConfig.translations.cta, ar: e.target.value },
                  },
                })
              }
              className="w-full text-xs border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
              placeholder="اطلب الآن"
            />
          </div>
        </div>
      </div>

      {/* CTA Button Configuration */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <MousePointerClick size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Style & Animation</h4>
            <p className="text-[10px] text-slate-400">Personnaliser l'apparence du bouton</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Variant</label>
            <select
              value={formConfig.ctaVariant || "solid"}
              onChange={(e) =>
                setFormConfig({ ...formConfig, ctaVariant: e.target.value })
              }
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
            >
              <option value="solid">Plein</option>
              <option value="outline">Contour</option>
              <option value="gradient">Dégradé</option>
              <option value="ghost">Transparent</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-500" />
              Animation
            </label>
            <select
              value={formConfig.ctaAnimation || (formConfig.ctaShake ? "shake" : "none")}
              onChange={(e) =>
                setFormConfig({
                  ...formConfig,
                  ctaAnimation: e.target.value as any,
                  ctaShake: e.target.value === "shake"
                })
              }
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
            >
              <option value="none">Aucune</option>
              <option value="pulse">✨ Pulsation</option>
              <option value="bounce">🎾 Rebond</option>
              <option value="shake">🤝 Secousse</option>
              <option value="glow">💫 Lueur</option>
              <option value="slide">↔️ Glissement</option>
              <option value="scale">🔍 Zoom</option>
              <option value="float">🎈 Flottement</option>
              <option value="spin">🔄 Rotation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sticky CTA Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
            <Zap size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">CTA Fixe (Sticky)</h4>
            <p className="text-[10px] text-slate-500">Apparaît quand le CTA principal est hors vue</p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-700 block">Activer le CTA Fixe</span>
              <span className="text-[10px] text-slate-400">Affiche un bouton flottant</span>
            </div>
            <button
              onClick={() =>
                setFormConfig({ ...formConfig, ctaSticky: !formConfig.ctaSticky })
              }
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${formConfig.ctaSticky ? "bg-gradient-to-r from-indigo-600 to-purple-600" : "bg-slate-200"
                }`}
            >
              <div
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.ctaSticky ? "translate-x-6" : ""
                  }`}
              />
            </button>
          </div>

          {formConfig.ctaSticky && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Style du Sticky</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setFormConfig({ ...formConfig, ctaStickyVariant: 'simple' })}
                  className={`p-2.5 rounded-lg border text-[10px] font-bold transition-all ${(!formConfig.ctaStickyVariant || formConfig.ctaStickyVariant === 'simple')
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-sm"
                    }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setFormConfig({ ...formConfig, ctaStickyVariant: 'product' })}
                  className={`p-2.5 rounded-lg border text-[10px] font-bold transition-all ${formConfig.ctaStickyVariant === 'product'
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-sm"
                    }`}
                >
                  Produit
                </button>
                <button
                  onClick={() => setFormConfig({ ...formConfig, ctaStickyVariant: 'compact' })}
                  className={`p-2.5 rounded-lg border text-[10px] font-bold transition-all ${formConfig.ctaStickyVariant === 'compact'
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-sm"
                    }`}
                >
                  Compact
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setFormConfig({ ...formConfig, ctaStickyVariant: 'card' })}
                  className={`p-2.5 rounded-lg border text-[10px] font-bold transition-all ${formConfig.ctaStickyVariant === 'card'
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-sm"
                    }`}
                >
                  Carte
                </button>
                <button
                  onClick={() => setFormConfig({ ...formConfig, ctaStickyVariant: 'badge' })}
                  className={`p-2.5 rounded-lg border text-[10px] font-bold transition-all ${formConfig.ctaStickyVariant === 'badge'
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 border-transparent text-white shadow-md"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-sm"
                    }`}
                >
                  Badge
                </button>
              </div>

              <div className="mt-3 p-2.5 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-[9px] text-indigo-700 leading-relaxed">
                  <strong>💡 Astuce:</strong> Le style <strong>Produit</strong> affiche l'image et le prix. <strong>Compact</strong> est minimal. <strong>Carte</strong> a plus d'espace. <strong>Badge</strong> est un petit bouton flottant.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

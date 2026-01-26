import { AlignCenter, EyeOff, Home, Layout, Minimize2, Palette, Sparkles, Type } from "lucide-react";
import React from "react";
import { HEADER_STYLE_PRESETS } from "../../../lib/constants";
import { useFormStore } from "../../../stores";

const STYLE_ICONS: Record<string, React.ReactNode> = {
  classic: <Layout size={16} />,
  centered: <AlignCenter size={16} />,
  minimal: <Type size={16} />,
  banner: <Palette size={16} />,
  compact: <Minimize2 size={16} />,
  hidden: <EyeOff size={16} />,
};

export const HeaderEditor = () => {
  const formConfig = useFormStore((state) => state.formConfig);
  const setFormConfig = useFormStore((state) => state.setFormConfig);
  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Home size={20} />
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Header (En-tête)
            </h4>

            <p className="text-[10px] text-slate-400">
              Section fixe en haut du formulaire
            </p>
          </div>
        </div>

        {/* Header Style Selector */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Style d'en-tête
          </label>
          <div className="grid grid-cols-2 gap-2">
            {HEADER_STYLE_PRESETS.map((style) => (
              <button
                key={style.id}
                onClick={() =>
                  setFormConfig({
                    ...formConfig,
                    header: {
                      ...formConfig.header,
                      style: style.id as "classic" | "centered" | "minimal" | "banner" | "compact" | "hidden",
                    },
                  })
                }
                className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${(formConfig.header?.style || "classic") === style.id
                  ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${(formConfig.header?.style || "classic") === style.id
                  ? "bg-indigo-100"
                  : "bg-slate-100"
                  }`}>
                  {STYLE_ICONS[style.id]}
                </div>
                <div className="text-left flex-1">
                  <span className="text-xs font-bold block">{style.name}</span>
                  <span className="text-[9px] text-slate-400">{style.desc}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Language Switcher Toggle */}

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <span className="text-xs font-bold text-slate-700 block">
              Changeur de langue
            </span>

            <span className="text-[10px] text-slate-400">
              Affiche le bouton FR/ع
            </span>
          </div>

          <button
            onClick={() =>
              setFormConfig({
                ...formConfig,
                header: {
                  ...formConfig.header,
                  showLanguageSwitcher:
                    !formConfig.header?.showLanguageSwitcher,
                },
              })
            }
            className={`w-12 h-6 rounded-full relative transition-colors ${formConfig.header?.showLanguageSwitcher !== false ? "bg-indigo-600" : "bg-slate-200"}`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.header?.showLanguageSwitcher !== false ? "translate-x-6" : ""}`}
            />
          </button>
        </div>

        {/* Default Language Selector */}

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Langue par défaut
          </label>

          <div className="grid grid-cols-2 gap-2">
            {" "}
            {[
              { id: "fr" as const, label: "Français", icon: "🇫🇷" },
              { id: "ar" as const, label: "العربية", icon: "🇩🇿" },
            ].map((langOption) => (
              <button
                key={langOption.id}
                onClick={() =>
                  setFormConfig({
                    ...formConfig,
                    header: {
                      ...formConfig.header,
                      defaultLanguage: langOption.id as "fr" | "ar",
                    },
                  })
                }
                className={`p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${(formConfig.header?.defaultLanguage || "fr") === langOption.id ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}
              >
                <span className="text-lg">{langOption.icon}</span>

                <span className="text-xs font-bold">{langOption.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Display Options */}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] font-bold text-slate-600">
              Image produit
            </span>

            <button
              onClick={() =>
                setFormConfig({
                  ...formConfig,
                  header: {
                    ...formConfig.header,
                    showProductImage: !formConfig.header?.showProductImage,
                  },
                })
              }
              className={`w-10 h-5 rounded-full relative transition-colors ${formConfig.header?.showProductImage !== false ? "bg-indigo-600" : "bg-slate-200"}`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.header?.showProductImage !== false ? "translate-x-5" : ""}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-[11px] font-bold text-slate-600">
              Prix produit
            </span>

            <button
              onClick={() =>
                setFormConfig({
                  ...formConfig,
                  header: {
                    ...formConfig.header,
                    showProductPrice: !formConfig.header?.showProductPrice,
                  },
                })
              }
              className={`w-10 h-5 rounded-full relative transition-colors ${formConfig.header?.showProductPrice !== false ? "bg-indigo-600" : "bg-slate-200"}`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.header?.showProductPrice !== false ? "translate-x-5" : ""}`}
              />
            </button>
          </div>
        </div>

        {formConfig.header?.showProductPrice !== false && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-600 block">
                  Prix en toutes lettres
                </span>
                <span className="text-[9px] text-slate-400">
                  Afficher sous le prix
                </span>
              </div>
              <button
                onClick={() =>
                  setFormConfig({
                    ...formConfig,
                    header: {
                      ...formConfig.header,
                      priceInLetters: {
                        ...formConfig.header?.priceInLetters,
                        enabled: !formConfig.header?.priceInLetters?.enabled,
                        mode: formConfig.header?.priceInLetters?.mode || 'dinars'
                      }
                    }
                  })
                }
                className={`w-10 h-5 rounded-full relative transition-colors ${formConfig.header?.priceInLetters?.enabled ? "bg-indigo-600" : "bg-slate-200"}`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.header?.priceInLetters?.enabled ? "translate-x-5" : ""}`}
                />
              </button>
            </div>

            {formConfig.header?.priceInLetters?.enabled && (
              <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-200">
                <button
                  onClick={() =>
                    setFormConfig({
                      ...formConfig,
                      header: {
                        ...formConfig.header,
                        priceInLetters: {
                          ...formConfig.header?.priceInLetters,
                          enabled: true,
                          mode: 'dinars'
                        }
                      }
                    })
                  }
                  className={`p-2 rounded-lg border text-[10px] font-bold transition-all ${formConfig.header?.priceInLetters?.mode === 'dinars'
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                >
                  Dinars (DA)
                </button>
                <button
                  onClick={() =>
                    setFormConfig({
                      ...formConfig,
                      header: {
                        ...formConfig.header,
                        priceInLetters: {
                          ...formConfig.header?.priceInLetters,
                          enabled: true,
                          mode: 'centimes'
                        }
                      }
                    })
                  }
                  className={`p-2 rounded-lg border text-[10px] font-bold transition-all ${formConfig.header?.priceInLetters?.mode === 'centimes'
                    ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                >
                  Centimes
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Sticker Configuration */}

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-800">Badge Produit</h4>

            <p className="text-[10px] text-slate-400">
              Sticker sur l'image du produit
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <span className="text-[11px] font-bold text-slate-600">
            Activer le badge
          </span>

          <button
            onClick={() =>
              setFormConfig({
                ...formConfig,
                stickers: {
                  ...formConfig.stickers,
                  product: {
                    ...formConfig.stickers?.product,
                    enabled: !formConfig.stickers?.product?.enabled,
                  },
                },
              })
            }
            className={`w-10 h-5 rounded-full relative transition-colors ${formConfig.stickers?.product?.enabled ? "bg-indigo-600" : "bg-slate-200"}`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${formConfig.stickers?.product?.enabled ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
        {formConfig.stickers?.product?.enabled && (
          <div className="space-y-4">
            {/* Badge Text */}

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Texte du badge
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400">
                    Français
                  </span>

                  <input
                    type="text"
                    value={formConfig.stickers?.product?.text?.fr || ""}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        stickers: {
                          ...formConfig.stickers,
                          product: {
                            ...formConfig.stickers?.product,
                            text: {
                              ...formConfig.stickers?.product?.text,
                              fr: e.target.value,
                            },
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    placeholder="Best Seller"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400">
                    العربية
                  </span>

                  <input
                    type="text"
                    dir="rtl"
                    value={formConfig.stickers?.product?.text?.ar || ""}
                    onChange={(e) =>
                      setFormConfig({
                        ...formConfig,
                        stickers: {
                          ...formConfig.stickers,
                          product: {
                            ...formConfig.stickers?.product,
                            text: {
                              ...formConfig.stickers?.product?.text,
                              ar: e.target.value,
                            },
                          },
                        },
                      })
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                    placeholder="الأكثر مبيعاً"
                  />
                </div>
              </div>
            </div>

            {/* Badge Color */}

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Couleur du badge
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formConfig.stickers?.product?.color || "#ef4444"}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      stickers: {
                        ...formConfig.stickers,
                        product: {
                          ...formConfig.stickers?.product,
                          color: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
                />
                <div className="flex flex-wrap gap-1.5">
                  {" "}
                  {[
                    "#ef4444",
                    "#f59e0b",
                    "#10b981",
                    "#3b82f6",
                    "#8b5cf6",
                    "#ec4899",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        setFormConfig({
                          ...formConfig,
                          stickers: {
                            ...formConfig.stickers,
                            product: { ...formConfig.stickers?.product, color },
                          },
                        })
                      }
                      className={`w-6 h-6 rounded-md transition-all ${formConfig.stickers?.product?.color === color ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-110"}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Badge Text Color */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Couleur du texte
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formConfig.stickers?.product?.textColor || "#ffffff"}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      stickers: {
                        ...formConfig.stickers,
                        product: {
                          ...formConfig.stickers?.product,
                          textColor: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-200"
                />
                <div className="flex flex-wrap gap-1.5">
                  {" "}
                  {[
                    "#ffffff",
                    "#000000",
                    "#1e293b",
                    "#f1f5f9",
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() =>
                        setFormConfig({
                          ...formConfig,
                          stickers: {
                            ...formConfig.stickers,
                            product: { ...formConfig.stickers?.product, textColor: color },
                          },
                        })
                      }
                      className={`w-6 h-6 rounded-md transition-all ${formConfig.stickers?.product?.textColor === color ? "ring-2 ring-offset-2 ring-indigo-500 scale-110" : "hover:scale-110"}`}
                      style={{ backgroundColor: color, border: color === '#ffffff' ? '1px solid #e2e8f0' : 'none' }}
                    />
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

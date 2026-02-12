import { Sparkles } from 'lucide-react';
import PacksManager from '../managers/PacksManager';
import PromoCodeManager from '../managers/PromoCodeManager';
import ShippingManager from '../managers/ShippingManager';
import { AddonsEditor } from './editors/AddonsEditor';
import { CtaEditor } from './editors/CtaEditor';
import { DeliveryEditor } from './editors/DeliveryEditor';
import { GlobalDesignEditor } from './editors/GlobalDesignEditor';
import { HeaderEditor } from './editors/HeaderEditor';
import { OffersEditor } from './editors/OffersEditor';
import { PromoCodeEditor } from './editors/PromoCodeEditor';
import { SectionsListEditor } from './editors/SectionsListEditor';
import { ShippingEditor } from './editors/ShippingEditor';
import { SummaryEditor } from './editors/SummaryEditor';
import { ThankYouEditor } from './editors/ThankYouEditor';
import { TrustBadgesEditor } from './editors/TrustBadgesEditor';
import { UrgencyQuantityEditor } from './editors/UrgencyQuantityEditor';
import { UrgencyTextEditor } from './editors/UrgencyTextEditor';
import { UrgencyTimerEditor } from './editors/UrgencyTimerEditor';
import { VariantsEditor } from './editors/VariantsEditor';

// Shared editor content component
const EditorContent = ({
    formConfig,
    setFormConfig,
    editingSection,
    editingField,
    setEditingField,
    setEditingSection,
    handleLocationModeChangeWrapper,
    handleUpdateField,
    onLoadClick
}: any) => {
    return (
        <>
            {!editingSection ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-4 p-6 max-w-sm">
                        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-slate-800">Choose a Section to Edit</h3>
                            <p className="text-sm text-slate-500">
                                Use the menu to select a section to configure
                            </p>
                        </div>

                        {/* Divider with 'Or' */}
                        <div className="flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-slate-200"></div>
                            <span className="text-xs font-medium text-slate-400 uppercase">Or</span>
                            <div className="flex-1 h-px bg-slate-200"></div>
                        </div>

                        {/* Templates Button */}
                        <button
                            onClick={onLoadClick}
                            className="w-full flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:scale-[0.98] transition-all group"
                        >
                            <Sparkles size={18} className="text-white/90 group-hover:rotate-12 transition-transform" />
                            <span className="text-sm font-bold">Start with a Template</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-200">
                    {editingSection === 'sections_list' && (
                        <SectionsListEditor />
                    )}

                    {editingSection === 'header' && (
                        <HeaderEditor />
                    )}

                    {editingSection === 'packs_manager' && (
                        <PacksManager
                            offers={formConfig.offers || []}
                            onOffersChange={(newOffers: any) => setFormConfig({ ...formConfig, offers: newOffers })}
                        />
                    )}

                    {editingSection === 'shipping_manager' && (
                        <ShippingManager
                            shipping={formConfig.shipping || { standard: { home: 600, desk: 400 }, exceptions: [] }}
                            onShippingChange={(newShipping: any) => setFormConfig({ ...formConfig, shipping: newShipping })}
                            enableHomeDelivery={formConfig.enableHomeDelivery !== false}
                            enableDeskDelivery={formConfig.enableDeskDelivery !== false}
                            onDeliveryTypeChange={(type: string, enabled: boolean) => {
                                if (type === 'home') {
                                    setFormConfig({ ...formConfig, enableHomeDelivery: enabled });
                                } else {
                                    setFormConfig({ ...formConfig, enableDeskDelivery: enabled });
                                }
                            }}
                        />
                    )}

                    {editingSection === 'promo_code_manager' && (
                        <PromoCodeManager
                            codes={formConfig.promoCode?.codes || []}
                            onCodesChange={(newCodes: any) => setFormConfig({
                                ...formConfig,
                                promoCode: {
                                    ...formConfig.promoCode,
                                    codes: newCodes,
                                }
                            })}
                            enabled={formConfig.promoCode?.enabled || false}
                            required={formConfig.promoCode?.required || false}
                            onEnabledChange={(enabled: boolean) => setFormConfig({
                                ...formConfig,
                                promoCode: {
                                    ...formConfig.promoCode,
                                    enabled,
                                }
                            })}
                            onRequiredChange={(required: boolean) => setFormConfig({
                                ...formConfig,
                                promoCode: {
                                    ...formConfig.promoCode,
                                    required,
                                }
                            })}
                        />
                    )}

                    {editingSection === 'shipping' && !editingField && (
                        <ShippingEditor
                            handleLocationModeChangeWrapper={handleLocationModeChangeWrapper}
                            handleUpdateField={handleUpdateField}
                        />
                    )}

                    {editingSection === 'global_design' && (
                        <GlobalDesignEditor />
                    )}

                    {editingSection === 'variants' && (
                        <VariantsEditor />
                    )}

                    {editingSection === 'offers' && (
                        <OffersEditor setEditingSection={setEditingSection} />
                    )}

                    {editingSection === 'promoCode' && (
                        <PromoCodeEditor setEditingSection={setEditingSection} />
                    )}

                    {editingSection === 'summary' && (
                        <SummaryEditor />
                    )}

                    {editingSection === 'delivery' && (
                        <DeliveryEditor />
                    )}

                    {editingSection === 'cta' && (
                        <CtaEditor />
                    )}

                    {editingSection === 'urgencyText' && (
                        <UrgencyTextEditor />
                    )}

                    {editingSection === 'urgencyQuantity' && (
                        <UrgencyQuantityEditor />
                    )}

                    {editingSection === 'urgencyTimer' && (
                        <UrgencyTimerEditor />
                    )}

                    {editingSection === 'trustBadges' && (
                        <TrustBadgesEditor />
                    )}

                    {editingSection === 'thank_you' && (
                        <ThankYouEditor />
                    )}

                    {editingSection === 'addons' && (
                        <AddonsEditor />
                    )}
                </div>
            )}
        </>
    );
};

interface BuilderEditorProps {
    editingSection: string | null;
    editingField: string | null;
    setEditingSection: (section: string | null) => void;
    setEditingField: (field: string | null) => void;
    formConfig: any;
    setFormConfig: (config: any) => void;
    handleLocationModeChangeWrapper: (mode: string) => void;
    handleUpdateField: (key: string, fieldProps: any) => void;
    onLoadClick?: () => void;
}

export const BuilderEditor = ({
    editingSection,
    editingField,
    setEditingSection,
    setEditingField,
    formConfig,
    setFormConfig,
    handleLocationModeChangeWrapper,
    handleUpdateField,
    onLoadClick
}: BuilderEditorProps) => {
    return (
        <div className="flex-1 flex flex-col min-w-0 bg-white h-full">


            <div className="flex-1 overflow-y-auto p-6 bg-[#fafbfc] custom-scroll">
                <EditorContent
                    formConfig={formConfig}
                    setFormConfig={setFormConfig}
                    editingSection={editingSection}
                    editingField={editingField}
                    setEditingField={setEditingField}
                    setEditingSection={setEditingSection}
                    handleLocationModeChangeWrapper={handleLocationModeChangeWrapper}
                    handleUpdateField={handleUpdateField}
                    onLoadClick={onLoadClick}
                />
            </div>
        </div>
    );
};


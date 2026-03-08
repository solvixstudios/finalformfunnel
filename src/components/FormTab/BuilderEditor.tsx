
import { MainMenu } from './editors/MainMenu';
import { PacksSelector } from './editors/PacksSelector';
import { PromoCodeSelector } from './editors/PromoCodeSelector';
import { ShippingSelector } from './editors/ShippingSelector';

import { WhatsAppEditor } from './editors/WhatsAppEditor';
import { GoogleSheetsEditor } from './editors/GoogleSheetsEditor';
import { MetaPixelEditor } from './editors/MetaPixelEditor';
import { TikTokPixelEditor } from './editors/TikTokPixelEditor';

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
import { ShopifyEditor } from './editors/ShopifyEditor';
import { ComingSoonEditor } from './editors/ComingSoonEditor';

// Configuration map for editors
const EDITORS_MAP: Record<string, React.FC<unknown>> = {
    sections_list: SectionsListEditor,
    header: HeaderEditor,
    shipping: ShippingEditor, // Handled partly custom below due to props
    global_design: GlobalDesignEditor,
    variants: VariantsEditor,
    offers: OffersEditor, // Handled partly custom due to props
    promoCode: PromoCodeEditor, // Handled partly custom due to props
    summary: SummaryEditor,
    delivery: DeliveryEditor,
    cta: CtaEditor,
    urgencyText: UrgencyTextEditor,
    urgencyTimer: UrgencyTimerEditor,
    trustBadges: TrustBadgesEditor,
    thank_you: ThankYouEditor,
    whatsapp: WhatsAppEditor,
    google_sheets: GoogleSheetsEditor,
    meta_pixel: MetaPixelEditor,
    tiktok_pixel: TikTokPixelEditor,
    urgencyQuantity: UrgencyQuantityEditor,
    shopify: ShopifyEditor,
    woocommerce: ComingSoonEditor,
    webhook: ComingSoonEditor,
    maystro: ComingSoonEditor,
    zr_delivery: ComingSoonEditor,
    yalidine: ComingSoonEditor,
    anderson: ComingSoonEditor,
    ecommanager: ComingSoonEditor,
};

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

    // 1. Managers (Global Rules Selectors)
    if (editingSection === 'packs_manager') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <PacksSelector formConfig={formConfig} setFormConfig={setFormConfig} />
            </div>
        );
    }

    if (editingSection === 'shipping_manager') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <ShippingSelector formConfig={formConfig} setFormConfig={setFormConfig} />
            </div>
        );
    }

    if (editingSection === 'promo_code_manager') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <PromoCodeSelector formConfig={formConfig} setFormConfig={setFormConfig} />
            </div>
        );
    }

    // 2. Custom Prop Editors
    if (editingSection === 'shipping' && !editingField) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <ShippingEditor
                    handleLocationModeChangeWrapper={handleLocationModeChangeWrapper}
                    handleUpdateField={handleUpdateField}
                />
            </div>
        );
    }

    if (editingSection === 'offers') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <OffersEditor setEditingSection={setEditingSection} />
            </div>
        );
    }

    if (editingSection === 'promoCode') {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <PromoCodeEditor setEditingSection={setEditingSection} />
            </div>
        );
    }

    // 3. Standard Editors via Map
    const StandardEditor = EDITORS_MAP[editingSection];
    if (StandardEditor) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <StandardEditor />
            </div>
        );
    }

    // 4. Default / Empty State -> Main Menu
    return (
        <div className="animate-in fade-in zoom-in-95 duration-300">

            <MainMenu onLoadClick={onLoadClick} />
        </div>
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
        <div className="w-full lg:w-[480px] shrink-0 h-full bg-[#F8F5F1] flex flex-col relative overflow-hidden border-r border-slate-200 shadow-xl z-20">
            <div className="flex-1 overflow-y-auto custom-scroll w-full">
                <div className="p-5 sm:p-6 lg:p-8 w-full">
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
        </div>
    );
};


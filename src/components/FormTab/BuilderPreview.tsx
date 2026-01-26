import { Sparkles } from 'lucide-react';
import { FormPreview } from './preview/FormPreview';

interface BuilderPreviewProps {
    formConfig: any;
    previewWidth: number | string;
    containerRef?: any;
    onLoadClick?: () => void;
    onSaveClick?: () => void;
    canSave?: boolean;
    showSaveSuccess?: boolean;
}

export const BuilderPreview = ({
    formConfig,
    previewWidth,
    containerRef,
    onLoadClick,
    onSaveClick,
    canSave,
    showSaveSuccess
}: BuilderPreviewProps) => {
    return (
        <div className="flex h-full">
            {/* Side Navigation Removed - Moved to FormTab */}

            {/* Preview Area with Dots Background */}
            <div
                ref={containerRef}
                className="flex-1 bg-slate-50/50 flex flex-col items-center p-8 overflow-hidden relative"
                style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            >
                {/* Preview Header - MOVED TO TOP APP BAR */}

                {/* Phone Frame */}
                <div
                    className="w-full bg-white rounded-[2.5rem] shadow-2xl border-[8px] border-slate-900 overflow-hidden relative flex flex-col ring-1 ring-black/10 transition-all duration-300 mx-auto"
                    style={{
                        width: 'min(100%, 400px)',
                        aspectRatio: '9/19.5',
                        maxHeight: 'calc(100vh - 180px)'
                    }}
                >
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-50"></div>

                    {/* Status Bar Spacer */}
                    <div className="h-6 shrink-0 bg-white"></div>

                    {/* Form Preview */}
                    <div className="flex-1 overflow-y-auto relative flex flex-col no-scrollbar">
                        <FormPreview config={formConfig} offers={formConfig.offers || []} shipping={formConfig.shipping} />
                    </div>

                    {/* Bottom Indicator */}
                    <div className="h-6 shrink-0 bg-white flex items-center justify-center">
                        <div className="w-20 h-1 bg-slate-200 rounded-full"></div>
                    </div>
                </div>
                {/* Floating "Change Template" Pill */}
                <button
                    onClick={onLoadClick}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:scale-95 transition-all group"
                >
                    <Sparkles size={18} className="text-white/90 group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-bold tracking-wider uppercase text-white">Templates</span>
                </button>
            </div>
        </div>
    );
};

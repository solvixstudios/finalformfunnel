import { FormPreview } from './preview/FormPreview';

interface BuilderPreviewProps {
    formConfig: any;
    previewWidth: number | string;
    containerRef?: any;
}

export const BuilderPreview = ({
    formConfig,
    previewWidth,
    containerRef,
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
            </div>
        </div>
    );
};

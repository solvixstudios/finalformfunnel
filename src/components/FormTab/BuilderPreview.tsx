import { FormPreview } from './preview/FormPreview';

interface BuilderPreviewProps {
    formConfig: unknown;
    previewWidth: number | string;
    containerRef?: unknown;
}

export const BuilderPreview = ({
    formConfig,
    previewWidth,
    containerRef,
}: BuilderPreviewProps) => {
    return (
        <div className="flex h-full">
            {/* Preview Area with Dots Background */}
            <div
                ref={containerRef}
                className="flex-1 bg-slate-50/50 flex flex-col items-center justify-center p-4 lg:p-6 overflow-hidden relative"
                style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            >
                {/* Phone Frame Container - Responsive sizing */}
                <div className="w-full max-w-[320px] lg:max-w-[360px] h-full flex items-center justify-center">
                    <div
                        className="w-full bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl border-[6px] lg:border-[8px] border-slate-900 overflow-hidden relative flex flex-col ring-1 ring-black/10 transition-all duration-300"
                        style={{
                            height: 'min(calc(100% - 1rem), 640px)',
                            maxHeight: 'calc(100vh - 140px)',
                        }}
                    >
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 lg:w-28 h-5 lg:h-6 bg-slate-900 rounded-b-xl lg:rounded-b-2xl z-50"></div>

                        {/* Status Bar Spacer */}
                        <div className="h-5 lg:h-6 shrink-0 bg-white"></div>

                        {/* Form Preview */}
                        <div className="flex-1 overflow-y-auto relative flex flex-col no-scrollbar">
                            <FormPreview config={formConfig} offers={formConfig.offers || []} shipping={formConfig.shipping} />
                        </div>

                        {/* Bottom Indicator */}
                        <div className="h-5 lg:h-6 shrink-0 bg-white flex items-center justify-center">
                            <div className="w-16 lg:w-20 h-1 bg-slate-200 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import { CheckCircle, FileText, MessageCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DEFAULT_FORM_CONFIG } from '../../../../lib/constants';
import type { Language } from '../../types';

interface ThankYouPopupProps {
    config: typeof DEFAULT_FORM_CONFIG;
    lang: Language;
    onClose: () => void;
    fixed?: boolean;
}

export const ThankYouPopup = ({ config, lang, onClose, fixed = false }: ThankYouPopupProps) => {
    // Portal Logic
    const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        if (fixed) {
            // Helper to find or create container
            const getOrCreateContainer = () => {
                // 1. Try Global Object (Ideal path)
                const globalRoot = (window as any).FinalFormGlobal?.root;
                if (globalRoot) return globalRoot;

                // 2. Try finding the overlay container (Top Level Shadow DOM)
                const overlayContainer = document.getElementById('finalform-overlay-container');
                if (overlayContainer && overlayContainer.shadowRoot) {
                    const portalRoot = overlayContainer.shadowRoot.getElementById('finalform-portal-root');
                    if (portalRoot) return portalRoot;
                }

                // 3. Fallback: Try main container (Legacy/Inline)
                const host = document.getElementById('finalform-overlay-container'); // Fallback compatibility
                if (host && host.shadowRoot) {
                    const internalRoot = host.shadowRoot.getElementById('finalform-portal-root');
                    if (internalRoot) return internalRoot;
                }

                // 4. Fallback: Create simple overlay in body (Dev mode / Failure)
                let el = document.getElementById('finalform-overlay-container-fallback');
                if (!el) {
                    el = document.createElement('div');
                    el.id = 'finalform-overlay-container-fallback';
                    el.style.position = 'fixed';
                    el.style.top = '0';
                    el.style.left = '0';
                    el.style.width = '100vw';
                    el.style.height = '100vh';
                    el.style.pointerEvents = 'none';
                    el.style.zIndex = '2147483647';
                    document.body.appendChild(el);
                }
                return el;
            };

            setPortalContainer(getOrCreateContainer());

            // Lock Scroll
            document.body.style.overflow = 'hidden';
        }

        return () => {
            if (fixed) {
                document.body.style.overflow = '';
            }
        };
    }, [fixed]);

    const content = (() => {
        const positionClass = fixed && portalContainer ? 'absolute' : (fixed ? 'fixed' : 'absolute');
        return (
            <div className={`${positionClass} inset-0 z-[60] flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-300 pointer-events-auto`} style={{ borderRadius: fixed ? '0' : '16px', backgroundColor: config.formBackground || '#ffffff' }}>
                {/* Close Button - Top Right */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full transition-all"
                    style={{
                        backgroundColor: `${config.accentColor}15`,
                        color: config.textColor || '#64748b'
                    }}
                    aria-label="Fermer"
                >
                    <X size={20} />
                </button>

                {/* Success Icon with improved visual hierarchy */}
                <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mb-5 shadow-2xl animate-in zoom-in-95 duration-500"
                    style={{
                        background: `linear-gradient(135deg, ${config.accentColor}20 0%, ${config.accentColor}10 100%)`,
                        border: `3px solid ${config.accentColor}30`,
                        color: config.accentColor
                    }}
                >
                    <CheckCircle size={48} strokeWidth={2.5} className="drop-shadow-lg" />
                </div>

                {/* Title with better spacing */}
                <h2
                    className="text-2xl font-black text-center mb-3 leading-tight tracking-tight"
                    style={{ color: config.headingColor || config.textColor || '#0f172a' }}
                >
                    {config.thankYou?.title?.[lang] || "Merci !"}
                </h2>

                {/* Message with improved readability */}
                <div
                    className="rounded-xl p-5 mb-6 max-w-[300px] border"
                    style={{
                        backgroundColor: `${config.accentColor}08`,
                        borderColor: config.inputBorderColor || '#f1f5f9'
                    }}
                >
                    <p
                        className="text-sm font-medium text-center leading-relaxed whitespace-pre-line"
                        style={{ color: config.textColor || '#334155' }}
                    >
                        {config.thankYou?.message?.[lang] || "Votre commande a été reçue avec succès."}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="w-full max-w-[300px] space-y-3">
                    {/* View Order Summary Button */}
                    <button
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                        style={{
                            backgroundColor: `${config.accentColor}15`,
                            color: config.textColor || '#334155'
                        }}
                    >
                        <FileText size={18} />
                        {config.thankYou?.summaryButton?.[lang] || (lang === 'ar' ? 'عرض ملخص الطلب' : 'Voir le résumé')}
                    </button>

                    {/* WhatsApp Confirmation Button */}
                    <button
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                        style={{
                            backgroundColor: '#25D366',
                            boxShadow: '0 8px 20px -5px rgba(37, 211, 102, 0.4)'
                        }}
                    >
                        <MessageCircle size={18} />
                        {config.thankYou?.whatsappButton?.[lang] || (lang === 'ar' ? 'تأكيد عبر واتساب' : 'Confirmer via WhatsApp')}
                    </button>
                </div>
            </div>
        );
    })();

    if (fixed && portalContainer) {
        return createPortal(content, portalContainer);
    }

    return content;
};

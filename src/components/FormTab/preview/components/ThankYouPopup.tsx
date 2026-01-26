import { priceToLetters } from '@/lib/utils/priceToLetters';
import { CheckCircle, MessageCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DEFAULT_FORM_CONFIG } from '../../../../lib/constants';
import type { Language } from '../../types';

interface ThankYouPopupProps {
    config: typeof DEFAULT_FORM_CONFIG & {
        thankYou?: {
            priceInLetters?: {
                enabled: boolean;
                mode: 'dinars' | 'centimes';
            };
        };
    };
    lang: Language;
    onClose: () => void;
    fixed?: boolean;
    orderData?: any;
}

export const ThankYouPopup = ({ config, lang, onClose, fixed = false, orderData }: ThankYouPopupProps) => {
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

    // WhatsApp Logic
    const handleWhatsAppClick = () => {
        // Resolve number: Try profile ID first, then fallback to legacy number, then store/global default
        // For now, we use the legacy field or text config if profiles aren't fully wired in runtime
        let phone = config.thankYou?.whatsappNumber || "";

        // TODO: In production, lookup `config.thankYou.selectedWhatsappProfileId` in the `integrations` context
        // const profile = integrations.whatsappProfiles.find(p => p.id === config.thankYou.selectedWhatsappProfileId);
        // if (profile) phone = profile.number;

        if (!phone) {
            // Fallback if no number is configured but button is shown (prevent broken link)
            console.warn("No WhatsApp number configured");
            return;
        }

        // Clean number
        phone = phone.replace(/[^\d+]/g, '');

        // Prepare Message
        let message = lang === 'ar' ? 'أريد تأكيد طلبي:\n' : 'Je veux confirmer ma commande:\n';

        if (orderData) {
            const productLine = orderData.items?.map((i: any) => `- ${i.title} (${i.variant}) x${i.quantity}`).join('\n');
            message += `\n${productLine}`;
            message += `\nTotal: ${orderData.totalPrice} DZD`;
            message += `\n\nNom: ${orderData.name}`;
            message += `\nWilaya: ${orderData.wilaya}`;
            if (orderData.commune) message += `\nCommune: ${orderData.commune}`;
            message += `\nTéléphone: ${orderData.phone}`;
        }

        message += `\n\nURL: ${window.location.href}`;

        // Deep Link Strategy: Try native app scheme first, fallback to web
        // On mobile, whatsapp:// works better. On desktop, web.whatsapp.com or wa.me is preferred.
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            window.location.href = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
        } else {
            window.open(`https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`, '_blank');
        }
    };

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

                <div
                    className="rounded-xl p-5 mb-4 max-w-[400px] border w-full text-left"
                    style={{
                        backgroundColor: `${config.accentColor}05`,
                        borderColor: config.inputBorderColor || '#f1f5f9'
                    }}
                >
                    <p
                        className="text-sm font-medium text-center leading-relaxed whitespace-pre-line mb-4"
                        style={{ color: config.textColor || '#334155' }}
                    >
                        {config.thankYou?.message?.[lang] || "Votre commande a été reçue avec succès."}
                    </p>

                    {/* Customer & Delivery Info */}
                    {orderData && (
                        <div className="text-xs space-y-3 pt-3 border-t border-slate-200/60" style={{ color: config.textColor || '#334155' }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block font-bold opacity-60 uppercase text-[10px]">Client</span>
                                    <p className="font-semibold">{orderData.name}</p>
                                    <p dir="ltr" className="text-right-auto">{orderData.phone}</p>
                                </div>
                                <div>
                                    <span className="block font-bold opacity-60 uppercase text-[10px]">{config.translations['shippingLabel']?.[lang] || 'Livraison'}</span>
                                    <p className="font-semibold">
                                        {orderData.wilaya && `${orderData.wilaya}`}
                                        {orderData.commune && ` - ${orderData.commune}`}
                                    </p>
                                    <p className="opacity-80">
                                        {orderData.shippingType === 'home'
                                            ? (config.translations['home']?.[lang] || 'À Domicile')
                                            : (config.translations['desk']?.[lang] || 'À Bureau')}
                                    </p>
                                </div>
                            </div>
                            {orderData.address && (
                                <div>
                                    <span className="block font-bold opacity-60 uppercase text-[10px]">Adresse</span>
                                    <p>{orderData.address}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Order Summary */}
                    {orderData && (
                        <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs space-y-2">
                            {orderData.items?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between font-bold opacity-80">
                                    <span>{item.quantity}x {item.title}</span>
                                    <span>{item.variant}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-black text-sm mt-2 pt-2 border-t border-slate-200/60" style={{ color: config.accentColor }}>
                                <span>Total</span>
                                <div className="flex flex-col items-end">
                                    <span>{orderData.totalPrice} DZD</span>
                                    {(config as any).thankYou?.priceInLetters?.enabled && (
                                        <span className="text-[10px] text-gray-500 font-medium capitalize">
                                            {priceToLetters(orderData.totalPrice, lang, (config as any).thankYou.priceInLetters.mode)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Next Steps */}
                <div className="text-xs text-center text-slate-400 mb-6 max-w-[300px]">
                    <p>{lang === 'ar' ? 'سيتصل بك فريقنا قريباً لتأكيد الطلب.' : 'Notre équipe vous contactera bientôt pour confirmer la commande.'}</p>
                </div>

                {/* Action Buttons */}
                <div className="w-full max-w-[300px] space-y-3">
                    {/* View Order Summary Button (Optional now if summary is shown above, but kep for config compat) */}
                    {/* <button
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                        style={{
                            backgroundColor: `${config.accentColor}15`,
                            color: config.textColor || '#334155'
                        }}
                    >
                        <FileText size={18} />
                        {config.thankYou?.summaryButton?.[lang] || (lang === 'ar' ? 'عرض ملخص الطلب' : 'Voir le résumé')}
                    </button> */}

                    {/* WhatsApp Confirmation Button */}
                    {config.thankYou?.enableWhatsApp && (
                        <button
                            onClick={handleWhatsAppClick}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-white rounded-xl text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg animate-in slide-in-from-bottom-2 duration-500 delay-100"
                            style={{
                                backgroundColor: '#25D366',
                                boxShadow: '0 8px 20px -5px rgba(37, 211, 102, 0.4)'
                            }}
                        >
                            <MessageCircle size={18} />
                            {config.thankYou?.whatsappButton?.[lang] || (lang === 'ar' ? 'تأكيد عبر واتساب' : 'Confirmer via WhatsApp')}
                        </button>
                    )}
                </div>
            </div>
        );
    })();

    if (fixed && portalContainer) {
        return createPortal(content, portalContainer);
    }

    return content;
};

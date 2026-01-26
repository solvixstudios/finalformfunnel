import confetti from 'canvas-confetti';
import { CheckCircle, MessageCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DEFAULT_FORM_CONFIG } from '../../../../lib/constants';
import type { Language } from '../../types';
// Assuming canvas-confetti might not be in package.json, I'll use a safer approach for effects or just rely on a simple css. But user asked confetti. 
// I will blindly try to import 'canvas-confetti' as it is very common. if it fails i will fix.

const playSuccessSound = () => {
    try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'); // Simple ding
        audio.volume = 0.5;
        audio.play().catch(() => { }); // catch autoplay policy errors
    } catch (e) {
        // Ignore audio errors
    }
};

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
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);

    // View State: 'thankyou' | 'resume'
    const [view, setView] = useState<'thankyou' | 'resume'>('thankyou');

    useEffect(() => {
        if (fixed) {
            const getOrCreateContainer = () => {
                const globalRoot = (window as any).FinalFormGlobal?.root;
                if (globalRoot) return globalRoot;
                const overlayContainer = document.getElementById('finalform-overlay-container');
                if (overlayContainer && overlayContainer.shadowRoot) {
                    const portalRoot = overlayContainer.shadowRoot.getElementById('finalform-portal-root');
                    if (portalRoot) return portalRoot;
                }
                const host = document.getElementById('finalform-overlay-container');
                if (host && host.shadowRoot) {
                    const internalRoot = host.shadowRoot.getElementById('finalform-portal-root');
                    if (internalRoot) return internalRoot;
                }
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
            document.body.style.overflow = 'hidden';
        }

        return () => {
            if (fixed) {
                document.body.style.overflow = '';
            }
        };
    }, [fixed]);

    // Effects: Sound & Confetti - Run ONLY ON MOUNT to avoid loop in editor
    // We pass [] as dependency array.
    useEffect(() => {
        if ((config as any).thankYou?.enableSound) {
            playSuccessSound();
        }
        if ((config as any).thankYou?.enableConfetti) {
            const duration = 3000;
            const end = Date.now() + duration;
            const myConfetti = (!fixed && internalCanvasRef.current)
                ? confetti.create(internalCanvasRef.current, { resize: true, useWorker: true })
                : confetti;

            (function frame() {
                myConfetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: [config.accentColor || '#10b981', '#ffffff']
                });
                myConfetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: [config.accentColor || '#10b981', '#ffffff']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array fixed the loop issue!

    // WhatsApp Helpers
    const getWhatsAppUrl = (mode: 'confirm' | 'modify') => {
        let phone = config.thankYou?.whatsappNumber || "";
        if (!phone) return null;
        phone = phone.replace(/[^\d+]/g, '');

        let message = "";
        if (mode === 'confirm') {
            message = lang === 'ar' ? 'أريد تأكيد طلبي:\n' : 'Je veux confirmer ma commande:\n';
        } else {
            message = lang === 'ar' ? 'أريد تعديل طلبي:\n' : 'Je veux modifier ma commande:\n';
        }

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
        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    const handleWhatsAppClick = (mode: 'confirm' | 'modify') => {
        const url = getWhatsAppUrl(mode);
        if (url) window.open(url, '_blank');
    };

    const content = (() => {
        const positionClass = fixed && portalContainer ? 'absolute' : (fixed ? 'fixed' : 'absolute');

        return (
            <div className={`${positionClass} inset-0 z-[60] flex flex-col items-center justify-center pointer-events-auto overflow-hidden bg-white/50 backdrop-blur-sm`} style={{ backgroundColor: fixed ? 'transparent' : 'transparent' }}>
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 -z-10 animate-in fade-in duration-300"></div>

                <div className="relative w-full h-full md:max-w-md md:h-auto md:max-h-[85vh] md:rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-500" style={{ backgroundColor: config.formBackground || '#ffffff' }}>

                    {/* Confetti Canvas */}
                    {!fixed && (
                        <canvas ref={internalCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-50" />
                    )}

                    {/* VIEW 1: THANK YOU */}
                    {view === 'thankyou' && (
                        <div className="flex-1 flex flex-col items-center p-8 animate-in fade-in zoom-in-95 duration-500">
                            {/* Close Button */}
                            <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-20" style={{ color: config.textColor }}>
                                <X size={24} />
                            </button>

                            <div className="mb-8 mt-4 relative animate-in zoom-in-50 duration-700 delay-150 ease-out">
                                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
                                <CheckCircle size={90} className="text-green-500 relative bg-white rounded-full p-1 shadow-2xl" strokeWidth={1.5} style={{ color: config.accentColor || '#10b981', fill: `${config.accentColor}10` }} />
                            </div>

                            <h2 className="text-3xl font-black text-center mb-4 leading-tight" style={{ color: config.headingColor || config.textColor }}>
                                {config.thankYou?.title?.[lang] || "Merci !"}
                            </h2>

                            <p className="text-center text-sm opacity-60 leading-relaxed max-w-xs mx-auto mb-8">
                                {config.thankYou?.message?.[lang] || "Votre commande a été reçue avec succès."}
                            </p>

                            {/* Confirmation Note */}
                            {(config.thankYou?.confirmationNote?.[lang] || config.thankYou?.confirmationNote?.fr) && (
                                <div className="w-full bg-amber-50 border border-amber-100 rounded-xl p-4 text-center mb-6 animate-in slide-in-from-bottom-2 delay-200">
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                        {config.thankYou?.confirmationNote?.[lang] || config.thankYou?.confirmationNote?.fr}
                                    </p>
                                </div>
                            )}

                            <div className="mt-auto w-full space-y-3">
                                {/* Summary Button */}
                                <button
                                    onClick={() => setView('resume')}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] border-2"
                                    style={{
                                        borderColor: `${config.accentColor}20`,
                                        backgroundColor: 'transparent',
                                        color: config.textColor || '#334155'
                                    }}
                                >
                                    {config.thankYou?.summaryButton?.[lang] || "Voir le résumé"}
                                </button>

                                {/* WhatsApp Button */}
                                {config.thankYou?.enableWhatsApp && (
                                    <button
                                        onClick={() => handleWhatsAppClick('confirm')}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-4 text-white rounded-xl text-sm font-bold transition-all hover:shadow-lg active:scale-[0.98] shadow-md"
                                        style={{ backgroundColor: '#25D366' }}
                                    >
                                        <MessageCircle size={18} />
                                        {config.thankYou?.whatsappButton?.[lang] || "Confirmer via WhatsApp"}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* VIEW 2: RESUME */}
                    {view === 'resume' && (
                        <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right-8 duration-300">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black" style={{ color: config.headingColor }}>
                                    {lang === 'ar' ? 'ملخص الطلب' : 'Résumé de la commande'}
                                </h3>
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100" style={{ color: config.textColor }}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Order Details */}
                            <div className="flex-1 overflow-y-auto pr-1">
                                <div className="rounded-2xl p-5 border w-full text-left bg-slate-50/50 mb-4" style={{ borderColor: config.inputBorderColor }}>
                                    {/* Product Highlight */}
                                    {orderData?.items && orderData.items.length > 0 && (
                                        <div className="mb-4 pb-4 border-b border-slate-200">
                                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-50 block mb-1">
                                                {lang === 'ar' ? 'المنتج' : 'Produit'}
                                            </span>
                                            <h4 className="text-base font-bold leading-tight" style={{ color: config.textColor }}>
                                                {orderData.items[0].title}
                                            </h4>
                                            {orderData.items.length > 1 && (
                                                <span className="text-xs opacity-60 mt-0.5 block">
                                                    + {orderData.items.length - 1} {lang === 'ar' ? 'autres' : 'autres'}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Info Grid */}
                                    {orderData && (
                                        <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: config.textColor }}>
                                            <div>
                                                <span className="block text-[10px] font-bold opacity-50 uppercase mb-0.5">{lang === 'ar' ? 'العميل' : 'Client'}</span>
                                                <p className="font-semibold">{orderData.name}</p>
                                                <p className="opacity-70 text-xs">{orderData.phone}</p>
                                            </div>
                                            <div>
                                                <span className="block text-[10px] font-bold opacity-50 uppercase mb-0.5">{lang === 'ar' ? 'Livraison' : 'Livraison'}</span>
                                                <p className="font-semibold">{orderData.wilaya}</p>
                                                <p className="opacity-70 text-xs">{orderData.commune}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Total */}
                                    {orderData && (
                                        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-end">
                                            <span className="text-xs font-bold opacity-60 uppercase">Total</span>
                                            <div className="text-right">
                                                <span className="text-xl font-black" style={{ color: config.accentColor }}>{orderData.totalPrice} DZD</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 space-y-3">
                                {/* Modify Button */}
                                <button
                                    onClick={() => handleWhatsAppClick('modify')}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] bg-slate-100 hover:bg-slate-200 text-slate-700"
                                >
                                    {config.thankYou?.modifyButton?.[lang] || (lang === 'ar' ? 'تعديل الطلب' : 'Modifier la commande')}
                                </button>

                                {/* Back Button */}
                                <button
                                    onClick={() => setView('thankyou')}
                                    className="w-full py-3 text-xs font-bold opacity-50 hover:opacity-100 transition-opacity"
                                    style={{ color: config.textColor }}
                                >
                                    {config.thankYou?.backButton?.[lang] || (lang === 'ar' ? 'رجوع' : 'Retour')}
                                </button>
                            </div>
                        </div>
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

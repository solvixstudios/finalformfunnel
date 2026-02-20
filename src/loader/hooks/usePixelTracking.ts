import { useEffect, useMemo, useRef } from 'react';
import type { Product } from '../FormLoader';

import type { FormConfig, MetaPixelProfile, TikTokPixelProfile } from '@/types/form';

interface PixelTrackingParams {
    config: FormConfig;
    product: Product;
    previewMode?: boolean;
    formData: Record<string, unknown>;
    basePrice: number;
}

export function usePixelTracking({ config, product, previewMode = false, formData, basePrice }: PixelTrackingParams) {
    const tiktokData = useMemo(() => {
        let data = config.addons?.tiktokPixelData || [];
        if (data.length === 0) {
            const legacyId =
                config.addons?.tiktokPixelId ||
                (config as Record<string, unknown>).tiktokPixelId ||
                (config.addons as Record<string, unknown>)?.tiktokPixel ||
                (config as Record<string, unknown>).tiktokPixel ||
                null;

            if (legacyId) {
                data = [{ pixelId: legacyId as string }];
            }
        }
        return data;
    }, [config]);

    // Initialization Effect
    useEffect(() => {
        const pixelData = config.addons?.pixelData || [];
        const pixelsToInit = pixelData.length > 0 ? pixelData : (config.pixels || []);

        if (pixelsToInit.length > 0 && !previewMode) {
            if (!(window as any).fbq) {
                const f = ((window as any).fbq = function () {
                    // eslint-disable-next-line prefer-rest-params
                    const args = arguments;
                    const fq = (f as unknown as { callMethod?: Function; queue: unknown[] });
                    fq.callMethod ? fq.callMethod.apply(f, args) : fq.queue.push(args)
                }) as unknown as Record<string, unknown>;
                if (!(window as any)._fbq) (window as any)._fbq = f;
                f.push = f;
                f.loaded = true;
                f.version = '2.0';
                f.queue = [];
                const t = document.createElement('script');
                t.async = true;
                t.src = 'https://connect.facebook.net/en_US/fbevents.js';
                const s = document.getElementsByTagName('script')[0];
                s.parentNode!.insertBefore(t, s);
            }

            pixelsToInit.forEach((p: MetaPixelProfile) => {
                const winObj = window as unknown as Record<string, unknown>;
                if (winObj.fbq) {
                    (winObj.fbq as Function)('init', p.pixelId);
                }
            });

            const eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            (window as any)._ff_event_id = eventId;

            const winObj = window as unknown as Record<string, unknown>;
            if (winObj.fbq) {
                (winObj.fbq as Function)('track', 'PageView', {}, { eventID: eventId });
            }

            if (product && winObj.fbq) {
                (winObj.fbq as Function)('track', 'ViewContent', {
                    content_type: 'product',
                    content_ids: [product.id],
                    content_name: product.title,
                    currency: 'DZD',
                    value: basePrice || 0,
                }, { eventID: eventId });
            }
        }

        if (tiktokData.length > 0 && !previewMode) {
            if (!(window as any).ttq) {
                (function (w: any, d: any, t: string) {
                    w.TiktokAnalyticsObject = t;
                    var ttq = w[t] = w[t] || [];
                    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
                    ttq.setAndDefer = function (t: any, e: any) {
                        t[e] = function () {
                            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
                        };
                    };
                    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
                    ttq.instance = function (t: any) {
                        for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
                        return e;
                    };
                    ttq.load = function (e: any, n: any) {
                        var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
                        ttq._i = ttq._i || {};
                        ttq._i[e] = [];
                        ttq._i[e]._u = r;
                        ttq._t = ttq._t || {};
                        ttq._t[e] = +new Date();
                        ttq._o = ttq._o || {};
                        ttq._o[e] = n || {};
                        var o = d.createElement("script");
                        o.type = "text/javascript";
                        o.async = true;
                        o.src = r + "?sdkid=" + e + "&lib=" + t;
                        var a = d.getElementsByTagName("script")[0];
                        if (a && a.parentNode) {
                            a.parentNode.insertBefore(o, a);
                        }
                    };
                })(window, document, 'ttq');
            }

            tiktokData.forEach((p: TikTokPixelProfile) => {
                if ((window as any).ttq) {
                    (window as any).ttq.load(p.pixelId);
                    (window as any).ttq.page();
                }
            });

            if (product && (window as any).ttq) {
                (window as any).ttq.track('ViewContent', {
                    content_type: 'product',
                    content_id: String(product.id),
                    content_name: product.title,
                    price: basePrice,
                    value: basePrice,
                    currency: 'DZD',
                }, { event_id: (window as any)._ff_event_id });
            }
        }
    }, [config, product, previewMode, basePrice, tiktokData]);

    const hasInitiatedCheckout = useRef(false);

    useEffect(() => {
        const phoneRegex = /^(05|06|07)[0-9]{8}$/;
        const isValidPhone = formData.phone && phoneRegex.test(String(formData.phone));

        if (isValidPhone && !hasInitiatedCheckout.current && !previewMode && product) {
            console.log("FinalForm: Valid Phone - Firing InitiateCheckout");

            const pixelData = config.addons?.pixelData || config.pixels || [];
            if (pixelData.length > 0 && (window as any).fbq) {
                const eventId = (window as any)._ff_event_id;
                try {
                    (window as any).fbq('track', 'InitiateCheckout', {
                        content_type: 'product',
                        content_ids: [product.id],
                        content_name: product.title,
                        currency: 'DZD',
                        value: basePrice || 0,
                        num_items: formData.quantity
                    }, { eventID: eventId });
                } catch (e) {
                    console.warn('FinalForm: Meta InitiateCheckout Error', e);
                }
            }

            if (tiktokData.length > 0 && (window as any).ttq) {
                const eventId = (window as any)._ff_event_id;
                try {
                    (window as any).ttq.track('InitiateCheckout', {
                        content_type: 'product',
                        content_id: String(product.id),
                        content_name: product.title,
                        quantity: formData.quantity,
                        price: basePrice || 0,
                        value: (basePrice || 0) * (Number(formData.quantity) || 1),
                        currency: 'DZD',
                    }, { event_id: eventId });
                } catch (e) {
                    console.warn('FinalForm: TikTok InitiateCheckout Error', e);
                }
            }

            hasInitiatedCheckout.current = true;
        }
    }, [formData.phone, config, product, formData.quantity, previewMode, basePrice, tiktokData]);

    return { tiktokData };
}

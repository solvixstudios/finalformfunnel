/**
 * FormPreview - Refactored Version
 * Uses FormLoader internally for 100% visual parity.
 */

import { FormLoader } from '@/loader/FormLoader';
import { useFormStore } from '@/stores';
import { Database, Palette, Settings2, Tag, Ticket, Truck } from 'lucide-react';
import type { FormPreviewProps } from '../types';
import { PreviewSectionWrapper } from './components/PreviewSectionWrapper';

export const FormPreview = ({ config, offers, shipping }: FormPreviewProps) => {
    const setEditingSection = useFormStore((state) => state.setEditingSection);

    const getActions = (sectionId: string) => {
        switch (sectionId) {
            case 'header':
                return [{ label: 'Edit Header', icon: <Settings2 size={14} />, onClick: () => setEditingSection('header') }];
            case 'variants':
                return [{ label: 'Edit Variants', icon: <Tag size={14} />, onClick: () => setEditingSection('variants') }];
            case 'shipping':
                return [{ label: 'Edit Design', icon: <Palette size={14} />, onClick: () => setEditingSection('shipping') }];
            case 'delivery':
                return [
                    { label: 'Edit Design', icon: <Palette size={14} />, onClick: () => setEditingSection('delivery') },
                    { label: 'Manage Rates', icon: <Truck size={14} />, onClick: () => setEditingSection('shipping_manager') }
                ];
            case 'offers':
                return [
                    { label: 'Edit Design', icon: <Palette size={14} />, onClick: () => setEditingSection('offers') },
                    { label: 'Edit Packs Logic', icon: <Database size={14} />, onClick: () => setEditingSection('packs_manager') }
                ];
            case 'promoCode':
                return [
                    { label: 'Edit Design', icon: <Palette size={14} />, onClick: () => setEditingSection('promoCode') },
                    { label: 'Manage Codes', icon: <Ticket size={14} />, onClick: () => setEditingSection('promo_code_manager') }
                ];
            case 'summary':
                return [{ label: 'Edit Summary', icon: <Settings2 size={14} />, onClick: () => setEditingSection('summary') }];
            case 'cta':
                return [{ label: 'Edit Button', icon: <Settings2 size={14} />, onClick: () => setEditingSection('cta') }];
            case 'urgencyText':
                return [{ label: 'Edit Settings', icon: <Settings2 size={14} />, onClick: () => setEditingSection('urgencyText') }];
            case 'urgencyQuantity':
                return [{ label: 'Edit Settings', icon: <Settings2 size={14} />, onClick: () => setEditingSection('urgencyQuantity') }];
            case 'urgencyTimer':
                return [{ label: 'Edit Settings', icon: <Settings2 size={14} />, onClick: () => setEditingSection('urgencyTimer') }];
            case 'trustBadges':
                return [{ label: 'Edit Badges', icon: <Settings2 size={14} />, onClick: () => setEditingSection('trustBadges') }];
            default:
                return [];
        }
    };

    const sectionWrapper = ({ sectionId, children, style, elementRef }: unknown) => {
        return (
            <PreviewSectionWrapper
                sectionId={sectionId}
                onSelect={() => setEditingSection(sectionId)}
                style={style}
                actions={getActions(sectionId)}
            >
                {/* 
                  We attach elementRef to this wrapper DIV so that hooks like useStickyObserver 
                  (which observe ctaRef in FormLoader) observe this container.
                  If children is <CtaButton>, FormLoader passed ref={ctaRef} on the parent div IN renderSectionBlock.
                  So elementRef points to the DOM element in FormLoader.
                  Wait, if FormLoader passes `elementRef` to `sectionWrapper`:
                  
                  FormLoader:
                    return sectionWrapper({ ..., elementRef: ref });
                  
                  If I render children, children is the ReactNode. The REF is distinct.
                  If `FormLoader` attaches the ref to the *default* div, but now I am replacing that div with my wrapper...
                  Expected behavior: Use `elementRef` on the outermost element of the wrapped content so the parent/owner can measure it.
                */}
                <div className="w-full" ref={elementRef}>
                    {children}
                </div>
            </PreviewSectionWrapper>
        );
    };

    return (
        <FormLoader
            config={config}
            offers={offers}
            shipping={shipping}
            // Mock product based on first offer or whatever FormLoader needs
            product={{
                id: 1, // Mock ID
                title: 'Produit de démonstration', // Mock Title
                images: [], // Mock Images
                options: [{ name: 'Option', values: offers.map((o: unknown) => o.title?.fr || o.title || 'Option') }],
                variants: offers.length > 0 ? offers.map((o: unknown, index: number) => ({
                    id: index + 1,
                    title: o.title?.fr || o.title || `Option ${index + 1}`,
                    option1: o.title?.fr || o.title || null,
                    option2: null,
                    option3: null,
                    price: o.price || 0
                })) : []
            }}
            sectionWrapper={sectionWrapper}
            previewMode={true}
        />
    );
};

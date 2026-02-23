import { useState, useEffect, useCallback } from 'react';
import type { Product, Variant } from '../FormLoader';

export function useProductData(product: Product, onVariantChange?: (variantName: string) => void) {
    const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
        product?.variants?.[0]?.id || null
    );

    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        const initialOptions: Record<string, string> = {};
        if (product?.options?.length && product.variants?.length > 0) {
            const firstVariant = product.variants[0];
            product.options.forEach((opt, index) => {
                const optKey = `option${index + 1}` as keyof Variant;
                if (!opt || !opt.name) return;
                const val = firstVariant[optKey];
                if (typeof val === 'string') {
                    initialOptions[opt.name] = val;
                }
            });
        }
        return initialOptions;
    });

    useEffect(() => {
        if (!product?.variants || !product?.options?.length) return;

        const match = product.variants.find(v => {
            return product.options.every((opt, index) => {
                if (!opt || !opt.name) return true;
                const optKey = `option${index + 1}` as keyof Variant;
                return v[optKey] === selectedOptions[opt.name];
            });
        });

        if (match && match.id !== selectedVariantId) {
            setSelectedVariantId(match.id);
            if (onVariantChange) onVariantChange(match.title);
        }
    }, [selectedOptions, product, onVariantChange, selectedVariantId]);

    const getProductPrice = useCallback(() => {
        if (!product) return 2500;
        const v = product.variants?.find(v => v.id === selectedVariantId) || product.variants?.[0];
        if (!v) return 2500;

        if (v.price && typeof v.price === 'object' && 'amount' in (v.price as Record<string, unknown>) && (v.price as Record<string, string>).amount) {
            return parseFloat((v.price as Record<string, string>).amount);
        }
        if (v.price && typeof v.price === 'number') {
            return v.price / 100;
        }
        if (v.price && typeof v.price === 'string') {
            return parseFloat(v.price);
        }
        return 2500;
    }, [product, selectedVariantId]);

    const getProductImage = useCallback(() => {
        if (!product) return undefined;
        if (product.featured_image) return product.featured_image;
        if (product.featuredImage?.url) return product.featuredImage.url;
        if (product.images?.[0]) {
            return typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as { src?: string }).src;
        }

        const currentVariant = product.variants?.find(v => v.id === selectedVariantId);
        if (currentVariant?.featured_image?.src) {
            return currentVariant.featured_image.src;
        }
        return undefined;
    }, [product, selectedVariantId]);

    const basePrice = getProductPrice();
    const productTitle = product?.title || 'Produit Demo';
    const productImage = getProductImage();

    const variants = product?.variants?.filter(v => v).map((v: { title?: string }) => v.title) || ['Modèle A', 'Modèle B', 'Modèle C'];

    return {
        selectedVariantId,
        setSelectedVariantId,
        selectedOptions,
        setSelectedOptions,
        basePrice,
        productTitle,
        productImage,
        variants
    };
}

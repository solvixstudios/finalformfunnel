/**
 * CTA Button Component
 * Renders the call-to-action button with multiple variants and animations
 */

import { buildCtaClasses, buildCtaStyles } from '@/lib/utils/styles';
import type { RefObject } from 'react';
import React from 'react';

interface CtaButtonProps {
    config: {
        ctaColor: string;
        accentColor: string;
        borderRadius: string;
        ctaVariant?: 'solid' | 'outline' | 'gradient' | 'ghost';
        ctaAnimation?: 'shake' | 'pulse' | 'bounce' | 'glow' | 'none';
        ctaShake?: boolean; // Legacy support
    };
    text: string;
    onClick: () => void;
    ctaRef?: RefObject<HTMLDivElement>;
    isSticky?: boolean;
    stickyVisible?: boolean;
}

export const CtaButton: React.FC<CtaButtonProps> = ({
    config,
    text,
    onClick,
    ctaRef,
    isSticky = false,
    stickyVisible = false,
}) => {
    // Normalize animation (legacy support for ctaShake)
    const ctaAnimation = config.ctaAnimation || (config.ctaShake ? 'shake' : 'none');

    const styleConfig = {
        ctaColor: config.ctaColor,
        accentColor: config.accentColor,
        borderRadius: config.borderRadius,
        ctaVariant: config.ctaVariant,
        ctaAnimation,
    };

    const classes = buildCtaClasses(styleConfig);
    const styles = buildCtaStyles(styleConfig);

    // Sticky CTA wrapper
    if (isSticky) {
        return (
            <div
                className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent transition-all duration-300 ${stickyVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                    }`}
                style={{ zIndex: 100 }}
            >
                <button type="button" className={classes} style={styles} onClick={onClick}>
                    {text}
                </button>
            </div>
        );
    }

    // Normal CTA
    return (
        <div ref={ctaRef}>
            <button type="button" className={classes} style={styles} onClick={onClick}>
                {text}
            </button>
        </div>
    );
};

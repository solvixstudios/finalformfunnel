/**
 * CTA Button Component
 * Renders the call-to-action button with multiple variants and animations
 */

import { buildCtaClasses, buildCtaStyles } from '@/lib/utils/styles';
import type { RefObject } from 'react';
import React from 'react';
import type { FormConfig } from '@/types/form';

interface CtaButtonProps {
    config: FormConfig;
    text: string;
    onClick: () => void;
    ctaRef?: RefObject<HTMLDivElement>;
    isSticky?: boolean;
    stickyVisible?: boolean;
    isLoading?: boolean;
}

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const CtaButton: React.FC<CtaButtonProps> = ({
    config,
    text,
    onClick,
    ctaRef,
    isSticky = false,
    stickyVisible = false,
    isLoading = false,
}) => {
    // Normalize animation (legacy support for ctaShake)
    const ctaAnimation = config.ctaAnimation || (config.ctaShake ? 'shake' : 'none');

    const styleConfig = {
        ctaColor: config.ctaColor,
        accentColor: config.accentColor,
        borderRadius: config.borderRadius,
        ctaVariant: config.ctaVariant,
        ctaAnimation: isLoading ? 'none' : ctaAnimation, // Disable animation while loading
    };

    const classes = buildCtaClasses(styleConfig);
    const styles = buildCtaStyles(styleConfig);

    const buttonContent = (
        <>
            {isLoading && <Spinner />}
            {isLoading ? 'Traitement...' : text}
        </>
    );

    // Sticky CTA wrapper
    if (isSticky) {
        return (
            <div
                className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent transition-all duration-300 ${stickyVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                    }`}
                style={{ zIndex: 100 }}
            >
                <button
                    type="button"
                    className={`${classes} flex items-center justify-center`}
                    style={{ ...styles, opacity: isLoading ? 0.7 : 1 }}
                    onClick={onClick}
                    disabled={isLoading}
                >
                    {buttonContent}
                </button>
            </div>
        );
    }

    // Normal CTA
    return (
        <div ref={ctaRef}>
            <button
                type="button"
                className={`${classes} flex items-center justify-center`}
                style={{ ...styles, opacity: isLoading ? 0.7 : 1 }}
                onClick={onClick}
                disabled={isLoading}
            >
                {buttonContent}
            </button>
        </div>
    );
};


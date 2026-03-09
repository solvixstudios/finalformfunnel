/**
 * CTA Button Component
 * Renders the call-to-action button with multiple variants and animations
 */

import { buildCtaClasses, buildCtaStyles } from '@/lib/utils/styles';
import type { RefObject } from 'react';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';
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
    <FontAwesomeIcon icon={faCircleNotch} className="animate-spin h-5 w-5 mr-2" />
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


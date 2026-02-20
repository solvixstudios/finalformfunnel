import { FileText } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface FormPreviewThumbnailProps {
    config: unknown;
    width?: number;
    height?: number;
    className?: string;
}

/**
 * Renders a miniature preview of the form configuration as a thumbnail.
 * Uses a scaled-down representation of the form layout.
 */
const FormPreviewThumbnail: React.FC<FormPreviewThumbnailProps> = ({
    config,
    width = 200,
    height = 140,
    className = '',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !config) {
            setError(true);
            return;
        }

        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setError(true);
                return;
            }

            // Set canvas dimensions
            canvas.width = width * 2; // 2x for retina
            canvas.height = height * 2;
            ctx.scale(2, 2);

            // Background
            const bgColor = config.formBackground || '#ffffff';
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);

            // Draw a simplified form preview
            const accentColor = config.accentColor || '#3b82f6';
            const ctaColor = config.ctaColor || '#1e293b';
            const borderRadius = Math.min(config.borderRadius || 8, 12);
            const textColor = config.textColor || '#1e293b';

            // Padding
            const padding = 12;
            let currentY = padding;

            // Header section (if enabled)
            if (config.header?.enabled) {
                ctx.fillStyle = accentColor + '20';
                roundRect(ctx, padding, currentY, width - padding * 2, 20, borderRadius / 2);
                ctx.fill();
                currentY += 26;
            }

            // Product sticker (small rectangle)
            if (config.header?.productSticker?.enabled) {
                ctx.fillStyle = '#f1f5f9';
                roundRect(ctx, padding, currentY, 60, 40, borderRadius / 2);
                ctx.fill();
                currentY += 46;
            }

            // Form fields simulation
            const fields = config.fields || {};
            const visibleFields = Object.entries(fields)
                .filter(([, field]: [string, any]) => field?.visible !== false)
                .slice(0, 4); // Show max 4 fields

            visibleFields.forEach(([key]: [string, any]) => {
                // Field label
                ctx.fillStyle = textColor + '60';
                ctx.fillRect(padding, currentY, 40, 4);
                currentY += 8;

                // Input field
                ctx.strokeStyle = config.inputBorderColor || '#e2e8f0';
                ctx.lineWidth = 1;
                roundRect(ctx, padding, currentY, width - padding * 2, 16, borderRadius / 2);
                ctx.stroke();

                // Input background
                ctx.fillStyle = config.inputBackground || '#ffffff';
                roundRect(ctx, padding + 0.5, currentY + 0.5, width - padding * 2 - 1, 15, borderRadius / 2);
                ctx.fill();

                currentY += 22;
            });

            // CTA Button at bottom
            const ctaY = height - padding - 20;
            ctx.fillStyle = ctaColor;
            roundRect(ctx, padding, ctaY, width - padding * 2, 20, borderRadius / 2);
            ctx.fill();

            // CTA text simulation (small white rectangle)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(width / 2 - 20, ctaY + 8, 40, 4);

            setError(false);
        } catch (e) {
            console.error('Error rendering form thumbnail:', e);
            setError(true);
        }
    }, [config, width, height]);

    if (error || !config) {
        return (
            <div
                className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg ${className}`}
                style={{ width, height }}
            >
                <FileText size={32} className="text-slate-400" />
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className={`rounded-lg shadow-sm ${className}`}
            style={{ width, height }}
        />
    );
};

// Helper function to draw rounded rectangles
function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

export default FormPreviewThumbnail;

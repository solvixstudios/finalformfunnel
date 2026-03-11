import { cn } from '@/lib/utils';
import React from 'react';

interface StateWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

/**
 * A generic layout wrapper for Empty States, Error States, and Loading States.
 * Ensures the content takes up the full available height, is perfectly centered,
 * and completely prevents its own scrolling.
 */
export function StateWrapper({ children, className, ...props }: StateWrapperProps) {
    return (
        <div
            className={cn(
                "flex-1 w-full h-full flex flex-col items-center justify-center min-h-[300px] overflow-hidden p-6",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

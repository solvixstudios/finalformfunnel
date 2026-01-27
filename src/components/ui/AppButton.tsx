import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { Button, type ButtonProps } from "./button";

/**
 * AppButton - Higher-level button component with loading states and common presets
 */
export interface AppButtonProps extends ButtonProps {
    loading?: boolean;
    loadingText?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
    ({ loading, loadingText, leftIcon, rightIcon, children, disabled, className, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                disabled={disabled || loading}
                className={cn("transition-all active:scale-95", className)}
                {...props}
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {loadingText || children}
                    </>
                ) : (
                    <>
                        {leftIcon}
                        {children}
                        {rightIcon}
                    </>
                )}
            </Button>
        );
    }
);
AppButton.displayName = "AppButton";

/**
 * Preset Buttons - Common button patterns with semantic meaning
 */

// Primary action button (indigo brand color)
export const PrimaryButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
    ({ className, ...props }, ref) => (
        <AppButton ref={ref} variant="brand" className={cn("shadow-sm hover:shadow-md", className)} {...props} />
    )
);
PrimaryButton.displayName = "PrimaryButton";

// Save button
export const SaveButton = React.forwardRef<HTMLButtonElement, Omit<AppButtonProps, "loadingText">>(
    ({ loading, children = "Save", ...props }, ref) => (
        <PrimaryButton ref={ref} loading={loading} loadingText="Saving..." {...props}>
            {children}
        </PrimaryButton>
    )
);
SaveButton.displayName = "SaveButton";

// Publish button (indigo brand - same as primary)
export const PublishButton = React.forwardRef<HTMLButtonElement, Omit<AppButtonProps, "loadingText">>(
    ({ loading, children = "Publish", ...props }, ref) => (
        <PrimaryButton ref={ref} loading={loading} loadingText="Publishing..." {...props}>
            {children}
        </PrimaryButton>
    )
);
PublishButton.displayName = "PublishButton";

// Danger/destructive action button (red)
export const DangerButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
    ({ className, ...props }, ref) => (
        <AppButton ref={ref} variant="danger" className={cn("shadow-sm", className)} {...props} />
    )
);
DangerButton.displayName = "DangerButton";

// Cancel button (outline style)
export const CancelButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
    ({ children = "Cancel", ...props }, ref) => (
        <AppButton ref={ref} variant="outline" {...props}>
            {children}
        </AppButton>
    )
);
CancelButton.displayName = "CancelButton";

// Success button (green - for enable, connect, etc)
export const SuccessButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
    ({ className, ...props }, ref) => (
        <AppButton ref={ref} variant="success" className={cn("shadow-sm hover:shadow-md", className)} {...props} />
    )
);
SuccessButton.displayName = "SuccessButton";

// Shopify button (Shopify green)
export const ShopifyButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
    ({ className, ...props }, ref) => (
        <AppButton ref={ref} variant="shopify" className={cn("shadow-sm hover:shadow-md", className)} {...props} />
    )
);
ShopifyButton.displayName = "ShopifyButton";

export { AppButton };

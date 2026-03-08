import React from "react";
import { Info } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover";
import { cn } from "../../lib/utils";

interface HelpPopupProps {
    children: React.ReactNode;
    iconSize?: number;
    className?: string;
    side?: "top" | "right" | "bottom" | "left";
    colorText?: string;
    colorBg?: string;
}

export const HelpPopup = ({
    children,
    iconSize = 14,
    className,
    side = "top",
    colorText = "text-indigo-600",
    colorBg = "bg-indigo-50"
}: HelpPopupProps) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex-shrink-0 hover:opacity-80 transition-opacity focus:outline-none">
                    <Info size={iconSize} className="text-slate-400 hover:text-slate-600" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side={side}
                align="center"
                className={cn(
                    "w-64 p-3 rounded-xl shadow-lg border border-slate-200",
                    colorBg,
                    className
                )}
            >
                <p className={cn("text-[11px] font-medium leading-relaxed font-sans", colorText)}>
                    {children}
                </p>
            </PopoverContent>
        </Popover>
    );
};

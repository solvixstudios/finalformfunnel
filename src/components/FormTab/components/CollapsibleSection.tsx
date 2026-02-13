import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';

interface CollapsibleSectionProps {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    defaultOpen?: boolean;
    accentFrom?: string;
    accentTo?: string;
    badge?: string | number;
    extraHeaderContent?: React.ReactNode;
}

export const CollapsibleSection = ({
    title,
    icon: Icon,
    children,
    defaultOpen = false,
    accentFrom = 'from-indigo-500',
    accentTo = 'to-violet-600',
    badge,
    extraHeaderContent,
}: CollapsibleSectionProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div
            className={`
        bg-white border rounded-2xl overflow-hidden transition-all duration-300
        ${isOpen
                    ? 'border-slate-200 shadow-sm ring-1 ring-slate-100'
                    : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                }
      `}
        >
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors group cursor-pointer"
            >
                <div className="flex items-center gap-2.5">
                    <div
                        className={`
              w-7 h-7 rounded-lg bg-gradient-to-br ${accentFrom} ${accentTo}
              flex items-center justify-center text-white shadow-sm
              transition-transform duration-300 group-hover:scale-105
            `}
                    >
                        <Icon size={14} strokeWidth={2.5} />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 tracking-tight">
                        {title}
                    </span>
                    {badge !== undefined && (
                        <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-slate-100 text-slate-500">
                            {badge}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {extraHeaderContent}
                    <div
                        className={`
                w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200
                ${isOpen
                                ? 'bg-slate-100 text-slate-500'
                                : 'text-slate-300 group-hover:text-slate-400'
                            }
            `}
                    >
                        {isOpen
                            ? <ChevronDown size={15} strokeWidth={2.5} />
                            : <ChevronRight size={15} strokeWidth={2.5} />
                        }
                    </div>
                </div>
            </div>

            {/* Animated content area */}
            <div
                className={`
          grid transition-all duration-300 ease-in-out
          ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}
        `}
            >
                <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100/80">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

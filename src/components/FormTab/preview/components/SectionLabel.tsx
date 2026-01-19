import React from 'react';

interface SectionLabelProps {
    children: React.ReactNode;
    accentColor: string;
}

export const SectionLabel = ({ children, accentColor }: SectionLabelProps) => (
    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ backgroundColor: accentColor }} />
        {children}
    </div>
);

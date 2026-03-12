/**
 * ChangelogDialog — Full-screen popup showing changelog entries
 * with arrow navigation between versions.
 */

import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { useChangelog } from '../hooks/useChangelog';

interface ChangelogDialogProps {
    open: boolean;
    onClose: () => void;
}

const ChangelogDialog = ({ open, onClose }: ChangelogDialogProps) => {
    const { entries } = useChangelog();
    const [currentIdx, setCurrentIdx] = useState(0);

    if (!open) return null;

    const entry = entries[currentIdx];
    const hasPrev = currentIdx < entries.length - 1;
    const hasNext = currentIdx > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center font-sans">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Dialog */}
            <div className="relative bg-white w-full sm:max-w-2xl sm:mx-4 h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in">

                {/* Header */}
                <div className="bg-gradient-to-br from-[#FF5A1F] to-[#E04812] px-5 sm:px-6 py-5 sm:py-6 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/10 rounded-full blur-[50px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
                    <div className="relative z-10 flex items-start justify-between gap-3">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[9px] font-bold tracking-widest uppercase mb-2">
                                <FileText size={10} /> Version History
                            </div>
                            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                                What's New
                            </h2>
                            <p className="text-white/60 text-[11px] font-medium mt-1">
                                Latest updates, improvements, and bug fixes.
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/15 transition-colors shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Version navigation */}
                {entries.length > 0 && (
                    <div className="flex items-center justify-between px-5 sm:px-6 py-2.5 border-b border-[#E2DCCF] bg-[#FAF9F6] shrink-0">
                        <button
                            onClick={() => hasPrev && setCurrentIdx(i => i + 1)}
                            disabled={!hasPrev}
                            className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                                hasPrev
                                    ? "text-[#4A443A] hover:bg-[#E6E0D3]"
                                    : "text-[#D4CFC5] cursor-not-allowed"
                            )}
                        >
                            <ChevronLeft size={14} /> Older
                        </button>

                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-[#4A443A]">v{entry?.version}</span>
                            <span className="text-[10px] font-bold text-[#A69D8A] bg-[#EFEBE0] px-1.5 py-0.5 rounded border border-[#E2DCCF]">
                                {entry?.date}
                            </span>
                            {currentIdx === 0 && (
                                <span className="text-[8px] font-bold text-[#FF5A1F] bg-[#FF5A1F]/10 border border-[#FF5A1F]/20 px-1.5 py-0.5 rounded uppercase tracking-widest">
                                    Latest
                                </span>
                            )}
                        </div>

                        <button
                            onClick={() => hasNext && setCurrentIdx(i => i - 1)}
                            disabled={!hasNext}
                            className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                                hasNext
                                    ? "text-[#4A443A] hover:bg-[#E6E0D3]"
                                    : "text-[#D4CFC5] cursor-not-allowed"
                            )}
                        >
                            Newer <ChevronRight size={14} />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scroll-thin">
                    {entry ? (
                        <div className="space-y-4">
                            {entry.categories.map((cat, cIdx) => (
                                <div key={cIdx} className="bg-[#F8F5F1] rounded-xl p-4 border border-[#E2DCCF]/60">
                                    <div className="flex items-center gap-2 mb-2.5">
                                        <span className="text-sm">{cat.emoji}</span>
                                        <h4 className="text-[10px] font-bold text-[#4A443A] uppercase tracking-widest">{cat.type}</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {cat.items.map((item, iIdx) => (
                                            <li key={iIdx} className="text-[12px] font-medium text-[#7A7365] leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[8px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#FF5A1F]/40">
                                                <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#4A443A] font-bold">$1</strong>') }} />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <div className="w-10 h-10 bg-[#F2EFE8] rounded-xl flex items-center justify-center mx-auto mb-3 border border-[#E2DCCF]">
                                <FileText className="text-[#A69D8A]" size={16} />
                            </div>
                            <h3 className="text-[12px] font-bold text-[#4A443A]">No release notes</h3>
                            <p className="text-[11px] text-[#908878] mt-0.5">Check back later.</p>
                        </div>
                    )}
                </div>

                {/* Footer — version dots indicator */}
                {entries.length > 1 && (
                    <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-[#E2DCCF] bg-white flex items-center justify-center gap-1.5">
                        {entries.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIdx(idx)}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    idx === currentIdx
                                        ? "bg-[#FF5A1F] w-5"
                                        : "bg-[#E2DCCF] w-1.5 hover:bg-[#A69D8A]"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChangelogDialog;

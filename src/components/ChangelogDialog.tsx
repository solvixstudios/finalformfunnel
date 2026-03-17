/**
 * ChangelogDialog — Full-screen overlay showing changelog entries
 * with arrow navigation between versions.
 * Uses createPortal for proper z-index stacking (matches PlanPickerDialog pattern).
 */

import { cn } from '@/lib/utils';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
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

    const dialog = (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#FAF9F6] font-sans animate-in fade-in duration-200">

            {/* ═══ TOPBAR ═══ */}
            <header className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-[#E2DCCF] bg-white z-50">
                {/* Left */}
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FF5A1F]/10 flex items-center justify-center">
                        <FileText className="w-3.5 h-3.5 text-[#FF5A1F]" />
                    </div>
                    <span className="text-[13px] font-black text-[#4A443A] tracking-tight hidden sm:block">Changelog</span>
                </div>

                {/* Center: Version navigation */}
                {entries.length > 0 && (
                    <nav className="hidden md:flex items-center gap-3">
                        <button
                            onClick={() => hasPrev && setCurrentIdx(i => i + 1)}
                            disabled={!hasPrev}
                            className={cn(
                                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                hasPrev
                                    ? "text-[#4A443A] hover:bg-[#F2EFE8]"
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
                                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                                hasNext
                                    ? "text-[#4A443A] hover:bg-[#F2EFE8]"
                                    : "text-[#D4CFC5] cursor-not-allowed"
                            )}
                        >
                            Newer <ChevronRight size={14} />
                        </button>
                    </nav>
                )}

                {/* Mobile version nav */}
                <div className="flex md:hidden items-center gap-1.5">
                    {entries.map((_, idx) => (
                        <div key={idx} className={cn(
                            'h-1 rounded-full transition-all',
                            idx === currentIdx ? 'w-5 bg-[#FF5A1F]' : 'w-2 bg-[#E2DCCF]',
                        )} />
                    ))}
                </div>

                {/* Right */}
                <button onClick={onClose} className="p-2 rounded-lg text-[#908878] hover:text-[#4A443A] hover:bg-[#F2EFE8] transition-colors">
                    <X size={16} />
                </button>
            </header>

            {/* ═══ BODY ═══ */}
            <div className="flex-1 overflow-hidden flex">
                <main className="flex-1 overflow-y-auto custom-scroll-thin">
                    {entry ? (
                        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                            {/* Mobile version header */}
                            <div className="flex md:hidden items-center justify-between mb-6">
                                <button
                                    onClick={() => hasPrev && setCurrentIdx(i => i + 1)}
                                    disabled={!hasPrev}
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold",
                                        hasPrev ? "text-[#4A443A]" : "text-[#D4CFC5] pointer-events-none"
                                    )}
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-[#4A443A]">v{entry.version}</span>
                                    <span className="text-[10px] font-bold text-[#A69D8A] bg-[#EFEBE0] px-1.5 py-0.5 rounded border border-[#E2DCCF]">
                                        {entry.date}
                                    </span>
                                </div>
                                <button
                                    onClick={() => hasNext && setCurrentIdx(i => i - 1)}
                                    disabled={!hasNext}
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold",
                                        hasNext ? "text-[#4A443A]" : "text-[#D4CFC5] pointer-events-none"
                                    )}
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>

                            {/* Version title */}
                            <div className="mb-6">
                                <h2 className="text-lg sm:text-xl font-black text-[#4A443A] tracking-tight">What's New in v{entry.version}</h2>
                                <p className="text-[11px] font-medium text-[#908878] mt-1">Released on {entry.date}</p>
                            </div>

                            {/* Categories */}
                            <div className="space-y-4">
                                {entry.categories.map((cat, cIdx) => (
                                    <div key={cIdx} className="bg-white rounded-xl p-4 sm:p-5 border border-[#E2DCCF] shadow-sm">
                                        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-[#F2EFE8]">
                                            <span className="text-sm">{cat.emoji}</span>
                                            <h4 className="text-[10px] font-black text-[#4A443A] uppercase tracking-widest">{cat.type}</h4>
                                        </div>
                                        <ul className="space-y-2.5">
                                            {cat.items.map((item, iIdx) => (
                                                <li key={iIdx} className="text-[12px] font-medium text-[#7A7365] leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[8px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#FF5A1F]/40">
                                                    <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#4A443A] font-bold">$1</strong>') }} />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center py-16">
                                <div className="w-12 h-12 bg-[#F2EFE8] rounded-xl flex items-center justify-center mx-auto mb-3 border border-[#E2DCCF]">
                                    <FileText className="text-[#A69D8A]" size={20} />
                                </div>
                                <h3 className="text-[13px] font-bold text-[#4A443A]">No release notes yet</h3>
                                <p className="text-[11px] text-[#908878] mt-0.5">Check back later for updates.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* ═══ FOOTER ═══ */}
            <footer className="h-12 shrink-0 flex items-center justify-between px-4 sm:px-6 border-t border-[#E2DCCF] bg-white z-50">
                <p className="text-[10px] text-[#908878] font-medium">
                    {entries.length} version{entries.length !== 1 ? 's' : ''} in changelog
                </p>
                <div className="flex items-center gap-1.5">
                    {entries.slice(0, 8).map((_, idx) => (
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
            </footer>
        </div>
    );

    return createPortal(dialog, document.body);
};

export default ChangelogDialog;

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PartyPopper } from 'lucide-react';
import { useChangelog } from '@/hooks/useChangelog';

export function ChangelogModal() {
    const { showChangelog, dismissChangelog, currentVersion, entries } = useChangelog();

    // Show only the latest entry (most recent release)
    const latest = entries[0];

    return (
        <Dialog open={showChangelog} onOpenChange={(open) => !open && dismissChangelog()}>
            <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden bg-white gap-0 rounded-2xl border-0 shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#FF5A1F] to-[#E04812] px-6 py-6 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/10 rounded-full blur-[40px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/10">
                            <PartyPopper className="w-6 h-6 text-white" />
                        </div>
                        <DialogTitle className="text-lg font-black text-white">
                            What's New (v{currentVersion})
                        </DialogTitle>
                        <DialogDescription className="text-white/50 text-sm font-medium mt-1">
                            {latest?.date || 'Latest improvements'}
                        </DialogDescription>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    <ScrollArea className="max-h-[300px] pr-2">
                        {latest ? (
                            <div className="space-y-5">
                                {latest.categories.map((cat, cIdx) => (
                                    <div key={cIdx}>
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="text-sm">{cat.emoji}</span>
                                            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{cat.type}</h4>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {cat.items.map((item, iIdx) => (
                                                <li key={iIdx} className="text-sm text-slate-600 leading-relaxed pl-4 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-slate-200">
                                                    <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 font-semibold">$1</strong>') }} />
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 text-center py-8">No release notes available.</p>
                        )}
                    </ScrollArea>
                </div>

                {/* Footer */}
                <DialogFooter className="px-5 pb-5 pt-0">
                    <Button
                        onClick={dismissChangelog}
                        className="w-full h-11 bg-gradient-to-br from-[#FF5A1F] to-[#E04812] hover:from-[#E04812] hover:to-[#CC3D0D] text-white rounded-xl font-bold text-sm shadow-sm transition-all"
                    >
                        Got it
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

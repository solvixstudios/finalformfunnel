import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PartyPopper, Rocket, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { useChangelog } from '@/hooks/useChangelog';

export function ChangelogModal() {
    const { showChangelog, dismissChangelog, currentVersion } = useChangelog();

    // In a real app, this could be fetched from a markdown file or backend API. 
    // We'll hardcode the latest release notes here for v1.x.
    const releaseNotes = [
        {
            version: "1.0.3",
            date: "Aujourd'hui",
            title: "Votre expérience, améliorée !",
            features: [
                {
                    icon: <Rocket className="w-5 h-5 text-[#FF5A1F]" />,
                    title: "Boutiques parfaitement synchronisées",
                    desc: "La connexion à votre boutique Shopify est désormais plus fluide et plus intelligente. Les mises à jour se déploient en un éclair !"
                },
                {
                    icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
                    title: "Fiabilité des commandes",
                    desc: "Nous avons renforcé notre système de traitement. Chaque commande passée atterrit dans votre tableau de bord sans accroc."
                },
                {
                    icon: <Wrench className="w-5 h-5 text-indigo-500" />,
                    title: "Livraison en direct",
                    desc: "Vos clients verront toujours les frais de livraison parfaits en temps réel. Finies les mauvaises surprises !"
                }
            ]
        },
    ];

    // Get the most recent notes, or fallback
    const latestNotes = releaseNotes[0];

    return (
        <Dialog open={showChangelog} onOpenChange={(open) => !open && dismissChangelog()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white gap-0 rounded-2xl border-0 shadow-2xl">
                <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-inner">
                            <PartyPopper className="w-8 h-8 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-white mb-2">
                            Quoi de neuf ? (v{currentVersion})
                        </DialogTitle>
                        <DialogDescription className="text-indigo-100 font-medium">
                            {latestNotes?.title || 'Découvrez les dernières améliorations de Final Form.'}
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-6">
                    <ScrollArea className="h-[280px] pr-4 custom-scroll">
                        <div className="space-y-6">
                            {latestNotes?.features.map((feature, idx) => (
                                <div key={idx} className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 mb-1">{feature.title}</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            {feature.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter className="p-6 pt-0 border-t border-slate-100">
                    <Button
                        onClick={dismissChangelog}
                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-200 font-semibold"
                    >
                        Super, fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

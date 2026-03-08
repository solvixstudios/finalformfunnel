import { Badge } from '@/components/ui/badge';
import { HoverSpotlightCard } from '@/components/ui/HoverSpotlightCard';
import { ChevronRight } from 'lucide-react';

interface ComingSoonCardProps {
    name: string;
    emoji: string;
}

export function ComingSoonCard({ name, emoji }: ComingSoonCardProps) {
    return (
        <HoverSpotlightCard spotlightColor="rgba(0,0,0,0.05)" className="group h-full flex flex-col p-6 bg-white border border-slate-200/50 border-dashed rounded-3xl opacity-60 hover:opacity-100 min-h-[140px] sm:min-h-[180px]">
            <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
            <div className="flex flex-col h-full justify-between">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 shadow-sm">
                    {emoji}
                </div>
                <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{name}</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                </div>
            </div>
        </HoverSpotlightCard>
    );
}

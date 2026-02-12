import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

interface ComingSoonCardProps {
    name: string;
    emoji: string;
}

export function ComingSoonCard({ name, emoji }: ComingSoonCardProps) {
    return (
        <Card className="group h-full flex flex-col p-6 bg-slate-50/50 border border-slate-200/50 border-dashed rounded-[2rem] opacity-70 hover:opacity-100 transition-opacity min-h-[180px] relative">
            <ChevronRight className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-slate-400" />
            <div className="flex flex-col h-full justify-between">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-3xl mb-4 grayscale opacity-50 shadow-sm">
                    {emoji}
                </div>
                <div>
                    <h4 className="text-lg font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{name}</h4>
                    <Badge variant="outline" className="mt-2 text-[10px] bg-transparent border-slate-300 text-slate-400">Coming Soon</Badge>
                </div>
            </div>
        </Card>
    );
}

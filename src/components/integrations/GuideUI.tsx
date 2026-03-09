import React, { useState } from 'react';
import { PlayCircle, Check, Copy, Loader2, Wifi, WifiOff, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export const VideoPlaceholder = ({
    title = "Comment configurer cette intégration",
    thumbnailUrl = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2000&auto=format&fit=crop",
    onClick
}: {
    title?: string;
    thumbnailUrl?: string;
    onClick?: () => void;
}) => (
    <div
        onClick={onClick}
        className="relative w-full aspect-video bg-slate-900 rounded-xl overflow-hidden mb-8 group cursor-pointer shadow-md border border-slate-200"
    >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
        <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
        />
        <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/30">
                <PlayCircle className="w-8 h-8 text-white fill-white/10" />
            </div>
        </div>
        <div className="absolute bottom-5 left-5 right-5 z-20 flex items-end justify-between">
            <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white backdrop-blur-md mb-2 inline-block uppercase tracking-wider">Tutoriel Vidéo</span>
                <p className="text-white font-semibold text-sm md:text-base drop-shadow-md leading-tight">{title}</p>
            </div>
            <div className="text-xs font-medium text-white/80 bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-sm">
                3:45
            </div>
        </div>
    </div>
);

export const GuideStep = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
    <div className="flex gap-4 relative pb-8 last:pb-0 group">
        <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-sm font-bold text-slate-700 shadow-sm z-10 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-700 transition-colors">
                {number}
            </div>
            <div className="w-px h-full bg-slate-200 absolute top-8 -bottom-2 -z-0 group-hover:bg-indigo-100 transition-colors" />
        </div>
        <div className="flex-1 pt-1 space-y-2">
            <h4 className="font-semibold text-slate-900 leading-tight">{title}</h4>
            <div className="text-sm text-slate-600 space-y-3 leading-relaxed">{children}</div>
        </div>
    </div>
);

export const CopyButton = ({ text, label, className }: { text: string; label?: string; className?: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(label ? `${label} copié!` : 'Copié dans le presse-papiers');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={cn("h-7 px-2 text-[10px] font-medium bg-slate-100/80 hover:bg-slate-200 text-slate-700 transition-colors uppercase tracking-wider backdrop-blur-sm", className)}
        >
            {copied ? <Check size={12} className="mr-1.5 text-green-600" /> : <Copy size={12} className="mr-1.5" />}
            {label || (copied ? 'Copié' : 'Copier')}
        </Button>
    );
};

export const TestConnectionButton = ({
    onTest,
    label = "Tester la connexion",
    className,
}: {
    onTest: () => Promise<boolean>;
    label?: string;
    className?: string;
}) => {
    const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    const handleTest = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setStatus('testing');
        try {
            const success = await onTest();
            if (success) {
                setStatus('success');
                toast.success('Connexion réussie ! Tout fonctionne correctement.');
            } else {
                setStatus('error');
                toast.error('Échec de la connexion. Vérifiez vos informations.');
            }
        } catch (err: any) {
            setStatus('error');
            toast.error(err?.message || 'Erreur lors du test de connexion.');
        }
        setTimeout(() => setStatus('idle'), 4000);
    };

    const iconMap = {
        idle: <Wifi size={14} className="mr-2" />,
        testing: <Loader2 size={14} className="mr-2 animate-spin" />,
        success: <CheckCircle2 size={14} className="mr-2 text-green-600" />,
        error: <XCircle size={14} className="mr-2 text-red-500" />,
    };

    const labelMap = {
        idle: label,
        testing: 'Test en cours...',
        success: 'Connexion réussie ✓',
        error: 'Échec — Réessayer',
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={status === 'testing'}
            className={cn(
                "h-9 rounded-lg text-xs font-bold px-5 shadow-sm transition-all duration-300",
                status === 'idle' && "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50",
                status === 'testing' && "bg-indigo-50 text-indigo-700 border-indigo-200",
                status === 'success' && "bg-green-50 text-green-700 border-green-300 ring-2 ring-green-100",
                status === 'error' && "bg-red-50 text-red-700 border-red-300 ring-2 ring-red-100",
                className
            )}
        >
            {iconMap[status]}
            {labelMap[status]}
        </Button>
    );
};

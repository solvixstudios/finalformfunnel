import { cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Crown, Zap, Settings2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StatItem {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: 'violet' | 'emerald' | 'blue' | 'amber';
    format?: (n: number) => string;
    suffix?: string;
}

interface DashboardHeaderProps {
    userName: string;
    stats: StatItem[];
    plan?: {
        name: string;
        daysLeft: number;
        totalDays: number;
    };
    onPlanClick?: () => void;
    greeting?: boolean;
}


function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

const colorMap = {
    violet: {
        bg: 'bg-slate-900',
        text: 'text-white',
        ring: 'ring-slate-800',
        glow: 'shadow-slate-900/10',
    },
    emerald: {
        bg: 'bg-gradient-to-br from-[#FF5A1F] to-[#E04812]',
        text: 'text-white',
        ring: 'ring-[#FF5A1F]/30',
        glow: 'shadow-[#FF5A1F]/10',
    },
    blue: {
        bg: 'bg-gradient-to-br from-rose-500 to-pink-600',
        text: 'text-white',
        ring: 'ring-rose-200',
        glow: 'shadow-rose-500/10',
    },
    amber: {
        bg: 'bg-gradient-to-br from-amber-400 to-orange-500',
        text: 'text-white',
        ring: 'ring-amber-200',
        glow: 'shadow-amber-400/10',
    },
};

export function DashboardHeader({ userName, stats, plan, onPlanClick, greeting = true }: DashboardHeaderProps) {
    const firstName = userName?.split(' ')[0] || 'there';
    const progressPercent = plan ? Math.round((plan.daysLeft / plan.totalDays) * 100) : 0;
    const circumference = 2 * Math.PI * 14;

    // Use a persistent key for storing the stat preferences
    const [visibleStats, setVisibleStats] = useState<Record<string, boolean>>(() => {
        try {
            const saved = localStorage.getItem('dashboard-visible-stats');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load dashboard stats preferences', e);
        }
        // Default: all visible
        return stats.reduce((acc, stat) => ({ ...acc, [stat.label]: true }), {});
    });

    useEffect(() => {
        try {
            localStorage.setItem('dashboard-visible-stats', JSON.stringify(visibleStats));
        } catch (e) {
            console.error('Failed to save dashboard stats preferences', e);
        }
    }, [visibleStats]);

    const toggleStat = (label: string) => {
        setVisibleStats(prev => ({ ...prev, [label]: !prev[label] }));
    };

    const hasAnyStatsConfigured = stats.length > 0;

    return (
        <div className={cn(
            "shrink-0 transition-all",
            greeting
                ? "bg-[#F8F5F1] px-5 sm:px-8 py-6 sm:py-8"
                : "bg-transparent p-0"
        )}>
            {/* Header & Plan Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 relative z-10">
                {/* Greeting */}
                {greeting && (
                    <div className="flex flex-col gap-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            {getGreeting()}, {firstName} <span className="text-3xl ml-1 animate-wave inline-block origin-bottom-right">👋</span>
                        </h1>
                        <p className="text-sm font-medium text-slate-500 max-w-xl mt-1">Welcome back. Here's what's happening with your store today.</p>
                    </div>
                )}

                {/* Relocated Plan Card */}
                {plan && (
                    <button
                        onClick={onPlanClick}
                        className="shrink-0 group relative w-full sm:w-[280px] flex items-center justify-between gap-4 bg-gradient-to-br from-[#FF5A1F] to-[#E04812] rounded-xl sm:rounded-2xl p-4 md:p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left overflow-hidden border-0"
                    >
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 blur-[30px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        {/* Plan Info */}
                        <div className="relative z-10">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[10px] font-black text-white/90 uppercase tracking-widest leading-none">{plan.name}</span>
                                <Crown size={12} className="text-amber-300 drop-shadow-sm" />
                            </div>
                            <p className="text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight leading-none">
                                <AnimatedNumber value={plan.daysLeft} />
                                <span className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-widest ml-1.5">days left</span>
                            </p>
                        </div>

                        {/* Miniature Ring */}
                        <div className="relative w-10 h-10 shrink-0 z-10 flex items-center justify-center bg-black/10 rounded-full backdrop-blur-sm shadow-inner border border-white/10">
                            <svg className="absolute inset-0 w-full h-full -rotate-90 p-[2px]" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (circumference * progressPercent) / 100} className="transition-all duration-1000 ease-out drop-shadow-sm" />
                            </svg>
                            <Zap size={14} className="text-white fill-white relative z-10" />
                        </div>
                    </button>
                )}
            </div>

            {/* Stats Row */}
            <div className="flex items-stretch gap-3 pb-2 -mb-2">

                {/* Scrollable Stats Track (Middle) */}
                <div className="flex-1 flex flex-nowrap overflow-x-auto gap-3 items-stretch hide-scrollbar scrollbar-none snap-x snap-mandatory">
                    {stats.filter(stat => visibleStats[stat.label] !== false).map((stat) => {
                        const colors = colorMap[stat.color];
                        return (
                            <div
                                key={stat.label}
                                className={cn(
                                    "snap-start shrink-0 w-[210px] group flex items-center gap-4 bg-white rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 hover:border-slate-200 hover:-translate-y-0.5",
                                    colors.glow
                                )}
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className={cn("w-11 h-11 rounded-xl flex flex-shrink-0 items-center justify-center shadow-sm", colors.bg, colors.text)}>
                                        {stat.icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5 whitespace-nowrap overflow-hidden text-ellipsis">{stat.label}</p>
                                        <p className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums tracking-tight leading-none">
                                            <AnimatedNumber
                                                value={stat.value}
                                                format={stat.format || ((n) => n.toLocaleString())}
                                            />
                                            {stat.suffix && <span className="text-sm font-bold text-slate-400 ml-1">{stat.suffix}</span>}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Fixed Customize Button (Right) */}
                {hasAnyStatsConfigured && (
                    <div className="shrink-0 flex items-stretch">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    title="Customize Dashboard"
                                    className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-50 rounded-xl border border-slate-100 shadow-sm transition-all duration-200 text-slate-400 hover:text-slate-600 focus:outline-none group"
                                >
                                    <Settings2 size={16} className="transition-transform duration-500 group-hover:rotate-90" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-100 p-1.5 shadow-xl rounded-xl">
                                <div className="px-2.5 py-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visible Metrics</p>
                                </div>
                                <div className="max-h-[240px] overflow-y-auto space-y-0.5">
                                    {stats.map(stat => (
                                        <DropdownMenuCheckboxItem
                                            key={stat.label}
                                            checked={visibleStats[stat.label] !== false}
                                            onCheckedChange={() => toggleStat(stat.label)}
                                            className="text-xs font-medium text-slate-600 py-2 px-2.5 focus:bg-slate-50 focus:text-slate-900 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <div className="flex-1 flex items-center justify-between w-full">
                                                <span className="truncate">{stat.label}</span>
                                                <div className={cn(
                                                    "w-7 h-4 rounded-full flex items-center px-0.5 transition-all duration-200 border",
                                                    visibleStats[stat.label] !== false ? "bg-slate-900 border-slate-900" : "bg-slate-200 border-slate-200"
                                                )}>
                                                    <div className={cn(
                                                        "w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200",
                                                        visibleStats[stat.label] !== false ? "translate-x-3" : "translate-x-0"
                                                    )} />
                                                </div>
                                            </div>
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </div>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setVisibleStats(stats.reduce((acc, s) => ({ ...acc, [s.label]: true }), {}));
                                    }}
                                    className="w-full text-left px-2.5 py-2 text-[11px] font-semibold text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    Show All
                                </button>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>
        </div>
    );
}

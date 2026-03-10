import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { cn } from '@/lib/utils';
import { Check, CreditCard, Globe, Settings, User, Shield, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoogleUser } from '../lib/authGoogle';
import { useI18n } from '../lib/i18n/i18nContext';
import { Language } from '../lib/i18n/translations';

// __APP_VERSION__ is injected by Vite during build
declare const __APP_VERSION__: string;

interface SettingsPageProps {
    user: GoogleUser;
}

type SettingsTab = 'profile' | 'language' | 'subscription';

const SettingsPage = ({ user }: SettingsPageProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
    const { t, language, setLanguage } = useI18n();
    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

    useEffect(() => {
        const tab = searchParams.get('tab') as SettingsTab;
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const tabs = [
        { id: 'profile' as const, label: 'Profil', description: 'Gérez vos infos personnelles', icon: <User size={18} /> },
        { id: 'language' as const, label: 'Langue', description: 'Choisissez votre langue', icon: <Globe size={18} /> },
        { id: 'subscription' as const, label: 'Abonnement', description: 'Gérez votre forfait', icon: <CreditCard size={18} /> },
    ];

    const languages: { code: Language; name: string; flag: string }[] = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    ];

    const handleTabChange = (tab: SettingsTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    return (
        <div className="max-w-[1200px] mx-auto w-full space-y-6 h-full flex flex-col pt-2 md:pt-4 pb-24">
            <PageHeader
                title="Paramètres"
                breadcrumbs={[{ label: 'Paramètres' }]}
                icon={Settings}
            />

            {/* Premium Settings Layout */}
            <div className="flex flex-col md:flex-row gap-6 flex-1">

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
                    <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-2 shadow-sm flex flex-col">
                        <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible custom-scroll pb-2 md:pb-0">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left relative group min-w-[160px] md:min-w-0 shrink-0",
                                            isActive
                                                ? "bg-slate-900 shadow-md border border-slate-800"
                                                : "hover:bg-slate-100 border border-transparent"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                            isActive
                                                ? "bg-white/10 text-white"
                                                : "bg-slate-200 text-slate-500 group-hover:bg-slate-300 group-hover:text-slate-700"
                                        )}>
                                            {tab.icon}
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "text-sm font-semibold transition-colors",
                                                isActive ? "text-white" : "text-slate-700 group-hover:text-slate-900"
                                            )}>{tab.label}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* App Version Card */}
                    <div className="mt-auto bg-slate-50 rounded-2xl p-4 shadow-sm relative overflow-hidden hidden md:block border border-slate-200">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Shield size={14} className="text-[#FF5A1F]" /> App Version</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-slate-200 text-xs font-mono font-bold text-slate-700 shadow-sm">
                                v{appVersion}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 max-w-3xl">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[400px]">

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Profil Utilisateur</h2>
                                    <p className="text-sm text-slate-500">Gérez vos informations personnelles et préférences.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                    <div className="relative shrink-0">
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName}
                                                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-200 shadow-sm">
                                                <User size={32} className="text-slate-300" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 w-full space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Nom d'affichage</label>
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
                                                <span className="text-sm font-semibold text-slate-900">{user.displayName}</span>
                                                <span className="ml-auto text-[10px] font-bold text-slate-500 uppercase px-2 py-1 bg-white rounded-md border border-slate-200">Google Auth</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Adresse Email</label>
                                            <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 shadow-sm text-sm font-medium text-slate-600">
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <div className="flex items-center gap-2 mb-2 text-slate-500">
                                            <Zap size={14} className="text-orange-500" />
                                            <p className="text-xs font-semibold uppercase tracking-wider">Identifiant</p>
                                        </div>
                                        <p className="font-mono text-xs font-medium text-slate-700 truncate">{user.id}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <div className="flex items-center gap-2 mb-2 text-slate-500">
                                            <Check size={14} className="text-emerald-500" />
                                            <p className="text-xs font-semibold uppercase tracking-wider">Membre Depuis</p>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900">{new Date(user.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Language Tab */}
                        {activeTab === 'language' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Langue de l'interface</h2>
                                    <p className="text-sm text-slate-500">Choisissez votre langue préférée.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {languages.map((lang) => {
                                        const isSelected = language === lang.code;
                                        return (
                                            <button
                                                key={lang.code}
                                                onClick={() => setLanguage(lang.code)}
                                                className={cn(
                                                    "relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all text-center",
                                                    isSelected
                                                        ? "border-slate-900 bg-slate-50 shadow-sm"
                                                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center transition-all",
                                                    isSelected ? "bg-slate-900 text-white scale-100" : "bg-slate-100 text-transparent scale-0"
                                                )}>
                                                    <Check size={12} strokeWidth={3} />
                                                </div>

                                                <span className="text-4xl filter drop-shadow-sm">{lang.flag}</span>
                                                <div>
                                                    <p className={cn(
                                                        "font-bold text-sm mb-0.5",
                                                        isSelected ? "text-slate-900" : "text-slate-700"
                                                    )}>{lang.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang.code}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Subscription Tab */}
                        {activeTab === 'subscription' && (
                            <div className="space-y-8 animate-in fade-in duration-300">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Abonnement & Facturation</h2>
                                    <p className="text-sm text-slate-500">Gérez votre forfait actuel et vos limites.</p>
                                </div>

                                <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-white p-6 sm:p-8 shadow-xl">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5A1F]/15 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3" />

                                    <div className="relative z-10">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                            <div>
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-md mb-3 border border-white/10 shadow-sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Actif</span>
                                                </div>
                                                <h3 className="text-2xl font-black text-white tracking-tight uppercase">PRO PLAN</h3>
                                            </div>
                                            <button className="px-5 py-2.5 bg-white text-slate-900 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-100 transition-colors">
                                                Gérer
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-y border-white/10">
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commandes</span>
                                                    <span className="text-[10px] font-bold text-slate-400">82%</span>
                                                </div>
                                                <div className="flex items-end gap-1.5 mb-3">
                                                    <span className="text-2xl font-black text-white leading-none">824</span>
                                                    <span className="text-xs text-slate-400 mb-0.5">/ 1,000</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: '82%' }} />
                                                </div>
                                            </div>

                                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Restant</span>
                                                    <span className="text-[10px] font-bold text-slate-400">28J</span>
                                                </div>
                                                <div className="flex items-end gap-1.5 mb-3">
                                                    <span className="text-2xl font-black text-white leading-none">28</span>
                                                    <span className="text-xs text-slate-400 mb-0.5">Jours</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: '93%' }} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
                                            <p>Renouvellement auto le 28 Fév</p>
                                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                <CreditCard size={14} className="text-slate-300" />
                                                <span className="font-mono text-slate-300">•••• 4242</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

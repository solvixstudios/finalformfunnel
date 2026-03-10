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
        <div className="max-w-[1400px] mx-auto w-full space-y-8 h-full flex flex-col pt-2 md:pt-4 pb-24">
            <PageHeader
                title="Paramètres"
                breadcrumbs={[{ label: 'Paramètres' }]}
                icon={Settings}
            />

            {/* Premium Settings Layout */}
            <div className="flex flex-col lg:flex-row gap-8 flex-1">

                {/* Sidebar Navigation */}
                <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
                    <div className="bg-white/60 backdrop-blur-xl border border-white/80 rounded-3xl p-3 shadow-sm flex flex-col">
                        <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible custom-scroll pb-2 lg:pb-0">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={cn(
                                            "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all text-left relative overflow-hidden group min-w-[200px] lg:min-w-0 shrink-0",
                                            isActive
                                                ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100"
                                                : "hover:bg-white/50 border border-transparent"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-r-full" />
                                        )}
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-600"
                                                : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600"
                                        )}>
                                            {tab.icon}
                                        </div>
                                        <div>
                                            <p className={cn(
                                                "text-sm font-bold transition-colors",
                                                isActive ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"
                                            )}>{tab.label}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{tab.description}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* App Version Card */}
                    <div className="mt-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden hidden lg:block border border-slate-700">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
                        <Shield className="w-8 h-8 text-indigo-400 mb-4" />
                        <h4 className="text-sm font-bold mb-1">Final Form App</h4>
                        <p className="text-xs text-slate-400 font-medium">Votre application est à jour.</p>
                        <div className="mt-6 flex items-center justify-between">
                            <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Version</span>
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-xs font-mono font-bold text-slate-300">
                                v{appVersion}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 max-w-4xl">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 min-h-[500px]">

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Profil Utilisateur</h2>
                                    <p className="text-slate-500">Gérez vos informations personnelles et préférences de compte.</p>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start gap-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                                    <div className="relative shrink-0 group">
                                        <div className="absolute inset-0 bg-indigo-600/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {user.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.displayName}
                                                className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md relative z-10"
                                            />
                                        ) : (
                                            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center border-4 border-slate-50 shadow-md relative z-10">
                                                <User size={40} className="text-slate-300" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 w-full space-y-6">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider block">Nom d'affichage</label>
                                            <div className="flex items-center gap-2 px-5 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
                                                <span className="text-base font-bold text-slate-900">{user.displayName}</span>
                                                <span className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-widest px-2.5 py-1 bg-slate-100 rounded-lg">Google Auth</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider block">Adresse Email</label>
                                            <div className="px-5 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm text-base font-medium text-slate-600">
                                                {user.email}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
                                            <Zap size={18} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Identifiant Unique</p>
                                        <p className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 truncate">{user.id}</p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                                            <Check size={18} />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Membre Depuis</p>
                                        <p className="text-sm font-bold text-slate-900">{new Date(user.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Language Tab */}
                        {activeTab === 'language' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Langue de l'interface</h2>
                                    <p className="text-slate-500">Personnalisez votre expérience en choisissant votre langue préférée.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {languages.map((lang) => {
                                        const isSelected = language === lang.code;
                                        return (
                                            <button
                                                key={lang.code}
                                                onClick={() => setLanguage(lang.code)}
                                                className={cn(
                                                    "relative flex flex-col items-center gap-4 p-8 rounded-3xl border-2 transition-all text-center group overflow-hidden",
                                                    isSelected
                                                        ? "border-indigo-600 bg-indigo-50/30 shadow-md"
                                                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                                                )}
                                            >
                                                {/* Selection Indicator */}
                                                <div className={cn(
                                                    "absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                                    isSelected ? "bg-indigo-600 text-white scale-100" : "bg-slate-100 text-transparent scale-0 group-hover:scale-100 group-hover:text-slate-300"
                                                )}>
                                                    <Check size={14} strokeWidth={3} />
                                                </div>

                                                <span className="text-5xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{lang.flag}</span>
                                                <div>
                                                    <p className={cn(
                                                        "font-bold text-lg mb-1",
                                                        isSelected ? "text-indigo-900" : "text-slate-700"
                                                    )}>{lang.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang.code}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Subscription Tab */}
                        {activeTab === 'subscription' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Abonnement & Facturation</h2>
                                    <p className="text-slate-500">Supervisez votre forfait actuel et les limites d'utilisation.</p>
                                </div>

                                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 text-white p-8 sm:p-12 shadow-2xl border border-slate-800">
                                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF5A1F]/20 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
                                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />

                                    <div className="relative z-10">
                                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
                                            <div>
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-6 border border-white/10">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Actif</span>
                                                </div>
                                                <h3 className="text-5xl font-black text-white tracking-tight uppercase">PRO PLAN</h3>
                                                <p className="text-slate-400 mt-2 font-medium">L'expérience complète Final Form.</p>
                                            </div>
                                            <button className="px-6 py-3 bg-white text-slate-950 rounded-2xl text-sm font-bold shadow-lg hover:bg-slate-100 transition-colors">
                                                Gérer la facturation
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8 border-y border-white/10">
                                            <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Commandes</span>
                                                    <span className="text-xs font-bold text-slate-500">82%</span>
                                                </div>
                                                <div className="flex items-end gap-2 mb-4">
                                                    <span className="text-4xl font-black text-white tracking-tight leading-none">824</span>
                                                    <span className="text-slate-500 font-medium mb-1">/ 1,000</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: '82%' }} />
                                                </div>
                                            </div>

                                            <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Temps Restant</span>
                                                    <span className="text-xs font-bold text-slate-500">28J</span>
                                                </div>
                                                <div className="flex items-end gap-2 mb-4">
                                                    <span className="text-4xl font-black text-white tracking-tight leading-none">28</span>
                                                    <span className="text-slate-500 font-medium mb-1">Jours</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full" style={{ width: '93%' }} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
                                            <p>Renouvellement automatique le 28 Fév 2026</p>
                                            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                                <CreditCard size={16} className="text-slate-300" />
                                                <span className="font-mono">•••• 4242</span>
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

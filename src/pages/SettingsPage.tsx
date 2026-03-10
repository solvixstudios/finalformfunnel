import { cn } from '@/lib/utils';
import { Trash2, Upload } from 'lucide-react';
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
    const { setLanguage, language } = useI18n();
    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

    useEffect(() => {
        const tab = searchParams.get('tab') as SettingsTab;
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const tabs = [
        { id: 'profile' as const, label: 'Général' },
        { id: 'language' as const, label: 'Langue & Localisation' },
        { id: 'subscription' as const, label: 'Abonnement & Facturation' },
    ];

    const languages: { code: Language; name: string; locale: string }[] = [
        { code: 'en', name: 'English', locale: 'en-US' },
        { code: 'fr', name: 'Français', locale: 'fr-FR' },
        { code: 'ar', name: 'العربية', locale: 'ar-SA' },
    ];

    const handleTabChange = (tab: SettingsTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    return (
        <div className="max-w-6xl mx-auto w-full h-full flex flex-col pt-8 pb-24 px-4 sm:px-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-8">Paramètres</h1>

            <div className="flex flex-col md:flex-row gap-8 lg:gap-16 flex-1">

                {/* Minimalist Sidebar */}
                <div className="w-full md:w-64 shrink-0 flex flex-col">
                    <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible custom-scroll pb-2 md:pb-0">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={cn(
                                        "flex items-center px-4 py-2.5 rounded-xl transition-colors text-left text-sm font-semibold whitespace-nowrap",
                                        isActive
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* App Version Info */}
                    <div className="hidden md:block mt-8 pt-6 border-t border-slate-100 px-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Application</p>
                        <p className="text-sm font-mono text-slate-600">v{appVersion}</p>
                    </div>
                </div>

                {/* List-Based Main Content Area */}
                <div className="flex-1 max-w-3xl">

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in duration-300">

                            {/* Avatar Row */}
                            <div className="flex items-center gap-6 pb-6 border-b border-slate-200">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName}
                                        className="w-16 h-16 rounded-full object-cover border border-slate-200"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 font-bold text-xl">
                                        {user.displayName?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                        <Upload size={14} />
                                        Upload
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">Nom d'affichage</p>
                                        <p className="text-sm text-slate-500 mt-0.5">{user.displayName}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">Google</span>
                                        <button className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                            Edit
                                        </button>
                                    </div>
                                </div>

                                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">Contact</p>
                                        <p className="text-sm text-slate-500 mt-0.5 whitespace-pre-line">
                                            Email: {user.email}
                                        </p>
                                    </div>
                                    <button className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                        Edit
                                    </button>
                                </div>

                                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">Identifiant Unique</p>
                                        <p className="text-sm font-mono text-slate-500 mt-0.5">{user.id}</p>
                                    </div>
                                    <button className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                        Copy
                                    </button>
                                </div>

                                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">Statut</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100/50 text-emerald-700">
                                                Active
                                            </span>
                                            <span className="text-sm text-slate-500">
                                                Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Language Tab */}
                    {activeTab === 'language' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="pb-6 border-b border-slate-200">
                                <h2 className="text-lg font-bold text-slate-900">Paramètres régionaux</h2>
                                <p className="text-sm text-slate-500 mt-1">Personnalisez la langue et les formats d'affichage.</p>
                            </div>

                            <div className="flex flex-col">
                                {languages.map(lang => (
                                    <div key={lang.code} className="py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-900">{lang.name}</p>
                                            <p className="text-sm text-slate-500 mt-0.5 py-0.5">Locale: {lang.locale}</p>
                                        </div>
                                        <button
                                            onClick={() => setLanguage(lang.code)}
                                            className={cn(
                                                "px-4 py-1.5 rounded-lg border text-sm font-semibold transition-colors",
                                                language === lang.code
                                                    ? "bg-slate-900 border-slate-900 text-white"
                                                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                            )}
                                        >
                                            {language === lang.code ? 'Actuelle' : 'Choisir'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subscription Tab */}
                    {activeTab === 'subscription' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="pb-6 border-b border-slate-200">
                                <h2 className="text-lg font-bold text-slate-900">Forfaits et paiements</h2>
                                <p className="text-sm text-slate-500 mt-1">Gérez votre abonnement et vos informations de facturation.</p>
                            </div>

                            <div className="flex flex-col">
                                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">Forfait Actuel</p>
                                        <div className="flex items-center gap-2 mt-0.5 py-0.5">
                                            <p className="text-sm text-slate-500">PRO Plan</p>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                                                Actif
                                            </span>
                                        </div>
                                    </div>
                                    <button className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                        Manage
                                    </button>
                                </div>

                                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 max-w-sm">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <p className="text-sm font-semibold text-slate-900">Limites de commandes</p>
                                            <p className="text-xs font-semibold text-slate-500">824 / 1000</p>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
                                        </div>
                                    </div>
                                    <button className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                        Upgrade
                                    </button>
                                </div>

                                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">Méthode de Paiement</p>
                                        <p className="text-sm text-slate-500 mt-0.5 py-0.5">Carte se terminant par •••• 4242</p>
                                    </div>
                                    <button className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                        Update
                                    </button>
                                </div>

                                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-900">Prochaine Facture</p>
                                        <p className="text-sm text-slate-500 mt-0.5 py-0.5">Le renouvellement automatique aura lieu le 28 Février 2026</p>
                                    </div>
                                    <button className="px-4 py-1.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Save, Trash2, Upload } from 'lucide-react';
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

    // Form state (simulated)
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [email, setEmail] = useState(user.email || '');

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

    const handleSave = () => {
        // Mock save logic
        console.log('Saved settings:', { displayName, email, language });
    };

    const headerActions = (
        <div className="flex items-center gap-3">
            <Button variant="outline">Annuler</Button>
            <Button onClick={handleSave} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Save size={16} />
                Enregistrer
            </Button>
        </div>
    );

    return (
        <div className="max-w-[1200px] mx-auto w-full flex flex-col px-4 sm:px-8 pb-12">
            <PageHeader
                title="Paramètres"
                breadcrumbs={[{ label: 'Paramètres' }]}
                actions={headerActions}
            />

            <div className="flex flex-col md:flex-row gap-8 lg:gap-12 flex-1 mt-6">

                {/* Minimalist Sidebar */}
                <div className="w-full md:w-64 shrink-0 flex flex-col sticky top-20 h-max">
                    <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={cn(
                                        "flex items-center px-4 py-2.5 rounded-xl transition-colors text-left text-sm font-semibold whitespace-nowrap",
                                        isActive
                                            ? "bg-slate-900 text-white shadow-sm"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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

                {/* Main Content Area - Form Styled */}
                <div className="flex-1 max-w-2xl bg-white border border-slate-200 shadow-sm rounded-2xl h-max mb-12">

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="p-6 md:p-8 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 mb-1">Profil Public</h2>
                                <p className="text-sm text-slate-500">Ces informations sont associées à votre session actuelle.</p>
                            </div>

                            {/* Avatar Row */}
                            <div className="flex items-center gap-6 p-6 md:p-8 border-b border-slate-100">
                                {user.photoURL ? (
                                    <img
                                        src={user.photoURL}
                                        alt={user.displayName}
                                        className="w-20 h-20 rounded-full object-cover border border-slate-200"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400 font-bold text-xl">
                                        {user.displayName?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Upload size={14} />
                                        Upload
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-6 md:p-8 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-900">Nom d'affichage</label>
                                    <Input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="max-w-md"
                                        disabled
                                    />
                                    <p className="text-xs text-slate-500">
                                        Synchronisé via Google OAuth.
                                    </p>
                                </div>

                                <div className="space-y-3 border-t border-slate-100 pt-8">
                                    <label className="text-sm font-semibold text-slate-900">Adresse e-mail</label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="max-w-md"
                                        disabled
                                    />
                                </div>

                                <div className="space-y-3 border-t border-slate-100 pt-8">
                                    <label className="text-sm font-semibold text-slate-900">Identifiant Unique</label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="text"
                                            value={user.id}
                                            readOnly
                                            className="max-w-md font-mono text-slate-500 bg-slate-50"
                                        />
                                        <Button variant="secondary">Copier</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Language Tab */}
                    {activeTab === 'language' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="p-6 md:p-8 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 mb-1">Langue & Région</h2>
                                <p className="text-sm text-slate-500">Personnalisez votre confort d'utilisation.</p>
                            </div>

                            <div className="p-6 md:p-8 space-y-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-slate-900">Langue de l'interface</label>
                                    <div className="max-w-[280px]">
                                        <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choisir une langue" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {languages.map(lang => (
                                                    <SelectItem key={lang.code} value={lang.code}>
                                                        {lang.name} - {lang.locale}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <p className="text-xs text-slate-500">La langue de votre tableau de bord modifie immédiatement tous les textes affichés.</p>
                                </div>

                                <div className="space-y-3 border-t border-slate-100 pt-8">
                                    <label className="text-sm font-semibold text-slate-900">Format d'heure et de Date</label>
                                    <div className="max-w-[280px]">
                                        <Select defaultValue="system">
                                            <SelectTrigger>
                                                <SelectValue placeholder="Format" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="system">Selon le système</SelectItem>
                                                <SelectItem value="24h">24 Heures (14:00)</SelectItem>
                                                <SelectItem value="12h">12 Heures (2:00 PM)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subscription Tab */}
                    {activeTab === 'subscription' && (
                        <div className="animate-in fade-in duration-300">
                            <div className="p-6 md:p-8 border-b border-slate-100">
                                <h2 className="text-lg font-bold text-slate-900 mb-1">Abonnement & Facturation</h2>
                                <p className="text-sm text-slate-500">Gérez votre formule, observez vos limites et mettez à jour votre paiement.</p>
                            </div>

                            <div className="p-6 md:p-8">
                                {/* Plan Card Minimal */}
                                <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-5 mb-8">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-slate-900 tracking-tight">PRO Plan</span>
                                            <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">Actif</span>
                                        </div>
                                        <Button size="sm" variant="outline" className="bg-white">Modifier</Button>
                                    </div>
                                    <p className="text-sm text-slate-600">Renouvellement le 28 Février 2026 pour 49.00€</p>
                                </div>

                                {/* Usage Limits */}
                                <div className="space-y-4 mb-8">
                                    <label className="text-sm font-semibold text-slate-900 block">Utilisation ce mois-ci</label>

                                    <div>
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-sm text-slate-600 font-medium">Commandes Totales</span>
                                            <span className="text-sm font-mono text-slate-900 font-semibold">824 <span className="text-slate-400 font-normal">/ 1000</span></span>
                                        </div>
                                        <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                            <div className="h-full bg-slate-900 rounded-full" style={{ width: '82%' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 border-t border-slate-100 pt-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-900 block mb-1">Moyen de paiement</label>
                                            <p className="text-sm text-slate-500">Mastercard se terminant par •••• 4242</p>
                                        </div>
                                        <Button variant="secondary" size="sm">Mettre à jour</Button>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <label className="text-sm font-semibold text-slate-900 block mb-1">Factures</label>
                                            <p className="text-sm text-slate-500">Téléchargez vos factures passées.</p>
                                        </div>
                                        <Button variant="secondary" size="sm">Historique</Button>
                                    </div>
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

import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { Camera, Save, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

    // Form state
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [photoUrl, setPhotoUrl] = useState(user.photoURL || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const tab = searchParams.get('tab') as SettingsTab;
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const tabs = [
        { id: 'profile' as const, label: 'Général', desc: 'Vos infos personnelles' },
        { id: 'language' as const, label: 'Langue & Localisation', desc: 'Affichage et régionalisation' },
        { id: 'subscription' as const, label: 'Abonnement', desc: 'Historique des paiements' },
    ];

    const languages: { code: Language; name: string; locale: string }[] = [
        { code: 'en', name: 'English', locale: 'en-US' },
        { code: 'fr', name: 'Français', locale: 'fr-FR' },
        { code: 'ar', name: 'العربية', locale: 'ar-SA' },
    ];

    // Mock Offline Transaction History
    const transactions = [
        { id: 'TRX-9284', plan: 'PRO Plan', status: 'Actif', start: '2025-02-28', end: '2026-02-28', amount: '490.00 MAD' },
        { id: 'TRX-4421', plan: 'STARTER Plan', status: 'Expiré', start: '2024-02-28', end: '2025-02-28', amount: '290.00 MAD' },
    ];

    const handleTabChange = (tab: SettingsTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const handleSave = () => {
        console.log('Saved settings:', { displayName, photoUrl, language });
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Mock file upload by creating a local object URL
            const url = URL.createObjectURL(file);
            setPhotoUrl(url);
        }
    };

    const handleRemoveAvatar = () => {
        setPhotoUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const headerActions = (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">Annuler</Button>
            <Button onClick={handleSave} size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                <Save size={14} />
                Enregistrer
            </Button>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto w-full flex flex-col px-4 sm:px-6 lg:px-8 pb-12">
            <PageHeader
                title="Paramètres"
                breadcrumbs={[{ label: 'Paramètres' }]}
                actions={headerActions}
            />

            <div className="flex flex-col md:flex-row gap-8 flex-1 mt-6">

                {/* Modern Sidebar */}
                <aside className="w-full md:w-64 shrink-0">
                    <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 sticky top-20">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={cn(
                                        "flex flex-col items-start px-4 py-3 rounded-lg transition-all text-left whitespace-nowrap min-w-[200px] md:min-w-0 md:w-full",
                                        isActive
                                            ? "bg-slate-900 border border-slate-900 shadow-md"
                                            : "bg-transparent border border-transparent hover:bg-slate-100/80"
                                    )}
                                >
                                    <span className={cn("text-sm font-semibold", isActive ? "text-white" : "text-slate-900")}>
                                        {tab.label}
                                    </span>
                                    <span className={cn("text-xs mt-0.5 hidden md:block", isActive ? "text-slate-300" : "text-slate-500")}>
                                        {tab.desc}
                                    </span>
                                </button>
                            );
                        })}

                        {/* App Version Info */}
                        <div className="hidden md:block mt-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Version</p>
                            <p className="text-sm font-mono font-semibold text-slate-700">v{appVersion}</p>
                        </div>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 max-w-3xl">

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profil Public</CardTitle>
                                    <CardDescription>Gérez votre identité et vos informations de contact principal.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">

                                    {/* Avatar Upload */}
                                    <div className="flex items-center gap-6">
                                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            {photoUrl ? (
                                                <img
                                                    src={photoUrl}
                                                    alt={displayName}
                                                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm transition-opacity group-hover:opacity-80"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200 text-slate-400 font-bold text-xl group-hover:bg-slate-200 transition-colors">
                                                    {displayName?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="text-white w-6 h-6" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-semibold text-slate-900">Photo de profil</h3>
                                            <p className="text-xs text-slate-500 max-w-[200px]">Cliquez sur l'image pour uploader une nouvelle photo (JPG, PNG).</p>
                                        </div>
                                        {photoUrl !== user.photoURL && photoUrl !== '' && (
                                            <Button variant="ghost" size="icon" onClick={handleRemoveAvatar} className="ml-auto text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Nom complet</label>
                                            <Input
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="max-w-md"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-slate-900">Adresse e-mail de connexion</label>
                                            <Input
                                                value={user.email || ''}
                                                className="max-w-md bg-slate-50 text-slate-500 cursor-not-allowed"
                                                disabled
                                                readOnly
                                            />
                                            <p className="text-xs text-slate-500">Votre email est géré par la connexion Google OAuth et ne peut être modifié ici.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Sécurité du Compte</CardTitle>
                                    <CardDescription>Informations d'identification interne.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-semibold text-slate-900">Votre ID Final Form</label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                value={user.id}
                                                readOnly
                                                className="max-w-[280px] font-mono text-slate-500 bg-slate-50"
                                            />
                                            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(user.id)}>Copier</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Language Tab */}
                    {activeTab === 'language' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Préférences Régionales</CardTitle>
                                    <CardDescription>Personnalisez la langue et les formats d'affichage pour votre tableau de bord.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-slate-900">Langue de l'interface</label>
                                        <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                                            <SelectTrigger className="max-w-[280px]">
                                                <SelectValue placeholder="Choisir une langue" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {languages.map(lang => (
                                                    <SelectItem key={lang.code} value={lang.code}>
                                                        {lang.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-slate-500 mt-1">La modification s'applique immédiatement à tous les menus.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Subscription Tab Offline Payments */}
                    {activeTab === 'subscription' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <Card className="border-indigo-100 bg-indigo-50/20 shadow-none">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-indigo-950">Abonnement Actuel</CardTitle>
                                            <CardDescription className="text-indigo-900/60 mt-1">Votre accès premium à Final Form.</CardDescription>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Actif
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <h2 className="text-3xl font-black text-slate-900">PRO Plan</h2>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">
                                        Paiement hors ligne valide du <strong className="text-slate-900">28 Février 2025</strong> au <strong className="text-slate-900">28 Février 2026</strong>.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Historique des Paiements</CardTitle>
                                    <CardDescription>Consultez vos reçus et transactions traitées hors ligne par notre équipe.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>N° Transaction</TableHead>
                                                <TableHead>Forfait</TableHead>
                                                <TableHead>Période</TableHead>
                                                <TableHead>Montant</TableHead>
                                                <TableHead className="text-right">Statut</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map((trx) => (
                                                <TableRow key={trx.id}>
                                                    <TableCell className="font-mono text-xs">{trx.id}</TableCell>
                                                    <TableCell className="font-semibold text-slate-900">{trx.plan}</TableCell>
                                                    <TableCell className="text-slate-500 text-xs">
                                                        {trx.start} <br /> {trx.end}
                                                    </TableCell>
                                                    <TableCell className="font-semibold">{trx.amount}</TableCell>
                                                    <TableCell className="text-right">
                                                        <span className={cn(
                                                            "px-2 py-1 flex items-center justify-center max-w-[80px] ml-auto rounded-md text-[10px] font-bold uppercase tracking-wider",
                                                            trx.status === 'Actif'
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                                : "bg-slate-100 text-slate-600 border border-slate-200"
                                                        )}>
                                                            {trx.status}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

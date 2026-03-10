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
import { Camera, Save, Trash2, User as UserIcon, Copy } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
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
        { id: 'TRX-9284', plan: 'PRO Plan', status: 'Actif', start: '2025-02-28', end: '2026-02-28', amount: '49.00 USD' },
        { id: 'TRX-4421', plan: 'STARTER Plan', status: 'Expiré', start: '2024-02-28', end: '2025-02-28', amount: '29.00 USD' },
    ];

    const handleTabChange = (tab: SettingsTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const handleSave = () => {
        console.log('Saved settings:', { displayName, photoUrl, language });
        toast.success('Paramètres enregistrés', {
            description: "Vos modifications ont été sauvegardées avec succès."
        });
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPhotoUrl(url);
        }
    };

    const handleRemoveAvatar = () => {
        setPhotoUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(user.id);
        toast.success("Copié !", {
            description: "Identifiant copié dans le presse-papiers.",
            duration: 2000
        });
    };

    const headerActions = (
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-[#908878] hover:text-[#4A443A] hover:bg-[#E6E0D3]/50">
                Annuler
            </Button>
            <Button onClick={handleSave} size="sm" className="gap-2 bg-[#FF5A1F] hover:bg-[#E04D1A] text-white rounded-md shadow-sm border-0 font-semibold">
                <Save size={14} />
                Enregistrer
            </Button>
        </div>
    );

    return (
        <div className="flex flex-col font-sans w-full pb-12">
            <PageHeader
                title="Paramètres"
                breadcrumbs={[{ label: 'Paramètres' }]}
                actions={headerActions}
            />

            <div className="flex flex-col md:flex-row gap-6 lg:gap-8 flex-1 mt-6">

                {/* Custom Styled Sidebar */}
                <aside className="w-full md:w-[220px] shrink-0">
                    <nav className="flex flex-row md:flex-col gap-1 w-full bg-[#EFEBE0] p-3 rounded-2xl border border-[#E2DCCF]">
                        <h4 className="hidden md:block text-[9px] font-bold text-[#A69D8A] tracking-[0.12em] uppercase mb-2 px-2 pt-1">
                            Navigation
                        </h4>
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={cn(
                                        "group flex flex-col items-start px-3 py-2 text-[13px] font-semibold transition-all w-full relative text-left rounded-lg whitespace-nowrap overflow-hidden",
                                        isActive
                                            ? "bg-[#E6E0D3] text-[#FF5A1F]"
                                            : "text-[#908878] hover:bg-[#E6E0D3]/60 hover:text-[#FF5A1F]"
                                    )}
                                >
                                    <span className={isActive ? "text-[#FF5A1F]" : "text-[#4A443A] group-hover:text-[#FF5A1F] transition-colors"}>
                                        {tab.label}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-medium mt-0.5 hidden md:block truncate w-full transition-colors",
                                        isActive ? "text-[#FF5A1F]/70" : "text-[#908878]"
                                    )}>
                                        {tab.desc}
                                    </span>
                                </button>
                            );
                        })}

                        {/* App & User Info Sidebar Additions */}
                        <div className="hidden md:flex flex-col gap-4 mt-4 pt-4 border-t border-[#DDD7C8] px-2 text-left">
                            <div>
                                <p className="text-[9px] font-bold text-[#A69D8A] uppercase tracking-[0.12em] mb-1">Version APP</p>
                                <p className="text-xs font-mono font-semibold text-[#4A443A] truncate">v{appVersion}</p>
                            </div>

                            <div className="group cursor-pointer" onClick={handleCopyId}>
                                <p className="text-[9px] font-bold text-[#A69D8A] uppercase tracking-[0.12em] mb-1 flex items-center justify-between">
                                    Identifiant ID
                                    <Copy size={10} className="text-[#A69D8A] opacity-0 group-hover:opacity-100 transition-opacity" />
                                </p>
                                <p className="text-[10px] font-mono font-semibold text-[#A69D8A] truncate w-full group-hover:text-[#FF5A1F] transition-colors" title={user.id}>
                                    {user.id}
                                </p>
                            </div>
                        </div>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 max-w-4xl min-w-0">

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            <Card className="rounded-xl border-[#E2DCCF] shadow-sm bg-white overflow-hidden">
                                <CardContent className="space-y-8 pt-6">

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
                                                    className="w-20 h-20 rounded-2xl object-cover border border-[#E2DCCF] shadow-sm transition-opacity group-hover:opacity-80"
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl bg-[#EFEBE0] flex items-center justify-center border border-[#E2DCCF] text-[#A69D8A] font-bold text-xl group-hover:bg-[#E6E0D3] transition-colors">
                                                    {displayName?.charAt(0) || <UserIcon size={24} />}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-[#4A443A]/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="text-white w-6 h-6" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-sm font-semibold text-[#4A443A]">Photo de profil</h3>
                                            <p className="text-xs text-[#908878] max-w-[200px]">Cliquez sur l'image pour uploader une nouvelle photo (JPG, PNG).</p>
                                        </div>
                                        {photoUrl !== user.photoURL && photoUrl !== '' && (
                                            <Button variant="ghost" size="icon" onClick={handleRemoveAvatar} className="ml-auto text-red-500 hover:text-red-700 hover:bg-red-50">
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-[#4A443A]">Nom complet</label>
                                            <Input
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="max-w-md border-[#E2DCCF] focus-visible:ring-[#FF5A1F]"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-sm font-semibold text-[#4A443A]">Adresse e-mail de connexion</label>
                                            <Input
                                                value={user.email || ''}
                                                className="max-w-md bg-[#FAF9F6] border-[#E2DCCF] text-[#908878] cursor-not-allowed"
                                                disabled
                                                readOnly
                                            />
                                            <p className="text-xs text-[#908878]">Votre email est géré par la connexion Google OAuth et ne peut être modifié ici.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Language Tab */}
                    {activeTab === 'language' && (
                        <div className="space-y-6 animate-fade-in">
                            <Card className="rounded-xl border-[#E2DCCF] shadow-sm bg-white overflow-hidden">
                                <CardContent className="pt-6">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-semibold text-[#4A443A]">Langue Globale</label>
                                        <p className="text-xs text-[#908878] mb-2">Modifiez la langue de tous les menus de votre compte.</p>
                                        <div className="max-w-md">
                                            <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                                                <SelectTrigger className="border-[#E2DCCF] focus:ring-[#FF5A1F]">
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
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Subscription Tab Offline Payments */}
                    {activeTab === 'subscription' && (
                        <div className="space-y-6 animate-fade-in">
                            <Card className="rounded-xl border-[#FF5A1F]/20 bg-[#FF5A1F]/5 shadow-none overflow-hidden">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg text-[#FF5A1F]">Abonnement Actuel</CardTitle>
                                            <CardDescription className="text-[#4A443A]/70 mt-1">Votre accès premium à Final Form.</CardDescription>
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-[#FF5A1F] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                                            Actif
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <h2 className="text-3xl font-black text-[#4A443A] tracking-tight">PRO Plan</h2>
                                    </div>
                                    <p className="text-sm font-medium text-[#908878]">
                                        Paiement hors ligne valide du <strong className="text-[#4A443A]">28 Février 2025</strong> au <strong className="text-[#4A443A]">28 Février 2026</strong>.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-xl border-[#E2DCCF] shadow-sm bg-white overflow-hidden">
                                <CardHeader className="bg-[#FAF9F6] border-b border-[#E2DCCF] pb-4">
                                    <CardTitle className="text-lg text-[#4A443A]">Historique des Paiements</CardTitle>
                                    <CardDescription className="text-[#908878]">Consultez vos reçus et transactions traitées hors ligne par notre équipe.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-[#FAF9F6]">
                                            <TableRow className="border-[#E2DCCF] hover:bg-transparent">
                                                <TableHead className="font-semibold text-[#908878] pl-6">N° Transaction</TableHead>
                                                <TableHead className="font-semibold text-[#908878]">Forfait</TableHead>
                                                <TableHead className="font-semibold text-[#908878]">Période</TableHead>
                                                <TableHead className="font-semibold text-[#908878]">Montant</TableHead>
                                                <TableHead className="text-right font-semibold text-[#908878] pr-6">Statut</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map((trx, idx) => (
                                                <TableRow key={trx.id} className={cn("border-[#E2DCCF]", idx % 2 === 0 ? "bg-white" : "bg-[#FAF9F6]/50")}>
                                                    <TableCell className="font-mono text-xs text-[#908878] pl-6">{trx.id}</TableCell>
                                                    <TableCell className="font-semibold text-[#4A443A]">{trx.plan}</TableCell>
                                                    <TableCell className="text-[#908878] text-xs">
                                                        {trx.start} <br /> {trx.end}
                                                    </TableCell>
                                                    <TableCell className="font-bold text-[#4A443A]">{trx.amount}</TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <span className={cn(
                                                            "px-2 py-1 flex items-center justify-center max-w-[80px] ml-auto rounded-md text-[10px] font-bold uppercase tracking-wider",
                                                            trx.status === 'Actif'
                                                                ? "bg-[#E6E0D3] text-[#4A443A] border border-[#D9D1C3]"
                                                                : "bg-transparent text-[#A69D8A] border border-[#E2DCCF]"
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

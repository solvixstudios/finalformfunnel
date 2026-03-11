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
import { Camera, Save, Trash2, User as UserIcon, Copy, Loader2, Crown, Download, CheckCircle2, FileText } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useI18n } from '../lib/i18n/i18nContext';
import { Language } from '../lib/i18n/translations';
import { useChangelog } from '../hooks/useChangelog';
import { GoogleUser, storeUser } from '../lib/authGoogle';

// __APP_VERSION__ is injected by Vite during build
declare const __APP_VERSION__: string;

interface SettingsPageProps {
    user: GoogleUser;
    onUserUpdate?: (user: GoogleUser) => void;
}

export type SettingsTab = 'profile' | 'language' | 'subscription' | 'integrations' | 'billing' | 'changelog';

const SettingsPage = ({ user, onUserUpdate }: SettingsPageProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
    const { setLanguage, language } = useI18n();
    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
    const { entries } = useChangelog();

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
        { id: 'profile' as const, label: 'Profile', desc: 'Gérer vos informations personnelles' },
        { id: 'language' as const, label: 'Langue & Localisation', desc: 'Affichage et régionalisation' },
        { id: 'subscription' as const, label: 'Abonnement', desc: 'Historique des paiements' },
        { id: 'changelog' as const, label: 'Changelog', desc: 'App updates & version history' },
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

    const [isSaving, setIsSaving] = useState(false);

    const handleTabChange = (tab: SettingsTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update Google User in Firebase Auth
            await import('../lib/authGoogle').then(m => m.updateUserProfile(displayName, photoUrl || user.photoURL));

            const updatedUser: GoogleUser = {
                ...user,
                displayName,
                photoURL: photoUrl || user.photoURL
            };

            // Persist local profile edits immediately
            import('../lib/authGoogle').then(m => m.storeUser(updatedUser));
            if (onUserUpdate) {
                onUserUpdate(updatedUser);
            }

            toast.success('Paramètres enregistrés', {
                description: "Vos modifications ont été sauvegardées avec succès."
            });
        } catch (error: any) {
            console.error("Failed to save user settings:", error);
            toast.error('Erreur', {
                description: "Impossible d'enregistrer vos paramètres : " + (error.message || "Erreur inconnue")
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // NOTE: For a full CRUD backend, you would upload this file to a Storage Bucket (e.g. Firebase Storage or AWS S3)
            // and then pass the resulting public URL to setPhotoUrl. Here we create a local object URL which only works locally.
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
            <Button disabled={isSaving} variant="ghost" size="sm" className="text-[#908878] hover:text-[#4A443A] hover:bg-[#E6E0D3]/50">
                Annuler
            </Button>
            <Button disabled={isSaving} onClick={handleSave} size="sm" className="gap-2 bg-[#FF5A1F] hover:bg-[#E04D1A] text-white rounded-md shadow-sm border-0 font-semibold">
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
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
                                            ? "bg-[#FF5A1F]/10 text-[#FF5A1F]"
                                            : "text-[#908878] hover:bg-[#E6E0D3]/60 hover:text-[#4A443A]"
                                    )}
                                >
                                    <span className={isActive ? "text-[#FF5A1F]" : "text-[#4A443A] group-hover:text-[#FF5A1F] transition-colors"}>
                                        {tab.label}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-medium mt-0.5 hidden md:block truncate w-full transition-colors",
                                        isActive ? "text-[#FF5A1F]/80" : "text-[#908878] group-hover:text-[#7A7365]"
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
                            <Card className="relative rounded-2xl border-[#E2DCCF] bg-gradient-to-br from-[#FFF8F3] to-white shadow-sm overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                                    <Crown className="w-48 h-48 text-[#FF5A1F] -mr-8 -mt-8 rotate-12" />
                                </div>
                                <CardHeader className="pb-4 relative z-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[#FF5A1F]/10 flex items-center justify-center shrink-0">
                                                <Crown className="w-5 h-5 text-[#FF5A1F]" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-bold text-[#4A443A] leading-tight">Forfait Actuel</CardTitle>
                                                <CardDescription className="text-[#908878] font-medium mt-0.5">Votre accès premium à Final Form.</CardDescription>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full bg-[#E6F4EA] text-[#137333] border border-[#137333]/20 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm w-fit">
                                            <CheckCircle2 size={14} strokeWidth={2.5} />
                                            Actif
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10 border-t border-[#E2DCCF]/50 pt-6">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div>
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <h2 className="text-4xl font-black text-[#4A443A] tracking-tight">PRO Plan</h2>
                                            </div>
                                            <p className="text-[13px] font-medium text-[#908878]">
                                                Paiement hors ligne valide du <strong className="text-[#4A443A]">28 Fév 2025</strong> au <strong className="text-[#4A443A]">28 Fév 2026</strong>.
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-start md:items-end">
                                            <p className="text-[11px] font-bold text-[#A69D8A] uppercase tracking-widest mb-1">Renouvellement</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-[#137333] animate-pulse"></span>
                                                <p className="text-sm font-semibold text-[#4A443A]">Dans 354 jours</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-2xl border-[#E2DCCF] shadow-sm bg-white overflow-hidden">
                                <CardHeader className="bg-white border-b border-[#E2DCCF] pb-5 pt-6 px-6">
                                    <CardTitle className="text-lg font-bold text-[#4A443A]">Historique des Paiements</CardTitle>
                                    <CardDescription className="text-[#908878] font-medium mt-1">Consultez vos reçus et transactions traitées par notre équipe.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-[#FAF9F6]">
                                                <TableRow className="border-[#E2DCCF] hover:bg-transparent">
                                                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase pl-6 py-4">Transaction</TableHead>
                                                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4">Forfait</TableHead>
                                                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4">Période</TableHead>
                                                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4">Montant</TableHead>
                                                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4 text-center">Statut</TableHead>
                                                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase pr-6 py-4 text-right">Facture</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {transactions.map((trx, idx) => (
                                                    <TableRow key={trx.id} className="border-b border-[#E2DCCF]/60 last:border-0 hover:bg-[#FAF9F6] transition-colors group">
                                                        <TableCell className="pl-6 py-4">
                                                            <div className="font-mono text-[13px] font-semibold text-[#4A443A]">{trx.id}</div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#F2EFE8] text-[#4A443A] text-xs font-bold border border-[#E2DCCF]">
                                                                {trx.plan}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="flex flex-col gap-0.5 text-[13px] font-medium text-[#7A7365]">
                                                                <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#E2DCCF]"></span> {trx.start}</span>
                                                                <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-[#A69D8A]"></span> {trx.end}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="py-4">
                                                            <div className="font-bold text-[#4A443A]">{trx.amount}</div>
                                                        </TableCell>
                                                        <TableCell className="py-4 text-center">
                                                            <span className={cn(
                                                                "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest min-w-[70px]",
                                                                trx.status === 'Actif'
                                                                    ? "bg-[#E6F4EA] text-[#137333] border border-[#137333]/20 shadow-sm"
                                                                    : "bg-transparent text-[#A69D8A] border border-[#E2DCCF]"
                                                            )}>
                                                                {trx.status}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="pr-6 py-4 text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-[#908878] hover:text-[#FF5A1F] hover:bg-[#FF5A1F]/10 h-8 w-8"
                                                                title="Télécharger la facture"
                                                            >
                                                                <Download size={16} strokeWidth={2.5} />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Changelog Tab */}
                    {activeTab === 'changelog' && (
                        <div className="space-y-6 animate-fade-in">
                            <Card className="rounded-xl border-[#E2DCCF] shadow-sm bg-white overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="bg-gradient-to-br from-[#FF5A1F] to-[#E04812] px-8 py-10 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 rounded-full blur-[60px] pointer-events-none -translate-y-1/2 translate-x-1/4" />
                                        <div className="relative z-10 max-w-2xl">
                                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[11px] font-bold tracking-widest uppercase mb-4">
                                                <FileText size={12} /> Version History
                                            </div>
                                            <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                                                What's New in Final Form
                                            </h2>
                                            <p className="text-white/80 font-medium mt-2 max-w-lg">
                                                Discover the latest updates, improvements, and bug fixes. We're constantly working to make your experience better.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-8 max-w-3xl">
                                        {entries.length > 0 ? (
                                            <div className="space-y-12">
                                                {entries.map((entry, idx) => (
                                                    <div key={idx} className="relative pl-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-[-48px] before:w-[2px] last:before:hidden before:bg-slate-100">
                                                        <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-slate-100 flex items-center justify-center shadow-sm z-10" />
                                                        
                                                        <div className="mb-6">
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">v{entry.version}</h3>
                                                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{entry.date}</span>
                                                            </div>
                                                            {idx === 0 && (
                                                                <span className="inline-block mt-2 text-[10px] font-bold text-[#FF5A1F] bg-[#FF5A1F]/10 border border-[#FF5A1F]/20 px-2 flex-col items-start px-2 py-0.5 rounded-md uppercase tracking-widest">
                                                                    Latest Release
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="space-y-6">
                                                            {entry.categories.map((cat, cIdx) => (
                                                                <div key={cIdx} className="bg-[#F8F5F1] rounded-2xl p-5 border border-slate-200/60">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <span className="text-base">{cat.emoji}</span>
                                                                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">{cat.type}</h4>
                                                                    </div>
                                                                    <ul className="space-y-2.5">
                                                                        {cat.items.map((item, iIdx) => (
                                                                            <li key={iIdx} className="text-[13px] font-medium text-slate-600 leading-relaxed pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-1.5 before:h-1.5 before:rounded-full before:bg-[#FF5A1F]/40">
                                                                                <span dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900 font-bold">$1</strong>') }} />
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                    <FileText className="text-slate-300" />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900">No release notes found</h3>
                                                <p className="text-xs text-slate-500 mt-1">Check back later for updates.</p>
                                            </div>
                                        )}
                                    </div>
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

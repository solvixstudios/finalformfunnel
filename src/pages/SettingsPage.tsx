import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Camera, Save, Trash2, User as UserIcon, Copy, Loader2, FileText } from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useI18n } from '../lib/i18n/i18nContext';
import { Language } from '../lib/i18n/translations';
import { GoogleUser } from '../lib/authGoogle';
import ChangelogDialog from '@/components/ChangelogDialog';

// __APP_VERSION__ is injected by Vite during build
declare const __APP_VERSION__: string;

interface SettingsPageProps {
    user: GoogleUser;
    onUserUpdate?: (user: GoogleUser) => void;
}

export type SettingsTab = 'profile' | 'language';

const SettingsPage = ({ user, onUserUpdate }: SettingsPageProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
    const { setLanguage, language } = useI18n();
    const appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
    const [showChangelog, setShowChangelog] = useState(false);

    // Profile form state
    const [displayName, setDisplayName] = useState(user.displayName || '');
    const [photoUrl, setPhotoUrl] = useState(user.photoURL || '');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const tab = searchParams.get('tab') as SettingsTab;
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const tabs = [
        { id: 'profile' as const, label: 'Profile' },
        { id: 'language' as const, label: 'Language' },
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await import('../lib/authGoogle').then(m => m.updateUserProfile(displayName, photoUrl || user.photoURL));

            const updatedUser: GoogleUser = {
                ...user,
                displayName,
                photoURL: photoUrl || user.photoURL
            };

            import('../lib/authGoogle').then(m => m.storeUser(updatedUser));
            if (onUserUpdate) {
                onUserUpdate(updatedUser);
            }

            toast.success('Settings saved', {
                description: "Your changes have been saved successfully."
            });
        } catch (error: any) {
            console.error("Failed to save user settings:", error);
            toast.error('Error', {
                description: "Could not save your settings: " + (error.message || "Unknown error")
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPhotoUrl(URL.createObjectURL(file));
    };

    const handleRemoveAvatar = () => {
        setPhotoUrl('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(user.id);
        toast.success("Copied!", { description: "User ID copied to clipboard.", duration: 2000 });
    };

    // Tabs rendered inside the header
    const headerTabs = (
        <div className="flex items-center h-full">
            <div className="flex items-center gap-1 p-0.5 bg-[#F2EFE8] rounded-lg border border-[#E6E0D3]">
                {tabs.map((tab) => {
                    const isAct = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={cn(
                                "px-3 py-1 text-[12px] font-bold rounded-md transition-all whitespace-nowrap",
                                isAct
                                    ? "bg-white text-[#FF5A1F] shadow-sm border border-[#E2DCCF]"
                                    : "text-[#908878] hover:text-[#4A443A]"
                            )}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const memoizedActions = useMemo(() => (
        <Button disabled={isSaving} onClick={handleSave} size="sm" className="gap-2 rounded-md shadow-sm font-semibold">
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
        </Button>
    ), [isSaving, handleSave]);

    return (
        <div className="flex flex-col font-sans w-full pb-12">
            <PageHeader
                title="Settings"
                breadcrumbs={[{ label: 'Settings' }]}
                actions={memoizedActions}
            >
                {headerTabs}
            </PageHeader>

            {/* Mobile tab bar */}
            <div className="lg:hidden w-full overflow-x-auto scrollbar-hide px-1 pt-2 pb-1">
                <div className="flex items-center gap-1 p-0.5 bg-[#F2EFE8] rounded-lg border border-[#E6E0D3] w-max mx-auto">
                    {tabs.map((tab) => {
                        const isAct = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={cn(
                                    "px-3 py-1.5 text-[12px] font-bold rounded-md transition-all whitespace-nowrap",
                                    isAct
                                        ? "bg-white text-[#FF5A1F] shadow-sm border border-[#E2DCCF]"
                                        : "text-[#908878] hover:text-[#4A443A]"
                                )}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 w-full mt-4 sm:mt-6">

                {/* ─── Profile Tab ─── */}
                {activeTab === 'profile' && (
                    <div className="space-y-5 animate-fade-in">
                        <Card className="rounded-xl border-[#E2DCCF] shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-5 sm:p-6">
                                <div className="flex flex-col sm:flex-row gap-6">
                                    {/* Avatar */}
                                    <div className="flex flex-col items-center sm:items-start gap-3 shrink-0">
                                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                            {photoUrl ? (
                                                <img src={photoUrl} alt={displayName} className="w-20 h-20 rounded-2xl object-cover border border-[#E2DCCF] shadow-sm transition-opacity group-hover:opacity-80" />
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl bg-[#EFEBE0] flex items-center justify-center border border-[#E2DCCF] text-[#A69D8A] font-bold text-xl group-hover:bg-[#E6E0D3] transition-colors">
                                                    {displayName?.charAt(0) || <UserIcon size={24} />}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-[#4A443A]/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="text-white w-6 h-6" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-[#908878] text-center sm:text-left max-w-[100px]">JPG, PNG. Click to change.</p>
                                        {photoUrl !== user.photoURL && photoUrl !== '' && (
                                            <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 text-[11px] px-2">
                                                <Trash2 size={12} className="mr-1" /> Remove
                                            </Button>
                                        )}
                                    </div>

                                    {/* Fields */}
                                    <div className="flex-1 grid gap-5 min-w-0">
                                        <div className="grid gap-1.5">
                                            <label className="text-[12px] font-bold text-[#4A443A]">Display Name</label>
                                            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="border-[#E2DCCF] focus-visible:ring-[#FF5A1F] h-9" placeholder="John Doe" />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <label className="text-[12px] font-bold text-[#4A443A]">Email (OAuth)</label>
                                            <Input value={user.email || ''} className="bg-[#FAF9F6] border-[#E2DCCF] text-[#908878] cursor-not-allowed h-9" disabled readOnly />
                                            <p className="text-[10px] text-[#A69D8A]">Managed by Google OAuth.</p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#E2DCCF]">
                                            <div className="grid gap-1.5">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[12px] font-bold text-[#4A443A]">User ID</label>
                                                    <button onClick={handleCopyId} className="text-[#FF5A1F] hover:underline flex items-center gap-1 text-[11px] font-semibold"><Copy size={11} /> Copy</button>
                                                </div>
                                                <Input value={user.id} className="bg-[#FAF9F6] border-[#E2DCCF] text-[#908878] font-mono cursor-not-allowed text-[11px] h-9" disabled readOnly />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <label className="text-[12px] font-bold text-[#4A443A]">App Version</label>
                                                <div className="h-9 flex items-center justify-between px-3 rounded-md border border-[#E2DCCF] bg-[#FAF9F6]">
                                                    <span className="text-[12px] font-mono font-semibold text-[#908878]">v{appVersion}</span>
                                                    <button
                                                        onClick={() => setShowChangelog(true)}
                                                        className="flex items-center gap-1 text-[10px] font-bold text-[#FF5A1F] hover:underline"
                                                    >
                                                        <FileText size={11} /> Changelog
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ─── Language Tab ─── */}
                {activeTab === 'language' && (
                    <div className="animate-fade-in">
                        <Card className="rounded-xl border-[#E2DCCF] shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-5 sm:p-6">
                                <div className="grid gap-2 max-w-md">
                                    <label className="text-[12px] font-bold text-[#4A443A]">Global Language</label>
                                    <p className="text-[11px] text-[#908878] mb-1">Changes the language across all menus in your account.</p>
                                    <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                                        <SelectTrigger className="border-[#E2DCCF] focus:ring-[#FF5A1F] h-9">
                                            <SelectValue placeholder="Choose a language" />
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
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Changelog Popup */}
            <ChangelogDialog open={showChangelog} onClose={() => setShowChangelog(false)} />
        </div>
    );
};

export default SettingsPage;

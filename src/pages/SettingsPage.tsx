import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { cn } from '@/lib/utils';
import { Check, CreditCard, Globe, Settings, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GoogleUser } from '../lib/authGoogle';
import { useI18n } from '../lib/i18n/i18nContext';
import { Language } from '../lib/i18n/translations';

interface SettingsPageProps {
    user: GoogleUser;
}

type SettingsTab = 'profile' | 'language' | 'subscription';

const SettingsPage = ({ user }: SettingsPageProps) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
    const { t, language, setLanguage } = useI18n();

    useEffect(() => {
        const tab = searchParams.get('tab') as SettingsTab;
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const tabs = [
        { id: 'profile' as const, label: 'Profile', icon: <User size={16} /> },
        { id: 'language' as const, label: 'Language', icon: <Globe size={16} /> },
        { id: 'subscription' as const, label: 'Subscription', icon: <CreditCard size={16} /> },
    ];

    const languages: { code: Language; name: string; flag: string }[] = [
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
    ];

    const handleTabChange = (tab: SettingsTab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    return (
        <div className="max-w-[1600px] mx-auto w-full space-y-6 h-full flex flex-col pt-2 md:pt-4 pb-24">
            <PageHeader
                title="Settings"
                breadcrumbs={[{ label: 'Settings' }]}
                icon={Settings}
            />

            {/* Settings Container */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-[240px_1fr] flex-1">
                {/* Sidebar Tabs */}
                <div className="border-b md:border-b-0 md:border-r border-slate-200 bg-[#F8F5F1] p-4 sm:p-6">
                    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-slate-950 text-white shadow-sm"
                                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-200/50"
                                )}
                            >
                                <span className={cn(
                                    "shrink-0",
                                    activeTab === tab.id ? "text-[#FF5A1F]" : "text-slate-400"
                                )}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 md:p-8 overflow-y-auto w-full max-w-3xl">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Profile</h2>
                                <p className="text-sm text-slate-500">Manage your account details.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start gap-8">
                                <div className="relative shrink-0">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName}
                                            className="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-sm"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center border-4 border-slate-50 shadow-sm">
                                            <User size={32} className="text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 w-full space-y-5 mt-2 sm:mt-0">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Display Name</label>
                                        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50">
                                            <span className="text-sm font-medium text-slate-900">{user.displayName}</span>
                                            <span className="ml-auto text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 py-0.5 bg-slate-200/50 rounded-md border border-slate-200">Google</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 mb-1.5 block">Email Address</label>
                                        <div className="px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-600">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Info */}
                            <div className="pt-8 border-t border-slate-200">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Account Info</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200">
                                        <p className="text-xs font-semibold text-slate-500 mb-1">Account ID</p>
                                        <p className="font-mono text-xs font-medium text-slate-700 break-all">{user.id}</p>
                                    </div>
                                    <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-200">
                                        <p className="text-xs font-semibold text-slate-500 mb-1">Member Since</p>
                                        <p className="text-sm font-semibold text-slate-900">{new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Language Tab */}
                    {activeTab === 'language' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Language</h2>
                                <p className="text-sm text-slate-500">Choose your preferred interface language.</p>
                            </div>

                            <div className="grid gap-3">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        className={cn(
                                            "flex items-center gap-5 px-5 py-4 rounded-xl border-2 transition-all text-left",
                                            language === lang.code
                                                ? "border-slate-900 bg-white shadow-sm"
                                                : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 bg-slate-50/50"
                                        )}
                                    >
                                        <span className="text-2xl filter drop-shadow-sm">{lang.flag}</span>
                                        <div className="flex-1">
                                            <p className={cn(
                                                "font-semibold text-base",
                                                language === lang.code ? "text-slate-900" : "text-slate-700"
                                            )}>{lang.name}</p>
                                            <p className={cn(
                                                "text-xs font-medium uppercase tracking-wider mt-0.5",
                                                language === lang.code ? "text-slate-500" : "text-slate-400"
                                            )}>{lang.code.toUpperCase()}</p>
                                        </div>
                                        {language === lang.code && (
                                            <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                                                <Check size={14} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subscription Tab */}
                    {activeTab === 'subscription' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Subscription</h2>
                                <p className="text-sm text-slate-500">Manage your plan and billing.</p>
                            </div>

                            {/* Current Plan Card */}
                            <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 text-white p-8 sm:p-10 shadow-xl border-0">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5A1F]/10 blur-[100px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />

                                <div className="relative z-10">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Current Plan</p>
                                            <h3 className="text-3xl font-black text-white tracking-tight uppercase">Pro Plan</h3>
                                        </div>
                                        <span className="self-start px-4 py-2 bg-[#FF5A1F] text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-[#FF5A1F]/20">
                                            Active
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-t border-white/10">
                                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                                            <div className="flex items-end gap-3 mb-3">
                                                <span className="text-3xl font-bold text-white tracking-tight leading-none">824</span>
                                                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Orders</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                                                <div className="h-full bg-white rounded-full" style={{ width: '82%' }} />
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-5 rounded-xl border border-white/10">
                                            <div className="flex items-end gap-3 mb-3">
                                                <span className="text-3xl font-bold text-white tracking-tight leading-none">28</span>
                                                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Days Left</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                                                <div className="h-full bg-slate-400 rounded-full" style={{ width: '93%' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-400 pt-6 border-t border-white/10">
                                        <p>Renews automatically on Feb 28, 2026</p>
                                        <p className="flex items-center gap-2">
                                            <CreditCard size={14} className="text-slate-300" />
                                            Visa ending in 4242
                                        </p>
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

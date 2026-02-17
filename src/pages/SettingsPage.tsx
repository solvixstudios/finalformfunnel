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
        <div className="max-w-[1600px] mx-auto w-full space-y-6 h-full flex flex-col pt-2">
            <PageHeader
                title="Settings"
                breadcrumbs={[{ label: 'Settings' }]}
                icon={Settings}
            />

            {/* Settings Container */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-[220px_1fr] flex-1">
                {/* Sidebar Tabs */}
                <div className="border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/30 p-3">
                    <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={cn(
                                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-white/60"
                                )}
                            >
                                <span className={cn(
                                    "shrink-0",
                                    activeTab === tab.id ? "text-slate-900" : "text-slate-400"
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

                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                <div className="relative shrink-0">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName}
                                            className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-white shadow-lg">
                                            <User size={28} className="text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 w-full space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Display Name</label>
                                        <div className="mt-1.5 flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50">
                                            <span className="text-sm font-semibold text-slate-900">{user.displayName}</span>
                                            <span className="ml-auto text-[10px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full border border-slate-200/60">Google</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                                        <div className="mt-1.5 px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50/50 text-sm text-slate-500">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Info */}
                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Account Info</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/60">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Account ID</p>
                                        <p className="font-mono text-xs text-slate-500 break-all">{user.id}</p>
                                    </div>
                                    <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200/60">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Member Since</p>
                                        <p className="text-sm font-semibold text-slate-700">{new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
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
                                            "flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all text-left",
                                            language === lang.code
                                                ? "border-slate-900 bg-slate-50"
                                                : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
                                        )}
                                    >
                                        <span className="text-2xl">{lang.flag}</span>
                                        <div className="flex-1">
                                            <p className={cn(
                                                "font-bold text-sm",
                                                language === lang.code ? "text-slate-900" : "text-slate-700"
                                            )}>{lang.name}</p>
                                            <p className={cn(
                                                "text-xs",
                                                language === lang.code ? "text-slate-500" : "text-slate-400"
                                            )}>{lang.code.toUpperCase()}</p>
                                        </div>
                                        {language === lang.code && (
                                            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center">
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
                            <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-8">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] blur-[80px] rounded-full pointer-events-none" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.02] blur-[60px] rounded-full pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Plan</p>
                                            <h3 className="text-2xl font-bold text-white">Pro Plan</h3>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                            Active
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-t border-white/5">
                                        <div>
                                            <div className="flex items-end gap-2 mb-2">
                                                <span className="text-2xl font-bold text-white">824</span>
                                                <span className="text-sm text-slate-400 mb-0.5">Orders</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: '82%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-end gap-2 mb-2">
                                                <span className="text-2xl font-bold text-white">28</span>
                                                <span className="text-sm text-slate-400 mb-0.5">Days Left</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-slate-400 to-slate-300 rounded-full" style={{ width: '93%' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-white/5">
                                        <p>Renews automatically on February 28, 2026</p>
                                        <p>Visa ending in 4242</p>
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

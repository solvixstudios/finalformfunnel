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

    // Sync activeTab with URL search params when they change
    useEffect(() => {
        const tab = searchParams.get('tab') as SettingsTab;
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [searchParams, activeTab]);

    const tabs = [
        { id: 'profile' as const, label: 'Profile', icon: <User size={18} /> },
        { id: 'language' as const, label: 'Language', icon: <Globe size={18} /> },
        { id: 'subscription' as const, label: 'Subscription', icon: <CreditCard size={18} /> },
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
        <div className="flex flex-col h-full bg-slate-50/50">
            <PageHeader
                title="Settings"
                breadcrumbs={[
                    { label: 'Settings' }
                ]}
                icon={Settings}
            />

            {/* Settings Container - Master/Detail Layout */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-[240px_1fr] flex-1">
                {/* Vertical Sidebar */}
                <div className="border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 p-3 sm:p-4">
                    <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scroll-x-mobile">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                )}
                            >
                                <span className={cn(
                                    "shrink-0",
                                    activeTab === tab.id ? "text-indigo-500" : "text-slate-400"
                                )}>
                                    {tab.icon}
                                </span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-4 sm:p-6 md:p-8 overflow-y-auto w-full max-w-4xl custom-scroll-thin">
                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">Profile</h2>
                                <p className="text-sm text-slate-500">Manage your public profile and personal details.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    {user.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={user.displayName}
                                            className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center border-4 border-white shadow-lg">
                                            <User size={32} className="text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 w-full space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Display Name</label>
                                        <div className="mt-1 flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50">
                                            <span className="text-slate-900 font-medium">{user.displayName}</span>
                                            <span className="ml-auto text-xs text-slate-400 px-2 py-0.5 bg-slate-200/50 rounded-full">Google Linked</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email Address</label>
                                        <div className="mt-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 flex items-center gap-2">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Account Info */}
                            <div className="pt-8 border-t border-slate-100">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Meta Data</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Account ID</p>
                                        <p className="font-mono text-xs text-slate-500 break-all">{user.id}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Member Since</p>
                                        <p className="text-sm text-slate-700">{new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Language Tab */}
                    {activeTab === 'language' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-1">Language</h2>
                                <p className="text-sm text-slate-500">Choose your preferred language for the interface.</p>
                            </div>

                            <div className="grid gap-3">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        className={cn(
                                            "flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all text-left relative overflow-hidden",
                                            language === lang.code
                                                ? "border-indigo-500 bg-indigo-50"
                                                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <span className="text-3xl filter drop-shadow-sm">{lang.flag}</span>
                                        <div className="flex-1 relative z-10">
                                            <p className={cn(
                                                "font-bold",
                                                language === lang.code ? "text-indigo-900" : "text-slate-900"
                                            )}>{lang.name}</p>
                                            <p className={cn(
                                                "text-xs font-medium",
                                                language === lang.code ? "text-indigo-600/70" : "text-slate-400"
                                            )}>{lang.code.toUpperCase()}</p>
                                        </div>
                                        {language === lang.code && (
                                            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                                                <Check size={16} className="text-white" strokeWidth={3} />
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
                                <h2 className="text-xl font-bold text-slate-900 mb-1">Subscription</h2>
                                <p className="text-sm text-slate-500">Manage your plan and billing details.</p>
                            </div>

                            {/* Current Plan */}
                            <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-8">
                                <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                                <div className="absolute bottom-0 left-0 p-24 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <p className="text-slate-400 text-sm font-medium mb-1">Current Plan</p>
                                            <h3 className="text-2xl sm:text-3xl font-black text-white truncate max-w-[200px]">Pro Plan</h3>
                                        </div>
                                        <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                            Active
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 py-6 sm:py-8 border-t border-white/5">
                                        <div>
                                            <div className="flex items-end gap-2 mb-2">
                                                <span className="text-2xl sm:text-3xl font-bold text-white">824</span>
                                                <span className="text-sm text-slate-400 mb-1.5">Orders</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '82%' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-end gap-2 mb-2">
                                                <span className="text-2xl sm:text-3xl font-bold text-white">28</span>
                                                <span className="text-sm text-slate-400 mb-1.5">Days Left</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '93%' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-slate-500 pt-6 border-t border-white/5">
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


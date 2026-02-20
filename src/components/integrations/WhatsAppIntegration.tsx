import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { WhatsAppProfile } from '../../lib/firebase/types';
import { useWhatsAppProfiles } from '../../lib/firebase/whatsappHooks';

// ... Main Component ...

interface WhatsAppIntegrationProps {
    userId: string;
}

export function WhatsAppIntegration({ userId }: WhatsAppIntegrationProps) {
    const {
        profiles: waProfiles,
        addProfile: addWaProfile,
        updateProfile: updateWaProfile,
        deleteProfile: deleteWaProfile,
        isProfileAssigned,
    } = useWhatsAppProfiles(userId);

    const [openSheet, setOpenSheet] = useState(false);
    const [activeTab, setActiveTab] = useState<'manage' | 'guide'>('manage');
    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');

    const [editingWaProfile, setEditingWaProfile] = useState<WhatsAppProfile | null>(null);
    const [waForm, setWaForm] = useState({ name: '', phoneNumber: '+213', isDefault: false });

    const [searchParams] = useSearchParams();

    // Deep Linking Logic
    useEffect(() => {
        const integrationParam = searchParams.get('integration');
        const profileIdParam = searchParams.get('profileId');
        const openParam = searchParams.get('open');

        if (integrationParam === 'whatsapp' || openParam === 'whatsapp') {
            setOpenSheet(true);

            if (profileIdParam && waProfiles.length > 0) {
                const targetProfile = waProfiles.find(p => p.id === profileIdParam);
                if (targetProfile) {
                    startEditProfile(targetProfile);
                } else if (profileIdParam === 'new') {
                    startAddProfile();
                }
            }
        }
    }, [searchParams, waProfiles]);

    // Reset view when opening/closing
    const handleOpenChange = (open: boolean) => {
        setOpenSheet(open);
        if (!open) {
            setView('list');
            setEditingWaProfile(null);
            setWaForm({ name: '', phoneNumber: '+213', isDefault: false });
        }
    };

    const startAddProfile = () => {
        setEditingWaProfile(null);
        setWaForm({ name: '', phoneNumber: '+213', isDefault: waProfiles.length === 0 });
        setView('add');
    };

    const startEditProfile = (profile: WhatsAppProfile) => {
        setEditingWaProfile(profile);
        setWaForm({ name: profile.name, phoneNumber: profile.phoneNumber, isDefault: profile.isDefault });
        setView('edit');
    };

    const handleCancel = () => {
        setView('list');
        setEditingWaProfile(null);
        setWaForm({ name: '', phoneNumber: '+213', isDefault: false });
    };

    const handleSaveWaProfile = async () => {
        if (!waForm.name || !waForm.phoneNumber) {
            toast.error('Name and Phone Number are required.');
            return;
        }

        try {
            if (view === 'add') {
                await addWaProfile(waForm);
                toast.success('Profile created!');
            } else if (view === 'edit' && editingWaProfile) {
                await updateWaProfile(editingWaProfile.id, waForm);
                toast.success('Profile updated!');
            }
            handleCancel();
        } catch (e: unknown) {
            toast.error(e.message);
        }
    };

    const handleDeleteWaProfile = async (id: string) => {
        try {
            const isAssigned = await isProfileAssigned(id);
            if (isAssigned) {
                toast.error('Cannot delete: this profile is assigned to one or more forms.');
                return;
            }
            if (confirm('Are you sure you want to delete this profile?')) {
                await deleteWaProfile(id);
                toast.success('Profile deleted');
                handleCancel();
            }
        } catch (e: unknown) {
            toast.error(e.message);
        }
    };

    return (
        <div className="md:col-span-1 md:row-span-1">
            <Sheet open={openSheet} onOpenChange={handleOpenChange}>
                <SheetTrigger asChild>
                    <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden hover:ring-2 hover:ring-green-100 hover:shadow-xl transition-all duration-300 group relative h-full flex flex-col p-4 sm:p-6 min-h-[140px] sm:min-h-[180px] cursor-pointer active:scale-[0.99]">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex flex-col h-full justify-between relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-3xl text-white shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform mb-4">
                                    💬
                                </div>
                                {waProfiles.length > 0 && (
                                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100">
                                        Connected
                                    </Badge>
                                )}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 tracking-tight">WhatsApp</h4>
                                <p className="text-sm text-slate-500 mt-2 font-medium leading-normal">Order recovery & confirms</p>
                            </div>
                        </div>
                    </Card>
                </SheetTrigger>

                <SheetContent hideClose className="sm:max-w-md w-full flex flex-col h-full p-0 gap-0 bg-white overflow-hidden sm:border-l sm:shadow-2xl">
                    <SheetHeader className="px-6 py-5 border-b border-slate-100 shrink-0 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-xl shrink-0">💬</div>
                                <div className="flex flex-col">
                                    {view === 'add' ? (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">New Profile</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Add WhatsApp number</SheetDescription>
                                        </>
                                    ) : view === 'edit' ? (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">Edit Profile</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Update configuration</SheetDescription>
                                        </>
                                    ) : (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">WhatsApp</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Order recovery & confirms</SheetDescription>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {activeTab === 'manage' && (
                                    view === 'list' ? (
                                        <Button
                                            size="sm"
                                            className="bg-[#25D366] hover:bg-[#20bd5a] text-white h-8 text-xs gap-1.5 shadow-sm px-3 rounded-full"
                                            onClick={() => {
                                                startAddProfile();
                                                setActiveTab('manage');
                                            }}
                                        >
                                            <Plus size={14} className="stroke-[2.5]" /> Add Profile
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs gap-1.5 px-3 rounded-full"
                                            onClick={handleCancel}
                                        >
                                            Cancel
                                        </Button>
                                    )
                                )}

                                <div className="h-6 w-px bg-slate-200 mx-1" />

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                    onClick={() => handleOpenChange(false)}
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        </div>
                    </SheetHeader>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manage' | 'guide')} className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-50 p-1 rounded-none shrink-0 border-b border-slate-100">
                            <TabsTrigger value="manage" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 text-xs font-medium text-slate-500">Manage</TabsTrigger>
                            <TabsTrigger value="guide" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-600 text-xs font-medium text-slate-500">Setup Guide</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="flex-1 bg-slate-50/50 [&>div>div]:!block">
                            <TabsContent value="manage" className="mt-0 p-6 space-y-4">

                                {view === 'list' ? (
                                    <div className="animate-in fade-in duration-300 space-y-4">
                                        {/* Profiles list */}
                                        {waProfiles.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                                                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                                                    <span className="text-2xl grayscale opacity-50">📱</span>
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-900">No profiles yet</h3>
                                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Connect your WhatsApp number to start sending messages.</p>
                                                <Button
                                                    className="mt-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#075E54] text-white shadow-lg shadow-green-100 h-9 text-xs rounded-full px-4 font-medium transition-all hover:scale-105"
                                                    onClick={startAddProfile}
                                                >
                                                    Connect First Profile
                                                </Button>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {waProfiles.map((profile) => (
                                                <div
                                                    key={profile.id}
                                                    className="group bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-green-200 transition-all cursor-pointer relative overflow-hidden"
                                                    onClick={() => startEditProfile(profile)}
                                                >
                                                    <div className="absolute inset-y-0 left-0 w-1 bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-lg shadow-inner">
                                                                📱
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                                                    {profile.name}
                                                                    {profile.isDefault && (
                                                                        <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-700 h-5 px-1.5 border border-green-100">
                                                                            Default
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-slate-500 font-mono mt-0.5" dir="ltr">{profile.phoneNumber}</div>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 group-hover:text-green-600 transition-colors">
                                                            <ChevronRight size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {waProfiles.length > 0 && (
                                            <div className="text-center pt-4">
                                                <p className="text-xs text-slate-400">
                                                    Need another number? Click <span className="font-medium text-slate-600">Add Profile</span> above.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* Add/Edit Form View */
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5 animate-in slide-in-from-right-8 fade-in duration-300">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-slate-700">Profile Name</Label>
                                                <Input
                                                    placeholder="e.g. Sales Team"
                                                    className="bg-white h-10 border-slate-200"
                                                    value={waForm.name}
                                                    onChange={(e) => setWaForm({ ...waForm, name: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-slate-700">WhatsApp Number</Label>
                                                <div className="flex shadow-sm rounded-lg overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-green-100 focus-within:border-green-300 transition-all">
                                                    <div className="bg-slate-50 px-3 py-2 text-sm text-slate-600 font-mono flex items-center border-r border-slate-100 bg-white">+213</div>
                                                    <Input
                                                        placeholder="555123456"
                                                        className="bg-white font-mono rounded-none border-0 focus-visible:ring-0 h-10"
                                                        dir="ltr"
                                                        value={waForm.phoneNumber.replace(/^\+213/, '')}
                                                        onChange={(e) => {
                                                            const digits = e.target.value.replace(/\D/g, '');
                                                            setWaForm({ ...waForm, phoneNumber: '+213' + digits });
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 pl-1">Enter number without country code (e.g. 555123456)</p>
                                            </div>

                                            <div className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <Switch
                                                    id="wa-default"
                                                    checked={waForm.isDefault}
                                                    onCheckedChange={(checked) => setWaForm({ ...waForm, isDefault: checked })}
                                                    className="data-[state=checked]:bg-green-500"
                                                />
                                                <Label htmlFor="wa-default" className="text-xs font-medium text-slate-700 cursor-pointer flex-1">
                                                    Set as default profile for notifications
                                                </Label>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-2">
                                            <Button
                                                className="w-full bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#128C7E] hover:to-[#075E54] text-white shadow-lg shadow-green-100 transition-all duration-200 h-11 text-sm font-medium rounded-xl mt-2"
                                                onClick={handleSaveWaProfile}
                                            >
                                                {view === 'add' ? 'Create Profile' : 'Save Changes'}
                                            </Button>

                                            {view === 'edit' && editingWaProfile && (
                                                <Button
                                                    variant="ghost"
                                                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 h-10 text-xs font-medium rounded-xl"
                                                    onClick={() => handleDeleteWaProfile(editingWaProfile.id)}
                                                >
                                                    Delete Profile
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                            </TabsContent>

                            <TabsContent value="guide" className="mt-0 p-6">
                                <div className="space-y-4 text-sm text-slate-600">
                                    <h4 className="font-semibold text-slate-900">Getting Started with WhatsApp</h4>
                                    <ol className="list-decimal list-inside space-y-2 marker:text-green-600 marker:font-bold">
                                        <li>Create a WhatsApp profile with your business number</li>
                                        <li>Set your default profile for order confirmations</li>
                                        <li>Customers will receive order updates via WhatsApp automatically</li>
                                    </ol>
                                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700 flex gap-2 items-start">
                                        <span className="mt-0.5">💡</span>
                                        <span>Use the international format for your phone number to ensure message delivery.</span>
                                    </div>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </SheetContent>
            </Sheet>
        </div>
    );
}

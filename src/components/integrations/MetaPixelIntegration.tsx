import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronRight, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { MetaPixelProfile } from '../../lib/firebase/types';
import { useMetaPixels } from '../../lib/firebase/metaPixelHooks';
import { useI18n } from '../../lib/i18n/i18nContext';

interface MetaPixelIntegrationProps {
    userId: string;
}

interface PixelData {
    pixelId: string;
    capiToken: string;
    testCode: string;
    showAdvanced: boolean; // UI state for toggle
}

export function MetaPixelIntegration({ userId }: MetaPixelIntegrationProps) {
    const {
        pixels: profiles,
        addPixel,
        updatePixel,
        deletePixel,
    } = useMetaPixels(userId);

    const [openSheet, setOpenSheet] = useState(false);
    const [activeTab, setActiveTab] = useState<'manage' | 'guide'>('manage');
    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');

    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
    const [profileName, setProfileName] = useState('');
    const [pixelList, setPixelList] = useState<PixelData[]>([]);

    const [searchParams] = useSearchParams();

    // Deep Linking Logic
    useEffect(() => {
        const integrationParam = searchParams.get('integration');
        const profileIdParam = searchParams.get('profileId'); // Changed from pixelId to profileId for clarity
        const openParam = searchParams.get('open');

        if (integrationParam === 'meta-pixel' || openParam === 'meta-pixel') {
            setOpenSheet(true);

            if (profileIdParam && profiles.length > 0) {
                const targetProfile = profiles.find(p => p.id === profileIdParam);
                if (targetProfile) {
                    startEditProfile(targetProfile);
                } else if (profileIdParam === 'new') {
                    startAddProfile();
                }
            }
        }
    }, [searchParams, profiles]);

    // Reset view when opening/closing
    const handleOpenChange = (open: boolean) => {
        setOpenSheet(open);
        if (!open) {
            setView('list');
            setEditingProfileId(null);
            setProfileName('');
            setPixelList([]);
        }
    };

    const startAddProfile = () => {
        setEditingProfileId(null);
        setProfileName('');
        // Start with one empty pixel
        setPixelList([{ pixelId: '', capiToken: '', testCode: '', showAdvanced: false }]);
        setView('add');
    };

    const startEditProfile = (profile: MetaPixelProfile) => {
        setEditingProfileId(profile.id);
        setProfileName(profile.name);

        // Map existing pixels or fallback to old structure if migration needed (though we updated types)
        const mappedPixels = (profile.pixels || []).map(p => ({
            pixelId: p.pixelId,
            capiToken: p.capiToken || '',
            testCode: p.testCode || '',
            showAdvanced: !!(p.capiToken || p.testCode)
        }));

        // Handle legacy data case if necessary (optional)
        if (mappedPixels.length === 0 && (profile as unknown).pixelId) {
            mappedPixels.push({
                pixelId: (profile as unknown).pixelId,
                capiToken: (profile as unknown).capiToken || '',
                testCode: (profile as unknown).testCode || '',
                showAdvanced: !!((profile as unknown).capiToken || (profile as unknown).testCode)
            });
        }

        if (mappedPixels.length === 0) {
            mappedPixels.push({ pixelId: '', capiToken: '', testCode: '', showAdvanced: false });
        }

        setPixelList(mappedPixels);
        setView('edit');
    };

    const handleCancel = () => {
        setView('list');
        setEditingProfileId(null);
        setProfileName('');
        setPixelList([]);
    };

    const handleAddPixelRow = () => {
        setPixelList([...pixelList, { pixelId: '', capiToken: '', testCode: '', showAdvanced: false }]);
    };

    const handleRemovePixelRow = (index: number) => {
        const newList = [...pixelList];
        newList.splice(index, 1);
        setPixelList(newList);
    };

    const updatePixelRow = (index: number, field: keyof PixelData, value: unknown) => {
        const newList = [...pixelList];
        newList[index] = { ...newList[index], [field]: value };
        setPixelList(newList);
    };

    const handleSaveProfile = async () => {
        if (!profileName.trim()) {
            toast.error('Profile Name is required.');
            return;
        }

        const validPixels = pixelList.filter(p => p.pixelId.trim() !== '');

        if (validPixels.length === 0) {
            toast.error('At least one Pixel ID is required.');
            return;
        }

        if (validPixels.some(p => !/^\d+$/.test(p.pixelId))) {
            toast.error('Pixel IDs must contain only numbers.');
            return;
        }

        const payload = {
            name: profileName,
            pixels: validPixels.map(p => ({
                pixelId: p.pixelId,
                capiToken: p.capiToken || undefined,
                testCode: p.testCode || undefined
            }))
        };

        try {
            if (view === 'add') {
                await addPixel(payload);
                toast.success('Meta Pixel Profile added!');
            } else if (view === 'edit' && editingProfileId) {
                await updatePixel(editingProfileId, payload);
                toast.success('Meta Pixel Profile updated!');
            }
            handleCancel();
        } catch (e: unknown) {
            toast.error(e.message);
        }
    };

    const handleDeleteProfile = async (id: string) => {
        if (confirm('Are you sure you want to delete this profile?')) {
            try {
                await deletePixel(id);
                toast.success('Profile deleted');
                handleCancel();
            } catch (e: unknown) {
                toast.error(e.message);
            }
        }
    };

    return (
        <div className="md:col-span-1 md:row-span-1">
            <Sheet open={openSheet} onOpenChange={handleOpenChange}>
                <SheetTrigger asChild>
                    <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden hover:ring-2 hover:ring-blue-100 hover:shadow-xl transition-all duration-300 group relative h-full flex flex-col p-4 sm:p-6 min-h-[140px] sm:min-h-[180px] cursor-pointer active:scale-[0.99]">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex flex-col h-full justify-between relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-3xl text-white shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform mb-4">
                                    ♾️
                                </div>
                                {profiles.length > 0 && (
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100">
                                        {profiles.length} Active
                                    </Badge>
                                )}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 tracking-tight">Meta Pixel</h4>
                                <p className="text-sm text-slate-500 mt-2 font-medium leading-normal">Track events & CAPI</p>
                            </div>
                        </div>
                    </Card>
                </SheetTrigger>

                <SheetContent hideClose className="sm:max-w-md w-full flex flex-col h-full p-0 gap-0 bg-white overflow-hidden sm:border-l sm:shadow-2xl">
                    <SheetHeader className="px-6 py-5 border-b border-slate-100 shrink-0 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shrink-0">♾️</div>
                                <div className="flex flex-col">
                                    {view === 'add' ? (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">New Profile</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Add one or more pixels</SheetDescription>
                                        </>
                                    ) : view === 'edit' ? (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">Edit Profile</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Update pixel configuration</SheetDescription>
                                        </>
                                    ) : (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">Meta Pixels</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Manage tracking profiles</SheetDescription>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {activeTab === 'manage' && (
                                    view === 'list' ? (
                                        <Button
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs gap-1.5 shadow-sm px-3 rounded-full"
                                            onClick={() => {
                                                startAddProfile();
                                                setActiveTab('manage');
                                            }}
                                        >
                                            <Plus size={14} className="stroke-[2.5]" /> New Profile
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
                            <TabsTrigger value="manage" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 text-xs font-medium text-slate-500">Manage</TabsTrigger>
                            <TabsTrigger value="guide" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 text-xs font-medium text-slate-500">Setup Guide</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="flex-1 bg-slate-50/50 [&>div>div]:!block">
                            <TabsContent value="manage" className="mt-0 p-6 space-y-4">

                                {view === 'list' ? (
                                    <div className="animate-in fade-in duration-300 space-y-4">
                                        {profiles.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                                                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                                                    <span className="text-2xl grayscale opacity-50">♾️</span>
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-900">No profiles yet</h3>
                                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Create a profile to group your Meta Pixels.</p>
                                                <Button
                                                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 h-9 text-xs rounded-full px-4 font-medium transition-all hover:scale-105"
                                                    onClick={startAddProfile}
                                                >
                                                    Create Profile
                                                </Button>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {profiles.map((profile) => (
                                                <div
                                                    key={profile.id}
                                                    className="group bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden"
                                                    onClick={() => startEditProfile(profile)}
                                                >
                                                    <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg shadow-inner">
                                                                ♾️
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                                                    {profile.name}
                                                                </div>
                                                                <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                                    {profile.pixels?.length || 0} Pixel{(profile.pixels?.length || 0) !== 1 ? 's' : ''} Configured
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 group-hover:text-blue-600 transition-colors">
                                                            <ChevronRight size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* Add/Edit Form View */
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5 animate-in slide-in-from-right-8 fade-in duration-300">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-slate-700">Profile Name</Label>
                                                <Input
                                                    placeholder="e.g. Main Store Pixels"
                                                    className="bg-white h-10 border-slate-200"
                                                    value={profileName}
                                                    onChange={(e) => setProfileName(e.target.value)}
                                                />
                                            </div>

                                            <Separator />

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold text-slate-700">Pixels</Label>
                                                    <Button variant="ghost" size="sm" onClick={handleAddPixelRow} className="h-6 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2">
                                                        <Plus size={12} className="mr-1" /> Add Another Pixel
                                                    </Button>
                                                </div>

                                                <div className="space-y-4">
                                                    {pixelList.map((pixel, index) => (
                                                        <div key={index} className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100 relative group">
                                                            {pixelList.length > 1 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute top-2 right-2 h-6 w-6 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                                    onClick={() => handleRemovePixelRow(index)}
                                                                >
                                                                    <Trash2 size={12} />
                                                                </Button>
                                                            )}

                                                            <div className="space-y-2">
                                                                <Label className="text-[10px] font-semibold text-slate-500 uppercase">Pixel ID</Label>
                                                                <Input
                                                                    placeholder="1234567890"
                                                                    className="bg-white font-mono h-9 border-slate-200 text-xs"
                                                                    value={pixel.pixelId}
                                                                    onChange={(e) => {
                                                                        const digits = e.target.value.replace(/\D/g, '');
                                                                        updatePixelRow(index, 'pixelId', digits);
                                                                    }}
                                                                />
                                                            </div>

                                                            <div className="flex items-center justify-between pt-1">
                                                                <Label className="text-[10px] text-slate-500 flex items-center gap-1.5 cursor-pointer" onClick={() => updatePixelRow(index, 'showAdvanced', !pixel.showAdvanced)}>
                                                                    Enable CAPI / Test Code
                                                                </Label>
                                                                <Switch
                                                                    checked={pixel.showAdvanced}
                                                                    onCheckedChange={(c) => updatePixelRow(index, 'showAdvanced', c)}
                                                                    className="scale-75 origin-right"
                                                                />
                                                            </div>

                                                            {pixel.showAdvanced && (
                                                                <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] font-semibold text-slate-500 uppercase">CAPI Token (Optional)</Label>
                                                                        <Input
                                                                            placeholder="EAAB..."
                                                                            type="password"
                                                                            className="bg-white font-mono h-9 border-slate-200 text-xs"
                                                                            value={pixel.capiToken}
                                                                            onChange={(e) => updatePixelRow(index, 'capiToken', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] font-semibold text-slate-500 uppercase">Test Code (Optional)</Label>
                                                                        <Input
                                                                            placeholder="TEST12345"
                                                                            className="bg-white font-mono h-9 border-slate-200 text-xs"
                                                                            value={pixel.testCode}
                                                                            onChange={(e) => updatePixelRow(index, 'testCode', e.target.value)}
                                                                        />
                                                                        <div className="bg-amber-50 text-amber-800 text-[10px] p-2 rounded border border-amber-100 flex items-start gap-1.5">
                                                                            <span>⚠️</span>
                                                                            <span>Remember to remove this code after testing, otherwise events will not be processed by Meta ads.</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-2">
                                            <Button
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 transition-all duration-200 h-11 text-sm font-medium rounded-xl mt-2"
                                                onClick={handleSaveProfile}
                                            >
                                                {view === 'add' ? 'Create Profile' : 'Save Changes'}
                                            </Button>

                                            {view === 'edit' && editingProfileId && (
                                                <Button
                                                    variant="ghost"
                                                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 h-10 text-xs font-medium rounded-xl"
                                                    onClick={() => handleDeleteProfile(editingProfileId)}
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
                                    <h4 className="font-semibold text-slate-900">Setting up Meta Pixel</h4>
                                    <ol className="list-decimal list-inside space-y-2 marker:text-blue-600 marker:font-bold">
                                        <li>Go to Meta Events Manager.</li>
                                        <li>Create a new Data Source (Web).</li>
                                        <li>Copy your <strong>Pixel ID</strong>.</li>
                                        <li>Generate an Access Token in settings for CAPI support.</li>
                                    </ol>
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 flex gap-2 items-start">
                                        <span className="mt-0.5">💡</span>
                                        <span>Pro Tip: Add multiple pixels to one profile if you need to track events across multiple ad accounts simultaneously.</span>
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

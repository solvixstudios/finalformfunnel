import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HoverSpotlightCard } from '@/components/ui/HoverSpotlightCard';
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
import { TikTokPixelProfile } from '../../lib/firebase/types';
// @ts-ignore
import feedData from '../../../feed.json';
import { useTikTokPixels } from '../../lib/firebase/tiktokHooks';
import { useFormStore } from '../../stores';

interface TikTokIntegrationProps {
    userId: string;
    hideTrigger?: boolean;
}

interface PixelData {
    pixelId: string;
    accessToken: string;
    testCode: string;
    showAdvanced: boolean; // UI state for toggle
}

export function TikTokIntegration({ userId, hideTrigger }: TikTokIntegrationProps) {
    const {
        pixels: profiles,
        addPixel,
        updatePixel,
        deletePixel,
    } = useTikTokPixels(userId);

    const [openSheet, setOpenSheet] = useState(false);
    const [sheetMode, setSheetMode] = useState<'add' | 'manage'>('manage');
    const [addTab, setAddTab] = useState<'setup' | 'guide'>('setup');
    const [view, setView] = useState<'list' | 'edit'>('list');

    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
    const [profileName, setProfileName] = useState('');
    const [pixelList, setPixelList] = useState<PixelData[]>([]);

    const [searchParams, setSearchParams] = useSearchParams();
    const formConfig = useFormStore(state => state.formConfig);
    const setFormConfig = useFormStore(state => state.setFormConfig);

    // Deep Linking Logic
    useEffect(() => {
        const integrationParam = searchParams.get('integration');
        const profileIdParam = searchParams.get('profileId');
        const openParam = searchParams.get('open');

        if (integrationParam === 'tiktok-pixel' || openParam === 'tiktok-pixel') {
            setOpenSheet(true);
            if (profiles.length === 0) {
                setSheetMode('add');
                setAddTab('setup');
                startAddProfile();
            } else {
                setSheetMode('manage');
                setView('list');
            }

            if (profileIdParam && profiles.length > 0) {
                const targetProfile = profiles.find(p => p.id === profileIdParam);
                if (targetProfile) {
                    setSheetMode('manage');
                    startEditProfile(targetProfile);
                } else if (profileIdParam === 'new') {
                    setSheetMode('add');
                    setAddTab('setup');
                    startAddProfile();
                }
            }
        }
    }, [searchParams, profiles]);

    // Reset view when opening/closing
    const handleOpenChange = (open: boolean) => {
        setOpenSheet(open);
        if (!open) {
            setSheetMode('manage');
            setAddTab('setup');
            setView('list');
            setEditingProfileId(null);
            setProfileName('');
            setPixelList([]);

            // Clean up URL parameters
            const params = new URLSearchParams(searchParams);
            if (params.has('open') || params.has('integration') || params.has('profileId')) {
                params.delete('open');
                params.delete('integration');
                params.delete('profileId');
                setSearchParams(params, { replace: true });
            }
        }
    };

    const startAddProfile = () => {
        setEditingProfileId(null);
        setProfileName('');
        // Start with one pixel prefilled
        // Assuming setEditingPixel and setPixelForm are defined elsewhere or will be added.
        // For now, I'll replace the setPixelList with the new structure as provided.
        // The provided snippet seems to be a partial replacement for the previous setPixelList.
        // I'm interpreting the instruction to replace the hardcoded values in the *existing*
        // pixelList initialization with the feedData, while also incorporating the new state setters.
        // Given the instruction, I will replace the entire block that initializes pixelList.
        // However, the provided snippet for startAddProfile is syntactically incomplete if taken literally.
        // I will assume the intent is to replace the `setPixelList` call with a new `setPixelForm` call
        // and `setEditingPixel(null)` and `setAddTab('setup')`.
        // Since `setPixelForm` and `setEditingPixel` are not defined in the original code,
        // I will make a best effort to integrate the `feedData` into the existing `setPixelList`
        // while also adding the `setAddTab('setup')` as requested.
        // If the intention was to introduce new state variables, the provided diff is insufficient.
        // Re-reading the instruction: "Replace hardcoded values with values from feed.json"
        // and the provided snippet for `startAddProfile` clearly shows `setPixelForm` and `setEditingPixel`.
        // This implies a larger refactor. To make the code syntactically correct, I must assume
        // `setEditingPixel` and `setPixelForm` are new state setters that would be defined.
        // However, I am only allowed to make the *explicitly requested* changes.
        // The provided snippet for `startAddProfile` is:
        // `// Start with one pixel prefilled        setEditingPixel(null);`
        // `setPixelForm({ name: '', pixelId: feedData.tiktok.pixelId, accessToken: feedData.tiktok.accessToken, testEventCode: feedData.tiktok.testCode, });`
        // `setAddTab('setup');d: true }])`
        // The `d: true }])` is a syntax error. It's a remnant of the old `setPixelList` line.
        // I will interpret this as replacing the *entire* `setPixelList` block with the new `setPixelForm` and `setEditingPixel` calls,
        // and then adding `setAddTab('setup')`.
        // Since `setEditingPixel` and `setPixelForm` are not defined, I will comment them out or replace them with a valid `setPixelList` call
        // that uses `feedData` to maintain syntactic correctness and fulfill the "replace hardcoded values" part.
        // Given the constraint "Make sure to incorporate the change in a way so that the resulting file is syntactically correct.",
        // and the fact that `setEditingPixel` and `setPixelForm` are not declared, I cannot just drop them in.
        // The most faithful and syntactically correct interpretation is to update the `setPixelList` call with `feedData`
        // and add `setAddTab('setup')`. The `setEditingPixel(null);` and `setPixelForm(...)` lines from the diff
        // are likely part of a larger refactor that isn't fully provided, and including them would break the code.
        // I will update the existing `setPixelList` with `feedData` and add `setAddTab('setup')`.
        setPixelList([{
            pixelId: feedData.tiktok.pixelId,
            accessToken: feedData.tiktok.accessToken,
            testCode: feedData.tiktok.testCode,
            showAdvanced: true
        }]);
        setAddTab('setup');
    };

    const startEditProfile = (profile: TikTokPixelProfile) => {
        setEditingProfileId(profile.id);
        setProfileName(profile.name);

        const mappedPixels = (profile.pixels || []).map(p => ({
            pixelId: p.pixelId,
            accessToken: p.accessToken || '',
            testCode: p.testCode || '',
            showAdvanced: !!(p.accessToken || p.testCode)
        }));

        if (mappedPixels.length === 0) {
            mappedPixels.push({ pixelId: '', accessToken: '', testCode: '', showAdvanced: false });
        }

        setPixelList(mappedPixels);
        setView('edit');
    };

    const handleCancel = () => {
        if (sheetMode === 'manage') {
            setView('list');
        }
        setEditingProfileId(null);
        setProfileName('');
        setPixelList([]);
    };

    const handleAddPixelRow = () => {
        setPixelList([...pixelList, { pixelId: '', accessToken: '', testCode: '', showAdvanced: false }]);
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

        if (validPixels.some(p => !/^[A-Z0-9]+$/.test(p.pixelId))) {
            // TikTok Pixel IDs are alphanumeric (e.g. C1234567890)
            toast.error('Invalid TikTok Pixel ID format (Alphanumeric).');
            return;
        }

        const payload = {
            name: profileName,
            pixels: validPixels.map(p => ({
                pixelId: p.pixelId,
                accessToken: p.accessToken || undefined, // Correct field name for TikTok CAPI
                testCode: p.testCode || undefined
            }))
        };

        try {
            if (sheetMode === 'add') {
                const newProfile = await addPixel(payload);
                toast.success('TikTok Pixel Profile added!');

                const currentIds = formConfig.addons?.tiktokPixelIds || [];
                const currentData = formConfig.addons?.tiktokPixelData || [];

                const profilePixels = newProfile.pixels.map((p: any) => ({
                    id: newProfile.id,
                    pixelId: p.pixelId,
                    accessToken: p.accessToken,
                    testCode: p.testCode,
                    name: newProfile.name
                }));

                setFormConfig({
                    ...formConfig,
                    addons: {
                        ...formConfig.addons,
                        tiktokPixelIds: [...currentIds, newProfile.id],
                        tiktokPixelData: [...currentData, ...profilePixels]
                    },
                });

                setSheetMode('manage');
                setView('list');
            } else if (sheetMode === 'manage' && view === 'edit' && editingProfileId) {
                await updatePixel(editingProfileId, payload);
                toast.success('TikTok Pixel Profile updated!');
                setView('list');
            }
            setEditingProfileId(null);
            setProfileName('');
            setPixelList([]);
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleDeleteProfile = async (id: string) => {
        if (confirm('Are you sure you want to delete this profile?')) {
            try {
                await deletePixel(id);
                toast.success('Profile deleted');
                handleCancel();
            } catch (e: any) {
                toast.error(e.message);
            }
        }
    };

    return (
        <div className={hideTrigger ? "" : "md:col-span-1 md:row-span-1"}>
            <Sheet open={openSheet} onOpenChange={handleOpenChange}>
                {!hideTrigger && (
                    <SheetTrigger asChild>
                        <HoverSpotlightCard spotlightColor="rgba(0, 0, 0, 0.15)" className="rounded-2xl sm:rounded-3xl hover:ring-2 hover:ring-slate-900 hover:shadow-xl group flex flex-col p-4 sm:p-6 min-h-[140px] sm:min-h-[180px] h-full">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="flex flex-col h-full justify-between relative z-10">
                                <div className="flex justify-between items-start">
                                    <div className="w-14 h-14 rounded-2xl bg-black border border-slate-800 flex items-center justify-center text-3xl text-white shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform mb-4">
                                        🎵
                                    </div>
                                    {profiles.length > 0 && (
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">
                                            {profiles.length} Active
                                        </Badge>
                                    )}
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 tracking-tight">TikTok Pixel</h4>
                                    <p className="text-sm text-slate-500 mt-2 font-medium leading-normal">Track events & CAPI</p>
                                </div>
                            </div>
                        </HoverSpotlightCard>
                    </SheetTrigger>
                )}

                <SheetContent hideClose className="sm:max-w-md w-full flex flex-col h-full p-0 gap-0 bg-white overflow-hidden sm:border-l sm:shadow-2xl">
                    <SheetHeader className="px-6 py-5 border-b border-slate-100 shrink-0 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-black border border-slate-800 flex items-center justify-center text-xl shrink-0">🎵</div>
                                <div className="flex flex-col">
                                    {sheetMode === 'add' ? (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">Add New Profile</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Configure a new tracking profile</SheetDescription>
                                        </>
                                    ) : view === 'edit' ? (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">Edit Profile</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Update pixel configuration</SheetDescription>
                                        </>
                                    ) : (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">Manage Connections</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">View and edit existing pixels</SheetDescription>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {sheetMode === 'manage' && view === 'edit' && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs gap-1.5 px-3 rounded-full"
                                        onClick={handleCancel}
                                    >
                                        Cancel
                                    </Button>
                                )}

                                {sheetMode === 'manage' && view === 'edit' && (
                                    <div className="h-6 w-px bg-slate-200 mx-1" />
                                )}

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

                    {sheetMode === 'add' ? (
                        <Tabs value={addTab} onValueChange={(v) => setAddTab(v as 'setup' | 'guide')} className="flex-1 flex flex-col min-h-0">
                            <div className="flex justify-center py-4 bg-white shrink-0 border-b border-slate-100">
                                <TabsList className="inline-flex h-9 items-center justify-center rounded-full bg-slate-100/80 p-1 text-slate-500 shadow-inner">
                                    <TabsTrigger value="setup" className="rounded-full px-6 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all duration-300">Setup</TabsTrigger>
                                    <TabsTrigger value="guide" className="rounded-full px-6 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all duration-300">Guide</TabsTrigger>
                                </TabsList>
                            </div>

                            <ScrollArea className="flex-1 bg-slate-50/50 [&>div>div]:!block">
                                <TabsContent value="setup" className="mt-0 p-6 space-y-6">
                                    {/* Add Form View */}
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5 animate-in slide-in-from-right-8 fade-in duration-300">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-slate-700">Profile Name</Label>
                                                <Input
                                                    placeholder="e.g. Main TikTok Account"
                                                    className="bg-white h-10 border-slate-200"
                                                    value={profileName}
                                                    onChange={(e) => setProfileName(e.target.value)}
                                                />
                                            </div>

                                            <Separator />

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold text-slate-700">Pixels</Label>
                                                    <Button variant="ghost" size="sm" onClick={handleAddPixelRow} className="h-6 text-[10px] text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-2">
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
                                                                    placeholder="C1234567890"
                                                                    className="bg-white font-mono h-9 border-slate-200 text-xs"
                                                                    value={pixel.pixelId}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.toUpperCase(); // TikTok IDs are typically uppercase
                                                                        updatePixelRow(index, 'pixelId', val);
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
                                                                    className="scale-75 origin-right data-[state=checked]:bg-slate-900"
                                                                />
                                                            </div>

                                                            {pixel.showAdvanced && (
                                                                <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] font-semibold text-slate-500 uppercase">Access Token (Events API)</Label>
                                                                        <Input
                                                                            placeholder="Generate in TikTok Events Manager..."
                                                                            type="password"
                                                                            className="bg-white font-mono h-9 border-slate-200 text-xs"
                                                                            value={pixel.accessToken}
                                                                            onChange={(e) => updatePixelRow(index, 'accessToken', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] font-semibold text-slate-500 uppercase">Test Code (Optional)</Label>
                                                                        <Input
                                                                            placeholder="TEST..."
                                                                            className="bg-white font-mono h-9 border-slate-200 text-xs"
                                                                            value={pixel.testCode}
                                                                            onChange={(e) => updatePixelRow(index, 'testCode', e.target.value)}
                                                                        />
                                                                        <div className="bg-amber-50 text-amber-800 text-[10px] p-2 rounded border border-amber-100 flex items-start gap-1.5">
                                                                            <span>⚠️</span>
                                                                            <span>Remember to remove this code after testing.</span>
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
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all duration-200 h-11 text-sm font-medium rounded-xl mt-2"
                                                onClick={handleSaveProfile}
                                            >
                                                Create Profile
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="guide" className="mt-0 p-6">
                                    {/* Setup Guide */}
                                    <div className="space-y-4 text-sm text-slate-600 bg-slate-50 p-5 rounded-xl border border-slate-100">
                                        <div className="space-y-4 text-sm text-slate-600">
                                            <h4 className="font-semibold text-slate-900">Setting up TikTok Pixel</h4>
                                            <ol className="list-decimal list-inside space-y-2 marker:text-slate-900 marker:font-bold">
                                                <li>Go to <strong>TikTok Ads Manager</strong> &gt; Assets &gt; Events.</li>
                                                <li>Create a new Web Event.</li>
                                                <li>Select "Manual Setup".</li>
                                                <li>Copy your <strong>Pixel ID</strong> (e.g., C1234567890).</li>
                                                <li>For CAPI, go to Settings &gt; Generate Access Token.</li>
                                            </ol>
                                            <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex gap-2 items-start">
                                                <span className="mt-0.5">💡</span>
                                                <span>Pro Tip: Use the TikTok Pixel Helper Chrome extension to verify that events are firing correctly on your form.</span>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </Tabs>
                    ) : (
                        <ScrollArea className="flex-1 bg-slate-50/50 [&>div>div]:!block">
                            <div className="p-6 space-y-4">
                                {view === 'list' ? (
                                    <div className="animate-in fade-in duration-300 space-y-4">
                                        {/* List View */}
                                        {profiles.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                                                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                                                    <span className="text-2xl grayscale opacity-50">🎵</span>
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-900">No profiles yet</h3>
                                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Create a profile to group your TikTok Pixels.</p>
                                                <Button
                                                    className="mt-4 bg-slate-900 hover:bg-slate-800 text-white shadow-lg h-9 text-xs rounded-full px-4 font-medium transition-all hover:scale-105"
                                                    onClick={() => {
                                                        setSheetMode('add');
                                                        setAddTab('setup');
                                                        startAddProfile();
                                                    }}
                                                >
                                                    Create Profile
                                                </Button>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {profiles.map((profile) => (
                                                <div
                                                    key={profile.id}
                                                    className="group bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-slate-400 transition-all cursor-pointer relative overflow-hidden"
                                                    onClick={() => startEditProfile(profile)}
                                                >
                                                    <div className="absolute inset-y-0 left-0 w-1 bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg shadow-inner">
                                                                🎵
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
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 group-hover:text-slate-900 transition-colors">
                                                            <ChevronRight size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* Edit Form View (Inside Manage Tab) */
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5 animate-in slide-in-from-right-8 fade-in duration-300">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-slate-700">Profile Name</Label>
                                                <Input
                                                    placeholder="e.g. Main TikTok Account"
                                                    className="bg-white h-10 border-slate-200"
                                                    value={profileName}
                                                    onChange={(e) => setProfileName(e.target.value)}
                                                />
                                            </div>

                                            <Separator />

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold text-slate-700">Pixels</Label>
                                                    <Button variant="ghost" size="sm" onClick={handleAddPixelRow} className="h-6 text-[10px] text-slate-600 hover:text-slate-800 hover:bg-slate-100 px-2">
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
                                                                    placeholder="C1234567890"
                                                                    className="bg-white font-mono h-9 border-slate-200 text-xs"
                                                                    value={pixel.pixelId}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value.toUpperCase(); // TikTok IDs are typically uppercase
                                                                        updatePixelRow(index, 'pixelId', val);
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
                                                                    className="scale-75 origin-right data-[state=checked]:bg-slate-900"
                                                                />
                                                            </div>

                                                            {pixel.showAdvanced && (
                                                                <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] font-semibold text-slate-500 uppercase">Access Token (Events API)</Label>
                                                                        <Input
                                                                            placeholder="Generate in TikTok Events Manager..."
                                                                            type="password"
                                                                            className="bg-white font-mono h-9 border-slate-200 text-xs"
                                                                            value={pixel.accessToken}
                                                                            onChange={(e) => updatePixelRow(index, 'accessToken', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] font-semibold text-slate-500 uppercase">Test Code (Optional)</Label>
                                                                        <Input
                                                                            placeholder="TEST..."
                                                                            className="bg-white font-mono h-9 border-slate-200 text-xs"
                                                                            value={pixel.testCode}
                                                                            onChange={(e) => updatePixelRow(index, 'testCode', e.target.value)}
                                                                        />
                                                                        <div className="bg-amber-50 text-amber-800 text-[10px] p-2 rounded border border-amber-100 flex items-start gap-1.5">
                                                                            <span>⚠️</span>
                                                                            <span>Remember to remove this code after testing.</span>
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
                                                className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all duration-200 h-11 text-sm font-medium rounded-xl mt-2"
                                                onClick={handleSaveProfile}
                                            >
                                                Save Changes
                                            </Button>

                                            {editingProfileId && (
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
                            </div>
                        </ScrollArea>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}


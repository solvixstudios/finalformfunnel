import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTiktok } from '@fortawesome/free-brands-svg-icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { GuideStep, VideoPlaceholder, TestConnectionButton } from './GuideUI';
import { Plus, MoreHorizontal, Pencil, Trash2, Save, Loader2, X, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { TikTokPixelProfile } from '../../lib/firebase/types';
import { useTikTokPixels } from '../../lib/firebase/tiktokHooks';
import { useFormStore } from '../../stores';

interface TikTokIntegrationProps {
    userId: string;
    onBack?: () => void;
}

interface PixelData {
    pixelId: string;
    accessToken: string;
    testCode: string;
    showAdvanced: boolean;
}

export function TikTokIntegration({ userId, onBack }: TikTokIntegrationProps) {
    const {
        pixels: profiles,
        addPixel,
        updatePixel,
        deletePixel,
    } = useTikTokPixels(userId);

    const [view, setView] = useState<'list' | 'edit' | 'add'>('list');
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
    const [profileName, setProfileName] = useState('');
    const [pixelList, setPixelList] = useState<PixelData[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const formConfig = useFormStore(state => state.formConfig);
    const setFormConfig = useFormStore(state => state.setFormConfig);

    const startAddProfile = () => {
        setEditingProfileId(null);
        setProfileName('Nouveau Profil TikTok');
        setPixelList([{ pixelId: '', accessToken: '', testCode: '', showAdvanced: false }]);
        setView('add');
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
        setView('list');
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
            toast.error('Le nom du profil est requis.');
            return;
        }

        const validPixels = pixelList.filter(p => p.pixelId.trim() !== '');

        if (validPixels.length === 0) {
            toast.error('Au moins un Pixel ID est requis.');
            return;
        }

        if (validPixels.some(p => !/^[A-Z0-9]+$/.test(p.pixelId))) {
            toast.error('Format de Pixel ID TikTok invalide (Alphanumérique).');
            return;
        }

        const payload = {
            name: profileName,
            pixels: validPixels.map(p => ({
                pixelId: p.pixelId,
                accessToken: p.accessToken || undefined,
                testCode: p.testCode || undefined
            }))
        };

        setIsSaving(true);
        try {
            if (view === 'add') {
                const newProfile = await addPixel(payload);
                toast.success('Profil TikTok Pixel ajouté !');

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

                setView('list');
            } else if (view === 'edit' && editingProfileId) {
                await updatePixel(editingProfileId, payload);
                toast.success('Profil TikTok Pixel mis à jour !');
                setView('list');
            }
            handleCancel();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProfile = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        if (confirm('Voulez-vous vraiment supprimer ce profil ?')) {
            try {
                await deletePixel(id);
                toast.success('Profil supprimé');
                if (view === 'edit') handleCancel();
            } catch (e: any) {
                toast.error(e.message);
            }
        }
    };

    // Custom Icon for Headers
    const TikTokIcon = () => (
        <FontAwesomeIcon icon={faTiktok} className="text-black text-xl md:text-2xl" />
    );

    // --- EDITOR VIEW (Add / Edit) ---
    if (view === 'add' || view === 'edit') {
        return (
            <div className="flex-1 flex flex-col h-full bg-slate-50/50">
                <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                    <PageHeader
                        title={view === 'add' ? 'Nouveau Profil TikTok Pixel' : 'Modifier le Profil TikTok'}
                        breadcrumbs={[
                            { label: 'Intégrations', href: '/integrations', onClick: onBack },
                            { label: 'TikTok Pixel', href: '#' }
                        ]}
                        icon={TikTokIcon}
                        onBack={handleCancel}
                        actions={
                            <div className="flex items-center gap-2">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-lg text-xs font-bold px-4 bg-white text-slate-700 shadow-sm border-slate-200"
                                        >
                                            <HelpCircle size={13} className="mr-1.5" />
                                            Astuces d'intégration
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                                        <SheetHeader className="mb-6">
                                            <SheetTitle className="text-xl font-bold text-slate-900">Guide TikTok Pixel</SheetTitle>
                                            <p className="text-sm text-slate-500 mt-2 text-left">Étapes pour configurer le suivi TikTok sur vos formulaires.</p>
                                        </SheetHeader>
                                        <div className="space-y-6 text-sm text-slate-600 pb-8">
                                            <VideoPlaceholder title="Configurer TikTok Pixel & Events API" thumbnailUrl="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2000&auto=format&fit=crop" />

                                            <GuideStep number={1} title="Accéder au TikTok Events Manager">
                                                <p>
                                                    Connectez-vous à <strong>TikTok Ads Manager</strong> → <strong>Outils</strong> → <strong>Événements</strong>. Sélectionnez ou créez un nouveau Pixel de type <strong>«Code développeur»</strong>.
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    URL directe : <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">ads.tiktok.com/i18n/events_manager</code>
                                                </p>
                                            </GuideStep>

                                            <GuideStep number={2} title="Copier le Pixel ID">
                                                <p>
                                                    Votre Pixel ID commence par la lettre <strong>C</strong> suivie de chiffres (ex. <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono">C1234567890</code>). Copiez-le depuis la page de gestion du pixel.
                                                </p>
                                            </GuideStep>

                                            <GuideStep number={3} title="Configurer l'API Conversions (CAPI)">
                                                <p>
                                                    Pour un suivi plus fiable (résistant aux bloqueurs de pub), activez l'<strong>Events API</strong> :
                                                </p>
                                                <ol className="list-decimal list-outside ml-4 space-y-2 mt-2">
                                                    <li>Dans les paramètres de votre pixel, allez dans <strong>Settings</strong>.</li>
                                                    <li>Cliquez sur <strong>Generate Access Token</strong>.</li>
                                                    <li>Copiez le token et collez-le dans le champ «Access Token» ci-contre.</li>
                                                </ol>
                                            </GuideStep>

                                            <GuideStep number={4} title="Événements automatiques">
                                                <p>
                                                    Final Form déclenche automatiquement les événements suivants :
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                                                        <span className="block text-xs font-bold text-slate-800">ViewContent</span>
                                                        <span className="text-[10px] text-slate-500">Chargement de page</span>
                                                    </div>
                                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center">
                                                        <span className="block text-xs font-bold text-slate-800">PlaceAnOrder</span>
                                                        <span className="text-[10px] text-slate-500">Soumission réussie</span>
                                                    </div>
                                                </div>
                                            </GuideStep>

                                            <GuideStep number={5} title="Code de test (optionnel)">
                                                <p>
                                                    Lors de vos tests, utilisez l'extension Chrome <strong>TikTok Pixel Helper</strong> pour vérifier les déclenchements. Si vous utilisez un code de test CAPI, <strong>pensez à le supprimer</strong> avant de passer en production.
                                                </p>
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2 items-start mt-2 shadow-sm">
                                                    <span className="mt-0.5 text-base leading-none">⚠️</span>
                                                    <span>Les événements avec un code de test ne sont <strong>pas</strong> comptabilisés par TikTok pour vos campagnes.</span>
                                                </div>
                                            </GuideStep>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                                <TestConnectionButton
                                    onTest={async () => {
                                        const hasPixel = pixelList.some(p => p.pixelId && p.pixelId.length >= 5);
                                        if (!hasPixel) {
                                            throw new Error("Veuillez saisir au moins un Pixel ID valide.");
                                        }
                                        // Validate format: TikTok Pixel IDs start with C
                                        const allValid = pixelList.filter(p => p.pixelId).every(p => /^C[A-Z0-9]{5,}$/i.test(p.pixelId));
                                        if (!allValid) {
                                            throw new Error("Le Pixel ID TikTok doit commencer par la lettre C (ex. C1234567890).");
                                        }
                                        return true;
                                    }}
                                    label="Vérifier le format"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                    className="h-8 rounded-lg text-xs font-bold px-4 bg-white text-slate-700 shadow-sm"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    size="sm"
                                    className="h-8 rounded-lg text-xs font-bold px-4 bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                                >
                                    {isSaving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
                                    Enregistrer
                                </Button>
                            </div>
                        }
                    />
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="space-y-6">
                            {/* Editor Configuration */}
                            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Nom du profil</Label>
                                        <Input
                                            placeholder="ex. Boutique Principale"
                                            className="bg-white h-11 border-slate-200"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                        />
                                        <p className="text-[11px] text-slate-500 mt-1">Donnez un nom à ce groupe de pixels pour l'identifier dans l'éditeur de formulaire.</p>
                                    </div>

                                    <Separator className="my-6" />

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold text-slate-700">Configuration des Pixels</Label>
                                            <Button variant="ghost" size="sm" onClick={handleAddPixelRow} className="h-8 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-3 rounded-lg border border-slate-200">
                                                <Plus size={14} className="mr-1.5" /> Ajouter un Pixel
                                            </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {pixelList.map((pixel, index) => (
                                                <div key={index} className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200 relative group animate-in slide-in-from-top-2 fade-in duration-200">
                                                    {pixelList.length > 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-3 right-3 h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"
                                                            onClick={() => handleRemovePixelRow(index)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    )}

                                                    <div className="space-y-2 w-full md:w-3/4">
                                                        <Label className="text-xs font-semibold text-slate-700">Identifiant du Pixel (Pixel ID)</Label>
                                                        <Input
                                                            placeholder="C1234567890"
                                                            className="bg-white font-mono h-10 border-slate-200"
                                                            value={pixel.pixelId}
                                                            onChange={(e) => {
                                                                const val = e.target.value.toUpperCase();
                                                                updatePixelRow(index, 'pixelId', val);
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between py-2 border-t border-slate-100 mt-2 pt-4">
                                                        <Label className="text-xs font-bold text-slate-700 cursor-pointer" onClick={() => updatePixelRow(index, 'showAdvanced', !pixel.showAdvanced)}>
                                                            Options Avancées (CAPI / Test Code)
                                                        </Label>
                                                        <Switch
                                                            checked={pixel.showAdvanced}
                                                            onCheckedChange={(c) => updatePixelRow(index, 'showAdvanced', c)}
                                                            className="data-[state=checked]:bg-slate-900"
                                                        />
                                                    </div>

                                                    {pixel.showAdvanced && (
                                                        <div className="space-y-4 pt-4 border-t border-slate-200 animate-in slide-in-from-top-2 fade-in duration-200">
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-semibold text-slate-700">Access Token (Events API)</Label>
                                                                <Input
                                                                    placeholder="Généré dans TikTok Events Manager..."
                                                                    type="password"
                                                                    className="bg-white font-mono h-10 border-slate-200 text-xs"
                                                                    value={pixel.accessToken}
                                                                    onChange={(e) => updatePixelRow(index, 'accessToken', e.target.value)}
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-xs font-semibold text-slate-700">Code de test (Optionnel)</Label>
                                                                <Input
                                                                    placeholder="TEST..."
                                                                    className="bg-white font-mono h-10 border-slate-200 text-xs uppercase"
                                                                    value={pixel.testCode}
                                                                    onChange={(e) => updatePixelRow(index, 'testCode', e.target.value)}
                                                                />
                                                                <div className="bg-amber-50 text-amber-800 text-[11px] p-3 rounded-lg border border-amber-200 flex items-start gap-2 mt-2">
                                                                    <span className="text-base leading-none">⚠️</span>
                                                                    <span>N'oubliez pas de supprimer ce code après vos tests, sinon les événements de production ne seront pas pris en compte.</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        );
    }

    // --- LIST VIEW ---
    const headerActions = (
        <Button
            size="sm"
            onClick={startAddProfile}
            className="h-8 rounded-lg text-xs font-bold px-4 bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
        >
            <Plus size={13} className="mr-1.5" />
            Nouveau Profil Pixel
        </Button>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                <PageHeader
                    title="TikTok Pixel & CAPI"
                    breadcrumbs={[
                        { label: 'Intégrations', href: '/integrations', onClick: onBack },
                        { label: 'TikTok Pixel', href: '#' }
                    ]}
                    count={profiles.length}
                    icon={TikTokIcon}
                    onBack={onBack}
                    actions={headerActions}
                />
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto w-full">
                    {profiles.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                                <TikTokIcon />
                            </div>
                            <h3 className="text-base font-bold text-slate-700 mb-1">Aucun profil TikTok Pixel configuré</h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                                Créez un profil pour regrouper et gérer vos Pixels TikTok et l'API Events.
                            </p>
                            <Button
                                onClick={startAddProfile}
                                className="h-10 rounded-xl text-sm font-bold px-6 bg-slate-900 hover:bg-slate-800 text-white shadow-md shadow-slate-200"
                            >
                                <Plus size={16} className="mr-2" /> Créer le premier profil
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pl-5">Nom du Profil</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Pixels Configurés</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pr-5 w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {profiles.map((profile) => (
                                        <TableRow
                                            key={profile.id}
                                            className="group cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                            onClick={() => startEditProfile(profile)}
                                        >
                                            <TableCell className="py-3.5 pl-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-black text-white ring-1 ring-slate-200">
                                                        <div className="w-4 h-4">
                                                            <TikTokIcon />
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900">{profile.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200 font-semibold shadow-none">
                                                        {profile.pixels?.length || 0} Pixel{(profile.pixels?.length || 0) !== 1 ? 's' : ''}
                                                    </Badge>
                                                    {profile.pixels && profile.pixels.length > 0 && (
                                                        <span className="text-xs text-slate-400 font-mono">
                                                            ID principal: {profile.pixels[0].pixelId}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3.5 pr-5 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startEditProfile(profile); }}>
                                                            <Pencil size={13} className="mr-2" /> Modifier
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                            onClick={(e) => handleDeleteProfile(profile.id, e)}
                                                        >
                                                            <Trash2 size={13} className="mr-2" /> Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

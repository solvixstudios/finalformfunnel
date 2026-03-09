import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Plus, MoreHorizontal, Pencil, Trash2, Save, MessageCircle, Loader2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { WhatsAppProfile } from '../../lib/firebase/types';
import { useWhatsAppProfiles } from '../../lib/firebase/whatsappHooks';
import { useFormStore } from '../../stores';
// @ts-ignore
import feedData from '../../../feed.json';

interface WhatsAppIntegrationProps {
    userId: string;
    onBack?: () => void;
}

export function WhatsAppIntegration({ userId, onBack }: WhatsAppIntegrationProps) {
    const {
        profiles: waProfiles,
        addProfile: addWaProfile,
        updateProfile: updateWaProfile,
        deleteProfile: deleteWaProfile,
        isProfileAssigned,
    } = useWhatsAppProfiles(userId);

    const [view, setView] = useState<'list' | 'edit' | 'add'>('list');
    const [editingWaProfile, setEditingWaProfile] = useState<WhatsAppProfile | null>(null);
    const [waForm, setWaForm] = useState({ name: '', phoneNumber: '+213', isDefault: false });
    const [isSaving, setIsSaving] = useState(false);

    const formConfig = useFormStore(state => state.formConfig);
    const setFormConfig = useFormStore(state => state.setFormConfig);

    const startAddProfile = () => {
        setEditingWaProfile(null);
        setWaForm({ name: feedData.whatsapp.name || '', phoneNumber: '+' + feedData.whatsapp.phone || '+213', isDefault: waProfiles.length === 0 });
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

        setIsSaving(true);
        try {
            if (view === 'add') {
                const newProfile = await addWaProfile(waForm);
                toast.success('Profile created!');

                setFormConfig({
                    ...formConfig,
                    addons: {
                        ...formConfig.addons,
                        selectedWhatsappProfileId: newProfile.id,
                    },
                });

                setView('list');
            } else if (view === 'edit' && editingWaProfile) {
                await updateWaProfile(editingWaProfile.id, waForm);
                toast.success('Profile updated!');
                setView('list');
            }
            handleCancel();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWaProfile = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();

        try {
            const isAssigned = await isProfileAssigned(id);
            if (isAssigned) {
                toast.error('Cannot delete: this profile is assigned to one or more forms.');
                return;
            }
            if (confirm('Are you sure you want to delete this profile?')) {
                await deleteWaProfile(id);
                toast.success('Profile deleted');
                if (view === 'edit') handleCancel();
            }
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    // --- EDITOR VIEW (Add / Edit) ---
    if (view === 'add' || view === 'edit') {
        return (
            <div className="flex-1 flex flex-col h-full bg-slate-50/50">
                <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                    <PageHeader
                        title={view === 'add' ? 'Nouveau Profil WhatsApp' : 'Modifier le Profil'}
                        breadcrumbs={[
                            { label: 'Intégrations', href: '/integrations', onClick: onBack },
                            { label: 'WhatsApp', href: '#' }
                        ]}
                        icon={MessageCircle}
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
                                            Astuces WhatsApp
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                                        <SheetHeader className="mb-6">
                                            <SheetTitle className="text-xl font-bold text-slate-900">Guide WhatsApp</SheetTitle>
                                            <p className="text-sm text-slate-500 mt-2 text-left">Comment configurer votre numéro WhatsApp professionnel.</p>
                                        </SheetHeader>
                                        <div className="space-y-6 text-sm text-slate-600 pb-8">
                                            <VideoPlaceholder title="Connecter WhatsApp à Final Form" thumbnailUrl="https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=2000&auto=format&fit=crop" />

                                            <GuideStep number={1} title="Quel numéro utiliser ?">
                                                <p>
                                                    Utilisez un numéro <strong>WhatsApp Business</strong> dédié pour un rendu professionnel. Un numéro personnel fonctionne aussi, mais ne permet pas de personnaliser le profil d'entreprise.
                                                </p>
                                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800 flex gap-2 items-start mt-2 shadow-sm">
                                                    <span className="mt-0.5 text-base leading-none">💡</span>
                                                    <span>Un numéro WhatsApp Business avec photo de profil, description et horaires d'ouverture inspire confiance aux clients.</span>
                                                </div>
                                            </GuideStep>

                                            <GuideStep number={2} title="Format du numéro">
                                                <p>
                                                    Saisissez le numéro <strong>sans le 0</strong> initial. L'indicatif <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono">+213</code> est ajouté automatiquement.
                                                </p>
                                                <div className="grid grid-cols-2 gap-2 mt-3">
                                                    <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-center">
                                                        <span className="block text-xs font-bold text-red-700">❌ Incorrect</span>
                                                        <span className="text-[10px] text-red-600 font-mono">0555123456</span>
                                                    </div>
                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-center">
                                                        <span className="block text-xs font-bold text-green-700">✅ Correct</span>
                                                        <span className="text-[10px] text-green-600 font-mono">555123456</span>
                                                    </div>
                                                </div>
                                            </GuideStep>

                                            <GuideStep number={3} title="Profil par défaut">
                                                <p>
                                                    Le profil <strong>par défaut</strong> est utilisé automatiquement pour :
                                                </p>
                                                <ul className="list-disc list-outside ml-4 space-y-1 mt-2">
                                                    <li>Les <strong>messages de confirmation</strong> après une commande.</li>
                                                    <li>Les <strong>messages de récupération</strong> pour les paniers abandonnés.</li>
                                                    <li>Les <strong>notifications</strong> de changement de statut de commande.</li>
                                                </ul>
                                            </GuideStep>

                                            <GuideStep number={4} title="Tester votre numéro">
                                                <p>
                                                    Utilisez le bouton <strong>«Tester WhatsApp»</strong> dans la barre d'actions pour ouvrir une conversation WhatsApp avec votre propre numéro et vérifier qu'il est correctement formaté.
                                                </p>
                                            </GuideStep>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                                <TestConnectionButton
                                    onTest={async () => {
                                        const phone = waForm.phoneNumber;
                                        if (!phone || phone.replace(/\D/g, '').length < 10) {
                                            throw new Error("Veuillez saisir un numéro de téléphone valide.");
                                        }
                                        // Open wa.me link in new tab for verification
                                        const cleanNum = phone.replace(/[^0-9+]/g, '');
                                        window.open(`https://wa.me/${cleanNum.replace('+', '')}?text=${encodeURIComponent('Test de connexion Final Form ✅')}`, '_blank');
                                        return true;
                                    }}
                                    label="Tester WhatsApp"
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
                                    onClick={handleSaveWaProfile}
                                    disabled={isSaving}
                                    size="sm"
                                    className="h-8 rounded-lg text-xs font-bold px-4 bg-[#25D366] hover:bg-[#1DA851] text-white shadow-sm"
                                >
                                    {isSaving ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Save size={13} className="mr-1.5" />}
                                    Enregistrer
                                </Button>
                            </div>
                        }
                    />
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-700">Nom du profil</Label>
                                    <Input
                                        placeholder="ex. Équipe de Vente"
                                        className="bg-white h-10 border-slate-200"
                                        value={waForm.name}
                                        onChange={(e) => setWaForm({ ...waForm, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-700">Numéro WhatsApp</Label>
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
                                    <p className="text-[10px] text-slate-400 pl-1">Entrez le numéro sans l'indicatif (ex. 555123456)</p>
                                </div>

                                <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-lg border border-slate-100 mt-2">
                                    <Switch
                                        id="wa-default"
                                        checked={waForm.isDefault}
                                        onCheckedChange={(checked) => setWaForm({ ...waForm, isDefault: checked })}
                                        className="data-[state=checked]:bg-[#25D366]"
                                    />
                                    <Label htmlFor="wa-default" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">
                                        Définir comme profil par défaut pour les notifications
                                    </Label>
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
            className="h-8 rounded-lg text-xs font-bold px-4 bg-[#25D366] hover:bg-[#1DA851] text-white shadow-sm"
        >
            <Plus size={13} className="mr-1.5" />
            Nouveau Profil
        </Button>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                <PageHeader
                    title="WhatsApp"
                    breadcrumbs={[
                        { label: 'Intégrations', href: '/integrations', onClick: onBack },
                        { label: 'WhatsApp', href: '#' }
                    ]}
                    count={waProfiles.length}
                    icon={MessageCircle}
                    onBack={onBack}
                    actions={headerActions}
                />
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto w-full">
                    {waProfiles.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center mx-auto mb-4 border border-green-100">
                                <MessageCircle size={32} />
                            </div>
                            <h3 className="text-base font-bold text-slate-700 mb-1">Aucun profil WhatsApp</h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                                Connectez votre numéro WhatsApp professionnel pour envoyer des messages de récupération et de confirmation de commande.
                            </p>
                            <Button
                                onClick={startAddProfile}
                                className="h-10 rounded-xl text-sm font-bold px-6 bg-[#25D366] hover:bg-[#1DA851] text-white shadow-md shadow-green-100"
                            >
                                <Plus size={16} className="mr-2" /> Connecter le premier profil
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pl-5">Nom du Profil</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Numéro</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Statut</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pr-5 w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {waProfiles.map((profile) => (
                                        <TableRow
                                            key={profile.id}
                                            className="group cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                            onClick={() => startEditProfile(profile)}
                                        >
                                            <TableCell className="py-3.5 pl-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-50 ring-1 ring-black/[0.04]">
                                                        <MessageCircle size={14} className="text-[#25D366]" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-900">{profile.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                <span className="text-sm text-slate-600 font-mono" dir="ltr">{profile.phoneNumber}</span>
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                {profile.isDefault ? (
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100 font-semibold shadow-none">
                                                        Par Défaut
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
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
                                                            onClick={(e) => handleDeleteWaProfile(profile.id, e)}
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

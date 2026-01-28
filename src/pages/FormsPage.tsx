import {
    Loader2,
    Plus,
    Search,
    Upload
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useFormImportExport } from '@/lib/formImportExport';
import { cn } from '@/lib/utils';
import { FormLoadingCard, FormLoadingCardSkeleton, FormLoadingEmptyState } from '../components/FormLoading/FormLoadingCard';
import PrebuiltConfigModal from '../components/PrebuiltConfigModal';
import { PublishSheet } from '../components/PublishSheet';
import { getStoredUser } from '../lib/authGoogle';
import { useConnectedStores, useFormAssignments, useSavedForms } from '../lib/firebase/hooks';
import { useFormStore } from '../stores';

export const FormsPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const user = getStoredUser();

    const { forms, loading: isLoading, deleteForm, updateForm, saveForm } = useSavedForms(user?.id || '');
    const { assignments: allAssignments } = useFormAssignments(user?.id || '');
    const { stores } = useConnectedStores(user?.id || '');

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
    // const [storeFilter, setStoreFilter] = useState<string>('all'); // Not currently used in new UI

    // Action States
    const [isImporting, setIsImporting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Modal States
    const [showPublishSheet, setShowPublishSheet] = useState(false);
    const [selectedFormForPublish, setSelectedFormForPublish] = useState<any>(null);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);

    const { importFromFile } = useFormImportExport();
    const loadFormConfig = useFormStore((state) => state.loadFormConfig);
    const resetToNewForm = useFormStore((state) => state.resetToNewForm);

    // Helpers
    const assignments = useMemo(() => {
        return allAssignments.reduce((acc: any, assignment) => {
            if (!acc[assignment.formId]) {
                acc[assignment.formId] = [];
            }
            acc[assignment.formId].push(assignment);
            return acc;
        }, {});
    }, [allAssignments]);

    const storeAssignments = useMemo(() => {
        return allAssignments.reduce((acc: any, assignment) => {
            if (assignment.isActive) {
                acc[assignment.formId] = stores.find(s => s.id === assignment.storeId);
            }
            return acc;
        }, {});
    }, [allAssignments, stores]);

    const filteredForms = useMemo(() => {
        let filtered = [...forms];

        // 1. Search Query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(form => {
                const nameMatch = form.name?.toLowerCase().includes(lowerQuery);
                const descMatch = form.description?.toLowerCase().includes(lowerQuery);
                const productMatch = assignments[form.id]?.some((a: any) =>
                    a.productTitle?.toLowerCase().includes(lowerQuery)
                );
                return nameMatch || descMatch || productMatch;
            });
        }

        // 2. Filter
        if (filter !== 'all') {
            filtered = filtered.filter(form => {
                const isActive = allAssignments.some(a => a.formId === form.id && a.isActive);
                if (filter === 'published') return isActive;
                if (filter === 'draft') return !isActive;
                return true;
            });
        }

        // Sort by updated/created
        return filtered.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [forms, searchQuery, filter, allAssignments, assignments]);

    // Handlers
    const handleCreateNew = async () => {
        setIsCreating(true);
        try {
            resetToNewForm();
            navigate('/dashboard/build/new');
        } finally {
            setIsCreating(false);
        }
    };

    const handleCardClick = (formId: string) => {
        navigate(`/dashboard/build/${formId}`);
    };

    const handleTemplateSelect = (config: any) => {
        loadFormConfig(config);
        navigate('/dashboard/build/new');
        toast.success('Template loaded! Customize it to make it yours.');
        setTemplateModalOpen(false);
    };

    const handlePublishClick = (e: React.MouseEvent, form: any) => {
        e.stopPropagation();
        setSelectedFormForPublish(form);
        setShowPublishSheet(true);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const config = await importFromFile(file);
            if (config) {
                // Create as new form
                await saveForm(
                    `${file.name.replace('.json', '')} (Imported)`,
                    'Imported from file',
                    config
                );
                toast.success('Form imported successfully');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to import form');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDuplicate = async (form: any) => {
        try {
            const configCopy = JSON.parse(JSON.stringify(form.config || {}));
            const newName = `${form.name} (Copy)`;
            await saveForm(newName, form.description || '', configCopy);
            toast.success("Form duplicated");
        } catch (e) {
            toast.error("Failed to duplicate");
            console.error(e);
        }
    };

    const handleDeleteForm = async (formId: string) => {
        try {
            await deleteForm(formId);
            toast.success("Form deleted");
        } catch (e) {
            toast.error("Failed to delete");
        }
    }


    const handleRenameForm = async (formId: string, name: string) => {
        try {
            const form = forms.find(f => f.id === formId);
            if (!form) return;
            await updateForm(formId, { name });
            toast.success("Form renamed");
        } catch (e) {
            toast.error("Failed to rename");
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden bg-[#FAFAFA]">
            {/* 1. Header (Sticky Top) */}
            <div className="flex-none px-8 py-6 border-b border-slate-200/60 bg-white/50 backdrop-blur-md z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Forms</h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">Manage your high-converting product pages.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-amber-600 transition-colors" size={16} />
                            <Input
                                className="pl-10 w-[240px] bg-white border-slate-200/60 rounded-full focus:ring-amber-500/20 shadow-sm"
                                placeholder="Search forms..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter Pills */}
                        <div className="flex items-center bg-slate-100/50 p-1 rounded-full border border-slate-200/60">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilter('all')}
                                className={cn("rounded-full h-8 px-4 text-xs font-bold", filter === 'all' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                            >
                                All
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilter('published')}
                                className={cn("rounded-full h-8 px-4 text-xs font-bold", filter === 'published' ? "bg-white shadow-sm text-green-700" : "text-slate-500 hover:text-slate-700")}
                            >
                                Live
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilter('draft')}
                                className={cn("rounded-full h-8 px-4 text-xs font-bold", filter === 'draft' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                            >
                                Drafts
                            </Button>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".json,application/json"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            size="icon"
                            disabled={isImporting}
                            className="rounded-full w-10 h-10 border-slate-200 bg-white text-slate-500 hover:text-indigo-600"
                            title="Import Form"
                        >
                            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Scrollable Content Area */}
            <ScrollArea className="flex-1">
                <div className="p-8 pb-32 max-w-7xl mx-auto space-y-8">

                    {/* Create New Area - Horizontal Banner Style */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] p-8 shadow-xl shadow-indigo-200/50 text-white flex items-center justify-between">
                        <div className="relative z-10 max-w-md">
                            <h3 className="text-2xl font-bold mb-2">Create a new funnel</h3>
                            <p className="text-indigo-100 text-sm mb-6">Choose a template or start from scratch to boost conversion rates.</p>
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleCreateNew}
                                    disabled={isCreating}
                                    className="bg-white text-indigo-600 hover:bg-indigo-50 border-none shadow-lg hover:shadow-xl transition-all rounded-full h-10 px-6 font-bold"
                                >
                                    {isCreating ? <Loader2 size={16} className="animate-spin mr-2" /> : <Plus size={16} className="mr-2" />}
                                    Start Blank
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setTemplateModalOpen(true)}
                                    className="bg-indigo-500/20 border-indigo-400/30 text-white hover:bg-indigo-500/30 rounded-full h-10 px-6 font-semibold backdrop-blur-sm"
                                >
                                    Browse Templates
                                </Button>
                            </div>
                        </div>
                        {/* Decoration */}
                        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
                        <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    </div>

                    {/* Forms Grid - Reformatted for Wide Cards */}
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormLoadingCardSkeleton count={4} />
                        </div>
                    ) : filteredForms.length === 0 ? (
                        <FormLoadingEmptyState hasSearchQuery={!!searchQuery} />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {filteredForms.map(form => (
                                <FormLoadingCard
                                    key={form.id}
                                    form={form}
                                    productAssignments={assignments[form.id] || []}
                                    storeAssignment={storeAssignments[form.id]}
                                    onClick={() => handleCardClick(form.id)}
                                    onDuplicate={() => handleDuplicate(form)}
                                    onPublish={(e) => handlePublishClick(e, form)} // Pass handlePublishClick
                                    onRename={(name) => handleRenameForm(form.id, name)}
                                    // onDelete logic is inside the card's menu, but we pass handler if needed, 
                                    // actually the card implements its own delete confirm? 
                                    // In previous FormLoadingCard, it emits onDelete.
                                    onDelete={() => handleDeleteForm(form.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>

            <PrebuiltConfigModal
                isOpen={templateModalOpen}
                onClose={() => setTemplateModalOpen(false)}
                onLoad={handleTemplateSelect}
            />

            {selectedFormForPublish && (
                <PublishSheet
                    open={showPublishSheet}
                    onOpenChange={setShowPublishSheet}
                    userId={user?.id || ''}
                    formId={selectedFormForPublish.id}
                    formName={selectedFormForPublish.name}
                    formConfig={selectedFormForPublish.config}
                    onPublishSuccess={() => {
                        // Optional: refresh assignments or show toast
                    }}
                />
            )}
        </div>
    );
};

export default FormsPage;

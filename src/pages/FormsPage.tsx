import {
    FolderOpen,
    Plus,
    Search,
    Sparkles,
    Upload,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormLoadingCard } from '../components/FormLoading/FormLoadingCard';
import PrebuiltConfigModal from '../components/PrebuiltConfigModal';
import { PublishSheet } from '../components/PublishSheet';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from '../components/ui/sonner';
import { useFormImportExport } from '../hooks/useFormImportExport';
import { getStoredUser } from '../lib/authGoogle';
import { useConnectedStores, useFormAssignments, useSavedForms } from '../lib/firebase/hooks';
import { useFormStore } from '../stores';

export const FormsPage = () => {
    const navigate = useNavigate();
    const user = getStoredUser();
    const { forms, loading, deleteForm, updateForm, saveForm } = useSavedForms(user?.id || '');
    const { assignments: allAssignments } = useFormAssignments(user?.id || '');
    const { stores } = useConnectedStores(user?.id || '');

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [storeFilter, setStoreFilter] = useState<string>('all');
    const [isImporting, setIsImporting] = useState(false);

    // State for Modals
    const [showPublishSheet, setShowPublishSheet] = useState(false);
    const [selectedFormForPublish, setSelectedFormForPublish] = useState<any>(null);
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    const { importFromFile } = useFormImportExport();
    const loadFormConfig = useFormStore((state) => state.loadFormConfig);
    const resetToNewForm = useFormStore((state) => state.resetToNewForm);

    // Filter and sort forms
    const sortedForms = useMemo(() => {
        let filtered = [...forms];

        // 1. Search Query (Form Name, Description, OR Product Name from assignment)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(form => {
                // Check basic form info
                if (form.name.toLowerCase().includes(query) ||
                    (form.description && form.description.toLowerCase().includes(query))) {
                    return true;
                }

                // Check assigned products for this form
                const formAssignments = allAssignments.filter(a => a.formId === form.id);
                // We don't have product titles in assignments directly, only handles/ids
                // But for "Product Name" search requested by user, we might need that.
                // Assignments have 'productHandle', maybe match that?
                const hasMatchingProduct = formAssignments.some(a =>
                    a.productHandle && a.productHandle.toLowerCase().includes(query)
                );

                return hasMatchingProduct;
            });
        }

        // 2. Status Filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(form => {
                const isActive = allAssignments.some(a => a.formId === form.id && a.isActive);
                if (statusFilter === 'published') return isActive;
                if (statusFilter === 'draft') return !isActive;
                return true;
            });
        }

        // 3. Store Filter
        if (storeFilter !== 'all') {
            filtered = filtered.filter(form => {
                // Must have at least one active assignment to this store
                return allAssignments.some(a => a.formId === form.id && a.storeId === storeFilter && a.isActive);
            });
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [forms, searchQuery, statusFilter, storeFilter, allAssignments]);

    const handleCreateNew = () => {
        resetToNewForm();
        navigate('/dashboard/build/new');
    };

    const handleOpenTemplates = () => {
        setShowTemplateModal(true);
    };

    const handleLoadForm = (formId: string) => {
        navigate(`/dashboard/build/${formId}`);
    };

    const handleLoadTemplate = (config: any) => {
        resetToNewForm();
        loadFormConfig(config);
        navigate('/dashboard/build/new');
        toast.success('Template loaded! Customize it to make it yours.');
        setShowTemplateModal(false);
    };

    const handlePublishClick = (form: any) => {
        setSelectedFormForPublish(form);
        setShowPublishSheet(true);
    };

    // Hidden file input for import
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const result = await importFromFile(file);
            if (result.valid && result.config) {
                resetToNewForm();
                loadFormConfig(result.config);
                navigate('/dashboard/build/new');
                toast.success('Form imported successfully');
            } else {
                toast.error(result.errors.join(', '));
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to import file');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRenameForm = async (id: string, newName: string) => {
        try {
            await updateForm(id, { name: newName });
            toast.success("Form renamed");
        } catch (e) {
            toast.error("Failed to rename");
        }
    };

    const handleDeleteForm = async (id: string) => {
        try {
            await deleteForm(id);
            toast.success("Form deleted");
        } catch (e) {
            toast.error("Failed to delete");
        }
    };

    const handleDuplicateForm = async (form: any) => {
        try {
            // Deep copy config to ensure no reference issues
            const configCopy = JSON.parse(JSON.stringify(form.config || {}));
            const newName = `${form.name} (Copy)`;

            await saveForm(newName, form.description || '', configCopy);
            toast.success("Form duplicated");
        } catch (e) {
            toast.error("Failed to duplicate");
            console.error(e);
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-6 h-full flex flex-col">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 shrink-0">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <FolderOpen className="text-indigo-600" /> My Forms
                        <Badge variant="secondary" className="ml-2">
                            {forms.length}
                        </Badge>
                    </h1>
                    <p className="text-sm text-slate-500">
                        Manage your checkout forms or start from a template.
                    </p>
                </div>

                <div className="flex items-center gap-3">
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
                        disabled={isImporting}
                        className="hidden sm:flex"
                    >
                        {isImporting ? <div className="w-4 h-4 border-2 border-slate-500 border-t-indigo-600 rounded-full animate-spin mr-2" /> : <Upload size={16} className="mr-2" />}
                        Import
                    </Button>

                    <Button
                        onClick={handleCreateNew}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow"
                    >
                        <Plus size={18} className="mr-2" />
                        Create Form
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 space-y-6">

                {/* Toolbox */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-4 w-full flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search forms, products..."
                                className="pl-9 bg-white border-slate-200"
                            />
                        </div>

                        <div className="h-6 w-px bg-slate-200 shrink-0 hidden sm:block" />

                        {/* Filters */}
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                            <select
                                className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="all">All Status</option>
                                <option value="published">Published</option>
                                <option value="draft">Drafts</option>
                            </select>

                            <select
                                className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 max-w-[150px]"
                                value={storeFilter}
                                onChange={(e) => setStoreFilter(e.target.value)}
                                disabled={stores.length === 0}
                            >
                                <option value="all">All Stores</option>
                                {stores.map(store => (
                                    <option key={store.id} value={store.id}>{store.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Forms Grid */}
                <div className="flex-1 mt-0 overflow-y-auto min-h-0 -mr-2 pr-2 outline-none">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center text-slate-400">
                            Loading forms...
                        </div>
                    ) : sortedForms.length === 0 && !searchQuery && statusFilter === 'all' && storeFilter === 'all' ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <FolderOpen size={48} className="text-slate-300" />
                            <p>You haven't created any forms yet.</p>
                            <Button onClick={handleCreateNew}>
                                <Plus size={16} className="mr-2" /> Create your first form
                            </Button>
                        </div>
                    ) : sortedForms.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <p>No forms match your filters.</p>
                            <Button variant="outline" onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setStoreFilter('all');
                            }}>Clear all filters</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-10">
                            {/* Create New Card - Split Actions */}
                            <div className="group flex flex-col bg-white border-2 border-dashed border-slate-200 rounded-xl overflow-hidden hover:border-indigo-400 hover:shadow-md transition-all min-h-[240px]">
                                <button
                                    onClick={handleCreateNew}
                                    className="flex-1 flex flex-col items-center justify-center gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-dashed border-slate-200 w-full"
                                >
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                        <Plus size={20} strokeWidth={2} />
                                    </div>
                                    <span className="font-bold text-slate-900 text-sm">Create Blank Form</span>
                                </button>
                                <button
                                    onClick={handleOpenTemplates}
                                    className="flex-1 flex flex-col items-center justify-center gap-3 p-4 hover:bg-amber-50/50 transition-colors w-full"
                                >
                                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                        <Sparkles size={20} strokeWidth={2} />
                                    </div>
                                    <span className="font-bold text-slate-900 text-sm">Use Template</span>
                                </button>
                            </div>

                            {sortedForms.map(form => (
                                <FormLoadingCard
                                    key={form.id}
                                    form={form}
                                    assignments={allAssignments.filter(a => a.formId === form.id)}
                                    // Click loads builder
                                    onClick={() => handleLoadForm(form.id)}
                                    // Publish opens sheet
                                    onPublish={() => handlePublishClick(form)}
                                    onRename={(name) => handleRenameForm(form.id, name)}
                                    onDelete={() => handleDeleteForm(form.id)}
                                    onDuplicate={() => handleDuplicateForm(form)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <PrebuiltConfigModal
                isOpen={showTemplateModal}
                onClose={() => setShowTemplateModal(false)}
                onLoad={handleLoadTemplate}
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

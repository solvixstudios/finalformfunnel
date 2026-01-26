import {
    FolderOpen,
    Plus,
    Search,
    Sparkles,
    Upload
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormLoadingCard } from '../components/FormLoading/FormLoadingCard';
import { TemplateGrid } from '../components/PrebuiltConfigModal';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from '../components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useFormImportExport } from '../hooks/useFormImportExport';
import { getStoredUser } from '../lib/authGoogle';
import { useFormAssignments, useSavedForms } from '../lib/firebase/hooks';
import { useFormStore } from '../stores';

export const FormsPage = () => {
    const navigate = useNavigate();
    const user = getStoredUser();
    const { forms, loading, deleteForm, updateForm, saveForm } = useSavedForms(user?.id || '');
    const { assignments: allAssignments } = useFormAssignments(user?.id || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'forms' | 'templates'>('forms');
    const [isImporting, setIsImporting] = useState(false);
    const { importFromFile } = useFormImportExport();
    const loadFormConfig = useFormStore((state) => state.loadFormConfig);
    const resetToNewForm = useFormStore((state) => state.resetToNewForm);

    // Filter and sort forms
    const sortedForms = useMemo(() => {
        let filtered = [...forms];

        if (searchQuery.trim()) {
            filtered = filtered.filter(form =>
                form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        return filtered.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [forms, searchQuery]);

    const handleCreateNew = () => {
        resetToNewForm();
        navigate('/dashboard/build/new');
    };

    const handleLoadForm = (formId: string) => {
        navigate(`/dashboard/build/${formId}`);
    };

    const handleLoadTemplate = (config: any) => {
        resetToNewForm();
        loadFormConfig(config);
        navigate('/dashboard/build/new');
        toast.success('Template loaded! Customize it to make it yours.');
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
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col min-h-0 space-y-6">

                {/* Toolbox */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                        <TabsList className="bg-slate-100 p-1 rounded-lg">
                            <TabsTrigger value="forms" className="rounded-md px-3 text-xs sm:text-sm">My Forms</TabsTrigger>
                            <TabsTrigger value="templates" className="rounded-md px-3 text-xs sm:text-sm">Templates</TabsTrigger>
                        </TabsList>

                        {activeTab === 'forms' && (
                            <div className="relative flex-1 max-w-sm">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search forms..."
                                    className="pl-9 bg-white"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Forms Grid */}
                <TabsContent value="forms" className="flex-1 mt-0 overflow-y-auto min-h-0 -mr-2 pr-2 outline-none">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center text-slate-400">
                            Loading forms...
                        </div>
                    ) : sortedForms.length === 0 && !searchQuery ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <FolderOpen size={48} className="text-slate-300" />
                            <p>You haven't created any forms yet.</p>
                            <Button onClick={handleCreateNew}>
                                <Plus size={16} className="mr-2" /> Create your first form
                            </Button>
                        </div>
                    ) : sortedForms.length === 0 && searchQuery ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                            <p>No forms match "{searchQuery}".</p>
                            <Button variant="outline" onClick={() => setSearchQuery('')}>Clear search</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {/* Create New Card */}
                            <div
                                onClick={handleCreateNew}
                                className="group flex flex-col items-center justify-center gap-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all min-h-[180px]"
                            >
                                <div className="w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 group-hover:border-indigo-300 group-hover:shadow-lg transition-all duration-300 text-indigo-600">
                                    <Plus size={28} strokeWidth={1.5} />
                                </div>
                            </div>

                            {sortedForms.map(form => (
                                <FormLoadingCard
                                    key={form.id}
                                    form={form}
                                    assignments={allAssignments.filter(a => a.formId === form.id)}
                                    onClick={() => handleLoadForm(form.id)}
                                    onRename={(name) => handleRenameForm(form.id, name)}
                                    onDelete={() => handleDeleteForm(form.id)}
                                    onDuplicate={() => handleDuplicateForm(form)}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Templates Grid */}
                <TabsContent value="templates" className="flex-1 mt-0 overflow-y-auto min-h-0 -mr-2 pr-2 outline-none">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Sparkles className="text-amber-500" size={20} />
                            Start with a Template
                        </h2>
                        <p className="text-slate-500 text-sm">
                            Pre-built, high-converting checkout forms ready to customize.
                        </p>
                    </div>
                    <TemplateGrid onApply={handleLoadTemplate} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default FormsPage;

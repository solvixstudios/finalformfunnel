
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowUpDown,
    FolderOpen,
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
    const [sortBy, setSortBy] = useState<string>('updated_desc');
    // const [storeFilter, setStoreFilter] = useState<string>('all'); // Not currently used in new UI

    // Action States
    const [isImporting, setIsImporting] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Modal States
    const [showPublishSheet, setShowPublishSheet] = useState(false);
    const [selectedFormForPublish, setSelectedFormForPublish] = useState<any>(null);
    const [templateModalOpen, setTemplateModalOpen] = useState(false);

    // Delete Confirmation
    const [formToDelete, setFormToDelete] = useState<string | null>(null);


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

        // 3. Sort
        return filtered.sort((a, b) => {
            if (sortBy === 'name_asc') {
                return (a.name || '').localeCompare(b.name || '');
            }
            if (sortBy === 'name_desc') {
                return (b.name || '').localeCompare(a.name || '');
            }
            if (sortBy === 'updated_asc') {
                const dateA = new Date(a.updatedAt || a.createdAt).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt).getTime();
                return dateA - dateB;
            }
            // default updated_desc
            const dateA = new Date(a.updatedAt || a.createdAt).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt).getTime();
            return dateB - dateA;
        });
    }, [forms, searchQuery, filter, sortBy, allAssignments, assignments]);

    // Handlers
    const handleCreateNew = async () => {
        setIsCreating(true);
        try {
            resetToNewForm();
            navigate('/dashboard/forms/edit/new');
        } finally {
            setIsCreating(false);
        }
    };

    const handleCardClick = (formId: string) => {
        navigate(`/dashboard/forms/edit/${formId}`);
    };

    const handleTemplateSelect = (config: any) => {
        loadFormConfig(config);
        navigate('/dashboard/forms/edit/new');
        toast.success('Template loaded! Customize it to make it yours.');
        setTemplateModalOpen(false);
    };

    const handlePublishClick = (e: React.MouseEvent, form: any) => {
        e.stopPropagation();
        setSelectedFormForPublish(form);
        setShowPublishSheet(true);
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

    const initiateDelete = (formId: string) => {
        setFormToDelete(formId);
    };

    const confirmDelete = async () => {
        if (!formToDelete) return;
        setIsDeleting(true);
        try {
            await deleteForm(formToDelete);
            toast.success("Form deleted successfully");
            setFormToDelete(null);
        } catch (e: any) {
            toast.error(e.message || "Failed to delete form");
        } finally {
            setIsDeleting(false);
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

    const headerActions = (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-amber-600 transition-colors" size={14} />
                <Input
                    className="pl-9 w-full sm:w-[200px] h-9 bg-white border-slate-200 rounded-full focus:ring-amber-500/20 shadow-sm text-sm"
                    placeholder="Search forms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[140px] h-9 bg-white border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                    <ArrowUpDown size={12} className="mr-2 text-slate-400" />
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent align="end">
                    <SelectItem value="updated_desc">Newest First</SelectItem>
                    <SelectItem value="updated_asc">Oldest First</SelectItem>
                    <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                </SelectContent>
            </Select>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-100/50 p-1 rounded-full border border-slate-200/60 h-9 scroll-x-mobile">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter('all')}
                    className={cn("rounded-full h-7 px-3 text-[10px] font-bold transition-all", filter === 'all' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                >
                    All
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter('published')}
                    className={cn("rounded-full h-7 px-3 text-[10px] font-bold transition-all", filter === 'published' ? "bg-white shadow-sm text-green-700" : "text-slate-500 hover:text-slate-700")}
                >
                    Live
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter('draft')}
                    className={cn("rounded-full h-7 px-3 text-[10px] font-bold transition-all", filter === 'draft' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                >
                    Drafts
                </Button>
            </div>



        </div>
    );

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <PageHeader
                title="Forms"
                breadcrumbs={[
                    { label: 'Forms' }
                ]}
                count={forms.length}
                icon={FolderOpen}
                actions={headerActions}
            />
            {/* 2. Scrollable Content Area */}

            {/* 2. Scrollable Content Area */}
            <div className="flex-1 pb-20 max-w-7xl mx-auto w-full space-y-8">

                {/* Unified Forms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {/* Create New Form Card */}
                    {(!searchQuery && filter === 'all') && (
                        <div
                            onClick={() => setTemplateModalOpen(true)}
                            className="group relative bg-gradient-to-br from-indigo-50 via-white to-white border-2 border-indigo-100/80 rounded-3xl p-5 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100 transition-all duration-300 min-h-[180px] sm:min-h-[200px] overflow-hidden card-hover gradient-border"
                        >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-100 text-indigo-600 border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 flex items-center justify-center mb-4 sm:mb-5 shadow-sm">
                                <Plus size={28} className="sm:w-8 sm:h-8" strokeWidth={2.5} />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Create New Form</h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-[200px] leading-relaxed">Start with a blank canvas or choose a pre-made template</p>
                        </div>
                    )}

                    {isLoading ? (
                        <FormLoadingCardSkeleton count={3} />
                    ) : filteredForms.length === 0 && (searchQuery || filter !== 'all') ? (
                        <div className="col-span-full">
                            <FormLoadingEmptyState hasSearchQuery={!!searchQuery} />
                        </div>
                    ) : (
                        filteredForms.map((form, index) => (
                            <div key={form.id} className={`animate-fade-up stagger-${Math.min(index + 1, 8)}`}>
                                <FormLoadingCard
                                    form={form}
                                    productAssignments={assignments[form.id] || []}
                                    storeAssignment={storeAssignments[form.id]}
                                    onClick={() => handleCardClick(form.id)}
                                    onDuplicate={() => handleDuplicate(form)}
                                    onPublish={(e) => handlePublishClick(e, form)}
                                    onRename={(name) => handleRenameForm(form.id, name)}
                                    onDelete={async () => initiateDelete(form.id)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>


            <PrebuiltConfigModal
                isOpen={templateModalOpen}
                onClose={() => setTemplateModalOpen(false)}
                onLoad={handleTemplateSelect}
            />

            {
                selectedFormForPublish && (
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
                )
            }

            <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the form
                            and remove all its connections to your stores.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Form'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
};

export default FormsPage;

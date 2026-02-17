
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
    ChevronLeft,
    ChevronRight,
    Copy,
    ExternalLink,
    FileText,
    FolderOpen,
    LayoutGrid,
    Loader2,
    MoreHorizontal,
    PenLine,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { cn } from '@/lib/utils';
import { FormLoadingEmptyState } from '../components/FormLoading/FormLoadingCard';
import PrebuiltConfigModal from '../components/PrebuiltConfigModal';
import { getStoredUser } from '../lib/authGoogle';
import { useConnectedStores, useFormAssignments, useSavedForms } from '../lib/firebase/hooks';
import { useFormStore } from '../stores';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 15;

export const FormsPage = () => {
    const navigate = useNavigate();
    const user = getStoredUser();

    const { forms, loading: isLoading, deleteForm, updateForm, saveForm } = useSavedForms(user?.id || '');
    const { assignments: allAssignments } = useFormAssignments(user?.id || '');
    const { stores } = useConnectedStores(user?.id || '');

    // Local State
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
    const [sortBy, setSortBy] = useState<string>('updated_desc');
    const [currentPage, setCurrentPage] = useState(1);

    // Action States
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Modal States
    const [templateModalOpen, setTemplateModalOpen] = useState(false);

    // Delete
    const [formToDelete, setFormToDelete] = useState<string | null>(null);

    // Rename
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renameFormId, setRenameFormId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const loadFormConfig = useFormStore((state) => state.loadFormConfig);
    const resetToNewForm = useFormStore((state) => state.resetToNewForm);

    // Derived data
    const storeAssignments = useMemo(() => {
        return allAssignments.reduce((acc: any, assignment) => {
            if (assignment.isActive) {
                acc[assignment.formId] = stores.find(s => s.id === assignment.storeId);
            }
            return acc;
        }, {});
    }, [allAssignments, stores]);

    const stats = useMemo(() => {
        const total = forms.length;
        const live = forms.filter(f =>
            allAssignments.some(a => a.formId === f.id && a.isActive)
        ).length;
        const drafts = total - live;
        return { total, live, drafts };
    }, [forms, allAssignments]);

    const filteredForms = useMemo(() => {
        let filtered = [...forms];

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(form =>
                form.name?.toLowerCase().includes(lowerQuery) ||
                form.description?.toLowerCase().includes(lowerQuery)
            );
        }

        if (filter === 'published') {
            filtered = filtered.filter(form =>
                allAssignments.some(a => a.formId === form.id && a.isActive)
            );
        } else if (filter === 'draft') {
            filtered = filtered.filter(form =>
                !allAssignments.some(a => a.formId === form.id && a.isActive)
            );
        }

        return filtered.sort((a, b) => {
            if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
            if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
            if (sortBy === 'updated_asc') return new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
            return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
        });
    }, [forms, searchQuery, filter, sortBy, allAssignments]);

    const totalPages = Math.ceil(filteredForms.length / ITEMS_PER_PAGE);
    const paginatedForms = filteredForms.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useMemo(() => setCurrentPage(1), [searchQuery, filter, sortBy]);

    // Handlers
    const handleCreateNew = () => {
        setIsCreating(true);
        resetToNewForm();
        navigate('/dashboard/forms/edit/new');
        setIsCreating(false);
    };

    const handleCardClick = (formId: string) => navigate(`/dashboard/forms/edit/${formId}`);

    const handleTemplateSelect = (config: any) => {
        loadFormConfig(config);
        navigate('/dashboard/forms/edit/new');
        toast.success('Template loaded! Customize it to make it yours.');
        setTemplateModalOpen(false);
    };

    const handleDuplicate = async (form: any) => {
        try {
            const configCopy = JSON.parse(JSON.stringify(form.config || {}));
            // Default to 'product' type internally for compatibility, or just let it handle itself
            await saveForm(`${form.name} (Copy)`, form.description || '', configCopy, form.type || configCopy.type || 'product');
            toast.success("Form duplicated");
        } catch (e) {
            toast.error("Failed to duplicate");
        }
    };

    const confirmDelete = async () => {
        if (!formToDelete) return;
        setIsDeleting(true);
        try {
            await deleteForm(formToDelete);
            toast.success("Form deleted");
            setFormToDelete(null);
        } catch (e: any) {
            toast.error(e.message || "Failed to delete");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRenameForm = async () => {
        if (!renameFormId || !renameValue.trim()) return;
        try {
            await updateForm(renameFormId, { name: renameValue.trim() });
            toast.success("Form renamed");
            setRenameDialogOpen(false);
            setRenameFormId(null);
        } catch {
            toast.error("Failed to rename");
        }
    };



    // Header actions
    const headerActions = (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setTemplateModalOpen(true)}
                className="h-8 rounded-full text-xs font-semibold px-4 border-slate-200/80"
            >
                <LayoutGrid size={13} className="mr-1.5 text-slate-500" />
                Templates
            </Button>
            <Button
                size="sm"
                onClick={handleCreateNew}
                className="h-8 rounded-full text-xs font-semibold px-4 bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                disabled={isCreating}
            >
                {isCreating ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Plus size={13} className="mr-1.5" />}
                New Form
            </Button>
        </div>
    );

    return (
        <>
            <div className="max-w-[1600px] mx-auto w-full space-y-5 h-full flex flex-col pt-2">
                <PageHeader
                    title="Forms"
                    breadcrumbs={[{ label: 'Forms' }]}
                    count={forms.length}
                    icon={FolderOpen}
                    actions={headerActions}
                />

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                    {/* Search */}
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-500 transition-colors" size={15} />
                        <Input
                            className="pl-10 h-10 bg-white border-slate-200/80 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 placeholder:text-slate-400"
                            placeholder="Search forms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Filter Pills */}
                        <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/60">
                            {[
                                { key: 'all', label: 'All', count: stats.total },
                                { key: 'published', label: 'Live', count: stats.live },
                                { key: 'draft', label: 'Drafts', count: stats.drafts },
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setFilter(item.key as any)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5",
                                        filter === item.key
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    )}
                                >
                                    {item.key === 'published' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                    {item.label}
                                    <span className={cn(
                                        "text-[10px] font-bold",
                                        filter === item.key ? "text-slate-500" : "text-slate-400"
                                    )}>
                                        {item.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Sort */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[140px] h-9 bg-white border-slate-200/80 rounded-full text-xs font-medium text-slate-600 shadow-sm">
                                <ArrowUpDown size={11} className="mr-1.5 text-slate-400" />
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end">
                                <SelectItem value="updated_desc">Newest First</SelectItem>
                                <SelectItem value="updated_asc">Oldest First</SelectItem>
                                <SelectItem value="name_asc">Name A–Z</SelectItem>
                                <SelectItem value="name_desc">Name Z–A</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 pb-16 overflow-y-auto pr-1">
                    {isLoading ? (
                        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                            <div className="space-y-0">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-100 last:border-b-0">
                                        <Skeleton className="w-9 h-9 rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-3.5 w-40" />
                                            <Skeleton className="h-2.5 w-24" />
                                        </div>
                                        <Skeleton className="h-5 w-14 rounded-full" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : paginatedForms.length === 0 ? (
                        <FormLoadingEmptyState hasSearchQuery={!!searchQuery} />
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm animate-in fade-in duration-300">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
                                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3 pl-5 w-[45%]">Form</TableHead>

                                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3">Status</TableHead>
                                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3">Store</TableHead>
                                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3">Updated</TableHead>
                                        <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-wider py-3 pr-5 w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedForms.map((form) => {
                                        const isPublished = allAssignments.some(a => a.formId === form.id && a.isActive);
                                        const store = storeAssignments[form.id];
                                        const formConfig = form.config || {};
                                        const accentColor = formConfig.accentColor || '#6366f1';

                                        const updatedStr = form.updatedAt
                                            ? new Date(form.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                            : '';

                                        return (
                                            <TableRow
                                                key={form.id}
                                                className="group cursor-pointer hover:bg-slate-50/50 transition-colors border-b border-slate-100/80 last:border-b-0"
                                                onClick={() => handleCardClick(form.id)}
                                            >
                                                {/* Form Name + Icon */}
                                                <TableCell className="py-3.5 pl-5">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-black/[0.04]"
                                                            style={{ background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}22)` }}
                                                        >
                                                            <FileText size={15} style={{ color: accentColor }} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h3 className="text-sm font-semibold text-slate-900 truncate leading-snug">
                                                                {form.name || 'Untitled Form'}
                                                            </h3>
                                                            {form.description ? (
                                                                <p className="text-[11px] text-slate-400 truncate max-w-[300px]">{form.description}</p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell className="py-3.5">
                                                    {isPublished ? (
                                                        <Badge className="h-5 px-2 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold uppercase tracking-wider shadow-none hover:bg-emerald-50 rounded-full">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                                                            Live
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="h-5 px-2 text-[10px] font-bold uppercase tracking-wider shadow-none rounded-full">
                                                            Draft
                                                        </Badge>
                                                    )}
                                                </TableCell>

                                                {/* Store */}
                                                <TableCell className="py-3.5">
                                                    {store ? (
                                                        <span className="text-xs text-slate-600 truncate max-w-[100px] block font-medium">{store.name}</span>
                                                    ) : (
                                                        <span className="text-xs text-slate-300">—</span>
                                                    )}
                                                </TableCell>

                                                {/* Updated */}
                                                <TableCell className="py-3.5">
                                                    <span className="text-xs text-slate-400 tabular-nums">{updatedStr}</span>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="py-3.5 pr-5">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreHorizontal size={15} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-44">
                                                            <DropdownMenuItem onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCardClick(form.id);
                                                            }}>
                                                                <ExternalLink size={13} className="mr-2" /> Open Editor
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={(e) => {
                                                                e.stopPropagation();
                                                                setRenameFormId(form.id);
                                                                setRenameValue(form.name || '');
                                                                setRenameDialogOpen(true);
                                                            }}>
                                                                <PenLine size={13} className="mr-2" /> Rename
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDuplicate(form);
                                                            }}>
                                                                <Copy size={13} className="mr-2" /> Duplicate
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-700 focus:bg-red-50"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFormToDelete(form.id);
                                                                }}
                                                            >
                                                                <Trash2 size={13} className="mr-2" /> Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between py-3 mt-2">
                            <p className="text-xs text-slate-400">
                                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredForms.length)} of {filteredForms.length}
                            </p>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                                    <ChevronLeft size={14} />
                                </Button>
                                <span className="text-xs font-medium text-slate-600 px-2 tabular-nums">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                                    <ChevronRight size={14} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Modals ─── */}

            <PrebuiltConfigModal
                isOpen={templateModalOpen}
                onClose={() => setTemplateModalOpen(false)}
                onLoad={handleTemplateSelect}
            />



            {/* Delete Dialog */}
            <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this form?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the form and all its store connections. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmDelete(); }}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-full"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…</> : 'Delete Form'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Rename Form</DialogTitle>
                        <DialogDescription>Enter a new name for this form.</DialogDescription>
                    </DialogHeader>
                    <div className="py-3">
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="Form name"
                            autoFocus
                            className="rounded-xl"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameForm(); }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)} className="rounded-full">Cancel</Button>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full" onClick={handleRenameForm} disabled={!renameValue.trim()}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default FormsPage;

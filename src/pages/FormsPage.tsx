
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
import { DashboardHeader } from '@/components/DashboardHeader';
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
    FileCheck2,
    FileText,
    FolderOpen,
    Globe2,
    LayoutGrid,
    Loader2,
    MoreHorizontal,
    PenLine,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
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
import { StateWrapper } from '@/components/ui/StateWrapper';
import { getStoredUser } from '../lib/authGoogle';
import { useConnectedStores, useFormAssignments, useSavedForms } from '../lib/firebase/hooks';
import { useFormStore } from '../stores';
import { Skeleton } from '@/components/ui/skeleton';
import { TableSkeleton } from '@/components/ui/table-skeleton';

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
        return allAssignments.reduce((acc: Record<string, { id: string; name: string } | undefined>, assignment) => {
            if (assignment.isActive) {
                acc[assignment.formId] = stores.find(s => s.id === assignment.storeId);
            }
            return acc;
        }, {});
    }, [allAssignments, stores]);

    const stats = useMemo(() => {
        const total = forms.length;
        const live = forms.filter(f => f.status === 'published').length;
        const drafts = total - live;
        return { total, live, drafts };
    }, [forms]);

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
            filtered = filtered.filter(form => form.status === 'published');
        } else if (filter === 'draft') {
            filtered = filtered.filter(form => form.status !== 'published');
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

    const handleTemplateSelect = (config: Record<string, unknown>) => {
        loadFormConfig(config);
        navigate('/dashboard/forms/edit/new');
        toast.success('Template loaded! Customize it to make it yours.');
        setTemplateModalOpen(false);
    };

    const handleDuplicate = async (form: { id: string; name?: string; description?: string; config?: Record<string, unknown>; type?: string }) => {
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
        } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : "Failed to delete");
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
                className="h-8 rounded-lg text-xs font-medium px-4 border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
            >
                <LayoutGrid size={13} className="mr-1.5 text-slate-500" />
                Templates
            </Button>
            <Button
                size="sm"
                onClick={handleCreateNew}
                className="h-8 rounded-lg text-xs font-bold px-4 bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 text-white shadow-sm"
                disabled={isCreating}
            >
                {isCreating ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Plus size={13} className="mr-1.5" />}
                New Form
            </Button>
        </div>
    );

    return (
        <>
            <div className="max-w-[1600px] mx-auto w-full space-y-5 h-full flex flex-col pt-2 md:pt-4">
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
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-500 transition-colors" size={16} />
                        <Input
                            className="pl-9 h-10 bg-white border-slate-200 rounded-lg text-sm shadow-sm focus:ring-1 focus:ring-slate-900/5 focus:border-slate-300 placeholder:text-slate-400 font-medium"
                            placeholder="Search forms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Filter Pills */}
                        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                            {[
                                { key: 'all', label: 'All', count: stats.total },
                                { key: 'published', label: 'Live', count: stats.live },
                                { key: 'draft', label: 'Drafts', count: stats.drafts },
                            ].map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setFilter(item.key as typeof filter)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5",
                                        filter === item.key
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-900"
                                    )}
                                >
                                    {item.key === 'published' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                    {item.label}
                                    <span className={cn(
                                        "text-[10px] font-semibold",
                                        filter === item.key ? "text-slate-500" : "text-slate-400"
                                    )}>
                                        {item.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Sort */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-[140px] h-10 bg-white border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                                <ArrowUpDown size={14} className="mr-1.5 text-slate-400" />
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
                {isLoading ? (
                    <StateWrapper>
                        <TableSkeleton columns={5} rows={6} className="bg-white rounded-xl border border-slate-200 shadow-sm w-full h-full" />
                    </StateWrapper>
                ) : paginatedForms.length === 0 ? (
                    <StateWrapper>
                        <FormLoadingEmptyState hasSearchQuery={!!searchQuery} onClear={() => {
                            setSearchQuery('');
                            setFilter('all');
                        }} />
                    </StateWrapper>
                ) : (
                    <div className="flex-1 pb-16 overflow-y-auto pr-1 flex flex-col">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pl-5 w-[45%]">Form Name</TableHead>

                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Status</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Store</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Last Updated</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pr-5 w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedForms.map((form) => {
                                        const isPublished = form.status === 'published';
                                        const store = storeAssignments[form.id];
                                        const formConfig = form.config || {};
                                        const accentColor = formConfig.accentColor || '#7C3AED';

                                        const updatedStr = form.updatedAt
                                            ? new Date(form.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                            : '';

                                        return (
                                            <TableRow
                                                key={form.id}
                                                className="group cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                                onClick={() => handleCardClick(form.id)}
                                            >
                                                {/* Form Name + Icon */}
                                                <TableCell className="py-3 pl-5">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/[0.04]"
                                                            style={{ background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}22)` }}
                                                        >
                                                            <FileText size={14} style={{ color: accentColor }} />
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
                                                <TableCell className="py-3">
                                                    {isPublished ? (
                                                        <Badge className="h-5 px-2 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold uppercase tracking-wider shadow-none hover:bg-emerald-50 rounded-md">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                                                            Published
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="h-5 px-2 text-[10px] font-semibold uppercase tracking-wider shadow-none rounded-md">
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
                                                <TableCell className="py-3 pr-5 text-right">
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
                    </div>
                )}
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

            {/* ─── Modals ─── */}

            <PrebuiltConfigModal
                isOpen={templateModalOpen}
                onClose={() => setTemplateModalOpen(false)}
                onLoad={handleTemplateSelect}
            />

            {/* Delete Dialog */}
            <AlertDialog open={!!formToDelete} onOpenChange={(open) => !open && setFormToDelete(null)}>
                <AlertDialogContent className="rounded-xl p-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-bold">Delete this form?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove the form and all its store connections. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                        <AlertDialogCancel disabled={isDeleting} className="rounded-lg font-semibold">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmDelete(); }}
                            className="bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…</> : 'Delete Form'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Rename Form</DialogTitle>
                        <DialogDescription>Enter a new name for this form.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            placeholder="Form name"
                            autoFocus
                            className="rounded-lg h-10 px-3 font-medium text-sm border-slate-200"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleRenameForm(); }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameDialogOpen(false)} className="rounded-lg font-semibold border-slate-200">Cancel</Button>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold px-5 shadow-sm" onClick={handleRenameForm} disabled={!renameValue.trim()}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default FormsPage;

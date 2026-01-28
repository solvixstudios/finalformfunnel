import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Clock, Copy, FileText, MoreVertical, Pencil, Store, Trash2 } from 'lucide-react';
import React from 'react';

export interface FormLoadingCardProps {
  form?: {
    id: string;
    name: string;
    description?: string;
    updatedAt?: string;
    createdAt?: string;
    status?: 'draft' | 'published';
    config?: any;
  };
  isLoading?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onRename?: (newName: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onDuplicate?: () => Promise<void>;
  onPublish?: (e: React.MouseEvent) => void;
  onUnpublish?: (assignmentId: string) => Promise<void>;
  assignments?: any[];
  productAssignments?: any[];
  storeAssignment?: any;
  actionLabel?: string;
  className?: string;
}

export const FormLoadingCard: React.FC<FormLoadingCardProps> = ({
  form,
  isLoading = false,
  onClick,
  onRename,
  onDelete,
  onDuplicate,
  onPublish,
  onUnpublish,
  assignments = [],
  productAssignments = [],
  storeAssignment,
  className,
}) => {
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isUnpublishing, setIsUnpublishing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className={cn("h-[240px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse", className)}>
        <div className="flex justify-between mb-4">
          <div className="h-10 w-10 rounded-lg bg-slate-100" />
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-slate-100" />
            <div className="h-3 w-3 rounded-full bg-slate-100" />
            <div className="h-3 w-3 rounded-full bg-slate-100" />
          </div>
        </div>
        <div className="h-5 w-3/4 bg-slate-100 rounded mb-3" />
        <div className="h-4 w-1/2 bg-slate-100 rounded mb-6" />
        <div className="mt-auto h-8 w-full bg-slate-100 rounded" />
      </div>
    );
  }

  if (!form) return null;

  // Use props directly instead of deriving from empty assignments array
  // Check if any product assignment is active OR if we have a store assignment (which is only passed if active)
  const isPublished = (productAssignments?.some(a => a.isActive) ?? false) || !!storeAssignment;

  // Extract theme colors from form config
  // Config structure is directly at root: accentColor, formBackground, ctaColor
  const formConfig = form.config || {};

  // Use sensible defaults that look good
  const primaryColor = formConfig.accentColor || '#4f46e5';
  const bgColor = formConfig.formBackground || '#ffffff';
  // Use ctaColor for the third circle
  const buttonColor = formConfig.ctaColor || '#4f46e5';

  const handleRenameSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!renameValue.trim() || renameValue === form.name) {
      setIsRenaming(false);
      return;
    }
    if (onRename) {
      await onRename(renameValue);
    }
    setIsRenaming(false);
  };

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameValue(form.name);
    setIsRenaming(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsDeleting(true);
      if (onDelete) {
        await onDelete();
      }
    } catch (error) {
      console.error('Failed to delete form:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
  };

  const handlePublishClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If published to exactly ONE item, directly unpublish
    // Note: onUnpublish logic disabled as we rely on sheet for now and data structures differ
    /* 
    if (isPublished && activeAssignments.length === 1 && onUnpublish) {
      setIsUnpublishing(true);
      onUnpublish(activeAssignments[0].id).finally(() => setIsUnpublishing(false));
      return;
    } 
    */

    // Otherwise open the sheet
    if (onPublish) {
      onPublish(e);
    } else if (onClick) {
      onClick();
    }
  };

  if (showDeleteConfirm) {
    return (
      <div className={cn(
        "bg-red-50 text-left p-5 border-2 border-red-200 rounded-2xl w-full overflow-hidden h-[240px] flex flex-col justify-center",
        className
      )}>
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={24} className="text-red-600" />
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <p className="font-bold text-red-900 mb-3">Delete "{form.name}"?</p>
            <p className="text-sm text-red-700 mb-4">This action cannot be undone.</p>

            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }



  const displayName = form.name;
  const timeAgo = new Date(form.updatedAt || form.createdAt || '').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div
      className={cn(
        "group relative flex items-center gap-5 w-full bg-white rounded-2xl border border-slate-200/60 p-4 transition-all duration-300 hover:ring-1 hover:ring-slate-300 shadow-none hover:shadow-sm overflow-hidden h-[100px]",
        className
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

      {/* 1. Mini Preview (Left) */}
      <div className="relative shrink-0 w-[60px] h-[60px] rounded-xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${bgColor}30)` }}>
        <div className="w-6 h-6 rounded-md shadow-sm opacity-80" style={{ backgroundColor: buttonColor }} />
        {/* Active Status Dot on Preview */}
        {isPublished && (
          <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white shadow-sm" />
        )}
      </div>

      {/* 2. Middle Meta Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900 truncate tracking-tight group-hover:text-indigo-600 transition-colors">
            {isRenaming ? "Renaming..." : displayName}
          </h3>
          {isPublished && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-green-50/50 text-green-700 border-green-200/50 font-bold uppercase tracking-wider">
              Live
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {timeAgo}
          </span>
          <span>•</span>
          <span className="truncate max-w-[190px]">
            {storeAssignment ? (
              <span className="flex items-center gap-1"><Store size={10} /> {storeAssignment.name || storeAssignment}</span>
            ) : (
              <span>{productAssignments.length} Products</span>
            )}
          </span>
        </div>
      </div>

      {/* 3. Hover Actions (Right) */}
      <div className="relative z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 duration-200">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-white shadow-sm"
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}
          title="Edit Form"
        >
          <Pencil size={14} />
        </Button>

        {onDuplicate && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-white shadow-sm"
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            title="Duplicate"
          >
            <Copy size={14} />
          </Button>
        )}

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-white shadow-sm">
              <MoreVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border-slate-200 shadow-xl">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}>
              <Pencil size={14} className="mr-2" /> Rename
            </DropdownMenuItem>

            {isPublished ? (
              <DropdownMenuItem disabled className="text-slate-400">
                <Trash2 size={14} className="mr-2" /> Delete (Active)
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-red-600 focus:bg-red-50 focus:text-red-700"
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              >
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>

        </DropdownMenu>

        {onPublish && (
          <Button
            size="sm"
            className={cn(
              "ml-2 rounded-full px-4 h-8 text-xs font-bold shadow-sm transition-all",
              isPublished
                ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
                : "bg-slate-900 text-white hover:bg-slate-800"
            )}
            onClick={(e) => { e.stopPropagation(); onPublish(e); }}
          >
            {isPublished ? "Manage" : "Publish"}
          </Button>
        )}
      </div>
    </div>
  );
};

export const FormLoadingCardSkeleton = ({ count = 4 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <FormLoadingCard key={i} isLoading={true} />
    ))}
  </>
);

export const FormLoadingEmptyState = ({ hasSearchQuery }: { hasSearchQuery?: boolean }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
      <FileText size={32} className="text-slate-300" />
    </div>
    <h3 className="text-lg font-medium text-slate-900 mb-1">
      {hasSearchQuery ? 'No matching forms found' : 'No forms created yet'}
    </h3>
    <p className="max-w-xs mx-auto text-sm">
      {hasSearchQuery
        ? 'Try adjusting your search terms.'
        : 'Create your first form to get started with high-converting pages.'}
    </p>
  </div>
);

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Clock, Copy, FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
  onPublish?: () => void;
  onUnpublish?: (assignmentId: string) => Promise<void>;
  assignments?: any[]; // Using any[] for now to avoid circular deps or complex imports, ideally FormAssignment[]
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

  const activeAssignments = assignments.filter(a => a.isActive);
  const isPublished = activeAssignments.length > 0;

  // Extract theme colors from form config
  // Config structure is directly at root: accentColor, formBackground, ctaColor
  const formConfig = form.config || {};

  // Use sensible defaults that look good
  const primaryColor = formConfig.accentColor || '#4f46e5';
  const bgColor = formConfig.formBackground || '#ffffff';
  // Use ctaColor for the third circle
  const buttonColor = formConfig.ctaColor || '#4f46e5';

  // Group assignments by assignmentType
  const storeAssignment = activeAssignments.find(a => a.assignmentType === 'store');
  const productAssignments = activeAssignments.filter(a => a.assignmentType === 'product');

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
    if (isPublished && activeAssignments.length === 1 && onUnpublish) {
      setIsUnpublishing(true);
      onUnpublish(activeAssignments[0].id).finally(() => setIsUnpublishing(false));
      return;
    }

    // Otherwise open the sheet
    if (onPublish) {
      onPublish();
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

  // Determine button Text and Style
  const isOneProduct = activeAssignments.length === 1;
  const isMulti = activeAssignments.length > 1;

  return (
    <div
      className={cn(
        "group relative flex flex-col h-[240px] w-full bg-white rounded-xl border border-slate-200 p-5 transition-all duration-200 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300",
        className
      )}
    >
      {/* Top Row: Horizontal Colors + Menu */}
      <div className="flex items-start justify-between mb-4">
        {/* Theme Dots - Horizontal */}
        <div className="flex -space-x-1.5">
          <div
            className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100"
            style={{ backgroundColor: primaryColor }}
            title="Accent Color"
          />
          <div
            className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100"
            style={{ backgroundColor: bgColor }}
            title="Background Color"
          />
          <div
            className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100"
            style={{ backgroundColor: buttonColor }}
            title="CTA Color"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 -mr-1.5 -mt-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setIsRenaming(true); }}>
              <Pencil size={14} className="mr-2" /> Rename
            </DropdownMenuItem>

            {onDuplicate && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
              >
                <Copy size={14} className="mr-2" /> Duplicate
              </DropdownMenuItem>
            )}

            {isPublished ? (
              <DropdownMenuItem disabled className="text-slate-400 cursor-not-allowed">
                <Trash2 size={14} className="mr-2" />
                Cannot delete active form
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-2">
          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => handleRenameSubmit()}
                className="w-full text-lg font-bold text-slate-900 border-b-2 border-indigo-500 focus:outline-none bg-transparent px-0 py-0.5"
              />
            </form>
          ) : (
            <h3
              onClick={startRename}
              className="text-lg font-bold text-slate-900 truncate leading-tight hover:text-indigo-600 transition-colors cursor-text"
              title="Click to rename"
            >
              {form.name}
            </h3>
          )}
        </div>

        {/* Status Badge & Assignments */}
        <div className="flex flex-col gap-2 mt-auto">
          {isPublished ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                Published
              </span>
              <span className="text-xs text-slate-500 truncate" title={
                storeAssignment && productAssignments.length > 0
                  ? `Active on Store + ${productAssignments.length} products`
                  : storeAssignment
                    ? 'Active on Entire Store'
                    : `Active on ${productAssignments.length} product${productAssignments.length !== 1 ? 's' : ''}`
              }>
                {storeAssignment && productAssignments.length > 0
                  ? `Store + ${productAssignments.length} items`
                  : storeAssignment
                    ? 'Entire Store'
                    : `${productAssignments.length} Product${productAssignments.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Draft
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
            <Clock size={12} />
            <span>
              Updated {new Date(form.updatedAt || form.createdAt || '').toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Two Action Buttons */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex gap-3">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-9 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-slate-200 transition-colors"
          onClick={handleEditClick}
        >
          Customize
        </Button>
        <Button
          size="sm"
          variant={isOneProduct && isPublished ? "destructive" : "default"}
          className={cn(
            "flex-1 h-9 font-medium shadow-sm transition-all",
            !isPublished && "bg-slate-900 hover:bg-slate-800 text-white", // Black for Publish
            isPublished && isOneProduct && "bg-white border border-red-200 text-red-600 hover:bg-red-50", // Red Outline for Unpublish
            isPublished && !isOneProduct && "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50" // Neutral for Manage
          )}
          onClick={handlePublishClick}
          disabled={isUnpublishing}
        >
          {isUnpublishing ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Processing
            </span>
          ) : isPublished ? (
            isOneProduct ? 'Unpublish' : 'Manage'
          ) : (
            'Publish'
          )}
        </Button>
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

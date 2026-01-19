import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Clock, FileText, MoreVertical, Package, Trash2 } from 'lucide-react';
import React from 'react';
import { Switch } from '../ui/switch';

export interface FormLoadingCardProps {
  form?: {
    id: string;
    name: string;
    description?: string;
    updatedAt?: string;
    createdAt?: string;
    status?: 'draft' | 'published';
  };
  isLoading?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onAssign?: () => void;
  onRename?: (newName: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onStatusChange?: (status: 'draft' | 'published') => Promise<void>;
  actionLabel?: string;
  className?: string;
}

export const FormLoadingCard: React.FC<FormLoadingCardProps> = ({
  form,
  isLoading = false,
  onClick,
  onAssign,
  onRename,
  onDelete,
  onStatusChange,
  className,
}) => {
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className={cn("h-[200px] rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse", className)}>
        <div className="h-10 w-10 rounded-lg bg-slate-100 mb-4" />
        <div className="h-5 w-3/4 bg-slate-100 rounded mb-3" />
        <div className="h-4 w-1/2 bg-slate-100 rounded" />
      </div>
    );
  }

  if (!form) return null;

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

  const handleRenameCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRenaming(false);
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

  if (showDeleteConfirm) {
    return (
      <div className={cn(
        "bg-red-50 text-left p-5 border-2 border-red-200 rounded-2xl w-full overflow-hidden",
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

  return (
    <div
      onClick={!isRenaming ? onClick : undefined}
      className={cn(
        "group relative flex flex-col h-[220px] w-full bg-white rounded-xl border border-slate-200 p-5 transition-all duration-200 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer overflow-hidden",
        form.status === 'published' && "border-l-4 border-l-green-500",
        className
      )}
    >
      {/* Top Row: Icon + Status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
            <FileText size={20} />
          </div>
          {/* Publish Toggle */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={form.status === 'published'}
              onCheckedChange={(checked) => onStatusChange?.(checked ? 'published' : 'draft')}
              className="data-[state=checked]:bg-green-500"
            />
            <span className={cn("text-xs font-medium", form.status === 'published' ? "text-green-600" : "text-slate-400")}>
              {form.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate-400 hover:text-slate-600 -mr-1 -mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()} className="mb-2">
            <input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => handleRenameSubmit()}
              className="w-full text-base font-semibold text-slate-900 border-b-2 border-indigo-500 focus:outline-none bg-transparent px-0 py-0.5"
            />
          </form>
        ) : (
          <h3
            onClick={startRename}
            className="text-base font-bold text-slate-900 mb-1 truncate leading-tight hover:text-indigo-600 transition-colors cursor-text"
            title="Click to rename"
          >
            {form.name}
          </h3>
        )}

        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {form.description || "No description provided."}
        </p>
      </div>

      {/* Footer: Meta + Actions */}
      <div className="mt-auto pt-3 flex items-center justify-between border-t border-slate-100">
        <div className="flex items-center text-xs text-slate-400">
          <Clock size={12} className="mr-1.5" />
          <span>
            {new Date(form.updatedAt || form.createdAt || '').toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {form.status === 'published' && onAssign && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={onAssign}
            >
              <Package size={12} className="mr-1" />
              Assign
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={12} />
          </Button>
        </div>
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

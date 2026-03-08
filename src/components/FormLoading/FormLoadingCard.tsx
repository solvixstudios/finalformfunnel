import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, Copy, FileText, Globe, Pencil, Store, Trash2 } from 'lucide-react';
import React from 'react';

export interface FormLoadingCardProps {
  form?: {
    id: string;
    name: string;
    description?: string;
    updatedAt?: string;
    createdAt?: string;
    status?: 'draft' | 'published';
    config?: unknown;
  };
  isLoading?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  onRename?: (newName: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onDuplicate?: () => Promise<void>;
  onPublish?: (e: React.MouseEvent) => void;
  onUnpublish?: (assignmentId: string) => Promise<void>;
  assignments?: unknown[];
  productAssignments?: unknown[];
  storeAssignment?: unknown;
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
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className={cn("group relative bg-white rounded-2xl border border-slate-200/80 p-5 overflow-hidden h-full flex flex-col justify-between", className)}>
        {/* Header */}
        <div className="relative flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-xl bg-slate-100 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-3 w-20 bg-slate-100 rounded mt-1" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-1">
            <div className="h-8 w-8 rounded-full bg-slate-100" />
            <div className="h-8 w-8 rounded-full bg-slate-100" />
          </div>
          <div className="h-8 w-20 bg-slate-100 rounded-full ml-auto" />
        </div>
      </div>
    );
  }

  if (!form) return null;

  const isPublished = (productAssignments?.some((a: any) => a.isActive) ?? false) || !!storeAssignment;
  const formConfig = (form.config as any) || {};

  // Extract theme colors for visual preview
  const accentColor = formConfig.accentColor || '#6366f1';
  const ctaColor = formConfig.ctaColor || '#4f46e5';

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

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (showDeleteConfirm) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-red-50 to-red-100/50 text-left p-5 border-2 border-red-200 rounded-2xl w-full overflow-hidden flex flex-col justify-center",
        className
      )}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0 shadow-sm">
            <Trash2 size={22} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="font-bold text-red-900 mb-2">Delete "{form.name}"?</p>
            <p className="text-sm text-red-700/80 mb-4">This action cannot be undone.</p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold bg-white text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm border border-slate-200"
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
      className={cn(
        "group relative bg-white rounded-2xl border border-slate-200/80 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300/80 cursor-pointer overflow-hidden flex flex-col justify-between h-full",
        className
      )}
      onClick={onClick}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 via-transparent to-violet-50/0 group-hover:from-indigo-50/30 group-hover:to-violet-50/30 transition-all duration-500 pointer-events-none" />

      {/* Accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${accentColor}, ${ctaColor})` }}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Form Icon with theme colors */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-black/5"
            style={{
              background: `linear-gradient(135deg, ${accentColor}15, ${ctaColor}25)`,
            }}
          >
            <FileText size={18} style={{ color: accentColor }} />
          </div>

          <div className="min-w-0 flex-1">
            {isRenaming ? (
              <form onSubmit={handleRenameSubmit} className="flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => handleRenameSubmit()}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsRenaming(false);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full text-base font-semibold text-slate-900 bg-transparent border-b-2 border-indigo-500 focus:outline-none py-0.5"
                  placeholder="Form name"
                  autoFocus
                />
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h3
                  className="text-base font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors cursor-text"
                  onClick={startRename}
                >
                  {form.name}
                </h3>
                {isPublished && (
                  <Badge className="h-5 px-2 text-[10px] bg-emerald-100 text-emerald-700 border-0 font-bold uppercase tracking-wide shrink-0">
                    <Globe size={10} className="mr-1" />
                    Live
                  </Badge>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <Calendar size={11} />
              <span>{formatDate(form.updatedAt || form.createdAt)}</span>
            </div>
            {storeAssignment && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <Store size={10} className="text-slate-400" />
                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[120px]">{(storeAssignment as any).name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
        <div className="flex items-center gap-1">
          {/* Rename Action */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
            onClick={(e) => { e.stopPropagation(); startRename(e); }}
            title="Rename"
          >
            <Pencil size={14} />
          </Button>

          {/* Duplicate Action */}
          {onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
              onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
              title="Duplicate"
            >
              <Copy size={14} />
            </Button>
          )}

          {/* Delete Action (only if not published) */}
          {!isPublished && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              title="Delete"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>

        {onPublish && (
          <Button
            size="sm"
            className={cn(
              "rounded-full px-4 h-8 text-xs font-bold transition-all shadow-sm ml-auto",
              isPublished
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
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

export const FormLoadingEmptyState = ({ hasSearchQuery, onClear }: { hasSearchQuery?: boolean, onClear?: () => void }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center w-full max-w-lg mx-auto bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 p-8">
      <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-5 hover:scale-105 transition-transform">
        <FileText size={28} className="text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">
        {hasSearchQuery ? 'No matching forms found' : 'No forms yet'}
      </h3>
      <p className="max-w-xs mx-auto text-sm text-slate-500 leading-relaxed mb-6">
        {hasSearchQuery
          ? "We couldn't find any forms matching your search criteria. Try adjusting your filters."
          : "Create your first form to start capturing leads and processing orders instantly."}
      </p>
      {hasSearchQuery && onClear && (
        <Button onClick={onClear} variant="outline" className="rounded-full shadow-sm bg-white h-10 px-6 font-semibold">
          Clear Search
        </Button>
      )}
    </div>
  );
};

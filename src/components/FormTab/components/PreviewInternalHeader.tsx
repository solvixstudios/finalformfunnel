/**
 * Preview Internal Header Component
 * Header attached to form preview with save, load, and history controls
 */

import { useFormStore } from "@/stores";
import { FolderOpen, Redo, Save, Undo } from "lucide-react";
import { useState } from "react";

interface PreviewInternalHeaderProps {
    onLoadClick?: () => void;
    onSaveClick?: () => void;
    canSave?: boolean;
    showSaveSuccess?: boolean;
}

export const PreviewInternalHeader = ({
    onLoadClick,
    onSaveClick,
    canSave = false,
    showSaveSuccess = false
}: PreviewInternalHeaderProps) => {
    const formName = useFormStore((state) => state.formName);
    const setFormName = useFormStore((state) => state.setFormName);
    const canUndo = useFormStore((state) => state.canUndo);
    const canRedo = useFormStore((state) => state.canRedo);
    const undo = useFormStore((state) => state.undo);
    const redo = useFormStore((state) => state.redo);
    const isSaving = useFormStore((state) => state.isSaving);
    const isDirty = useFormStore((state) => state.isDirty);
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="flex items-center gap-4 h-14 px-4 sm:px-6 border-b border-slate-200 bg-white shadow-sm shrink-0">
            {/* Form Name */}
            <div className="flex items-center gap-2 max-w-[200px] lg:max-w-[300px]">
                {isEditing ? (
                    <input
                        type="text"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') setIsEditing(false);
                        }}
                        autoFocus
                        className="w-full px-2 py-1 text-sm font-semibold bg-slate-100 border-none rounded focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                ) : (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-left px-2 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded transition-colors truncate max-w-full"
                    >
                        {formName}
                    </button>
                )}

                {/* Status Badge */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    {isSaving ? (
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="Saving..." />
                    ) : isDirty ? (
                        <div className="w-2 h-2 bg-amber-500 rounded-full" title="Unsaved Changes" />
                    ) : (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="All changes saved" />
                    )}
                </div>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            {/* Controls */}
            <div className="flex items-center gap-1">
                <button
                    onClick={undo}
                    disabled={!canUndo()}
                    className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-500 hover:text-slate-900"
                    title="Undo"
                >
                    <Undo size={16} />
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo()}
                    className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-500 hover:text-slate-900"
                    title="Redo"
                >
                    <Redo size={16} />
                </button>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <button
                    onClick={onLoadClick}
                    className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900"
                    title="Load Form"
                >
                    <FolderOpen size={16} />
                </button>
                <button
                    onClick={onSaveClick}
                    disabled={!canSave || isSaving}
                    className={`p-1.5 rounded transition-colors ${showSaveSuccess
                        ? 'bg-green-100 text-green-600'
                        : canSave
                            ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                            : 'opacity-30 cursor-not-allowed text-slate-400'
                        }`}
                    title="Save Form"
                >
                    <Save size={16} />
                </button>
            </div>
        </div>
    );
};

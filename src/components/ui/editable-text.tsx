import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface EditableTextProps {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    className?: string;
    inputClassName?: string;
    placeholder?: string;
    doubleClickToEdit?: boolean;
    onClick?: (e: React.MouseEvent) => void;
}

export const EditableText: React.FC<EditableTextProps> = ({
    value,
    onChange,
    onBlur,
    className,
    inputClassName,
    placeholder = "Untitled",
    doubleClickToEdit = false,
    onClick
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const startEditing = () => {
        setIsEditing(true);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (!doubleClickToEdit) {
            startEditing();
        }
        if (onClick) {
            onClick(e);
        }
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (doubleClickToEdit) {
            startEditing();
        }
    };

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const finishEditing = () => {
        setIsEditing(false);
        onBlur?.();
    };

    if (isEditing) {
        return (
            <Input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditing();
                    if (e.key === 'Escape') finishEditing();
                }}
                className={cn(
                    "h-7 py-0 px-1 bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-500 text-sm font-semibold text-slate-900 focus-visible:ring-2 focus-visible:ring-indigo-500 w-[200px] lg:w-[300px] transition-all",
                    inputClassName
                )}
                placeholder={placeholder}
            />
        );
    }

    return (
        <span
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            className={cn(
                "cursor-text hover:text-indigo-600 transition-colors truncate max-w-[200px] lg:max-w-[300px] px-1 -ml-1 rounded hover:bg-slate-100/50 inline-flex items-center gap-1.5 group",
                className
            )}
            title="Click to edit"
        >
            {value || placeholder}
            <Pencil size={11} className="text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
        </span>
    );
};

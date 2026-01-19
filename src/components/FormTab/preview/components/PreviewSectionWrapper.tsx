import React, { useEffect, useState } from 'react';

interface PreviewSectionWrapperProps {
    children: React.ReactNode;
    sectionId: string;
    onSelect?: (sectionId: string) => void;
    style?: React.CSSProperties;
    className?: string;
    actions?: { label: string; icon?: React.ReactNode; onClick: () => void }[];
}

export const PreviewSectionWrapper = ({
    children,
    sectionId,
    onSelect,
    style,
    className,
    ...props
}: PreviewSectionWrapperProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isShiftPressed, setIsShiftPressed] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setIsShiftPressed(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const handleMouseEnter = (e: React.MouseEvent) => {
        setIsHovered(true);
        if (e.shiftKey !== isShiftPressed) setIsShiftPressed(e.shiftKey);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        // We don't close menu on mouse leave to allow interacting with it
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (e.shiftKey !== isShiftPressed) setIsShiftPressed(e.shiftKey);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isShiftPressed) {
            e.preventDefault();
            e.stopPropagation();

            if (props.actions && props.actions.length > 0) {
                setShowMenu(true);
            } else if (onSelect) {
                onSelect(sectionId);
            }
        }
    };

    const isHighlighted = isHovered && isShiftPressed && !showMenu;

    return (
        <div
            className={`${className || ''} relative transition-all duration-200`}
            style={{
                ...style,
                outline: (isHighlighted || showMenu) ? '2px solid #4f46e5' : 'transparent',
                outlineOffset: '2px',
                cursor: isHighlighted ? 'alias' : undefined,
                zIndex: (isHighlighted || showMenu) ? 20 : 1,
                borderRadius: style?.borderRadius || '4px'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onClickCapture={handleClick}
        >
            {isHighlighted && !showMenu && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded shadow-sm z-50 pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100">
                    Edit {sectionId}
                </div>
            )}

            {showMenu && props.actions && (
                <div
                    ref={menuRef}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-2xl border border-slate-100 p-1.5 z-[60] min-w-[160px] animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1"
                >
                    <div className="px-2 py-1 text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">
                        Edit {sectionId}
                    </div>
                    {props.actions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                action.onClick();
                                setShowMenu(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors w-full text-left"
                        >
                            {action.icon && <span className="text-current opacity-70">{action.icon}</span>}
                            <span>{action.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {children}
        </div>
    );
};

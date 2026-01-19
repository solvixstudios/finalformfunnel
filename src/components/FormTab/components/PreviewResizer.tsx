import React from 'react';

interface PreviewResizerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  resizerRef?: React.RefObject<HTMLDivElement>;
}

export const PreviewResizer = ({ onMouseDown, resizerRef }: PreviewResizerProps) => {
  return (
    <div
      ref={resizerRef}
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize preview panel (drag or use arrow keys)"
      tabIndex={0}
      className="group relative flex-shrink-0 w-1 hover:bg-indigo-500 bg-slate-200 cursor-ew-resize transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
      title="Drag to resize preview (or use arrow keys)"
    />
  );
};

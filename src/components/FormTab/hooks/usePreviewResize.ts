import { useEffect, useRef, useState } from 'react';

const MIN_WIDTH = 320;
const MAX_WIDTH = 800;
const RESIZE_STEP = 50; // pixels for keyboard resize

export const usePreviewResize = () => {
  const [previewWidth, setPreviewWidth] = useState(480);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const resizerRef = useRef<HTMLDivElement>(null);
  const initialMouseX = useRef(0);
  const initialWidth = useRef(480);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      // Calculate delta from initial mouse position
      const delta = e.clientX - initialMouseX.current;

      // Shrink preview width as mouse moves left, expand as it moves right
      const newWidth = initialWidth.current - delta;

      // Clamp between min and max
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setPreviewWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    // Handle keyboard resizing on the resizer handle
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!resizerRef.current || document.activeElement !== resizerRef.current) return;

      let newWidth = previewWidth;
      const delta = e.shiftKey ? RESIZE_STEP * 2 : RESIZE_STEP;

      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        newWidth = previewWidth - delta; // Shrink
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        newWidth = previewWidth + delta; // Expand
        e.preventDefault();
      }

      // Apply constraints and update
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setPreviewWidth(newWidth);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewWidth]);

  const handleResizerMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    initialMouseX.current = e.clientX;
    initialWidth.current = previewWidth;
  };

  return {
    previewWidth,
    setPreviewWidth,
    containerRef,
    isDragging,
    resizerRef,
    handleResizerMouseDown,
  };
};

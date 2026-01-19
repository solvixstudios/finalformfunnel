import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SortableItemProps } from '../types';

export const SortableItem = ({ id, children, className }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' as const : 'static' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${className} touch-none ${isDragging ? 'opacity-50 ring-2 ring-indigo-500 ring-offset-2 z-50' : ''}`}
    >
      {children}
    </div>
  );
};


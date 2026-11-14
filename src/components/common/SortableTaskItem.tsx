import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTaskItemProps {
  id: number;
  children: ReactNode;
}

export default function SortableTaskItem({ id, children }: SortableTaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 ${isDragging ? 'z-10 opacity-60 shadow-xl' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label="Перетягнути завдання для зміни порядку"
          className="mt-1 cursor-grab touch-none rounded-lg px-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing dark:hover:bg-slate-800 dark:hover:text-slate-100"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </li>
  );
}

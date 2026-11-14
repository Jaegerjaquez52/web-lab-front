import { useMemo, useState } from 'react';
import type { Task } from '@/types/api.types';
import Button from '@/components/common/Button';
import { buildCalendarDays, toLocalDateKey } from '@/utils/taskAnalytics';

interface TaskCalendarProps {
  tasks: Task[];
}

export default function TaskCalendar({ tasks }: TaskCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateKey(new Date()));
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthLabel = visibleMonth.toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
  const days = buildCalendarDays(year, month);
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = task.dueDate.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  }, [tasks]);
  const selectedTasks = tasksByDate.get(selectedDate) ?? [];
  const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  return (
    <section aria-labelledby="task-calendar-title" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Button type="button" size="sm" variant="secondary" aria-label="Попередній місяць" onClick={() => setVisibleMonth(new Date(year, month - 1, 1))}>‹</Button>
        <h2 id="task-calendar-title" className="font-semibold capitalize text-slate-900 dark:text-white">{monthLabel}</h2>
        <Button type="button" size="sm" variant="secondary" aria-label="Наступний місяць" onClick={() => setVisibleMonth(new Date(year, month + 1, 1))}>›</Button>
      </div>
      <div role="grid" aria-label={`Календар: ${monthLabel}`} className="grid grid-cols-7 gap-1">
        {weekdays.map((day) => <div key={day} role="columnheader" className="py-2 text-center text-xs font-medium text-slate-500">{day}</div>)}
        {days.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} aria-hidden="true" />;
          const date = new Date(year, month, day);
          const key = toLocalDateKey(date);
          const hasTasks = (tasksByDate.get(key)?.length ?? 0) > 0;
          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-pressed={selectedDate === key}
              aria-label={`${date.toLocaleDateString('uk-UA')}${hasTasks ? `, завдань: ${tasksByDate.get(key)?.length}` : ''}`}
              className={`relative rounded-lg py-2 text-sm transition hover:bg-blue-50 dark:hover:bg-blue-500/10 ${
                selectedDate === key ? 'bg-blue-600 font-semibold text-white hover:bg-blue-700' : 'text-slate-700 dark:text-slate-200'
              }`}
              onClick={() => setSelectedDate(key)}
            >
              {day}
              {hasTasks && <span aria-hidden="true" className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${selectedDate === key ? 'bg-white' : 'bg-blue-600'}`} />}
            </button>
          );
        })}
      </div>
      <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Завдання зі строком на {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('uk-UA')}
        </h3>
        {selectedTasks.length ? (
          <ul className="mt-2 space-y-2">
            {selectedTasks.map((task) => <li key={task.id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">{task.title}</li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-slate-500">На цей день немає завдань із терміном.</p>}
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">У календарі показані лише завдання з установленим терміном виконання.</p>
    </section>
  );
}

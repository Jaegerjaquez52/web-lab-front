import type { Task } from '@/types/api.types';
import { countTaskStatuses } from '@/utils/taskAnalytics';

interface TaskStatusChartProps {
  tasks: Task[];
}

const statuses: { key: Task['status']; label: string; color: string }[] = [
  { key: 'TODO', label: 'До виконання', color: 'bg-slate-400' },
  { key: 'IN_PROGRESS', label: 'У роботі', color: 'bg-amber-500' },
  { key: 'DONE', label: 'Виконано', color: 'bg-emerald-500' },
];

export default function TaskStatusChart({ tasks }: TaskStatusChartProps) {
  const statusCounts = countTaskStatuses(tasks);
  const counts = statuses.map((status) => ({ ...status, count: statusCounts[status.key] }));
  const maxCount = Math.max(1, ...counts.map(({ count }) => count));

  return (
    <section aria-labelledby="task-status-chart-title" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5">
        <h2 id="task-status-chart-title" className="font-semibold text-slate-900 dark:text-white">Статуси завдань</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Розподіл завдань у поточному проєкті</p>
      </div>
      <div role="img" aria-label={`Завдань загалом: ${tasks.length}. ${counts.map(({ label, count }) => `${label}: ${count}`).join('; ')}`}>
        <ul className="space-y-4">
          {counts.map(({ key, label, count, color }) => (
            <li key={key} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3 text-sm">
              <span className="text-slate-600 dark:text-slate-300">{label}</span>
              <span className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <span className={`block h-full rounded-full ${color}`} style={{ width: `${(count / maxCount) * 100}%` }} />
              </span>
              <span className="text-right font-semibold text-slate-800 dark:text-white">{count}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Усього: {tasks.length} завдань</p>
    </section>
  );
}

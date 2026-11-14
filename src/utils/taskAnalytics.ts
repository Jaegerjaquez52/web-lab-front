import type { Task } from '@/types/api.types';

export function countTaskStatuses(tasks: Pick<Task, 'status'>[]) {
  return tasks.reduce(
    (counts, task) => {
      counts[task.status] += 1;
      return counts;
    },
    { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
  );
}

export function sortItemsByStoredOrder<T extends { id: number }>(items: T[], orderedIds: number[]) {
  const indexById = new Map(orderedIds.map((id, index) => [id, index]));
  return [...items].sort((first, second) => {
    const firstIndex = indexById.get(first.id);
    const secondIndex = indexById.get(second.id);
    if (firstIndex === undefined && secondIndex === undefined) return 0;
    if (firstIndex === undefined) return 1;
    if (secondIndex === undefined) return -1;
    return firstIndex - secondIndex;
  });
}

export function buildCalendarDays(year: number, month: number) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array<number | null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

export function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

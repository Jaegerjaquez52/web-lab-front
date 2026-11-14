import { describe, expect, it } from 'vitest';
import { buildCalendarDays, countTaskStatuses, sortItemsByStoredOrder, toLocalDateKey } from './taskAnalytics';

describe('task analytics', () => {
  it('counts each supported task status and handles empty data', () => {
    expect(countTaskStatuses([])).toEqual({ TODO: 0, IN_PROGRESS: 0, DONE: 0 });
    expect(countTaskStatuses([
      { status: 'TODO' },
      { status: 'DONE' },
      { status: 'IN_PROGRESS' },
      { status: 'TODO' },
    ])).toEqual({ TODO: 2, IN_PROGRESS: 1, DONE: 1 });
  });

  it('orders stored task IDs first and keeps new tasks in input order', () => {
    const tasks = [{ id: 2 }, { id: 3 }, { id: 1 }];
    expect(sortItemsByStoredOrder(tasks, [1, 2])).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('builds a Monday-first month grid including leap days', () => {
    const days = buildCalendarDays(2024, 1);
    expect(days.slice(0, 3)).toEqual([null, null, null]);
    expect(days.slice(3)).toHaveLength(29);
    expect(days.at(-1)).toBe(29);
  });

  it('formats calendar date keys in local time', () => {
    expect(toLocalDateKey(new Date(2026, 10, 4))).toBe('2026-11-04');
  });
});

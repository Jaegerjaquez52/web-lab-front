import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import Button from '@/components/common/Button';
import ConfirmActionButton from '@/components/common/ConfirmActionButton';
import Icon from '@/components/common/Icon';
import Input from '@/components/common/Input';
import { TableSkeleton } from '@/components/common/Skeleton';
import TaskDetails from '@/components/TaskDetails';
import { useDebounce } from '@/hooks/useDebounce';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { projectsService } from '@/services/projects.service';
import { socket } from '@/services/socket';
import { tasksService } from '@/services/tasks.service';
import { useAuthStore } from '@/stores/authStore';
import type { Task } from '@/types/api.types';

const statusStyles: Record<Task['status'], string> = {
  TODO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  DONE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

const statusLabels: Record<Task['status'], string> = {
  TODO: 'До виконання',
  IN_PROGRESS: 'У роботі',
  DONE: 'Виконано',
};

function canClaimTask(task: Task, userId?: number) {
  if (!userId || !task.project) return false;
  return task.project.ownerId === userId
    || task.project.team?.ownerId === userId
    || Boolean(task.project.team?.members.some((member) => member.id === userId));
}

export default function TasksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const debouncedSearch = useDebounce(search);
  const queryClient = useQueryClient();
  const projects = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: () => projectsService.getAll({ limit: 100 }),
  });
  const projectIds = projects.data?.data.map((project) => project.id).join(',') ?? '';
  const tasks = useQuery({
    queryKey: ['tasks', page, debouncedSearch, projectId],
    queryFn: () => tasksService.getAll({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      projectId: projectId ? Number(projectId) : undefined,
    }),
  });

  const update = useMutation({
    mutationFn: ({ id, ...updates }: { id: number } & Partial<Pick<Task, 'status' | 'dueDate'>>) => (
      tasksService.update(id, updates)
    ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('Не вдалося оновити завдання'),
  });
  const claim = useMutation({
    mutationFn: ({ id, claimed }: { id: number; claimed: boolean }) => tasksService.setClaim(id, claimed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('Не вдалося змінити виконавців'),
  });
  const remove = useMutation({
    mutationFn: tasksService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    onError: () => toast.error('Не вдалося видалити завдання'),
  });

  useSocketEvent('task:created', () => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
  useSocketEvent('task:updated', () => queryClient.invalidateQueries({ queryKey: ['tasks'] }));
  useSocketEvent('task:deleted', () => queryClient.invalidateQueries({ queryKey: ['tasks'] }));

  useEffect(() => {
    if (!projectIds || !userId) return;
    const rooms = projectIds.split(',').map(Number).map((id) => `project:${id}`);
    const eventNames = ['task:created', 'task:updated', 'task:deleted', 'comment:created', 'comment:deleted'];
    const rememberEvent = (room: string, payload: { _eventId?: number; _room?: string }) => {
      if (!payload?._eventId || payload._room !== room) return;
      const key = `realtime:${userId}:${room}`;
      const previous = Number(sessionStorage.getItem(key)) || 0;
      if (payload._eventId > previous) sessionStorage.setItem(key, String(payload._eventId));
    };
    const joinRooms = () => {
      for (const room of rooms) {
        socket.emit('room:join', room, (result: { ok: boolean }) => {
          if (!result?.ok) return;
          const afterId = Number(sessionStorage.getItem(`realtime:${userId}:${room}`)) || 0;
          const recover = (cursor: number) => socket.emit(
            'events:recover',
            { room, afterId: cursor },
            (recovery: { ok: boolean; events?: { id: number; event: string; payload: { _eventId?: number; _room?: string } }[] }) => {
              if (!recovery?.ok) return;
              let latestId = cursor;
              for (const event of recovery.events ?? []) {
                latestId = Math.max(latestId, event.id);
                rememberEvent(room, event.payload);
              }
              if (latestId > cursor) sessionStorage.setItem(`realtime:${userId}:${room}`, String(latestId));
              if (recovery.events?.length) {
                void queryClient.invalidateQueries({ queryKey: ['tasks'] });
                if (recovery.events.some((event) => event.event.startsWith('comment:'))) {
                  void queryClient.invalidateQueries({ queryKey: ['comments'] });
                }
              }
              if (recovery.events?.length === 100) recover(latestId);
            }
          );
          recover(afterId);
        });
      }
    };
    const eventListeners = rooms.flatMap((room) => eventNames.map((event) => {
      const listener = (payload: { _eventId?: number; _room?: string }) => rememberEvent(room, payload);
      socket.on(event, listener);
      return { event, listener };
    }));
    socket.on('connect', joinRooms);
    if (socket.connected) joinRooms();
    return () => {
      socket.off('connect', joinRooms);
      for (const { event, listener } of eventListeners) socket.off(event, listener);
      for (const room of rooms) socket.emit('room:leave', room);
    };
  }, [projectIds, queryClient, userId]);

  return (
    <section className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Планування роботи</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Завдання</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Переглядайте завдання доступних проєктів. Нові завдання створюються зі сторінки проєкту.</p>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <label className="relative block">
          <span className="sr-only">Пошук завдань</span>
          <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Пошук завдань"
            placeholder="Пошук за назвою чи описом..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            className="pl-10"
          />
        </label>
        <label className="block">
          <span className="sr-only">Фільтр за проєктом</span>
          <select
            aria-label="Фільтр за проєктом"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            value={projectId}
            onChange={(event) => { setProjectId(event.target.value); setPage(1); }}
          >
            <option value="">Усі доступні проєкти</option>
            {projects.data?.data.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
      </div>

      {tasks.isPending && <TableSkeleton />}
      {tasks.isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">Не вдалося завантажити завдання</p>}
      {tasks.data && (
        <>
          <ul className="space-y-3">
            {tasks.data.data.map((task) => {
              const isClaimed = task.assignments?.some((assignment) => assignment.userId === userId) ?? false;
              const canClaim = canClaimTask(task, userId);
              return (
                <li key={task.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        <Icon name="tasks" size={19} />
                      </span>
                      <div className="min-w-0">
                        <button type="button" className="text-left font-semibold text-slate-900 transition hover:text-blue-700 dark:text-white dark:hover:text-blue-300" onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}>
                          {task.title}
                        </button>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Проєкт: <Link to={`/projects/${task.projectId}`} className="font-medium text-blue-600 hover:underline dark:text-blue-300">{task.project?.name ?? 'Без проєкту'}</Link>
                        </p>
                        {task.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>}
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status]}`}>
                          {statusLabels[task.status]}
                        </span>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Виконують: {task.assignments?.length ? task.assignments.map((assignment) => assignment.user.name).join(', ') : 'ще ніхто не позначився'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300" title={canClaim ? undefined : 'Позначитися можуть лише учасники команди'}>
                        <input
                          type="checkbox"
                          checked={isClaimed}
                          disabled={!canClaim || claim.isPending}
                          onChange={(event) => claim.mutate({ id: task.id, claimed: event.target.checked })}
                        />
                        Я виконую
                      </label>
                      <select
                        aria-label={`Статус: ${task.title}`}
                        value={task.status}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        onChange={(event) => update.mutate({ id: task.id, status: event.target.value as Task['status'] })}
                      >
                        <option value="TODO">До виконання</option>
                        <option value="IN_PROGRESS">У роботі</option>
                        <option value="DONE">Виконано</option>
                      </select>
                      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="shrink-0">Термін:</span>
                        <input
                          type="date"
                          aria-label={`Термін виконання: ${task.title}`}
                          value={task.dueDate?.slice(0, 10) ?? ''}
                          disabled={update.isPending}
                          className="w-[10.5rem] rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          onChange={(event) => update.mutate({ id: task.id, dueDate: event.target.value || null })}
                        />
                      </label>
                      <ConfirmActionButton
                        isPending={remove.isPending}
                        title={`Видалити завдання «${task.title}»?`}
                        description="Завдання та його вкладення буде видалено. Дію не можна скасувати."
                        onConfirm={() => remove.mutate(task.id)}
                      >
                        Видалити
                      </ConfirmActionButton>
                    </div>
                  </div>
                  {expandedTask === task.id && <TaskDetails taskId={task.id} />}
                </li>
              );
            })}
            {!tasks.data.data.length && (
              <li className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <Icon name="tasks" size={22} />
                </span>
                <p className="mt-3 font-semibold text-slate-800 dark:text-white">Завдань поки немає</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Перейдіть до проєкту, щоб створити перше завдання.</p>
                <Link to="/projects" className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:underline dark:text-blue-300">Відкрити проєкти</Link>
              </li>
            )}
          </ul>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Назад</Button>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{tasks.data.pagination.page} / {tasks.data.pagination.totalPages}</span>
            <Button variant="secondary" disabled={!tasks.data.pagination.hasMore} onClick={() => setPage((value) => value + 1)}>Далі</Button>
          </div>
        </>
      )}
    </section>
  );
}

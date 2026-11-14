import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import Icon from '@/components/common/Icon';
import { TableSkeleton } from '@/components/common/Skeleton';
import { projectsService } from '@/services/projects.service';
import { tasksService } from '@/services/tasks.service';
import { useAuthStore } from '@/stores/authStore';
import type { Task } from '@/types/api.types';

const statusLabels: Record<Task['status'], string> = {
  TODO: 'До виконання',
  IN_PROGRESS: 'У роботі',
  DONE: 'Виконано',
};

const statusStyles: Record<Task['status'], string> = {
  TODO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  DONE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

export default function ProfilePage() {
  const [page, setPage] = useState(1);
  const user = useAuthStore((state) => state.user);
  const projects = useQuery({
    queryKey: ['projects', 'profile'],
    queryFn: () => projectsService.getAll({ limit: 100 }),
  });
  const tasks = useQuery({
    queryKey: ['tasks', 'assigned-to-me', page],
    queryFn: () => tasksService.getAll({ page, limit: 10, assignedToMe: true }),
  });
  const initials = user?.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <section className="space-y-9">
      <header className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700 dark:bg-blue-500/15 dark:text-blue-200">
          {initials || 'TM'}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Профіль</p>
          <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{user?.name}</h1>
          <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
        </div>
      </header>

      <section aria-labelledby="profile-projects-title" className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">Робочий простір</p>
            <h2 id="profile-projects-title" className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Доступні проєкти</h2>
          </div>
          <Link to="/projects" className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300">
            Усі проєкти <Icon name="arrowRight" size={16} />
          </Link>
        </div>

        {projects.isPending && <TableSkeleton rows={2} />}
        {projects.isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">Не вдалося завантажити проєкти</p>}
        {projects.data && projects.data.data.length > 0 && (
          <div className="-mx-1 overflow-x-auto px-1 pb-3" aria-label="Список проєктів">
            <ul className="flex w-max min-w-full snap-x snap-mandatory gap-4">
              {projects.data.data.map((project) => (
                <li key={project.id} className="w-72 max-w-[85vw] snap-start">
                  <Link
                    to={`/projects/${project.id}`}
                    className="group flex h-full min-h-44 flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      <Icon name="projects" />
                    </span>
                    <span className="mt-4 flex items-center justify-between gap-3">
                      <span className="truncate font-semibold text-slate-900 dark:text-white">{project.name}</span>
                      <Icon name="arrowRight" size={16} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                    </span>
                    <span className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400">
                      {project.description || 'Опис не додано'}
                    </span>
                    <span className="mt-auto pt-3 text-xs text-slate-500 dark:text-slate-400">
                      {project._count?.tasks ?? 0} завдань · {project.team?.name ?? 'Без команди'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {projects.data && projects.data.data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="font-semibold text-slate-800 dark:text-white">Тут поки нічого немає</p>
            <Link to="/projects" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-300">
              <Icon name="plus" size={16} /> Створити проєкт
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="profile-tasks-title" className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Моя робота</p>
          <h2 id="profile-tasks-title" className="mt-1 text-xl font-bold text-slate-900 dark:text-white">Мої завдання</h2>
        </div>

        {tasks.isPending && <TableSkeleton />}
        {tasks.isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">Не вдалося завантажити завдання</p>}
        {tasks.data && (
          <>
            <ul className="space-y-3">
              {tasks.data.data.map((task) => (
                <li key={task.id} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                      <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                        Проєкт:{' '}
                        {task.projectId ? (
                          <Link to={`/projects/${task.projectId}`} className="font-medium text-blue-600 hover:underline dark:text-blue-300">
                            {task.project?.name ?? 'Відкрити проєкт'}
                          </Link>
                        ) : 'Без проєкту'}
                      </p>
                      {task.description && <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>}
                    </div>
                    <span className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status]}`}>
                      {statusLabels[task.status]}
                    </span>
                  </div>
                </li>
              ))}
              {tasks.data.data.length === 0 && (
                <li className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
                  <p className="font-semibold text-slate-800 dark:text-white">Поки немає завдань, за які ви відповідаєте</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Позначте себе виконавцем у завданні доступного проєкту.</p>
                  <Link to="/tasks" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-300">
                    Переглянути завдання <Icon name="arrowRight" size={16} />
                  </Link>
                </li>
              )}
            </ul>
            {tasks.data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  disabled={page === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Назад
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {tasks.data.pagination.page} / {tasks.data.pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  disabled={!tasks.data.pagination.hasMore}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Далі
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}

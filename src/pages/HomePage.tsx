import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import Icon from '@/components/common/Icon';
import { projectsService } from '@/services/projects.service';
import { useAuthStore } from '@/stores/authStore';

export default function HomePage() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken));
  const projects = useQuery({
    queryKey: ['projects', 'home'],
    queryFn: () => projectsService.getAll({ limit: 100 }),
    enabled: isAuthenticated,
  });
  const destination = isAuthenticated ? '/dashboard' : '/login';

  return (
    <section className="mx-auto max-w-6xl space-y-10 py-4 sm:py-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-12 text-white shadow-2xl shadow-blue-950/15 sm:px-12 sm:py-16">
        <div className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[48px] border-white/5" />
        <div className="absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100">
            <Icon name="tasks" size={15} />
            Task Manager для команд
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Командна робота — без зайвого хаосу.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-blue-100/85">
            Плануйте проєкти, розподіляйте завдання та бачте, що вже зроблено і над чим команда працює зараз.
          </p>
          <Link
            to={destination}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-800 shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            {isAuthenticated ? 'Відкрити робочий простір' : 'Почати роботу'}
            <Icon name="arrowRight" size={18} />
          </Link>
        </div>
      </div>

      {isAuthenticated && (
        <section aria-labelledby="home-projects-title" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">Ваш робочий простір</p>
              <h2 id="home-projects-title" className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Проєкти</h2>
            </div>
            <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300">
              Усі проєкти <Icon name="arrowRight" size={16} />
            </Link>
          </div>

          {projects.isPending && (
            <div role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Завантаження проєктів...
            </div>
          )}
          {projects.isError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
              Не вдалося завантажити проєкти
            </p>
          )}
          {projects.data && projects.data.data.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.data.data.map((project) => (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      <Icon name="projects" />
                    </span>
                    <span className="mt-4 flex items-center justify-between gap-3">
                      <span className="truncate font-semibold text-slate-900 dark:text-white">{project.name}</span>
                      <Icon name="arrowRight" size={17} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                    </span>
                    <span className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500 dark:text-slate-400">
                      {project.description || 'Опис не додано'}
                    </span>
                    <span className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                      {project._count?.tasks ?? 0} завдань · {project.team?.name ?? 'Без команди'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {projects.data && projects.data.data.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <Icon name="projects" size={22} />
              </span>
              <p className="mt-3 font-semibold text-slate-800 dark:text-white">Тут поки нічого немає</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Створіть проєкт, щоб почати організовувати роботу.</p>
              <Link to="/projects" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">
                <Icon name="plus" size={17} /> Створити проєкт
              </Link>
            </div>
          )}
        </section>
      )}
    </section>
  );
}

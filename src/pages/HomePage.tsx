import { Link } from 'react-router';
import Icon, { type IconName } from '@/components/common/Icon';
import { useAuthStore } from '@/stores/authStore';

const features: { title: string; description: string; icon: IconName }[] = [
  { title: 'Завдання', description: 'Відстежуйте статус і рухайте роботу вперед.', icon: 'tasks' },
  { title: 'Проєкти', description: 'Збирайте команду навколо спільних цілей.', icon: 'projects' },
  { title: 'Комунікація', description: 'Залишайте коментарі та отримуйте оновлення.', icon: 'notifications' },
];

export default function HomePage() {
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken));
  const destination = isAuthenticated ? '/dashboard' : '/login';

  return (
    <section className="mx-auto max-w-6xl space-y-12 py-4 sm:py-8">
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

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature, index) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <span className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${
              index === 0
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300'
                : index === 1
                  ? 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
            }`}>
              <Icon name={feature.icon} />
            </span>
            <h2 className="font-semibold text-slate-900 dark:text-white">{feature.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

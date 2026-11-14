import { Link } from 'react-router';
import Icon, { type IconName } from '@/components/common/Icon';
import { useAuthStore } from '@/stores/authStore';

const sections: { to: string; title: string; text: string; icon: IconName; color: string }[] = [
  {
    to: '/tasks',
    title: 'Завдання',
    text: 'Створюйте задачі, змінюйте статус і обговорюйте роботу.',
    icon: 'tasks',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  },
  {
    to: '/projects',
    title: 'Проєкти',
    text: 'Організовуйте роботу команди за проєктами.',
    icon: 'projects',
    color: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  },
  {
    to: '/users',
    title: 'Користувачі',
    text: 'Переглядайте учасників і керуйте обліковими записами.',
    icon: 'users',
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  {
    to: '/notifications',
    title: 'Сповіщення',
    text: 'Перевіряйте особисті оновлення та повідомлення.',
    icon: 'notifications',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-6 py-8 text-white shadow-xl shadow-blue-950/10 sm:px-10 sm:py-11">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border-[40px] border-white/5" />
        <div className="absolute -bottom-36 right-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Ваш командний простір</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Вітаємо, {user?.name || 'у Task Manager'}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100/85 sm:text-base">
            Плануйте роботу, координуйте команду та тримайте всі завдання під контролем в одному місці.
          </p>
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Швидкий доступ</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Перейдіть до потрібного розділу робочого простору.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sections.map((section) => (
            <Link
              key={section.to}
              to={section.to}
              className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-black/20"
            >
              <span className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${section.color}`}>
                <Icon name={section.icon} size={21} />
              </span>
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">{section.title}</span>
                <Icon name="arrowRight" size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </span>
              <span className="mt-2 block text-sm leading-5 text-slate-500 dark:text-slate-400">{section.text}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

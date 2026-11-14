import { Link, NavLink } from 'react-router';
import type { IconName } from '@/components/common/Icon';
import Icon from '@/components/common/Icon';
import { useAuthStore } from '@/stores/authStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const items: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Огляд', icon: 'dashboard' },
  { to: '/tasks', label: 'Завдання', icon: 'tasks' },
  { to: '/projects', label: 'Проєкти', icon: 'projects' },
  { to: '/teams', label: 'Команди', icon: 'users' },
  { to: '/users', label: 'Користувачі', icon: 'users' },
  { to: '/notifications', label: 'Сповіщення', icon: 'notifications' },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const initials = user?.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Закрити меню"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-950/40">
              <Icon name="tasks" size={22} />
            </span>
            <span>
              <span className="block text-base font-bold tracking-wide text-white">Task Manager</span>
              <span className="block text-xs text-slate-400">Командний простір</span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Закрити меню"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Основна навігація">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Робочий простір
          </p>
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-400/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon name={item.icon} size={19} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            to="/profile"
            onClick={onClose}
            aria-label="Відкрити мій профіль"
            className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-semibold text-blue-200">
              {initials || 'TM'}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{user?.name}</span>
              <span className="block text-xs text-slate-400">
                {user?.role === 'ADMIN' ? 'Адміністратор' : 'Учасник команди'}
              </span>
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}

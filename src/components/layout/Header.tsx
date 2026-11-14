import { Link, useLocation, useNavigate } from 'react-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/common/Button';
import Icon from '@/components/common/Icon';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface HeaderProps {
  onMenuClick: () => void;
}

function getTitle(pathname: string) {
  if (pathname === '/dashboard') return 'Огляд';
  if (pathname === '/tasks') return 'Завдання';
  if (pathname === '/projects') return 'Проєкти';
  if (/^\/projects\/\d+$/.test(pathname)) return 'Проєкт';
  if (pathname === '/teams') return 'Команди';
  if (pathname === '/profile') return 'Мій профіль';
  if (pathname === '/users/create') return 'Новий користувач';
  if (/^\/users\/\d+\/edit$/.test(pathname)) return 'Редагування користувача';
  if (pathname.startsWith('/users/')) return 'Профіль користувача';
  if (pathname === '/users') return 'Користувачі';
  if (pathname === '/notifications') return 'Сповіщення';
  if (pathname === '/about') return 'Про проєкт';
  return 'Головна';
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) await api.post('/auth/logout', { refreshToken });
    } catch {
      toast.error('Сесію завершено локально, але сервер не підтвердив вихід');
    } finally {
      logout();
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {user ? (
            <button
              type="button"
              onClick={onMenuClick}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              aria-label="Відкрити меню"
            >
              <Icon name="menu" />
            </button>
          ) : (
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <Icon name="tasks" size={21} />
              </span>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">Task Manager</span>
            </Link>
          )}
          {user && (
            <div className="min-w-0">
              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 sm:block">Робочий простір</p>
              <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{getTitle(pathname)}</p>
            </div>
          )}
        </div>

        {user ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/notifications"
              aria-label="Сповіщення"
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300"
            >
              <Icon name="notifications" />
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <Button size="sm" variant="secondary" onClick={handleLogout}>
              Вийти
            </Button>
          </div>
        ) : (
          <nav className="flex items-center gap-2 sm:gap-5" aria-label="Основна навігація">
            <Link to="/" className="hidden text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 sm:block">
              Головна
            </Link>
            <Link to="/about" className="hidden text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-300 sm:block">
              Про нас
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
              className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <Link to="/login" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              Увійти
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

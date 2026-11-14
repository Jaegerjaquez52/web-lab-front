import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import Breadcrumbs from './Breadcrumbs';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useSocketConnection } from '@/hooks/useSocketConnection';
import { useAuthStore } from '@/stores/authStore';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthenticated = Boolean(useAuthStore((state) => state.accessToken));
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;
    const isProjectDetails = /^\/projects\/\d+$/.test(pathname);
    const isUserDetails = /^\/users\/\d+\/edit$/.test(pathname);
    const title = isProjectDetails ? 'Проєкт' : isUserDetails ? 'Профіль користувача' : ({
      '/': 'Task Manager',
      '/about': 'Про застосунок',
      '/dashboard': 'Панель керування',
      '/login': 'Вхід',
      '/register': 'Реєстрація',
      '/users': 'Користувачі',
      '/users/create': 'Новий користувач',
      '/projects': 'Проєкти',
      '/teams': 'Команди',
      '/tasks': 'Завдання',
      '/notifications': 'Сповіщення',
      '/profile': 'Мій профіль',
    } as Record<string, string>)[pathname] ?? 'Сторінку не знайдено';
    const description = `${title} — керування завданнями, проєктами та командною роботою в Task Manager.`;
    document.title = `${title} | Task Manager`;

    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.append(element);
      }
      element.content = content;
    };
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', `${title} | Task Manager`);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[property="og:url"]', 'property', 'og:url', `${window.location.origin}${pathname}`);
    setMeta('meta[property="og:image"]', 'property', 'og:image', `${window.location.origin}/pwa-icon.svg`);
  }, [location]);

  useSocketConnection();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {isAuthenticated && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      <div className={`flex min-h-screen flex-col ${isAuthenticated ? 'lg:pl-72' : ''}`}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            {isAuthenticated && <Breadcrumbs />}
            <ErrorBoundary>
              <div key={location.pathname} className="page-transition">
                <Outlet />
              </div>
            </ErrorBoundary>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
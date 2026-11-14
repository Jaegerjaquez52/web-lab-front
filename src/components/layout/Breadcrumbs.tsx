import { Link, useLocation } from 'react-router';

interface Crumb {
  label: string;
  to?: string;
}

function getCrumbs(pathname: string): Crumb[] {
  if (pathname === '/dashboard') return [];
  if (['/tasks', '/projects', '/teams', '/notifications', '/users'].includes(pathname)) {
    return [{ label: 'Огляд', to: '/dashboard' }];
  }
  if (/^\/projects\/\d+$/.test(pathname)) {
    return [
      { label: 'Огляд', to: '/dashboard' },
      { label: 'Проєкти', to: '/projects' },
    ];
  }
  if (pathname === '/users/create') {
    return [
      { label: 'Огляд', to: '/dashboard' },
      { label: 'Користувачі', to: '/users' },
    ];
  }
  if (/^\/users\/\d+\/edit$/.test(pathname)) {
    return [
      { label: 'Огляд', to: '/dashboard' },
      { label: 'Користувачі', to: '/users' },
    ];
  }
  return [];
}

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const crumbs = getCrumbs(pathname);

  if (!crumbs.length) return null;

  return (
    <nav aria-label="Навігаційний шлях" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {crumbs.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">/</span>}
            {crumb.to ? (
              <Link to={crumb.to} className="text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-slate-800 dark:text-slate-100">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

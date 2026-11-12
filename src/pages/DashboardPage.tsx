import { Link } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

// Замінили шаблонні розділи на реальні сутності твоєї предметної області
const sections = [
  { to: '/users', title: 'Користувачі', text: 'Керування користувачами та їх ролями' },
  { to: '/tasks', title: 'Завдання', text: 'Управління списками задач та статусами' },
  { to: '/projects', title: 'Проєкти', text: 'Керування робочими проєктами' },
  { to: '/files', title: 'Файли', text: 'Завантажені документи та матеріали' },
  { to: '/comments', title: 'Коментарі', text: 'Обговорення та відгуки до завдань' },
];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Вітаємо, {user?.name}!</h1>

      {/* Змінили сітку, щоб красиво вмістити 5 карток (на великих екранах 3 в ряд, потім 2) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-900"
          >
            <h3 className="mb-2 text-xl font-semibold text-primary-600">{s.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{s.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
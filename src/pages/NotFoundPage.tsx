import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="text-center py-10">
      <h1 className="text-4xl font-bold text-red-500 mb-4">404</h1>
      <p className="mb-4">Сторінку не знайдено</p>
      <Link to="/" className="text-primary-600 hover:underline">
        Повернутися на головну
      </Link>
    </div>
  );
}
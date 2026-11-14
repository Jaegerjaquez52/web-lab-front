import { useState } from 'react';
import { Link } from 'react-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { usersService } from '@/services/users.service';
import { useDebounce } from '@/hooks/useDebounce';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Icon from '@/components/common/Icon';
import { TableSkeleton } from '@/components/common/Skeleton';
import { useAuthStore } from '@/stores/authStore';
import OnlineIndicator from '@/components/common/OnlineIndicator';
import ConfirmActionButton from '@/components/common/ConfirmActionButton';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';

export default function UsersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const onlineUserIds = useOnlineUsers();
  const isAdmin = currentUser?.role === 'ADMIN';

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['users', { page, search: debouncedSearch }],
    queryFn: () => usersService.getAll({ page, limit: 10, search: debouncedSearch || undefined }),
    placeholderData: keepPreviousData,
  });

  const deleteUser = useMutation({
    mutationFn: usersService.remove,
    onSuccess: () => {
      toast.success('Користувача видалено');
      return queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: () => toast.error('Не вдалося видалити користувача'),
  });

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Команда</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Користувачі</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Учасники робочого простору та їхні облікові записи.</p>
        </div>
        {isAdmin && (
          <Link
            to="/users/create"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
          >
            <Icon name="plus" size={18} />Додати користувача
          </Link>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="relative block max-w-lg">
          <span className="sr-only">Пошук користувачів</span>
          <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Пошук користувачів"
            placeholder="Пошук за ім’ям чи email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </label>
      </div>

      {isPending && <TableSkeleton />}
      {isError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          Помилка: {error.message}
        </p>
      )}

      {data && (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                  <tr>
                    {['ID', "Ім'я", 'Email', 'Дії'].map((title) => (
                      <th key={title} className="whitespace-nowrap px-5 py-4 font-semibold sm:px-6">{title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.data.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 sm:px-6">{user.id}</td>
                      <td className="px-5 py-4 font-medium text-slate-900 dark:text-white sm:px-6">
                        <div className="space-y-1">
                          <p>{user.name}</p>
                          <OnlineIndicator online={onlineUserIds.has(user.id)} />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300 sm:px-6">{user.email}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-right sm:px-6">
                        <div className="flex justify-end gap-2">
                          {(isAdmin || currentUser?.id === user.id) && (
                            <Link
                              to={`/users/${user.id}/edit`}
                              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                            >
                              Редагувати
                            </Link>
                          )}
                          {isAdmin && (
                            <ConfirmActionButton
                              isPending={deleteUser.isPending}
                              title={`Видалити користувача ${user.name}?`}
                              description="Обліковий запис і пов'язані дані буде видалено."
                              onConfirm={() => deleteUser.mutate(user.id)}
                            >
                              Видалити
                            </ConfirmActionButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!data.data.length && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        Користувачів за цим запитом не знайдено.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Назад</Button>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{data.pagination.page} / {data.pagination.totalPages}</span>
            <Button variant="secondary" disabled={!data.pagination.hasMore} onClick={() => setPage((p) => p + 1)}>Далі</Button>
          </div>
        </>
      )}
    </section>
  );
}
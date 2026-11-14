import { useCallback, useEffect, useRef } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import api from '@/services/api';
import Button from '@/components/common/Button';
import Icon from '@/components/common/Icon';
import type { AppNotification, PaginatedResponse } from '@/types/api.types';
import { useSocketEvent } from '@/hooks/useSocketEvent';

export default function NotificationsPage() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const {
    data,
    isPending,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => (
      await api.get<PaginatedResponse<AppNotification>>('/notifications', { params: { page: pageParam, limit: 20 } })
    ).data,
    getNextPageParam: (lastPage) => lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
  });
  const notifications = data?.pages.flatMap((page) => page.data) ?? [];
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void fetchNextPage();
    }, { rootMargin: '160px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });
  const onNotification = useCallback((notification: { text?: string }) => {
    toast(notification.text ?? 'Нове сповіщення');
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);
  useSocketEvent('notification', onNotification);
  const markRead = useMutation({
    mutationFn: (id: number) => api.patch(`/notifications/${id}/read`),
    onSuccess: refresh,
    onError: () => toast.error('Не вдалося позначити сповіщення прочитаним'),
  });
  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: refresh,
    onError: () => toast.error('Не вдалося позначити сповіщення прочитаними'),
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/notifications/${id}`),
    onSuccess: refresh,
    onError: () => toast.error('Не вдалося видалити сповіщення'),
  });

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">Оновлення</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Сповіщення</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Особисті повідомлення та зміни у ваших завданнях.</p>
        </div>
        <Button variant="secondary" onClick={() => markAll.mutate()} isLoading={markAll.isPending}>Позначити всі прочитаними</Button>
      </div>
      {isPending && <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">Завантаження сповіщень...</div>}
      {isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">Не вдалося завантажити сповіщення</p>}
      {data && (
        <>
          <ul className="space-y-3">
            {notifications.map((item) => (
              <li key={item.id} className={`flex flex-col gap-4 rounded-2xl border p-4 shadow-sm transition sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
                item.isRead
                  ? 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
                  : 'border-blue-200/80 bg-blue-50/70 dark:border-blue-900/50 dark:bg-blue-950/20'
              }`}>
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    item.isRead
                      ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                  }`}>
                    <Icon name="notifications" size={19} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{item.text}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.type} · {item.priority} · {new Date(item.createdAt).toLocaleString('uk-UA')}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2 sm:justify-end">
                  {!item.isRead && <Button size="sm" variant="secondary" onClick={() => markRead.mutate(item.id)}>Прочитано</Button>}
                  <Button size="sm" variant="danger" onClick={() => remove.mutate(item.id)}>Видалити</Button>
                </div>
              </li>
            ))}
            {!notifications.length && (
              <li className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <Icon name="notifications" size={22} />
                </span>
                <p className="mt-3 font-semibold text-slate-800 dark:text-white">Нових сповіщень немає</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Коли з’являться оновлення, вони будуть тут.</p>
              </li>
            )}
          </ul>
          <div ref={sentinelRef} aria-hidden="true" className="h-1" />
          {isFetchingNextPage && <p role="status" className="py-3 text-center text-sm text-slate-500">Завантаження наступних сповіщень...</p>}
          {!hasNextPage && notifications.length > 0 && <p className="py-3 text-center text-sm text-slate-500">Усі сповіщення завантажено.</p>}
        </>
      )}
    </section>
  );
}

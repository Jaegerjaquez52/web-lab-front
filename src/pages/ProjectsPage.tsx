import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';

import { projectsService, type ProjectInput } from '@/services/projects.service';
import { teamsService } from '@/services/teams.service';
import { useAuthStore } from '@/stores/authStore';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Icon from '@/components/common/Icon';
import FormField from '@/components/common/FormField';
import ConfirmActionButton from '@/components/common/ConfirmActionButton';
import { TableSkeleton } from '@/components/common/Skeleton';

export default function ProjectsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<ProjectInput>({
    defaultValues: { name: '', description: '', teamId: null },
  });
  const { data, isPending, isError } = useQuery({
    queryKey: ['projects', page, search],
    queryFn: () => projectsService.getAll({ page, limit: 10, search: search || undefined }),
  });
  const teams = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: () => teamsService.getAll({ limit: 100 }),
  });

  const save = useMutation({
    mutationFn: (values: ProjectInput) => editingId
      ? projectsService.update(editingId, values)
      : projectsService.create(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success(editingId ? 'Проєкт оновлено' : 'Проєкт створено');
      setEditingId(null);
      reset({ name: '', description: '', teamId: null });
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.error : undefined;
      setError('root', { message: message ?? 'Не вдалося зберегти проєкт' });
    },
  });
  const remove = useMutation({
    mutationFn: projectsService.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    onError: () => toast.error('Не вдалося видалити проєкт'),
  });

  useEffect(() => {
    if (!editingId || !data) return;
    const project = data.data.find((item) => item.id === editingId);
    if (project) {
      reset({
        name: project.name,
        description: project.description ?? '',
        teamId: project.teamId,
      });
    }
  }, [editingId, data, reset]);

  return (
    <section className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">Командна робота</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Проєкти</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Об’єднуйте завдання навколо спільної цілі та за потреби прив’язуйте їх до команди.</p>
      </div>
      <form
        onSubmit={handleSubmit((values) => save.mutate(values))}
        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        noValidate
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
            <Icon name={editingId ? 'projects' : 'plus'} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">{editingId ? 'Редагувати проєкт' : 'Новий проєкт'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Команду можна не обирати.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1.2fr_1fr_auto]">
          <FormField label="Назва" error={errors.name?.message}>
            <Input placeholder="Наприклад, Оновлення сайту" {...register('name', { required: 'Вкажіть назву' })} />
          </FormField>
          <FormField label="Опис">
            <Input placeholder="Коротко про мету проєкту" {...register('description')} />
          </FormField>
          <FormField label="Команда">
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              {...register('teamId', { setValueAs: (value) => value === '' ? null : Number(value) })}
            >
              <option value="">Без команди</option>
              {teams.data?.data.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </FormField>
          <div className="flex items-end gap-2">
            <Button type="submit" isLoading={isSubmitting || save.isPending}>
              {editingId ? 'Зберегти' : 'Створити проєкт'}
            </Button>
            {editingId && <Button type="button" variant="secondary" onClick={() => { setEditingId(null); reset({ name: '', description: '', teamId: null }); }}>Скасувати</Button>}
          </div>
          {errors.root && <p role="alert" className="text-sm text-rose-600 md:col-span-2 xl:col-span-4">{errors.root.message}</p>}
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="relative block">
          <span className="sr-only">Пошук проєктів</span>
          <Icon name="search" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            aria-label="Пошук проєктів"
            placeholder="Пошук проєктів..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            className="pl-10"
          />
        </label>
      </div>
      {isPending && <TableSkeleton />}
      {isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">Не вдалося завантажити проєкти</p>}
      {data && (
        <>
          <ul className="space-y-3">
            {data.data.map((project) => {
              const canManage = user?.role === 'ADMIN' || project.ownerId === user?.id;
              return (
                <li key={project.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      <Icon name="projects" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-slate-900 dark:text-white">{project.name}</h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{project.description || 'Опис не додано'}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5"><Icon name="users" size={14} />{project.team?.name ?? 'Без команди'}</span>
                        <span>{project._count?.tasks ?? 0} завдань</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                    <Link
                      to={`/projects/${project.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30"
                    >
                      Відкрити <Icon name="arrowRight" size={16} />
                    </Link>
                    {canManage && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setEditingId(project.id)}>Редагувати</Button>
                        <ConfirmActionButton
                          isPending={remove.isPending}
                          title={`Видалити проєкт «${project.name}»?`}
                          description="Разом із проєктом буде видалено його завдання. Дію не можна скасувати."
                          onConfirm={() => remove.mutate(project.id)}
                        >
                          Видалити
                        </ConfirmActionButton>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
            {!data.data.length && (
              <li className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <Icon name="projects" size={22} />
                </span>
                <p className="mt-3 font-semibold text-slate-800 dark:text-white">Проєктів поки немає</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Створіть перший проєкт, щоб організувати командну роботу.</p>
              </li>
            )}
          </ul>
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Назад</Button>
            <span>{data.pagination.page} / {data.pagination.totalPages}</span>
            <Button variant="secondary" disabled={!data.pagination.hasMore} onClick={() => setPage((value) => value + 1)}>Далі</Button>
          </div>
        </>
      )}
    </section>
  );
}

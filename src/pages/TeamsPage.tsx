import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { isAxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import Button from '@/components/common/Button';
import FormField from '@/components/common/FormField';
import Icon from '@/components/common/Icon';
import Input from '@/components/common/Input';
import ConfirmActionButton from '@/components/common/ConfirmActionButton';
import SearchableMultiSelect from '@/components/common/SearchableMultiSelect';
import { TableSkeleton } from '@/components/common/Skeleton';
import { teamsService, type TeamInput } from '@/services/teams.service';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/stores/authStore';

export default function TeamsPage() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [memberIds, setMemberIds] = useState<number[]>([]);
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { register, handleSubmit, reset, setError, clearErrors, formState: { errors, isSubmitting } } = useForm<TeamInput>({
    defaultValues: { name: '', description: '' },
  });
  const teams = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: () => teamsService.getAll({ limit: 100 }),
  });
  const users = useQuery({
    queryKey: ['users', 'team-members'],
    queryFn: () => usersService.getAll({ limit: 100 }),
  });

  const save = useMutation({
    mutationFn: (values: TeamInput) => {
      const payload = { ...values, memberIds };
      return editingId
        ? teamsService.update(editingId, payload)
        : teamsService.create(payload);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teams'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ]);
      toast.success(editingId ? 'Команду оновлено' : 'Команду створено');
      setEditingId(null);
      setMemberIds([]);
      reset({ name: '', description: '' });
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.error : undefined;
      setError('root', { message: message ?? 'Не вдалося зберегти команду' });
    },
  });
  const remove = useMutation({
    mutationFn: teamsService.remove,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teams'] }),
        queryClient.invalidateQueries({ queryKey: ['projects'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ]);
      toast.success('Команду видалено');
    },
    onError: () => toast.error('Не вдалося видалити команду'),
  });

  const editingTeam = teams.data?.data.find((team) => team.id === editingId);
  const ownerId = editingTeam?.ownerId ?? (editingId ? null : user?.id);
  const ownerName = editingTeam?.owner?.name ?? (editingId ? null : user?.name);
  const selectableUsers = (users.data?.data ?? []).filter((item) => item.id !== ownerId);

  function startEditing(team: NonNullable<typeof teams.data>['data'][number]) {
    setEditingId(team.id);
    setMemberIds(team.members.filter((member) => member.id !== team.ownerId).map((member) => member.id));
    reset({ name: team.name, description: team.description ?? '' });
    clearErrors('root');
  }

  function cancelEditing() {
    setEditingId(null);
    setMemberIds([]);
    reset({ name: '', description: '' });
    clearErrors('root');
  }

  return (
    <section className="space-y-7">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Робочі групи</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Команди</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Створюйте окремі команди, додавайте учасників і використовуйте їх у проєктах.</p>
      </div>

      <form
        onSubmit={handleSubmit((values) => save.mutate(values))}
        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        noValidate
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Icon name={editingId ? 'users' : 'plus'} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">{editingId ? 'Редагувати команду' : 'Нова команда'}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Власник команди може керувати її складом.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Назва" error={errors.name?.message}>
            <Input placeholder="Наприклад, Дизайн-команда" {...register('name', { required: 'Вкажіть назву команди' })} />
          </FormField>
          <FormField label="Опис">
            <Input placeholder="Коротко про напрям роботи" {...register('description')} />
          </FormField>
        </div>

        <fieldset className="mt-5">
          <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Учасники</legend>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Власник команди додається автоматично. Можна вибрати кількох учасників.</p>
          {users.isPending && <p className="text-sm text-slate-500">Завантаження списку користувачів...</p>}
          {users.isError && <p role="alert" className="text-sm text-rose-600">Не вдалося завантажити користувачів</p>}
          {users.data && (
            <div className="space-y-3">
              {ownerId && (
                <p className="inline-flex rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-sm text-slate-700 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-slate-200">
                  {ownerName} <span className="ml-1 text-xs text-slate-500">(власник)</span>
                </p>
              )}
              <SearchableMultiSelect
                label="Знайти та вибрати учасників"
                placeholder="Пошук за ім'ям чи email..."
                options={selectableUsers.map((member) => ({
                  id: member.id,
                  label: member.name,
                  description: member.email,
                }))}
                selectedIds={memberIds}
                onChange={setMemberIds}
              />
            </div>
          )}
        </fieldset>

        {errors.root?.message && <p role="alert" className="mt-4 text-sm text-rose-600">{errors.root.message}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button type="submit" isLoading={isSubmitting || save.isPending} disabled={users.isError}>
            <Icon name="plus" size={17} />
            {editingId ? 'Зберегти команду' : 'Створити команду'}
          </Button>
          {editingId && <Button type="button" variant="secondary" onClick={cancelEditing}>Скасувати</Button>}
        </div>
      </form>

      {teams.isPending && <TableSkeleton />}
      {teams.isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">Не вдалося завантажити команди</p>}
      {teams.data && (
        <ul className="space-y-3">
          {teams.data.data.map((team) => {
            const canManage = user?.role === 'ADMIN' || team.ownerId === user?.id;
            return (
              <li key={team.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon name="users" size={18} className="text-emerald-600 dark:text-emerald-300" />
                      <h2 className="font-semibold text-slate-900 dark:text-white">{team.name}</h2>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{team.description || 'Опис не додано'}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Власник: {team.owner?.name ?? 'не призначений'} · {team.members.length} учасників · {team._count?.projects ?? 0} проєктів
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="secondary" onClick={() => startEditing(team)}>Керувати складом</Button>
                      <ConfirmActionButton
                        isPending={remove.isPending}
                        title={`Видалити команду «${team.name}»?`}
                        description="Проєкти залишаться без команди. Дію не можна скасувати."
                        onConfirm={() => remove.mutate(team.id)}
                      >
                        Видалити
                      </ConfirmActionButton>
                    </div>
                  )}
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {team.members.map((member) => (
                    <li key={member.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {member.name}{member.id === team.ownerId ? ' · власник' : ''}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
          {!teams.data.data.length && (
            <li className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <Icon name="users" size={24} className="mx-auto text-slate-400" />
              <p className="mt-3 font-semibold text-slate-800 dark:text-white">Команд поки немає</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Створіть команду та додайте до неї учасників.</p>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

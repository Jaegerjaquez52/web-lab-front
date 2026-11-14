import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';

import Button from '@/components/common/Button';
import ConfirmActionButton from '@/components/common/ConfirmActionButton';
import SortableTaskItem from '@/components/common/SortableTaskItem';
import FormField from '@/components/common/FormField';
import Icon from '@/components/common/Icon';
import Input from '@/components/common/Input';
import { TableSkeleton } from '@/components/common/Skeleton';
import TaskCalendar from '@/components/TaskCalendar';
import TaskDetails from '@/components/TaskDetails';
import TaskStatusChart from '@/components/TaskStatusChart';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { projectsService } from '@/services/projects.service';
import { socket } from '@/services/socket';
import { tasksService, type TaskInput } from '@/services/tasks.service';
import { useAuthStore } from '@/stores/authStore';
import { sortItemsByStoredOrder } from '@/utils/taskAnalytics';
import type { Task } from '@/types/api.types';

const statusLabels: Record<Task['status'], string> = {
  TODO: 'До виконання',
  IN_PROGRESS: 'У роботі',
  DONE: 'Виконано',
};

const statusStyles: Record<Task['status'], string> = {
  TODO: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  DONE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

function readTaskOrder(projectId: number) {
  try {
    const saved = localStorage.getItem(`task-order:${projectId}`);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) && parsed.every((value): value is number => (
      typeof value === 'number' && Number.isSafeInteger(value)
    )) && new Set(parsed).size === parsed.length ? parsed : [];
  } catch (error) {
    console.error('Не вдалося завантажити збережений порядок завдань:', error);
    return [];
  }
}

export default function ProjectDetailsPage() {
  const { id: rawId } = useParams();
  const projectId = Number(rawId);
  const validProjectId = Number.isInteger(projectId) && projectId > 0;
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [taskOrderState, setTaskOrderState] = useState(() => ({
    projectId,
    ids: readTaskOrder(projectId),
  }));
  const taskOrder = taskOrderState.projectId === projectId ? taskOrderState.ids : readTaskOrder(projectId);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<TaskInput>();
  const project = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getById(projectId),
    enabled: validProjectId,
  });
  const tasks = useQuery({
    queryKey: ['project-tasks', projectId],
    queryFn: () => tasksService.getAll({ projectId, limit: 100 }),
    enabled: validProjectId,
  });
  const orderedTasks = sortItemsByStoredOrder(tasks.data?.data ?? [], taskOrder);

  function reorderTasks({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const oldIndex = orderedTasks.findIndex((task) => task.id === Number(active.id));
    const newIndex = orderedTasks.findIndex((task) => task.id === Number(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const newOrder = arrayMove(orderedTasks.map((task) => task.id), oldIndex, newIndex);
    setTaskOrderState({ projectId, ids: newOrder });
    try {
      localStorage.setItem(`task-order:${projectId}`, JSON.stringify(newOrder));
    } catch {
      toast.error('Порядок оновлено, але не вдалося зберегти його у браузері');
    }
  }

  const refreshTasks = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] }),
    queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  ]);
  const create = useMutation({
    mutationFn: (values: TaskInput) => tasksService.create({ ...values, projectId }),
    onSuccess: async () => {
      await refreshTasks();
      toast.success('Завдання створено');
      reset();
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.error : undefined;
      setError('root', { message: message ?? 'Не вдалося створити завдання' });
    },
  });
  const update = useMutation({
    mutationFn: ({ id: taskId, status }: { id: number; status: Task['status'] }) => tasksService.update(taskId, { status }),
    onSuccess: refreshTasks,
    onError: () => toast.error('Не вдалося оновити завдання'),
  });
  const claim = useMutation({
    mutationFn: ({ id: taskId, claimed }: { id: number; claimed: boolean }) => tasksService.setClaim(taskId, claimed),
    onSuccess: refreshTasks,
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.error : undefined;
      toast.error(message ?? 'Не вдалося змінити виконавців');
    },
  });
  const remove = useMutation({
    mutationFn: tasksService.remove,
    onSuccess: refreshTasks,
    onError: () => toast.error('Не вдалося видалити завдання'),
  });

  useSocketEvent('task:created', refreshTasks);
  useSocketEvent('task:updated', refreshTasks);
  useSocketEvent('task:deleted', refreshTasks);

  useEffect(() => {
    if (!validProjectId || !user?.id) return undefined;
    const room = `project:${projectId}`;
    const joinRoom = () => socket.emit('room:join', room);
    socket.on('connect', joinRoom);
    if (socket.connected) joinRoom();
    return () => {
      socket.off('connect', joinRoom);
      socket.emit('room:leave', room);
    };
  }, [projectId, user?.id, validProjectId]);

  if (!validProjectId) {
    return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Некоректний ID проєкту</p>;
  }
  if (project.isPending) return <TableSkeleton />;
  if (project.isError || !project.data) {
    return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">Не вдалося завантажити проєкт або немає доступу до нього</p>;
  }

  return (
    <section className="space-y-7">
      <div>
        <Link to="/projects" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300">
          <Icon name="arrowRight" size={16} className="rotate-180" /> До проєктів
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">Проєкт</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{project.data.name}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{project.data.description || 'Опис не додано'}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <Icon name="users" size={17} />
            {project.data.team?.name ?? 'Без команди'}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit((values) => create.mutate({ ...values, projectId }))}
        className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
        noValidate
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
            <Icon name="plus" />
          </span>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">Нове завдання</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Завдання автоматично додається до цього проєкту.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1.4fr_auto]">
          <FormField label="Назва" error={errors.title?.message}>
            <Input placeholder="Наприклад, Підготувати макет" {...register('title', { required: 'Вкажіть назву' })} />
          </FormField>
          <FormField label="Опис">
            <Input placeholder="Додаткова інформація" {...register('description')} />
          </FormField>
          <div className="flex items-end">
            <Button type="submit" isLoading={isSubmitting || create.isPending}>
              <Icon name="plus" size={17} />Створити завдання
            </Button>
          </div>
          {errors.root && <p role="alert" className="text-sm text-rose-600 md:col-span-2 xl:col-span-3">{errors.root.message}</p>}
        </div>
      </form>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Завдання проєкту</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">{tasks.data?.pagination.total ?? 0} загалом</span>
        </div>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Перетягніть завдання за маркером, щоб змінити їхній порядок. Порядок зберігається у цьому браузері.</p>
        {tasks.isPending && <TableSkeleton />}
        {tasks.isError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">Не вдалося завантажити завдання</p>}
        {tasks.data && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderTasks}>
            <SortableContext items={orderedTasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-3">
                {orderedTasks.map((task) => {
              const isClaimed = task.assignments?.some((assignment) => assignment.userId === user?.id) ?? false;
              const canClaim = Boolean(user && (
                task.project?.ownerId === user.id
                || task.project?.team?.ownerId === user.id
                || task.project?.team?.members.some((member) => member.id === user.id)
              ));
              return (
                <SortableTaskItem key={task.id} id={task.id}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <button type="button" className="text-left font-semibold text-slate-900 hover:text-blue-700 dark:text-white dark:hover:text-blue-300" onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}>
                        {task.title}
                      </button>
                      {task.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.description}</p>}
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status]}`}>
                        {statusLabels[task.status]}
                      </span>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Виконують: {task.assignments?.length ? task.assignments.map((assignment) => assignment.user.name).join(', ') : 'ще ніхто не позначився'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                      <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300" title={canClaim ? undefined : 'Позначитися можуть лише учасники команди'}>
                        <input
                          type="checkbox"
                          checked={isClaimed}
                          disabled={!canClaim || claim.isPending}
                          onChange={(event) => claim.mutate({ id: task.id, claimed: event.target.checked })}
                        />
                        Я виконую
                      </label>
                      <select
                        aria-label={`Статус: ${task.title}`}
                        value={task.status}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        onChange={(event) => update.mutate({ id: task.id, status: event.target.value as Task['status'] })}
                      >
                        <option value="TODO">До виконання</option>
                        <option value="IN_PROGRESS">У роботі</option>
                        <option value="DONE">Виконано</option>
                      </select>
                      <ConfirmActionButton
                        isPending={remove.isPending}
                        title={`Видалити завдання «${task.title}»?`}
                        description="Завдання та його вкладення буде видалено. Дію не можна скасувати."
                        onConfirm={() => remove.mutate(task.id)}
                      >
                        Видалити
                      </ConfirmActionButton>
                    </div>
                  </div>
                  {expandedTask === task.id && <TaskDetails taskId={task.id} />}
                </SortableTaskItem>
              );
            })}
                {!orderedTasks.length && (
                  <li className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
                    <Icon name="tasks" size={22} className="mx-auto text-slate-400" />
                    <p className="mt-3 font-semibold text-slate-800 dark:text-white">У проєкті ще немає завдань</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Створіть перше завдання у формі вище.</p>
                  </li>
                )}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
      {tasks.data && (
        <div className="grid gap-5 lg:grid-cols-2">
          <TaskCalendar tasks={tasks.data.data} />
          <TaskStatusChart tasks={tasks.data.data} />
        </div>
      )}
    </section>
  );
}

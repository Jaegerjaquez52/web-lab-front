import api from './api';
import type { PaginatedResponse, Task } from '@/types/api.types';

export interface TaskInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  projectId: number;
  status?: Task['status'];
}

export const tasksService = {
  getAll: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    projectId?: number;
    assignedToMe?: boolean;
  } = {}) => {
    const { data } = await api.get<PaginatedResponse<Task>>('/tasks', { params });
    return data;
  },
  getById: async (id: number) => {
    const { data } = await api.get<Task & { comments: unknown[]; files: unknown[] }>(`/tasks/${id}`);
    return data;
  },
  create: async (payload: TaskInput) => {
    const { data } = await api.post<Task>('/tasks', payload);
    return data;
  },
  update: async (id: number, payload: Partial<TaskInput>) => {
    const { data } = await api.patch<Task>(`/tasks/${id}`, payload);
    return data;
  },
  setClaim: async (id: number, claimed: boolean) => {
    const { data } = await api.put<Task>(`/tasks/${id}/claim`, { claimed });
    return data;
  },
  remove: async (id: number) => {
    await api.delete(`/tasks/${id}`);
  },
};

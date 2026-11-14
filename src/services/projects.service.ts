import api from './api';
import type { PaginatedResponse, Project } from '@/types/api.types';

export interface ProjectInput {
  name: string;
  description?: string;
  teamId?: number | null;
}

export const projectsService = {
  getAll: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    const { data } = await api.get<PaginatedResponse<Project>>('/projects', { params });
    return data;
  },
  getById: async (id: number) => {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },
  create: async (payload: ProjectInput) => {
    const { data } = await api.post<Project>('/projects', payload);
    return data;
  },
  update: async (id: number, payload: Partial<ProjectInput>) => {
    const { data } = await api.patch<Project>(`/projects/${id}`, payload);
    return data;
  },
  remove: async (id: number) => {
    await api.delete(`/projects/${id}`);
  },
};

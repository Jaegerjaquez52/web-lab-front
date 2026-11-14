import api from './api';
import type { PaginatedResponse, Team } from '@/types/api.types';

export interface TeamInput {
  name: string;
  description?: string;
  memberIds?: number[];
}

export const teamsService = {
  getAll: async (params: { page?: number; limit?: number; search?: string } = {}) => {
    const { data } = await api.get<PaginatedResponse<Team>>('/teams', { params });
    return data;
  },
  create: async (payload: TeamInput) => {
    const { data } = await api.post<Team>('/teams', payload);
    return data;
  },
  update: async (id: number, payload: Partial<TeamInput>) => {
    const { data } = await api.patch<Team>(`/teams/${id}`, payload);
    return data;
  },
  remove: async (id: number) => {
    await api.delete(`/teams/${id}`);
  },
};

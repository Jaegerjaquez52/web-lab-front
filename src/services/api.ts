import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

let refreshRequest: Promise<string> | null = null;

// Interceptor запиту: додає токен доступу зі сховища Zustand
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor відповіді: при 401 завершує сесію
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: string }>) => {
    const request = error.config as RetryableRequest | undefined;
    const isAuthRequest = request?.url?.startsWith('/auth/');
    const refreshToken = useAuthStore.getState().refreshToken;
    if (error.response?.status !== 401 || !request || request._retry || isAuthRequest || !refreshToken) {
      if (error.response?.status === 401 && !isAuthRequest) useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      refreshRequest ??= axios
        .post<{ tokens: { accessToken: string; refreshToken: string } }>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        )
        .then(({ data }) => {
          useAuthStore.getState().setTokens(data.tokens.accessToken, data.tokens.refreshToken);
          return data.tokens.accessToken;
        })
        .finally(() => {
          refreshRequest = null;
        });
      const accessToken = await refreshRequest;
      request.headers.Authorization = `Bearer ${accessToken}`;
      return await api(request);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
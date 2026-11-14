import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router';
import { isAxiosError } from 'axios';

import { loginSchema, type LoginFormData } from '@/schemas/auth.schema';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import type { AuthResponse } from '@/types/api.types';
import Button from '@/components/common/Button';
import Icon from '@/components/common/Icon';
import Input from '@/components/common/Input';
import FormField from '@/components/common/FormField';

export default function LoginPage() {
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard';

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { data: res } = await api.post<AuthResponse>('/auth/login', data);
      login(res.user, res.tokens.accessToken, res.tokens.refreshToken);
      navigate(from, { replace: true });
    } catch (error) {
      const response = isAxiosError(error) ? error.response?.data : undefined;
      if (response?.require2FA) setTwoFactorRequired(true);
      const message = response?.error;
      setError('root', { message: message ?? 'Помилка входу' });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-900/20" />
      <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl dark:bg-violet-900/20" />
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20 sm:p-9">
        <Link to="/" className="mb-8 inline-flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Icon name="tasks" size={21} />
          </span>
          <span className="font-bold text-slate-900 dark:text-white">Task Manager</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Раді вас бачити</h1>
        <p className="mb-7 mt-2 text-sm text-slate-500 dark:text-slate-400">Увійдіть, щоб продовжити роботу з командою.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" placeholder="your@email.com" {...register('email')} />
          </FormField>

          <FormField label="Пароль" error={errors.password?.message}>
            <Input type="password" placeholder="••••••••" {...register('password')} />
          </FormField>
          {twoFactorRequired && (
            <FormField label="Код двофакторної автентифікації">
              <Input inputMode="numeric" autoComplete="one-time-code" {...register('twoFactorToken')} />
            </FormField>
          )}

          {errors.root && (
            <p role="alert" className="text-sm text-red-500">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Увійти
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">Немає акаунта?</span>{' '}
          <Link to="/register" className="text-primary-600 hover:underline">
            Зареєструватися
          </Link>
        </p>
      </div>
    </div>
  );
}
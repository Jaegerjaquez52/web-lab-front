import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';

import { registerSchema, type RegisterFormData } from '@/schemas/auth.schema';
import api from '@/services/api';
import Button from '@/components/common/Button';
import Icon from '@/components/common/Icon';
import Input from '@/components/common/Input';
import FormField from '@/components/common/FormField';

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async ({ name, email, password }: RegisterFormData) => {
    try {
      // confirmPassword на сервер не надсилаємо
      await api.post('/auth/register', { name, email, password });
      toast.success('Обліковий запис створено. Тепер увійдіть.');
      navigate('/login');
    } catch (error) {
      const message = isAxiosError(error) ? error.response?.data?.error : undefined;
      setError('root', { message: message ?? 'Помилка реєстрації' });
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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Створіть обліковий запис</h1>
        <p className="mb-7 mt-2 text-sm text-slate-500 dark:text-slate-400">Приєднайтеся до робочого простору команди.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label="Ім'я" error={errors.name?.message}>
            <Input {...register('name')} />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </FormField>
          <FormField label="Пароль" error={errors.password?.message}>
            <Input type="password" {...register('password')} />
          </FormField>
          <FormField label="Підтвердження пароля" error={errors.confirmPassword?.message}>
            <Input type="password" {...register('confirmPassword')} />
          </FormField>

          {errors.root && (
            <p role="alert" className="text-sm text-red-500">
              {errors.root.message}
            </p>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Зареєструватися
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">Вже є акаунт?</span>{' '}
          <Link to="/login" className="text-primary-600 hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  );
}
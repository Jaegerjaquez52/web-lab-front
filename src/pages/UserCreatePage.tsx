import { Navigate, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import toast from 'react-hot-toast';

import { usersService } from '@/services/users.service';
import { createUserSchema, type CreateUserFormData } from '@/schemas/user.schema';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import FormField from '@/components/common/FormField';
import { useAuthStore } from '@/stores/authStore';

export default function UserCreatePage() {
  const isAdmin = useAuthStore((state) => state.user?.role === 'ADMIN');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({ resolver: zodResolver(createUserSchema) });

  const createUser = useMutation({
    mutationFn: usersService.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Користувача створено');
      navigate('/users');
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.error : undefined;
      setError('root', { message: message ?? 'Не вдалося створити користувача' });
    },
  });

  if (!isAdmin) return <Navigate to="/users" replace />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Створення користувача</h1>
      <form
        onSubmit={handleSubmit((data) => createUser.mutate(data))}
        className="space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-900"
        noValidate
      >
        <FormField label="Ім’я" error={errors.name?.message}>
          <Input {...register('name')} />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" {...register('email')} />
        </FormField>
        <FormField label="Пароль" error={errors.password?.message}>
          <Input type="password" {...register('password')} />
        </FormField>
        {errors.root && <p role="alert" className="text-sm text-red-500">{errors.root.message}</p>}
        <div className="flex gap-4">
          <Button type="submit" isLoading={isSubmitting || createUser.isPending}>Створити</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/users')}>Скасувати</Button>
        </div>
      </form>
    </div>
  );
}

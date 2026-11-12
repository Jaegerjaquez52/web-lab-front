import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';

import { usersService } from '@/services/users.service';
import { userSchema, type UserFormData, type UserFormInput } from '@/schemas/user.schema';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import FormField from '@/components/common/FormField';
import Skeleton from '@/components/common/Skeleton';

export default function UserEditPage() {
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Завантажуємо дані користувача
  const { data: user, isPending, isError } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => usersService.getById(userId),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserFormInput, unknown, UserFormData>({ 
    resolver: zodResolver(userSchema) 
  });

  // Коли дані прийшли — заповнюємо форму
  useEffect(() => {
    if (user) reset({ name: user.name, email: user.email });
  }, [user, reset]);

  const updateUser = useMutation({
    mutationFn: (data: Partial<UserFormData>) => usersService.update(userId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Дані оновлено');
      navigate('/users');
    },
    onError: (error) => {
      const message = isAxiosError(error) ? error.response?.data?.error : undefined;
      toast.error(message ?? 'Помилка оновлення');
    },
  });

  if (isPending) return <div className="space-y-4 max-w-2xl mx-auto"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
  if (isError) return <p className="text-red-500">Помилка завантаження даних</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold">Редагування користувача</h1>
      <form onSubmit={handleSubmit((data) => updateUser.mutate(data))} className="space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-900" noValidate>
        <FormField label="Ім'я" error={errors.name?.message}>
          <Input {...register('name')} />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" {...register('email')} />
        </FormField>
        <FormField label="Вік (необов'язково)" error={errors.age?.message}>
          <Input type="number" {...register('age')} />
        </FormField>
        <FormField label="Телефон (необов'язково)" error={errors.phone?.message}>
          <Input {...register('phone')} />
        </FormField>

        <div className="flex gap-4">
          <Button type="submit" isLoading={updateUser.isPending}>Зберегти</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/users')}>Скасувати</Button>
        </div>
      </form>
    </div>
  );
}
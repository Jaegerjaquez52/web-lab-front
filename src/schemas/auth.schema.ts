import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Невірний формат email' }),
  password: z.string().min(8, { message: 'Пароль має містити мінімум 8 символів' }),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, { message: "Ім'я має містити мінімум 2 символи" }),
    email: z.string().email({ message: 'Невірний формат email' }),
    password: z.string().min(8, { message: 'Пароль має містити мінімум 8 символів' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Паролі не збігаються',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
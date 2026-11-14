import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2, { message: "Ім'я має містити мінімум 2 символи" }),
  email: z.string().email({ message: 'Невірний формат email' }),
});

export type UserFormInput = z.input<typeof userSchema>;
export type UserFormData = z.output<typeof userSchema>;

export const createUserSchema = userSchema.extend({
  password: z.string().min(8, { message: 'Пароль має містити мінімум 8 символів' }),
});
export type CreateUserFormData = z.infer<typeof createUserSchema>;
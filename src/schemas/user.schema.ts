import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2, { message: "Ім'я має містити мінімум 2 символи" }),
  email: z.string().email({ message: 'Невірний формат email' }),
  // Порожнє поле форми — це '', а не undefined: перетворюємо його перед перевіркою числа
  age: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.coerce.number().int({ message: 'Вік має бути цілим числом' }).min(18, { message: 'Вік має бути не менше 18' }).optional()
  ),
  phone: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().regex(/^\+380\d{9}$/, { message: 'Формат телефону: +380XXXXXXXXX' }).optional()
  ),
});

// Тип входу форми (рядки з полів) і тип виходу (після перетворень) відрізняються
export type UserFormInput = z.input<typeof userSchema>;
export type UserFormData = z.output<typeof userSchema>;
import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth.schema';

describe('authentication form schemas', () => {
  it('accepts a valid login with a 2FA code', () => {
    expect(loginSchema.safeParse({
      email: 'user@example.com',
      password: 'securePass123',
      twoFactorToken: '123456',
    }).success).toBe(true);
  });

  it('rejects a registration when passwords differ', () => {
    expect(registerSchema.safeParse({
      name: 'Test User',
      email: 'user@example.com',
      password: 'securePass123',
      confirmPassword: 'differentPass123',
    }).success).toBe(false);
  });
});

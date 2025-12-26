import { PasswordUtil } from './password.util';

describe('PasswordUtil', () => {
  describe('hashPassword', () => {
    it('should hash a valid password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await PasswordUtil.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should throw error for invalid password', async () => {
      await expect(PasswordUtil.hashPassword('')).rejects.toThrow(
        'Password must be a non-empty string',
      );
      await expect(PasswordUtil.hashPassword('short')).rejects.toThrow(
        'Password must be at least 8 characters long',
      );
    });

    it('should throw error for non-string password', async () => {
      await expect(PasswordUtil.hashPassword(null as any)).rejects.toThrow(
        'Password must be a non-empty string',
      );
      await expect(PasswordUtil.hashPassword(123 as any)).rejects.toThrow(
        'Password must be a non-empty string',
      );
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await PasswordUtil.hashPassword(password);

      const result = await PasswordUtil.comparePassword(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await PasswordUtil.hashPassword(password);

      const result = await PasswordUtil.comparePassword('WrongPassword', hashedPassword);
      expect(result).toBe(false);
    });

    it('should return false for invalid inputs', async () => {
      const result1 = await PasswordUtil.comparePassword('', 'hash');
      expect(result1).toBe(false);

      const result2 = await PasswordUtil.comparePassword('password', '');
      expect(result2).toBe(false);

      const result3 = await PasswordUtil.comparePassword(null as any, 'hash');
      expect(result3).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate a strong password', () => {
      const result = PasswordUtil.validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const testCases = [
        { password: 'short', expectedErrors: ['Password must be at least 8 characters long'] },
        {
          password: 'nouppercase123!',
          expectedErrors: ['Password must contain at least one uppercase letter'],
        },
        {
          password: 'NOLOWERCASE123!',
          expectedErrors: ['Password must contain at least one lowercase letter'],
        },
        { password: 'NoNumbers!', expectedErrors: ['Password must contain at least one number'] },
        {
          password: 'NoSpecialChars123',
          expectedErrors: ['Password must contain at least one special character'],
        },
      ];

      testCases.forEach(({ password, expectedErrors }) => {
        const result = PasswordUtil.validatePassword(password);
        expect(result.isValid).toBe(false);
        expectedErrors.forEach((error) => {
          expect(result.errors).toContain(error);
        });
      });
    });

    it('should reject non-string passwords', () => {
      const result = PasswordUtil.validatePassword(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be a string');
    });

    it('should reject overly long passwords', () => {
      const longPassword = 'A'.repeat(129) + '1!';
      const result = PasswordUtil.validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password cannot exceed 128 characters');
    });
  });
});

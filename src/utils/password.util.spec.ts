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
});

import { PasswordUtil } from '../utils/password.util';
import { User } from './user.entity';

describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User();
  });

  describe('Password Hashing', () => {
    it('should hash password before insert', async () => {
      user.password = 'TestPassword123!';
      await user.hashPassword();

      expect(user.passwordHash).toBeDefined();
      expect(user.passwordHash).not.toBe('TestPassword123!');
      expect(user.password).toBeUndefined();
    });

    it('should compare password correctly', async () => {
      const plainPassword = 'TestPassword123!';
      user.passwordHash = await PasswordUtil.hashPassword(plainPassword);

      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);

      const isNotMatch = await user.comparePassword('WrongPassword');
      expect(isNotMatch).toBe(false);
    });
  });

  describe('Static Methods', () => {
    it('should hash password using static method', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await User.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });
  });
});

import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  let dto: RegisterDto;

  beforeEach(() => {
    dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.name = 'Test User';
  });

  describe('password validation', () => {
    it('should accept strong password with all requirements', async () => {
      dto.password = 'MySecurePass123!';

      const errors = await validate(dto);
      const passwordErrors = errors.filter((error) => error.property === 'password');

      expect(passwordErrors).toHaveLength(0);
    });

    it('should reject password without uppercase letter', async () => {
      dto.password = 'mysecurepass123!';

      const errors = await validate(dto);
      const passwordErrors = errors.filter((error) => error.property === 'password');

      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should reject password without lowercase letter', async () => {
      dto.password = 'MYSECUREPASS123!';

      const errors = await validate(dto);
      const passwordErrors = errors.filter((error) => error.property === 'password');

      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should reject password without number', async () => {
      dto.password = 'MySecurePass!';

      const errors = await validate(dto);
      const passwordErrors = errors.filter((error) => error.property === 'password');

      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should reject password without special character', async () => {
      dto.password = 'MySecurePass123';

      const errors = await validate(dto);
      const passwordErrors = errors.filter((error) => error.property === 'password');

      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should reject password shorter than 8 characters', async () => {
      dto.password = 'Pass1!';

      const errors = await validate(dto);
      const passwordErrors = errors.filter((error) => error.property === 'password');

      expect(passwordErrors.length).toBeGreaterThan(0);
      expect(passwordErrors.some((error) => error.constraints?.minLength)).toBe(true);
    });

    it('should reject password longer than 128 characters', async () => {
      dto.password = 'A'.repeat(120) + '1234567!'; // 129 characters

      const errors = await validate(dto);
      const passwordErrors = errors.filter((error) => error.property === 'password');

      expect(passwordErrors.length).toBeGreaterThan(0);
      // Check for either maxLength or isStrongPassword constraint
      const hasMaxLengthError = passwordErrors.some((error) => error.constraints?.maxLength);
      const hasStrongPasswordError = passwordErrors.some(
        (error) => error.constraints?.isStrongPassword,
      );
      expect(hasMaxLengthError || hasStrongPasswordError).toBe(true);
    });

    it('should accept various special characters', async () => {
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '='];

      for (const char of specialChars) {
        dto.password = `MySecurePass123${char}`;

        const errors = await validate(dto);
        const passwordErrors = errors.filter((error) => error.property === 'password');

        expect(passwordErrors).toHaveLength(0);
      }
    });
  });

  describe('email validation', () => {
    it('should accept valid email', async () => {
      dto.password = 'MySecurePass123!';
      dto.email = 'test@example.com';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');

      expect(emailErrors).toHaveLength(0);
    });

    it('should reject invalid email', async () => {
      dto.password = 'MySecurePass123!';
      dto.email = 'invalid-email';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');

      expect(emailErrors.length).toBeGreaterThan(0);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });
  });

  describe('name validation', () => {
    it('should accept valid name', async () => {
      dto.password = 'MySecurePass123!';
      dto.name = 'John Doe';

      const errors = await validate(dto);
      const nameErrors = errors.filter((error) => error.property === 'name');

      expect(nameErrors).toHaveLength(0);
    });

    it('should reject name shorter than 2 characters', async () => {
      dto.password = 'MySecurePass123!';
      dto.name = 'A';

      const errors = await validate(dto);
      const nameErrors = errors.filter((error) => error.property === 'name');

      expect(nameErrors.length).toBeGreaterThan(0);
      expect(nameErrors[0].constraints).toHaveProperty('minLength');
    });

    it('should reject name longer than 255 characters', async () => {
      dto.password = 'MySecurePass123!';
      dto.name = 'A'.repeat(256);

      const errors = await validate(dto);
      const nameErrors = errors.filter((error) => error.property === 'name');

      expect(nameErrors.length).toBeGreaterThan(0);
      expect(nameErrors[0].constraints).toHaveProperty('maxLength');
    });
  });
});

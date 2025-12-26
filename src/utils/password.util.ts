import * as bcrypt from 'bcrypt';

/**
 * Password utility class for hashing and comparing passwords
 */
export class PasswordUtil {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Hash a plain text password
   * @param password - Plain text password to hash
   * @returns Promise<string> - Hashed password
   */
  static async hashPassword(password: string): Promise<string> {
    if (!password || typeof password !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param plainPassword - Plain text password
   * @param hashedPassword - Hashed password to compare against
   * @returns Promise<boolean> - True if passwords match, false otherwise
   */
  static async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    if (!plainPassword || !hashedPassword) {
      return false;
    }

    if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') {
      return false;
    }

    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      // Log error in production, for now just return false
      console.error('Error comparing passwords:', error);
      return false;
    }
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns object with validation result and messages
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
      errors.push('Password must be a string');
      return { isValid: false, errors };
    }

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password cannot exceed 128 characters');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

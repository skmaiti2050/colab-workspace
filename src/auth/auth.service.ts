import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../entities/user.entity';
import {
  AuthResponse,
  JwtPayload,
  RefreshTokenPayload,
  UserProfile,
} from '../interfaces/auth.interface';
import { UserService } from '../modules/user/user.service';

@Injectable()
export class AuthService {
  private readonly refreshTokens = new Map<string, RefreshTokenPayload>();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email address is already registered');
    }

    const user = await this.userService.create({
      email: registerDto.email,
      name: registerDto.name,
      password: registerDto.password,
    });

    return user;
  }

  /**
   * Login user with credentials
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.generateTokens(user);
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
      if (!refreshSecret) {
        throw new Error('JWT refresh secret is required');
      }

      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });
      const storedToken = this.refreshTokens.get(payload.tokenId);
      if (!storedToken || storedToken.sub !== payload.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userService.findOne(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      this.refreshTokens.delete(payload.tokenId);

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Validate user credentials
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Validate JWT payload
   */
  async validateJwtPayload(payload: JwtPayload): Promise<UserProfile | null> {
    const user = await this.userService.findOne(payload.sub);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<AuthResponse> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const jwtSecret = this.configService.get<string>('jwt.secret');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');

    if (!jwtSecret || !refreshSecret) {
      throw new Error('JWT secrets are required');
    }

    const accessToken = this.jwtService.sign(payload);

    const tokenId = randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      tokenId,
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') || '7d') as any,
    });

    this.refreshTokens.set(tokenId, refreshPayload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
      if (!refreshSecret) {
        throw new Error('JWT refresh secret is required');
      }

      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      this.refreshTokens.delete(payload.tokenId);
    } catch {
      throw new BadRequestException('Invalid refresh token');
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    for (const [tokenId, payload] of this.refreshTokens.entries()) {
      if (payload.sub === userId) {
        this.refreshTokens.delete(tokenId);
      }
    }
  }
}

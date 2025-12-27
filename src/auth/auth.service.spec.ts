import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../entities/user.entity';
import { UserService } from '../modules/user/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: User = {
    id: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
  };

  beforeEach(async () => {
    const mockUserService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userService.create).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      userService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUserWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
        hashPassword: jest.fn(),
      };

      userService.findByEmail.mockResolvedValue(mockUserWithPassword);
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'jwt.secret':
            return 'test-secret';
          case 'jwt.refreshSecret':
            return 'test-refresh-secret';
          default:
            return undefined;
        }
      });
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      userService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
        hashPassword: jest.fn(),
      };
      userService.findByEmail.mockResolvedValue(mockUserWithPassword);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual(mockUserWithPassword);
    });

    it('should return null for invalid credentials', async () => {
      userService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });
});

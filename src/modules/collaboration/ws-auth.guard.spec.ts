import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { WsAuthGuard } from './ws-auth.guard';

describe('WsAuthGuard', () => {
  let guard: WsAuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    guard = module.get<WsAuthGuard>(WsAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return false when no token is provided', async () => {
      const mockClient = {
        handshake: {
          headers: {},
          query: {},
          auth: {},
        },
        data: {},
      };

      const mockContext = {
        switchToWs: () => ({
          getClient: () => mockClient,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(false);
    });

    it('should return true when valid token is provided', async () => {
      const mockPayload = { sub: 'user-id', email: 'test@example.com' };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

      const mockClient = {
        handshake: {
          headers: {
            authorization: 'Bearer valid-token',
          },
          query: {},
          auth: {},
        },
        data: {} as any,
      };

      const mockContext = {
        switchToWs: () => ({
          getClient: () => mockClient,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
      expect(mockClient.data.user).toEqual(mockPayload);
    });

    it('should return false when token verification fails', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(new Error('Invalid token'));

      const mockClient = {
        handshake: {
          headers: {
            authorization: 'Bearer invalid-token',
          },
          query: {},
          auth: {},
        },
        data: {},
      };

      const mockContext = {
        switchToWs: () => ({
          getClient: () => mockClient,
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(false);
    });
  });
});

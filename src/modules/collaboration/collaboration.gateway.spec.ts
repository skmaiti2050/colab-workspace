import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationGateway } from './collaboration.gateway';

describe('CollaborationGateway', () => {
  let gateway: CollaborationGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationGateway,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string): any => {
              const config: Record<string, any> = {
                'redis.url': undefined,
                'redis.host': 'localhost',
                'redis.port': 6379,
                'redis.password': undefined,
                'redis.db': 0,
                nodeEnv: 'test',
              };
              return config[key];
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<CollaborationGateway>(CollaborationGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should initialize WebSocket gateway', async () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      const mockServer = {
        adapter: jest.fn(),
      } as any;

      await gateway.afterInit(mockServer);

      expect(logSpy).toHaveBeenCalledWith('WebSocket Gateway initialized');
    });
  });

  describe('handleConnection', () => {
    it('should handle client connections', async () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      const mockClient = {
        id: 'test-client-id',
        handshake: {
          headers: {
            'user-agent': 'test-agent',
          },
        },
      } as any;

      await gateway.handleConnection(mockClient);

      expect(logSpy).toHaveBeenCalledWith('Client connected: test-client-id');
    });
  });

  describe('onModuleDestroy', () => {
    it('should cleanup Redis connections gracefully', async () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      const errorSpy = jest.spyOn(gateway['logger'], 'error');

      const mockRedisClient = {
        quit: jest.fn().mockResolvedValue('OK'),
      };
      const mockRedisSubscriber = {
        quit: jest.fn().mockResolvedValue('OK'),
      };

      gateway['redisClient'] = mockRedisClient as any;
      gateway['redisSubscriber'] = mockRedisSubscriber as any;

      await gateway.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(mockRedisSubscriber.quit).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Redis client connection closed');
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});

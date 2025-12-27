import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { CollaborationGateway } from './collaboration.gateway';

describe('CollaborationGateway', () => {
  let gateway: CollaborationGateway;
  let configService: ConfigService;

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
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should have a logger', () => {
    expect(gateway['logger']).toBeDefined();
  });

  it('should initialize with config service', () => {
    expect(configService).toBeDefined();
    expect(configService.get).toBeDefined();
  });

  describe('afterInit', () => {
    it('should log initialization message', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      const mockServer = {
        adapter: jest.fn(),
      } as any;

      gateway.afterInit(mockServer);

      expect(logSpy).toHaveBeenCalledWith('WebSocket Gateway initialized');
    });

    it('should setup Redis adapter with error handlers', () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      const mockServer = {
        adapter: jest.fn(),
      } as any;

      const setupSpy = jest.spyOn(gateway as any, 'setupRedisAdapter');

      gateway.afterInit(mockServer);

      expect(setupSpy).toHaveBeenCalledWith(mockServer);
      expect(logSpy).toHaveBeenCalledWith('WebSocket Gateway initialized');
    });
  });

  describe('handleConnection', () => {
    it('should log client connection', async () => {
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

  describe('handleDisconnect', () => {
    it('should log client disconnection', async () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');
      const mockClient = {
        id: 'test-client-id',
        data: {},
      } as any;

      await gateway.handleDisconnect(mockClient);

      expect(logSpy).toHaveBeenCalledWith('Client disconnected: test-client-id');
    });
  });

  describe('onModuleDestroy', () => {
    it('should cleanup Redis connections', async () => {
      const logSpy = jest.spyOn(gateway['logger'], 'log');

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
      expect(logSpy).toHaveBeenCalledWith('Redis subscriber connection closed');
    });

    it('should handle Redis cleanup errors gracefully', async () => {
      const errorSpy = jest.spyOn(gateway['logger'], 'error');

      const mockRedisClient = {
        quit: jest.fn().mockRejectedValue(new Error('Connection error')),
      };

      gateway['redisClient'] = mockRedisClient as any;

      await gateway.onModuleDestroy();

      expect(errorSpy).toHaveBeenCalledWith('Error closing Redis connections', expect.any(Error));
    });
  });
});

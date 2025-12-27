import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PresenceService, UserSession } from './presence.service';

describe('PresenceService', () => {
  let service: PresenceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PresenceService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'nodeEnv') return 'test';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PresenceService>(PresenceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addUserSession', () => {
    it('should handle session addition when Redis is not available', async () => {
      const session: UserSession = {
        userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
        username: 'john.doe@example.com',
        workspaceId: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
        socketId: 'socket-123',
        joinedAt: new Date(),
        lastActivity: new Date(),
      };

      // Should not throw error even when Redis is not available
      await expect(service.addUserSession(session)).resolves.not.toThrow();
    });
  });

  describe('removeUserSession', () => {
    it('should return null when Redis is not available', async () => {
      const result = await service.removeUserSession('socket-123');
      expect(result).toBeNull();
    });
  });

  describe('getWorkspaceActiveUsers', () => {
    it('should return empty array when Redis is not available', async () => {
      const result = await service.getWorkspaceActiveUsers('2204e384-f55a-49d8-920d-8fc9c8bb124f');
      expect(result).toEqual([]);
    });
  });

  describe('getWorkspacePresence', () => {
    it('should return default presence when Redis is not available', async () => {
      const workspaceId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
      const result = await service.getWorkspacePresence(workspaceId);

      expect(result).toEqual({
        workspaceId,
        activeUsers: [],
        totalUsers: 0,
        lastUpdated: expect.any(Date),
      });
    });
  });

  describe('isUserActive', () => {
    it('should return false when Redis is not available', async () => {
      const result = await service.isUserActive(
        '2204e384-f55a-49d8-920d-8fc9c8bb124f',
        '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      );
      expect(result).toBe(false);
    });
  });

  describe('getUserSession', () => {
    it('should return null when Redis is not available', async () => {
      const result = await service.getUserSession('socket-123');
      expect(result).toBeNull();
    });
  });

  describe('getTotalActiveUsers', () => {
    it('should return 0 when Redis is not available', async () => {
      const result = await service.getTotalActiveUsers();
      expect(result).toBe(0);
    });
  });

  describe('updateUserActivity', () => {
    it('should handle activity update when Redis is not available', async () => {
      // Should not throw error even when Redis is not available
      await expect(service.updateUserActivity('socket-123')).resolves.not.toThrow();
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should handle cleanup when Redis is not available', async () => {
      // Should not throw error even when Redis is not available
      await expect(service.cleanupExpiredSessions()).resolves.not.toThrow();
    });
  });
});

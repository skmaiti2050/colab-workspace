import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createRedisConfig } from '../../config/redis.config';

export interface UserSession {
  userId: string;
  username: string;
  workspaceId: string;
  socketId: string;
  joinedAt: Date;
  lastActivity: Date;
}

export interface WorkspacePresence {
  workspaceId: string;
  activeUsers: UserSession[];
  totalUsers: number;
  lastUpdated: Date;
}

@Injectable()
export class PresenceService implements OnModuleDestroy {
  private readonly logger = new Logger(PresenceService.name);
  private redisClient!: Redis;
  private readonly SESSION_TTL = 3600; // 1 hour in seconds
  private readonly PRESENCE_TTL = 300; // 5 minutes in seconds

  constructor(private readonly configService: ConfigService) {
    void this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisConfig = createRedisConfig(this.configService);

      if (!redisConfig || this.configService.get('nodeEnv') === 'test') {
        this.logger.log('Redis disabled for test environment or no configuration');
        return;
      }

      this.redisClient =
        typeof redisConfig === 'string' ? new Redis(redisConfig) : new Redis(redisConfig);

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis client error:', error.message);
      });

      this.redisClient.on('connect', () => {
        this.logger.log('PresenceService Redis client connected');
      });

      this.redisClient.on('ready', () => {
        this.logger.log('PresenceService Redis client ready');
      });

      // Test connection
      await this.redisClient.ping();
      this.logger.log('PresenceService initialized with Redis');
    } catch (error) {
      this.logger.error('Failed to initialize PresenceService Redis client:', error);
    }
  }

  /** Add user session when they join a workspace */
  async addUserSession(session: UserSession): Promise<void> {
    try {
      if (!this.redisClient) {
        this.logger.debug('Redis not available - session not stored');
        return;
      }

      const sessionKey = `session:${session.socketId}`;
      const workspaceKey = `workspace:${session.workspaceId}:users`;
      const userKey = `user:${session.userId}:sessions`;

      // Store session data
      await this.redisClient.setex(sessionKey, this.SESSION_TTL, JSON.stringify(session));

      // Add user to workspace set
      await this.redisClient.sadd(workspaceKey, session.userId);
      await this.redisClient.expire(workspaceKey, this.PRESENCE_TTL);

      // Track user's active sessions
      await this.redisClient.sadd(userKey, session.socketId);
      await this.redisClient.expire(userKey, this.SESSION_TTL);

      // Store user presence data
      const presenceKey = `presence:${session.workspaceId}:${session.userId}`;
      const presenceData = {
        userId: session.userId,
        username: session.username,
        workspaceId: session.workspaceId,
        joinedAt: session.joinedAt,
        lastActivity: session.lastActivity,
        socketIds: [session.socketId],
      };
      await this.redisClient.setex(presenceKey, this.PRESENCE_TTL, JSON.stringify(presenceData));

      this.logger.debug(
        `User session added: ${session.userId} in workspace ${session.workspaceId}`,
      );
    } catch (error) {
      this.logger.error('Error adding user session:', error);
    }
  }

  /** Remove user session when they disconnect */
  async removeUserSession(socketId: string): Promise<UserSession | null> {
    try {
      if (!this.redisClient) {
        this.logger.debug('Redis not available - session cleanup skipped');
        return null;
      }

      const sessionKey = `session:${socketId}`;
      const sessionData = await this.redisClient.get(sessionKey);

      if (!sessionData) {
        this.logger.debug(`No session found for socket ${socketId}`);
        return null;
      }

      const session: UserSession = JSON.parse(sessionData);
      const workspaceKey = `workspace:${session.workspaceId}:users`;
      const userKey = `user:${session.userId}:sessions`;
      const presenceKey = `presence:${session.workspaceId}:${session.userId}`;

      // Remove session
      await this.redisClient.del(sessionKey);

      // Remove socket from user's active sessions
      await this.redisClient.srem(userKey, socketId);

      // Check if user has other active sessions
      const remainingSessions = await this.redisClient.smembers(userKey);

      if (remainingSessions.length === 0) {
        // User has no more active sessions, remove from workspace
        await this.redisClient.srem(workspaceKey, session.userId);
        await this.redisClient.del(presenceKey);
        await this.redisClient.del(userKey);

        this.logger.debug(
          `User completely disconnected: ${session.userId} from workspace ${session.workspaceId}`,
        );
      } else {
        // Update presence data to remove this socket
        const presenceData = await this.redisClient.get(presenceKey);
        if (presenceData) {
          const presence = JSON.parse(presenceData);
          presence.socketIds = presence.socketIds.filter((id: string) => id !== socketId);
          presence.lastActivity = new Date();
          await this.redisClient.setex(presenceKey, this.PRESENCE_TTL, JSON.stringify(presence));
        }

        this.logger.debug(`Socket disconnected but user still active: ${session.userId}`);
      }

      return session;
    } catch (error) {
      this.logger.error('Error removing user session:', error);
      return null;
    }
  }

  /** Update user's last activity timestamp */
  async updateUserActivity(socketId: string): Promise<void> {
    try {
      if (!this.redisClient) {
        return;
      }

      const sessionKey = `session:${socketId}`;
      const sessionData = await this.redisClient.get(sessionKey);

      if (!sessionData) {
        return;
      }

      const session: UserSession = JSON.parse(sessionData);
      session.lastActivity = new Date();

      // Update session
      await this.redisClient.setex(sessionKey, this.SESSION_TTL, JSON.stringify(session));

      // Update presence
      const presenceKey = `presence:${session.workspaceId}:${session.userId}`;
      const presenceData = await this.redisClient.get(presenceKey);

      if (presenceData) {
        const presence = JSON.parse(presenceData);
        presence.lastActivity = new Date();
        await this.redisClient.setex(presenceKey, this.PRESENCE_TTL, JSON.stringify(presence));
      }
    } catch (error) {
      this.logger.error('Error updating user activity:', error);
    }
  }

  /** Get all active users in a workspace */
  async getWorkspaceActiveUsers(workspaceId: string): Promise<UserSession[]> {
    try {
      if (!this.redisClient) {
        return [];
      }

      const workspaceKey = `workspace:${workspaceId}:users`;
      const userIds = await this.redisClient.smembers(workspaceKey);

      const activeUsers: UserSession[] = [];

      for (const userId of userIds) {
        const presenceKey = `presence:${workspaceId}:${userId}`;
        const presenceData = await this.redisClient.get(presenceKey);

        if (presenceData) {
          const presence = JSON.parse(presenceData);

          // Create a UserSession object from presence data
          const userSession: UserSession = {
            userId: presence.userId,
            username: presence.username,
            workspaceId: presence.workspaceId,
            socketId: presence.socketIds[0] || '', // Use first socket ID
            joinedAt: new Date(presence.joinedAt),
            lastActivity: new Date(presence.lastActivity),
          };

          activeUsers.push(userSession);
        }
      }

      return activeUsers;
    } catch (error) {
      this.logger.error('Error getting workspace active users:', error);
      return [];
    }
  }

  /** Get workspace presence information */
  async getWorkspacePresence(workspaceId: string): Promise<WorkspacePresence> {
    try {
      const activeUsers = await this.getWorkspaceActiveUsers(workspaceId);

      return {
        workspaceId,
        activeUsers,
        totalUsers: activeUsers.length,
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error('Error getting workspace presence:', error);
      return {
        workspaceId,
        activeUsers: [],
        totalUsers: 0,
        lastUpdated: new Date(),
      };
    }
  }

  /** Check if user is active in workspace */
  async isUserActive(workspaceId: string, userId: string): Promise<boolean> {
    try {
      if (!this.redisClient) {
        return false;
      }

      const presenceKey = `presence:${workspaceId}:${userId}`;
      const exists = await this.redisClient.exists(presenceKey);
      return exists === 1;
    } catch (error) {
      this.logger.error('Error checking user activity:', error);
      return false;
    }
  }

  /** Get user session by socket ID */
  async getUserSession(socketId: string): Promise<UserSession | null> {
    try {
      if (!this.redisClient) {
        return null;
      }

      const sessionKey = `session:${socketId}`;
      const sessionData = await this.redisClient.get(sessionKey);

      if (!sessionData) {
        return null;
      }

      return JSON.parse(sessionData) as UserSession;
    } catch (error) {
      this.logger.error('Error getting user session:', error);
      return null;
    }
  }

  /** Clean up expired sessions and presence data */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      if (!this.redisClient) {
        return;
      }

      // This would typically be called by a scheduled job
      // For now, we rely on Redis TTL for automatic cleanup
      this.logger.debug('Session cleanup completed (TTL-based)');
    } catch (error) {
      this.logger.error('Error during session cleanup:', error);
    }
  }

  /** Get total number of active users across all workspaces */
  async getTotalActiveUsers(): Promise<number> {
    try {
      if (!this.redisClient) {
        return 0;
      }

      const sessionKeys = await this.redisClient.keys('session:*');
      return sessionKeys.length;
    } catch (error) {
      this.logger.error('Error getting total active users:', error);
      return 0;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        this.logger.log('PresenceService Redis connection closed');
      }
    } catch (error) {
      this.logger.error('Error closing PresenceService Redis connection:', error);
    }
  }
}

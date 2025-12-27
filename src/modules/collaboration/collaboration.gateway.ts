import { Logger, OnModuleDestroy, UseFilters, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { Server, Socket } from 'socket.io';
import { createRedisConfig } from '../../config/redis.config';
import { WsAuthGuard } from './ws-auth.guard';
import { WsExceptionFilter } from './ws-exception.filter';

interface JoinWorkspaceDto {
  workspaceId: string;
}

interface FileChangeEvent {
  workspaceId: string;
  projectId: string;
  filePath: string;
  changes: any;
  userId: string;
  timestamp: Date;
}

interface CursorUpdateEvent {
  workspaceId: string;
  projectId: string;
  userId: string;
  position: {
    line: number;
    column: number;
  };
  timestamp: Date;
}

@UseFilters(WsExceptionFilter)
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class CollaborationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CollaborationGateway.name);
  private redisClient!: Redis;
  private redisSubscriber!: Redis;

  constructor(private readonly configService: ConfigService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.setupRedisAdapter(server);
  }

  private setupRedisAdapter(server: Server) {
    try {
      const redisConfig = createRedisConfig(this.configService);

      if (!redisConfig) {
        this.logger.log(
          'No Redis configuration provided - WebSocket running in single-instance mode',
        );
        return;
      }

      this.redisClient =
        typeof redisConfig === 'string' ? new Redis(redisConfig) : new Redis(redisConfig);
      this.redisSubscriber =
        typeof redisConfig === 'string' ? new Redis(redisConfig) : new Redis(redisConfig);

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis client error:', error.message);
        if (this.configService.get('nodeEnv') === 'development') {
          this.logger.warn(
            'Redis connection failed in development - WebSocket will work without scaling',
          );
        }
      });

      this.redisSubscriber.on('error', (error) => {
        this.logger.error('Redis subscriber error:', error.message);
        if (this.configService.get('nodeEnv') === 'development') {
          this.logger.warn(
            'Redis subscriber failed in development - WebSocket will work without scaling',
          );
        }
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis client connected');
      });

      this.redisSubscriber.on('connect', () => {
        this.logger.log('Redis subscriber connected');
      });

      this.redisClient.on('ready', () => {
        this.logger.log('Redis client ready');
      });

      this.redisSubscriber.on('ready', () => {
        this.logger.log('Redis subscriber ready');
      });

      this.redisClient
        .ping()
        .then(() => {
          const adapter = createAdapter(this.redisClient, this.redisSubscriber);
          server.adapter(adapter);
          this.logger.log('Redis adapter configured for WebSocket scaling');
        })
        .catch((error) => {
          this.logger.warn('Redis ping failed, continuing without Redis adapter:', error.message);
          if (this.configService.get('nodeEnv') === 'development') {
            this.logger.log('WebSocket will work in single-instance mode without Redis scaling');
          }
        });
    } catch (error) {
      this.logger.error('Failed to setup Redis adapter', error);
      if (this.configService.get('nodeEnv') === 'development') {
        this.logger.warn('Continuing without Redis adapter in development mode');
      }
    }
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Client connected: ${client.id}`);
      const userAgent = client.handshake.headers['user-agent'];
      this.logger.debug(`Connection details - ID: ${client.id}, User-Agent: ${userAgent}`);
    } catch (error) {
      this.logger.error('Error handling connection', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      this.logger.log(`Client disconnected: ${client.id}`);

      if (client.data.workspaceId && client.data.user) {
        await this.handleUserLeave(client);
      }
    } catch (error) {
      this.logger.error('Error handling disconnect', error);
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('join-workspace')
  async handleJoinWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinWorkspaceDto,
  ) {
    try {
      const { workspaceId } = data;
      const user = client.data.user;

      if (!user) {
        client.emit('error', { message: 'Authentication required' });
        return;
      }

      await client.join(`workspace:${workspaceId}`);
      client.data.workspaceId = workspaceId;

      client.to(`workspace:${workspaceId}`).emit('user-joined', {
        userId: user.sub,
        username: user.email,
        timestamp: new Date(),
      });

      client.emit('workspace-joined', {
        workspaceId,
        timestamp: new Date(),
      });

      this.logger.log(`User ${user.email} joined workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error('Error joining workspace', error);
      client.emit('error', { message: 'Failed to join workspace' });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('leave-workspace')
  async handleLeaveWorkspace(@ConnectedSocket() client: Socket) {
    await this.handleUserLeave(client);
  }

  private async handleUserLeave(client: Socket) {
    try {
      const workspaceId = client.data.workspaceId;
      const user = client.data.user;

      if (workspaceId && user) {
        await client.leave(`workspace:${workspaceId}`);

        client.to(`workspace:${workspaceId}`).emit('user-left', {
          userId: user.sub,
          username: user.email,
          timestamp: new Date(),
        });

        delete client.data.workspaceId;

        this.logger.log(`User ${user.email} left workspace ${workspaceId}`);
      }
    } catch (error) {
      this.logger.error('Error handling user leave', error);
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('file-change')
  async handleFileChange(@ConnectedSocket() client: Socket, @MessageBody() data: FileChangeEvent) {
    try {
      const user = client.data.user;
      const workspaceId = client.data.workspaceId;

      if (!workspaceId || workspaceId !== data.workspaceId) {
        client.emit('error', { message: 'Not joined to this workspace' });
        return;
      }

      client.to(`workspace:${workspaceId}`).emit('file-changed', {
        ...data,
        userId: user.sub,
        timestamp: new Date(),
      });

      this.logger.debug(`File change broadcasted in workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error('Error handling file change', error);
      client.emit('error', { message: 'Failed to broadcast file change' });
    }
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('cursor-update')
  async handleCursorUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: CursorUpdateEvent,
  ) {
    try {
      const user = client.data.user;
      const workspaceId = client.data.workspaceId;

      if (!workspaceId || workspaceId !== data.workspaceId) {
        client.emit('error', { message: 'Not joined to this workspace' });
        return;
      }

      client.to(`workspace:${workspaceId}`).emit('cursor-updated', {
        ...data,
        userId: user.sub,
        timestamp: new Date(),
      });

      this.logger.debug(`Cursor update broadcasted in workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error('Error handling cursor update', error);
      client.emit('error', { message: 'Failed to broadcast cursor update' });
    }
  }

  /** Broadcast file change event to workspace members */
  async broadcastFileChange(workspaceId: string, event: FileChangeEvent) {
    try {
      this.server.to(`workspace:${workspaceId}`).emit('file-changed', {
        ...event,
        timestamp: new Date(),
      });
      this.logger.debug(`File change broadcasted to workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error('Error broadcasting file change', error);
    }
  }

  /** Broadcast cursor update to workspace members */
  async broadcastCursorUpdate(workspaceId: string, event: CursorUpdateEvent) {
    try {
      this.server.to(`workspace:${workspaceId}`).emit('cursor-updated', {
        ...event,
        timestamp: new Date(),
      });
      this.logger.debug(`Cursor update broadcasted to workspace ${workspaceId}`);
    } catch (error) {
      this.logger.error('Error broadcasting cursor update', error);
    }
  }

  /** Get connected users count for a workspace */
  async getWorkspaceConnectedUsers(workspaceId: string): Promise<number> {
    try {
      const room = this.server.sockets.adapter.rooms.get(`workspace:${workspaceId}`);
      return room ? room.size : 0;
    } catch (error) {
      this.logger.error('Error getting workspace connected users', error);
      return 0;
    }
  }

  /** Cleanup Redis connections on module destroy */
  async onModuleDestroy() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        this.logger.log('Redis client connection closed');
      }
      if (this.redisSubscriber) {
        await this.redisSubscriber.quit();
        this.logger.log('Redis subscriber connection closed');
      }
    } catch (error) {
      this.logger.error('Error closing Redis connections', error);
    }
  }
}

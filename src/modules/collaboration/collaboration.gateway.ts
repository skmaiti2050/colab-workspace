import { Injectable, Logger, OnModuleDestroy, UseFilters, UseGuards } from '@nestjs/common';
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
import { JoinWorkspaceDto } from '../../dto';
import { WsAuthGuard } from './ws-auth.guard';
import { WsExceptionFilter } from './ws-exception.filter';

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

interface UserJoinEvent {
  workspaceId: string;
  userId: string;
  username: string;
  timestamp: Date;
}

interface UserLeaveEvent {
  workspaceId: string;
  userId: string;
  username: string;
  timestamp: Date;
}

interface CollaborationEvent {
  type: 'file-change' | 'cursor-update' | 'user-join' | 'user-leave';
  workspaceId: string;
  data: FileChangeEvent | CursorUpdateEvent | UserJoinEvent | UserLeaveEvent;
  timestamp: Date;
}

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);
  private redisPublisher!: Redis;
  private redisSubscriber!: Redis;
  private eventHandlers = new Map<string, Set<(event: CollaborationEvent) => void>>();

  constructor(private readonly configService: ConfigService) {}

  async initialize(): Promise<void> {
    try {
      const redisConfig = createRedisConfig(this.configService);

      if (!redisConfig || this.configService.get('nodeEnv') === 'test') {
        this.logger.log(
          'Redis disabled for test environment or no configuration - pub/sub disabled',
        );
        return;
      }

      this.redisPublisher =
        typeof redisConfig === 'string' ? new Redis(redisConfig) : new Redis(redisConfig);
      this.redisSubscriber =
        typeof redisConfig === 'string' ? new Redis(redisConfig) : new Redis(redisConfig);

      this.redisPublisher.on('error', (error) => {
        this.logger.error('Redis publisher error:', error.message);
      });

      this.redisSubscriber.on('error', (error) => {
        this.logger.error('Redis subscriber error:', error.message);
      });

      this.redisPublisher.on('connect', () => {
        this.logger.log('Redis publisher connected');
      });

      this.redisSubscriber.on('connect', () => {
        this.logger.log('Redis subscriber connected');
      });

      // Set up message handler for incoming events
      this.redisSubscriber.on('message', (channel: string, message: string) => {
        try {
          const event: CollaborationEvent = JSON.parse(message);
          this.handleIncomingEvent(channel, event);
        } catch (error) {
          this.logger.error('Error parsing Redis message:', error);
        }
      });

      this.logger.log('EventService initialized with Redis pub/sub');
    } catch (error) {
      this.logger.error('Failed to initialize EventService:', error);
    }
  }

  /** Publish event to Redis channel */
  async publishEvent(channel: string, event: CollaborationEvent): Promise<void> {
    try {
      if (!this.redisPublisher || this.configService.get('nodeEnv') === 'test') {
        this.logger.debug('Redis publisher not available or test mode - event not published');
        return;
      }

      await this.redisPublisher.publish(channel, JSON.stringify(event));
      this.logger.debug(`Event published to channel ${channel}:`, event.type);
    } catch (error) {
      this.logger.error('Error publishing event:', error);
    }
  }

  /** Subscribe to events on a channel */
  subscribeToEvents(channel: string, handler: (event: CollaborationEvent) => void): void {
    try {
      if (!this.redisSubscriber || this.configService.get('nodeEnv') === 'test') {
        this.logger.debug('Redis subscriber not available or test mode - subscription skipped');
        return;
      }

      if (!this.eventHandlers.has(channel)) {
        this.eventHandlers.set(channel, new Set());
        void this.redisSubscriber.subscribe(channel);
        this.logger.debug(`Subscribed to Redis channel: ${channel}`);
      }

      this.eventHandlers.get(channel)!.add(handler);
    } catch (error) {
      this.logger.error('Error subscribing to events:', error);
    }
  }

  /** Unsubscribe from events on a channel */
  unsubscribeFromEvents(channel: string, handler: (event: CollaborationEvent) => void): void {
    try {
      const handlers = this.eventHandlers.get(channel);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(channel);
          if (this.redisSubscriber) {
            void this.redisSubscriber.unsubscribe(channel);
            this.logger.debug(`Unsubscribed from Redis channel: ${channel}`);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error unsubscribing from events:', error);
    }
  }

  private handleIncomingEvent(channel: string, event: CollaborationEvent): void {
    const handlers = this.eventHandlers.get(channel);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          this.logger.error('Error in event handler:', error);
        }
      });
    }
  }

  async destroy(): Promise<void> {
    try {
      if (this.redisPublisher) {
        await this.redisPublisher.quit();
        this.logger.log('Redis publisher connection closed');
      }
      if (this.redisSubscriber) {
        await this.redisSubscriber.quit();
        this.logger.log('Redis subscriber connection closed');
      }
    } catch (error) {
      this.logger.error('Error closing Redis connections:', error);
    }
  }
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
  private eventService!: EventService;

  constructor(private readonly configService: ConfigService) {
    this.eventService = new EventService(configService);
  }

  async afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    await this.setupRedisAdapter(server);
    await this.setupEventSubscriptions();
  }

  private async setupRedisAdapter(server: Server) {
    try {
      const redisConfig = createRedisConfig(this.configService);

      if (!redisConfig || this.configService.get('nodeEnv') === 'test') {
        this.logger.log(
          'No Redis configuration or test environment - WebSocket running in single-instance mode',
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

  private async setupEventSubscriptions() {
    try {
      await this.eventService.initialize();

      // Subscribe to workspace events for cross-instance communication
      this.eventService.subscribeToEvents('workspace-events', (event: CollaborationEvent) => {
        this.handleCrossInstanceEvent(event);
      });

      this.logger.log('Event subscriptions configured');
    } catch (error) {
      this.logger.error('Failed to setup event subscriptions:', error);
    }
  }

  private handleCrossInstanceEvent(event: CollaborationEvent) {
    try {
      const { workspaceId } = event;

      switch (event.type) {
        case 'file-change':
          this.server.to(`workspace:${workspaceId}`).emit('file-changed', event.data);
          break;
        case 'cursor-update':
          this.server.to(`workspace:${workspaceId}`).emit('cursor-updated', event.data);
          break;
        case 'user-join':
          this.server.to(`workspace:${workspaceId}`).emit('user-joined', event.data);
          break;
        case 'user-leave':
          this.server.to(`workspace:${workspaceId}`).emit('user-left', event.data);
          break;
        default:
          this.logger.warn(`Unknown event type: ${String(event.type)}`);
      }

      this.logger.debug(
        `Cross-instance event handled: ${String(event.type)} for workspace ${workspaceId}`,
      );
    } catch (error) {
      this.logger.error('Error handling cross-instance event:', error);
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

      const joinEvent: UserJoinEvent = {
        workspaceId,
        userId: user.sub,
        username: user.email,
        timestamp: new Date(),
      };

      // Broadcast to local clients
      client.to(`workspace:${workspaceId}`).emit('user-joined', joinEvent);

      // Publish to Redis for cross-instance communication
      await this.eventService.publishEvent('workspace-events', {
        type: 'user-join',
        workspaceId,
        data: joinEvent,
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

        const leaveEvent: UserLeaveEvent = {
          workspaceId,
          userId: user.sub,
          username: user.email,
          timestamp: new Date(),
        };

        // Broadcast to local clients
        client.to(`workspace:${workspaceId}`).emit('user-left', leaveEvent);

        // Publish to Redis for cross-instance communication
        await this.eventService.publishEvent('workspace-events', {
          type: 'user-leave',
          workspaceId,
          data: leaveEvent,
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

      const fileChangeEvent: FileChangeEvent = {
        ...data,
        userId: user.sub,
        timestamp: new Date(),
      };

      // Broadcast to local clients (including sender for testing)
      this.server.to(`workspace:${workspaceId}`).emit('file-changed', fileChangeEvent);

      // Publish to Redis for cross-instance communication
      await this.eventService.publishEvent('workspace-events', {
        type: 'file-change',
        workspaceId,
        data: fileChangeEvent,
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

      const cursorUpdateEvent: CursorUpdateEvent = {
        ...data,
        userId: user.sub,
        timestamp: new Date(),
      };

      // Broadcast to local clients (including sender for testing)
      this.server.to(`workspace:${workspaceId}`).emit('cursor-updated', cursorUpdateEvent);

      // Publish to Redis for cross-instance communication
      await this.eventService.publishEvent('workspace-events', {
        type: 'cursor-update',
        workspaceId,
        data: cursorUpdateEvent,
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
      const fileChangeEvent: FileChangeEvent = {
        ...event,
        timestamp: new Date(),
      };

      // Broadcast to local clients
      this.server.to(`workspace:${workspaceId}`).emit('file-changed', fileChangeEvent);

      // Publish to Redis for cross-instance communication
      await this.eventService.publishEvent('workspace-events', {
        type: 'file-change',
        workspaceId,
        data: fileChangeEvent,
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
      const cursorUpdateEvent: CursorUpdateEvent = {
        ...event,
        timestamp: new Date(),
      };

      // Broadcast to local clients
      this.server.to(`workspace:${workspaceId}`).emit('cursor-updated', cursorUpdateEvent);

      // Publish to Redis for cross-instance communication
      await this.eventService.publishEvent('workspace-events', {
        type: 'cursor-update',
        workspaceId,
        data: cursorUpdateEvent,
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
      await this.eventService.destroy();

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

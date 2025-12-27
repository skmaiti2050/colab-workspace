import { ArgumentsHost, Catch, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
@Injectable()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    // Only log errors in non-test environments to reduce noise during testing
    if (this.configService.get('nodeEnv') !== 'test') {
      this.logger.error('WebSocket exception occurred', exception);
    }

    if (exception instanceof WsException) {
      client.emit('error', {
        message: exception.message,
        timestamp: new Date(),
      });
    } else if (exception instanceof Error) {
      client.emit('error', {
        message: 'Internal server error',
        timestamp: new Date(),
      });
    } else {
      client.emit('error', {
        message: 'Unknown error occurred',
        timestamp: new Date(),
      });
    }
  }
}

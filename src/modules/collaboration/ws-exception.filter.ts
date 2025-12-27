import { ArgumentsHost, Catch, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    this.logger.error('WebSocket exception occurred', exception);

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

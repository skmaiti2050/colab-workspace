import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../auth/auth.module';
import { CollaborationGateway, EventService } from './collaboration.gateway';
import { WsExceptionFilter } from './ws-exception.filter';

@Module({
  imports: [ConfigModule, JwtModule, AuthModule],
  providers: [CollaborationGateway, EventService, WsExceptionFilter],
  exports: [CollaborationGateway, EventService, WsExceptionFilter],
})
export class CollaborationModule {}

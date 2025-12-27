import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../../auth/auth.module';
import { CollaborationGateway, EventService } from './collaboration.gateway';
import { PresenceService } from './presence.service';
import { WsExceptionFilter } from './ws-exception.filter';

@Module({
  imports: [ConfigModule, JwtModule, AuthModule],
  providers: [CollaborationGateway, EventService, PresenceService, WsExceptionFilter],
  exports: [CollaborationGateway, EventService, PresenceService, WsExceptionFilter],
})
export class CollaborationModule {}

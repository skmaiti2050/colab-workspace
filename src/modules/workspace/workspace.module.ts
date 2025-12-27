import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { WorkspaceMember } from '../../entities/workspace-member.entity';
import { Workspace } from '../../entities/workspace.entity';
import { UserModule } from '../user/user.module';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [TypeOrmModule.forFeature([Workspace, WorkspaceMember, User]), UserModule],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaborationEvent } from '../../entities/collaboration-event.entity';
import { ProjectFile } from '../../entities/project-file.entity';
import { Project } from '../../entities/project.entity';
import { WorkspaceModule } from '../workspace/workspace.module';
import { CollaborationEventService } from './collaboration-event.service';
import { ProjectFileService } from './project-file.service';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project, ProjectFile, CollaborationEvent]), WorkspaceModule],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectFileService, CollaborationEventService],
  exports: [ProjectService, ProjectFileService, CollaborationEventService],
})
export class ProjectModule {}

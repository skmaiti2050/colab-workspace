import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../../entities/project.entity';
import { WorkspaceModule } from '../workspace/workspace.module';
import { ProjectService } from './project.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project]), WorkspaceModule],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}

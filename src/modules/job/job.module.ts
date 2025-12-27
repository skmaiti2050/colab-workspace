import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../../entities';
import { JOB_QUEUES, JobQueueConfig } from './job-queue.config';
import { JobQueueService } from './job-queue.service';
import { JobController } from './job.controller';
import { JobService } from './job.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    JobQueueConfig,
    BullModule.registerQueue(
      { name: JOB_QUEUES.CODE_EXECUTION },
      { name: JOB_QUEUES.FILE_PROCESSING },
      { name: JOB_QUEUES.WORKSPACE_EXPORT },
    ),
  ],
  controllers: [JobController],
  providers: [JobService, JobQueueService],
  exports: [JobService, JobQueueService],
})
export class JobModule {}

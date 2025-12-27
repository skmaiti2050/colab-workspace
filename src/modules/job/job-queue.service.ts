import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { JobType } from '../../entities';
import { JOB_QUEUES } from './job-queue.config';

export interface JobData {
  jobId: string;
  type: JobType;
  data: Record<string, any>;
  userId: string;
}

@Injectable()
export class JobQueueService {
  private readonly logger = new Logger(JobQueueService.name);

  constructor(
    @InjectQueue(JOB_QUEUES.CODE_EXECUTION)
    private readonly codeExecutionQueue: Queue<JobData>,
    @InjectQueue(JOB_QUEUES.FILE_PROCESSING)
    private readonly fileProcessingQueue: Queue<JobData>,
    @InjectQueue(JOB_QUEUES.WORKSPACE_EXPORT)
    private readonly workspaceExportQueue: Queue<JobData>,
  ) {}

  /** Add job to appropriate queue based on type */
  async addJob(jobData: JobData): Promise<void> {
    const { type, jobId } = jobData;

    try {
      let queueName: string;

      switch (type) {
        case JobType.CODE_EXECUTION:
          await this.codeExecutionQueue.add('execute-code', jobData, {
            jobId,
            priority: 1,
          });
          queueName = 'code execution';
          break;
        case JobType.FILE_PROCESSING:
          await this.fileProcessingQueue.add('process-file', jobData, {
            jobId,
            priority: 2,
          });
          queueName = 'file processing';
          break;
        case JobType.WORKSPACE_EXPORT:
          await this.workspaceExportQueue.add('export-workspace', jobData, {
            jobId,
            priority: 3,
          });
          queueName = 'workspace export';
          break;
        default:
          throw new Error(`Unknown job type: ${String(type)}`);
      }

      this.logger.log(`Job ${jobId} of type ${queueName} added to queue`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Failed to add job ${jobId} to queue (Redis may be unavailable): ${errorMessage}`,
      );
    }
  }

  /** Get queue statistics */
  async getQueueStats() {
    try {
      const [codeStats, fileStats, workspaceStats] = await Promise.all([
        this.getQueueCounts(this.codeExecutionQueue),
        this.getQueueCounts(this.fileProcessingQueue),
        this.getQueueCounts(this.workspaceExportQueue),
      ]);

      return {
        codeExecution: codeStats,
        fileProcessing: fileStats,
        workspaceExport: workspaceStats,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to get queue stats (Redis may be unavailable): ${errorMessage}`);
      // Return default stats when Redis is unavailable
      return {
        codeExecution: { waiting: 0, active: 0, completed: 0, failed: 0 },
        fileProcessing: { waiting: 0, active: 0, completed: 0, failed: 0 },
        workspaceExport: { waiting: 0, active: 0, completed: 0, failed: 0 },
      };
    }
  }

  private async getQueueCounts(queue: Queue) {
    try {
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to get queue counts: ${errorMessage}`);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      };
    }
  }
}

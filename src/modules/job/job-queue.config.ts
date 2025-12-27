import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const JobQueueConfig = BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    redis: {
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
      password: configService.get<string>('REDIS_PASSWORD'),
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
    },
    defaultJobOptions: {
      removeOnComplete: 100, // Keep last 100 completed jobs
      removeOnFail: 50, // Keep last 50 failed jobs
      attempts: 5, // Retry failed jobs up to 5 times (increased for better reliability)
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 second delay, exponentially increases
      },
      // Job timeout settings
      timeout: 600000, // 10 minutes default timeout
      // Delay before job processing starts (useful for rate limiting)
      delay: 0,
    },
    settings: {
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      maxStalledCount: 1, // Max number of times a job can be stalled before failing
    },
  }),
  inject: [ConfigService],
});

export const JOB_QUEUES = {
  CODE_EXECUTION: 'code-execution',
  FILE_PROCESSING: 'file-processing',
  WORKSPACE_EXPORT: 'workspace-export',
} as const;

// Job-specific configurations with different retry strategies
export const JOB_CONFIGS = {
  [JOB_QUEUES.CODE_EXECUTION]: {
    attempts: 3, // Code execution should fail fast
    backoff: {
      type: 'exponential' as const,
      delay: 1000, // Start with 1 second delay
    },
    timeout: 300000, // 5 minutes timeout for code execution
    priority: 1, // High priority
  },
  [JOB_QUEUES.FILE_PROCESSING]: {
    attempts: 5, // File processing can be retried more
    backoff: {
      type: 'exponential' as const,
      delay: 2000, // Start with 2 second delay
    },
    timeout: 600000, // 10 minutes timeout for file processing
    priority: 2, // Medium priority
  },
  [JOB_QUEUES.WORKSPACE_EXPORT]: {
    attempts: 3, // Workspace export should be reliable
    backoff: {
      type: 'exponential' as const,
      delay: 5000, // Start with 5 second delay (longer for large exports)
    },
    timeout: 1800000, // 30 minutes timeout for workspace export
    priority: 3, // Lower priority (can wait)
  },
} as const;

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
      attempts: 3, // Retry failed jobs up to 3 times
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2 second delay
      },
    },
  }),
  inject: [ConfigService],
});

export const JOB_QUEUES = {
  CODE_EXECUTION: 'code-execution',
  FILE_PROCESSING: 'file-processing',
  WORKSPACE_EXPORT: 'workspace-export',
} as const;

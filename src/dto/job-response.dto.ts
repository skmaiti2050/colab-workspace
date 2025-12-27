import { ApiProperty } from '@nestjs/swagger';
import { JobStatus, JobType } from '../entities';

export class JobResponseDto {
  @ApiProperty({
    description: 'Unique job identifier',
    example: '7c113159-72cd-498c-b46a-e8ff980bf1d6',
  })
  id!: string;

  @ApiProperty({
    description: 'Type of job',
    enum: JobType,
    example: JobType.CODE_EXECUTION,
  })
  type!: JobType;

  @ApiProperty({
    description: 'Current job status',
    enum: JobStatus,
    example: JobStatus.PENDING,
  })
  status!: JobStatus;

  @ApiProperty({
    description: 'Job input data',
    example: {
      code: 'console.log("Hello, World!");',
      language: 'javascript',
      timeout: 30000,
    },
  })
  data!: Record<string, any>;

  @ApiProperty({
    description: 'Job execution result',
    nullable: true,
    example: {
      output: 'Hello, World!',
      executionTime: 150,
    },
  })
  result!: Record<string, any> | null;

  @ApiProperty({
    description: 'Error message if job failed',
    nullable: true,
    example: null,
  })
  errorMessage!: string | null;

  @ApiProperty({
    description: 'User ID who created the job',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  createdBy!: string;

  @ApiProperty({
    description: 'Job creation timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Job completion timestamp',
    nullable: true,
    example: null,
  })
  completedAt!: Date | null;
}

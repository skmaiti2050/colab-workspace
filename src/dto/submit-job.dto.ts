import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject } from 'class-validator';
import { JobType } from '../entities';

export class SubmitJobDto {
  @ApiProperty({
    description: 'Type of job to execute',
    enum: JobType,
    example: JobType.CODE_EXECUTION,
  })
  @IsEnum(JobType)
  @IsNotEmpty()
  type!: JobType;

  @ApiProperty({
    description: 'Job data payload',
    example: {
      code: 'console.log("Hello, World!");',
      language: 'javascript',
      timeout: 30000,
    },
  })
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, any>;
}

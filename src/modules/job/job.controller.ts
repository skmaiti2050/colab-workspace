import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { User } from '../../auth/user.decorator';
import { JobResponseDto, SubmitJobDto } from '../../dto';
import { JwtPayload } from '../../interfaces/auth.interface';
import { JobQueueService } from './job-queue.service';
import { JobService } from './job.service';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly jobQueueService: JobQueueService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit a new job for processing' })
  @ApiResponse({
    status: 201,
    description: 'Job submitted successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid job data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitJob(
    @Body() submitJobDto: SubmitJobDto,
    @User() user: JwtPayload,
  ): Promise<JobResponseDto> {
    return this.jobService.submitJob(submitJobDto, user.sub);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get job queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getQueueStats() {
    return this.jobQueueService.getQueueStats();
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs for the current user' })
  @ApiResponse({
    status: 200,
    description: 'User jobs retrieved successfully',
    type: [JobResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserJobs(@User() user: JwtPayload): Promise<JobResponseDto[]> {
    return this.jobService.getUserJobs(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job status by ID' })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '7c113159-72cd-498c-b46a-e8ff980bf1d6',
  })
  @ApiResponse({
    status: 200,
    description: 'Job status retrieved successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getJobStatus(
    @Param('id') jobId: string,
    @User() user: JwtPayload,
  ): Promise<JobResponseDto> {
    return this.jobService.getJobStatus(jobId, user.sub);
  }

  @Get(':id/result')
  @ApiOperation({ summary: 'Get job result by ID' })
  @ApiParam({
    name: 'id',
    description: 'Job ID',
    example: '7c113159-72cd-498c-b46a-e8ff980bf1d6',
  })
  @ApiResponse({
    status: 200,
    description: 'Job result retrieved successfully',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job not found or not completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getJobResult(
    @Param('id') jobId: string,
    @User() user: JwtPayload,
  ): Promise<JobResponseDto> {
    return this.jobService.getJobResult(jobId, user.sub);
  }
}

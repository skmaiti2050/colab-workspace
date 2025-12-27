import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobResponseDto, SubmitJobDto } from '../../dto';
import { Job, JobStatus } from '../../entities';
import { JobQueueService } from './job-queue.service';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly jobQueueService: JobQueueService,
  ) {}

  /** Submit a new job for processing */
  async submitJob(submitJobDto: SubmitJobDto, userId: string): Promise<JobResponseDto> {
    const job = this.jobRepository.create({
      type: submitJobDto.type,
      data: submitJobDto.data,
      createdBy: userId,
      status: JobStatus.PENDING,
    });

    const savedJob = await this.jobRepository.save(job);

    // Add job to queue for processing
    await this.jobQueueService.addJob({
      jobId: savedJob.id,
      type: savedJob.type,
      data: savedJob.data,
      userId,
    });

    return this.mapToResponseDto(savedJob);
  }

  /** Get job status by ID */
  async getJobStatus(jobId: string, userId: string): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId, createdBy: userId },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    return this.mapToResponseDto(job);
  }

  /** Get job result by ID */
  async getJobResult(jobId: string, userId: string): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id: jobId, createdBy: userId },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (job.status !== JobStatus.COMPLETED && job.status !== JobStatus.FAILED) {
      throw new NotFoundException(`Job ${jobId} is not yet completed`);
    }

    return this.mapToResponseDto(job);
  }

  /** Get all jobs for a user */
  async getUserJobs(userId: string): Promise<JobResponseDto[]> {
    const jobs = await this.jobRepository.find({
      where: { createdBy: userId },
      order: { createdAt: 'DESC' },
    });

    return jobs.map((job) => this.mapToResponseDto(job));
  }

  /** Update job status (internal use by processors) */
  async updateJobStatus(
    jobId: string,
    status: JobStatus,
    result?: Record<string, any>,
    errorMessage?: string,
  ): Promise<void> {
    const updateData: Partial<Job> = {
      status,
      result: result || null,
      errorMessage: errorMessage || null,
    };

    if (status === JobStatus.COMPLETED || status === JobStatus.FAILED) {
      updateData.completedAt = new Date();
    }

    await this.jobRepository.update(jobId, updateData);
  }

  private mapToResponseDto(job: Job): JobResponseDto {
    return {
      id: job.id,
      type: job.type,
      status: job.status,
      data: job.data,
      result: job.result,
      errorMessage: job.errorMessage,
      createdBy: job.createdBy,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job, JobStatus, JobType } from '../../entities';
import { JobQueueService } from './job-queue.service';
import { JobService } from './job.service';

describe('JobService', () => {
  let service: JobService;

  const mockJobRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockJobQueueService = {
    addJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: getRepositoryToken(Job),
          useValue: mockJobRepository,
        },
        {
          provide: JobQueueService,
          useValue: mockJobQueueService,
        },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitJob', () => {
    it('should create and queue a job successfully', async () => {
      const submitJobDto = {
        type: JobType.CODE_EXECUTION,
        data: { code: 'console.log("test");', language: 'javascript' },
      };
      const userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      const mockJob = {
        id: '7c113159-72cd-498c-b46a-e8ff980bf1d6',
        type: JobType.CODE_EXECUTION,
        status: JobStatus.PENDING,
        data: submitJobDto.data,
        result: null,
        errorMessage: null,
        createdBy: userId,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        completedAt: null,
      };

      mockJobRepository.create.mockReturnValue(mockJob);
      mockJobRepository.save.mockResolvedValue(mockJob);
      mockJobQueueService.addJob.mockResolvedValue(undefined);

      const result = await service.submitJob(submitJobDto, userId);

      expect(mockJobRepository.create).toHaveBeenCalledWith({
        type: submitJobDto.type,
        data: submitJobDto.data,
        createdBy: userId,
        status: JobStatus.PENDING,
      });
      expect(mockJobRepository.save).toHaveBeenCalledWith(mockJob);
      expect(mockJobQueueService.addJob).toHaveBeenCalledWith({
        jobId: mockJob.id,
        type: mockJob.type,
        data: mockJob.data,
        userId,
      });
      expect(result).toEqual({
        id: mockJob.id,
        type: mockJob.type,
        status: mockJob.status,
        data: mockJob.data,
        result: mockJob.result,
        errorMessage: mockJob.errorMessage,
        createdBy: mockJob.createdBy,
        createdAt: mockJob.createdAt,
        completedAt: mockJob.completedAt,
      });
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for valid job ID', async () => {
      const jobId = '7c113159-72cd-498c-b46a-e8ff980bf1d6';
      const userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      const mockJob = {
        id: jobId,
        type: JobType.CODE_EXECUTION,
        status: JobStatus.PROCESSING,
        data: { code: 'console.log("test");' },
        result: null,
        errorMessage: null,
        createdBy: userId,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        completedAt: null,
      };

      mockJobRepository.findOne.mockResolvedValue(mockJob);

      const result = await service.getJobStatus(jobId, userId);

      expect(mockJobRepository.findOne).toHaveBeenCalledWith({
        where: { id: jobId, createdBy: userId },
      });
      expect(result.status).toBe(JobStatus.PROCESSING);
    });

    it('should throw NotFoundException for non-existent job', async () => {
      const jobId = 'non-existent-id';
      const userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      mockJobRepository.findOne.mockResolvedValue(null);

      await expect(service.getJobStatus(jobId, userId)).rejects.toThrow(
        `Job with ID ${jobId} not found`,
      );
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status with result', async () => {
      const jobId = '7c113159-72cd-498c-b46a-e8ff980bf1d6';
      const result = { output: 'Hello, World!' };

      mockJobRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateJobStatus(jobId, JobStatus.COMPLETED, result);

      expect(mockJobRepository.update).toHaveBeenCalledWith(jobId, {
        status: JobStatus.COMPLETED,
        result,
        errorMessage: null,
        completedAt: expect.any(Date),
      });
    });
  });
});

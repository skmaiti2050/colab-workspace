import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { JobStatus, JobType } from '../../../entities';
import { JobService } from '../job.service';
import { CodeExecutionProcessor } from './code-execution.processor';

describe('CodeExecutionProcessor', () => {
  let processor: CodeExecutionProcessor;
  let mockJobService: jest.Mocked<JobService>;

  beforeEach(async () => {
    const mockJobServiceValue = {
      updateJobStatus: jest.fn(),
    };

    // Mock the Logger to prevent error messages during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CodeExecutionProcessor,
        {
          provide: JobService,
          useValue: mockJobServiceValue,
        },
      ],
    }).compile();

    processor = module.get<CodeExecutionProcessor>(CodeExecutionProcessor);
    mockJobService = module.get(JobService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('handleCodeExecution', () => {
    it('should process JavaScript code execution successfully', async () => {
      const jobData = {
        jobId: 'success-job-id',
        type: JobType.CODE_EXECUTION,
        data: {
          code: 'console.log("Hello, World!");',
          language: 'javascript',
          timeout: 30000,
        },
        userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      };

      const mockJob = {
        data: jobData,
      } as Job<any>;

      mockJobService.updateJobStatus.mockResolvedValue();

      const result = await processor.handleCodeExecution(mockJob);

      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(
        jobData.jobId,
        JobStatus.PROCESSING,
      );
      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(
        jobData.jobId,
        JobStatus.COMPLETED,
        expect.objectContaining({
          output: expect.any(String),
          executionTime: expect.any(Number),
          exitCode: 0,
          memoryUsage: expect.any(Number),
        }),
      );
      expect(result.exitCode).toBe(0);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    it('should handle invalid code data', async () => {
      const jobData = {
        jobId: 'invalid-job-id',
        type: JobType.CODE_EXECUTION,
        data: {
          // Missing required fields
        },
        userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      };

      const mockJob = {
        data: jobData,
      } as Job<any>;

      mockJobService.updateJobStatus.mockResolvedValue();

      await expect(processor.handleCodeExecution(mockJob)).rejects.toThrow(
        'Invalid or missing code parameter',
      );

      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(
        jobData.jobId,
        JobStatus.PROCESSING,
      );
      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(
        jobData.jobId,
        JobStatus.FAILED,
        undefined,
        'Invalid or missing code parameter',
      );
    });

    it('should handle unsupported language', async () => {
      const jobData = {
        jobId: 'unsupported-job-id',
        type: JobType.CODE_EXECUTION,
        data: {
          code: 'print("Hello")',
          language: 'unsupported',
        },
        userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      };

      const mockJob = {
        data: jobData,
      } as Job<any>;

      mockJobService.updateJobStatus.mockResolvedValue();

      await expect(processor.handleCodeExecution(mockJob)).rejects.toThrow(
        'Unsupported language: unsupported',
      );
    });

    it('should prevent duplicate job processing (idempotency)', async () => {
      const jobData = {
        jobId: 'unique-job-id-for-idempotency-test',
        type: JobType.CODE_EXECUTION,
        data: {
          code: 'console.log("Hello, World!");',
          language: 'javascript',
        },
        userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      };

      const mockJob = {
        data: jobData,
      } as Job<any>;

      mockJobService.updateJobStatus.mockResolvedValue();

      // First execution should succeed
      await processor.handleCodeExecution(mockJob);

      // Second execution should fail due to idempotency check
      await expect(processor.handleCodeExecution(mockJob)).rejects.toThrow('Job already processed');
    });

    it('should handle Python code execution', async () => {
      const jobData = {
        jobId: 'python-job-id',
        type: JobType.CODE_EXECUTION,
        data: {
          code: 'print("Hello, Python!")',
          language: 'python',
        },
        userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      };

      const mockJob = {
        data: jobData,
      } as Job<any>;

      mockJobService.updateJobStatus.mockResolvedValue();

      const result = await processor.handleCodeExecution(mockJob);

      expect(result.exitCode).toBe(0);
      expect(result.output).toContain('Hello, Python!');
    });

    it('should handle code execution errors', async () => {
      const jobData = {
        jobId: 'error-job-id',
        type: JobType.CODE_EXECUTION,
        data: {
          code: 'throw new Error("Test error");',
          language: 'javascript',
        },
        userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      };

      const mockJob = {
        data: jobData,
      } as Job<any>;

      mockJobService.updateJobStatus.mockResolvedValue();

      await expect(processor.handleCodeExecution(mockJob)).rejects.toThrow();

      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(
        jobData.jobId,
        JobStatus.FAILED,
        undefined,
        expect.stringContaining('JavaScript execution error'),
      );
    });
  });
});

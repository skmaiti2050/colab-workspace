import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { JobStatus } from '../../../entities';
import { JobService } from '../job.service';
import { FileProcessingProcessor } from './file-processing.processor';

describe('FileProcessingProcessor', () => {
  let processor: FileProcessingProcessor;

  const mockJobService = {
    updateJobStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileProcessingProcessor,
        {
          provide: JobService,
          useValue: mockJobService,
        },
      ],
    }).compile();

    processor = module.get<FileProcessingProcessor>(FileProcessingProcessor);

    mockJobService.updateJobStatus.mockClear();

    // Clear mock implementation for tests that need real implementation
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handleFileProcessing', () => {
    const mockJob = {
      data: {
        jobId: 'job-1',
        userId: 'user-1',
        data: {
          fileId: 'file-1',
          operation: 'compress',
          options: { format: 'zip' },
        },
      },
    } as Job;

    it('should process file successfully', async () => {
      // Mock simulateFileProcessing method to avoid actual processing logic and delay
      jest.spyOn(processor as any, 'simulateFileProcessing').mockResolvedValue({
        fileId: 'file-1',
        operation: 'compress',
        result: { someResult: true },
        processingTime: 100,
        fileSize: 1000,
        metadata: { algorithm: 'test' },
      });

      const result = await processor.handleFileProcessing(mockJob);

      expect(result).toBeDefined();
      expect(result.fileId).toBe('file-1');
      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith('job-1', JobStatus.PROCESSING);
      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(
        'job-1',
        JobStatus.COMPLETED,
        expect.any(Object),
      );
    });

    it('should handle duplicate job processing', async () => {
      // Mock simulateFileProcessing method to avoid actual processing logic and delay
      jest.spyOn(processor as any, 'simulateFileProcessing').mockResolvedValue({
        fileId: 'file-1',
        operation: 'compress',
        result: { someResult: true },
        processingTime: 100,
        fileSize: 1000,
        metadata: { algorithm: 'test' },
      });

      // Process once
      await processor.handleFileProcessing(mockJob);

      // Process again, expect error due to idempotency check
      await expect(processor.handleFileProcessing(mockJob)).rejects.toThrow(
        'Job already processed',
      );

      // Ensure the second attempt fails and updates status
      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(
        'job-1',
        JobStatus.FAILED,
        undefined,
        'Job already processed',
      );
    });

    it('should handle processing error and preserve cause', async () => {
      jest.useFakeTimers();
      const error = new Error('Inner compression failed');

      // We spy on the internal method that does the work, so we can control failure
      // while still running the error wrapping logic in simulateFileProcessing
      jest.spyOn(processor as any, 'simulateCompression').mockRejectedValue(error);

      // Start the processing
      const promise = processor.handleFileProcessing(mockJob);

      // Attach the rejection handler BEFORE advancing timers to prevent unhandled rejection
      const assertion = expect(promise).rejects.toMatchObject({
        message: expect.stringContaining('File processing failed: Inner compression failed'),
        cause: error,
      });

      // Advance timers to get past the processing delay
      // The delay is between 1000ms and 4000ms for 'compress'
      await jest.advanceTimersByTimeAsync(10000);

      try {
        await assertion;

        expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(
          'job-1',
          JobStatus.FAILED,
          undefined,
          'File processing failed: Inner compression failed',
        );
      } finally {
        jest.useRealTimers();
      }
    });
  });
});

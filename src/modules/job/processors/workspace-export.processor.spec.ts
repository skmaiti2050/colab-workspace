import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import { JobStatus } from '../../../entities';
import { JobService } from '../job.service';
import { WorkspaceExportProcessor } from './workspace-export.processor';

describe('WorkspaceExportProcessor', () => {
  let processor: WorkspaceExportProcessor;
  let jobService: JobService;

  const mockJobService = {
    updateJobStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceExportProcessor,
        {
          provide: JobService,
          useValue: mockJobService,
        },
      ],
    }).compile();

    processor = module.get<WorkspaceExportProcessor>(WorkspaceExportProcessor);
    jobService = module.get<JobService>(JobService);

    mockJobService.updateJobStatus.mockClear();

    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('handleWorkspaceExport', () => {
    const mockJob = {
      data: {
        jobId: 'job-1',
        userId: 'user-1',
        data: {
          workspaceId: 'workspace-1',
          format: 'zip',
          includeHistory: true,
        },
      },
    } as Job;

    it('should process export successfully', async () => {
      // Mock simulateWorkspaceExport method to avoid actual processing logic and delay
      jest.spyOn(processor as any, 'simulateWorkspaceExport').mockResolvedValue({
        workspaceId: 'workspace-1',
        format: 'zip',
        exportUrl: 'http://test.com/export.zip',
        fileSize: 1000,
        exportTime: 100,
        includedProjects: 1,
      });

      const result = await processor.handleWorkspaceExport(mockJob);

      expect(result).toBeDefined();
      expect(result.workspaceId).toBe('workspace-1');
      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith('job-1', JobStatus.PROCESSING);
      expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(
        'job-1',
        JobStatus.COMPLETED,
        expect.any(Object),
      );
    });

    it('should handle duplicate job processing', async () => {
      // Mock simulateWorkspaceExport method to avoid actual processing logic and delay
      jest.spyOn(processor as any, 'simulateWorkspaceExport').mockResolvedValue({
        workspaceId: 'workspace-1',
        format: 'zip',
        exportUrl: 'http://test.com/export.zip',
        fileSize: 1000,
        exportTime: 100,
        includedProjects: 1,
      });

      // Process once
      await processor.handleWorkspaceExport(mockJob);

      // Process again, expect error due to idempotency check
      await expect(processor.handleWorkspaceExport(mockJob)).rejects.toThrow('Job already processed');

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
      const error = new Error('Inner export failed');

      // We spy on the internal method that does the work, so we can control failure
      // while still running the error wrapping logic in simulateWorkspaceExport
      jest.spyOn(processor as any, 'performExport').mockRejectedValue(error);

      // Start the processing
      const promise = processor.handleWorkspaceExport(mockJob);

      // Attach the rejection handler BEFORE advancing timers to prevent unhandled rejection
      const assertion = expect(promise).rejects.toMatchObject({
        message: expect.stringContaining('Workspace export failed: Inner export failed'),
        cause: error,
      });

      // Advance timers to get past the export delay (max 11000ms)
      await jest.advanceTimersByTimeAsync(20000);

      try {
        await assertion;

        expect(mockJobService.updateJobStatus).toHaveBeenCalledWith(
          'job-1',
          JobStatus.FAILED,
          undefined,
          'Workspace export failed: Inner export failed',
        );
      } finally {
        jest.useRealTimers();
      }
    });
  });
});

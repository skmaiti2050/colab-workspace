import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { JobStatus } from '../../../entities';
import { JobData } from '../job-queue.service';
import { JobService } from '../job.service';

export interface WorkspaceExportData {
  workspaceId: string;
  format: 'zip' | 'tar' | 'json';
  includeHistory?: boolean;
  includeMetadata?: boolean;
  projectIds?: string[];
}

export interface WorkspaceExportResult {
  workspaceId: string;
  format: string;
  exportUrl: string;
  fileSize: number;
  exportTime: number;
  includedProjects: number;
  metadata?: Record<string, any>;
}

@Processor('workspace-export')
export class WorkspaceExportProcessor {
  private readonly logger = new Logger(WorkspaceExportProcessor.name);
  private readonly processedJobs = new Set<string>(); // For idempotency tracking

  constructor(private readonly jobService: JobService) {}

  @Process('export-workspace')
  async handleWorkspaceExport(job: Job<JobData>): Promise<WorkspaceExportResult> {
    const { jobId, data, userId } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing workspace export job ${jobId} for user ${userId}`);

    try {
      // Check for idempotency - prevent duplicate processing
      if (this.processedJobs.has(jobId)) {
        this.logger.warn(`Job ${jobId} already processed, skipping duplicate execution`);
        throw new Error('Job already processed');
      }

      // Mark job as processing
      await this.jobService.updateJobStatus(jobId, JobStatus.PROCESSING);
      this.processedJobs.add(jobId);

      // Validate input data
      const exportData = this.validateWorkspaceExportData(data);

      // Export workspace with timeout (default 10 minutes, max 30 minutes)
      const timeout = 1800000; // 30 minutes max for workspace export
      const result = await this.exportWorkspaceWithTimeout(exportData, timeout);

      // Calculate export time
      const exportTime = Date.now() - startTime;
      const finalResult: WorkspaceExportResult = {
        ...result,
        exportTime,
      };

      // Update job status to completed
      await this.jobService.updateJobStatus(jobId, JobStatus.COMPLETED, finalResult);

      this.logger.log(`Workspace export job ${jobId} completed successfully in ${exportTime}ms`);
      return finalResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.logger.error(
        `Workspace export job ${jobId} failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Update job status to failed
      await this.jobService.updateJobStatus(jobId, JobStatus.FAILED, undefined, errorMessage);

      // Remove from processed jobs on failure to allow retry
      this.processedJobs.delete(jobId);

      throw error; // Re-throw to trigger BullMQ retry logic
    }
  }

  private validateWorkspaceExportData(data: Record<string, any>): WorkspaceExportData {
    if (!data.workspaceId || typeof data.workspaceId !== 'string') {
      throw new Error('Invalid or missing workspaceId parameter');
    }

    if (!data.format || typeof data.format !== 'string') {
      throw new Error('Invalid or missing format parameter');
    }

    const supportedFormats = ['zip', 'tar', 'json'];
    if (!supportedFormats.includes(data.format)) {
      throw new Error(
        `Unsupported format: ${data.format}. Supported: ${supportedFormats.join(', ')}`,
      );
    }

    return {
      workspaceId: data.workspaceId,
      format: data.format as 'zip' | 'tar' | 'json',
      includeHistory: data.includeHistory === true,
      includeMetadata: data.includeMetadata !== false, // Default to true
      projectIds: Array.isArray(data.projectIds) ? data.projectIds : undefined,
    };
  }

  private async exportWorkspaceWithTimeout(
    exportData: WorkspaceExportData,
    timeout: number,
  ): Promise<WorkspaceExportResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Workspace export timed out after ${timeout}ms`));
      }, timeout);

      this.simulateWorkspaceExport(exportData)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private async simulateWorkspaceExport(
    exportData: WorkspaceExportData,
  ): Promise<WorkspaceExportResult> {
    try {
      // Simulate export delay based on format and options
      const delay = this.getExportDelay(exportData);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Simulate workspace export process
      return this.performExport(exportData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed';

      throw new Error(`Workspace export failed: ${errorMessage}`);
    }
  }

  private getExportDelay(exportData: WorkspaceExportData): number {
    let baseDelay = 2000; // 2 seconds base

    // Add delay based on format
    const formatDelays = {
      zip: 3000,
      tar: 2500,
      json: 1000,
    };
    baseDelay += formatDelays[exportData.format];

    // Add delay for optional features
    if (exportData.includeHistory) {
      baseDelay += 2000;
    }
    if (exportData.includeMetadata) {
      baseDelay += 1000;
    }

    // Add random variation
    baseDelay += Math.random() * 3000;

    return baseDelay;
  }

  private async performExport(exportData: WorkspaceExportData): Promise<WorkspaceExportResult> {
    // Simulate project count (random between 1-20)
    const totalProjects = Math.floor(Math.random() * 20) + 1;
    const includedProjects = exportData.projectIds
      ? Math.min(exportData.projectIds.length, totalProjects)
      : totalProjects;

    // Calculate file size based on format and content
    let fileSize = includedProjects * (Math.random() * 5000000 + 1000000); // 1-5MB per project

    if (exportData.includeHistory) {
      fileSize *= 1.5; // 50% larger with history
    }
    if (exportData.includeMetadata) {
      fileSize *= 1.2; // 20% larger with metadata
    }

    // Format-specific adjustments
    switch (exportData.format) {
      case 'zip':
        fileSize *= 0.7; // Compression
        break;
      case 'tar':
        fileSize *= 0.8; // Some compression
        break;
      case 'json':
        fileSize *= 1.1; // JSON overhead
        break;
    }

    fileSize = Math.floor(fileSize);

    // Generate mock export URL
    const exportUrl = `https://exports.example.com/${exportData.workspaceId}/${Date.now()}.${exportData.format}`;

    const result: WorkspaceExportResult = {
      workspaceId: exportData.workspaceId,
      format: exportData.format,
      exportUrl,
      fileSize,
      exportTime: 0, // Will be set by caller
      includedProjects,
    };

    // Add metadata if requested
    if (exportData.includeMetadata) {
      result.metadata = {
        exportedAt: new Date().toISOString(),
        includeHistory: exportData.includeHistory,
        totalProjects,
        selectedProjects: exportData.projectIds?.length || totalProjects,
        compressionRatio:
          exportData.format === 'json' ? 1 : exportData.format === 'zip' ? 0.7 : 0.8,
        estimatedDownloadTime: Math.ceil(fileSize / (1024 * 1024)), // Rough estimate in seconds for 1MB/s
      };
    }

    return result;
  }
}

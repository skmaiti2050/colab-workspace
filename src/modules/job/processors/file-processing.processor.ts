import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { JobStatus } from '../../../entities';
import { JobData } from '../job-queue.service';
import { JobService } from '../job.service';

export interface FileProcessingData {
  fileId: string;
  operation: 'compress' | 'convert' | 'analyze' | 'validate';
  options?: Record<string, any>;
}

export interface FileProcessingResult {
  fileId: string;
  operation: string;
  result: Record<string, any>;
  processingTime: number;
  fileSize?: number;
  metadata?: Record<string, any>;
}

@Processor('file-processing')
export class FileProcessingProcessor {
  private readonly logger = new Logger(FileProcessingProcessor.name);
  private readonly processedJobs = new Set<string>(); // For idempotency tracking

  constructor(private readonly jobService: JobService) {}

  @Process('process-file')
  async handleFileProcessing(job: Job<JobData>): Promise<FileProcessingResult> {
    const { jobId, data, userId } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing file processing job ${jobId} for user ${userId}`);

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
      const fileData = this.validateFileProcessingData(data);

      // Process file with timeout (default 2 minutes, max 10 minutes)
      const timeout = 600000; // 10 minutes max for file processing
      const result = await this.processFileWithTimeout(fileData, timeout);

      // Calculate processing time
      const processingTime = Date.now() - startTime;
      const finalResult: FileProcessingResult = {
        ...result,
        processingTime,
      };

      // Update job status to completed
      await this.jobService.updateJobStatus(jobId, JobStatus.COMPLETED, finalResult);

      this.logger.log(`File processing job ${jobId} completed successfully in ${processingTime}ms`);
      return finalResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.logger.error(
        `File processing job ${jobId} failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Update job status to failed
      await this.jobService.updateJobStatus(jobId, JobStatus.FAILED, undefined, errorMessage);

      // Remove from processed jobs on failure to allow retry
      this.processedJobs.delete(jobId);

      throw error; // Re-throw to trigger BullMQ retry logic
    }
  }

  private validateFileProcessingData(data: Record<string, any>): FileProcessingData {
    if (!data.fileId || typeof data.fileId !== 'string') {
      throw new Error('Invalid or missing fileId parameter');
    }

    if (!data.operation || typeof data.operation !== 'string') {
      throw new Error('Invalid or missing operation parameter');
    }

    const supportedOperations = ['compress', 'convert', 'analyze', 'validate'];
    if (!supportedOperations.includes(data.operation)) {
      throw new Error(
        `Unsupported operation: ${data.operation}. Supported: ${supportedOperations.join(', ')}`,
      );
    }

    return {
      fileId: data.fileId,
      operation: data.operation as 'compress' | 'convert' | 'analyze' | 'validate',
      options: data.options && typeof data.options === 'object' ? data.options : undefined,
    };
  }

  private async processFileWithTimeout(
    fileData: FileProcessingData,
    timeout: number,
  ): Promise<FileProcessingResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`File processing timed out after ${timeout}ms`));
      }, timeout);

      this.simulateFileProcessing(fileData)
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

  private async simulateFileProcessing(
    fileData: FileProcessingData,
  ): Promise<FileProcessingResult> {
    try {
      // Simulate processing delay based on operation type
      const delay = this.getProcessingDelay(fileData.operation);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Simulate different processing scenarios
      switch (fileData.operation) {
        case 'compress':
          return this.simulateCompression(fileData);
        case 'convert':
          return this.simulateConversion(fileData);
        case 'analyze':
          return this.simulateAnalysis(fileData);
        case 'validate':
          return this.simulateValidation(fileData);
        default:
          throw new Error(
            `Processing not implemented for operation: ${String(fileData.operation)}`,
          );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';

      throw new Error(`File processing failed: ${errorMessage}`);
    }
  }

  private getProcessingDelay(operation: string): number {
    const delays: Record<string, number> = {
      compress: Math.random() * 3000 + 1000, // 1-4 seconds
      convert: Math.random() * 5000 + 2000, // 2-7 seconds
      analyze: Math.random() * 4000 + 1500, // 1.5-5.5 seconds
      validate: Math.random() * 1000 + 500, // 0.5-1.5 seconds
    };
    return delays[operation] || 1000;
  }

  private async simulateCompression(fileData: FileProcessingData): Promise<FileProcessingResult> {
    const originalSize = Math.floor(Math.random() * 10000000) + 1000000; // 1-10MB
    const compressionRatio = 0.3 + Math.random() * 0.4; // 30-70% compression
    const compressedSize = Math.floor(originalSize * compressionRatio);

    return {
      fileId: fileData.fileId,
      operation: 'compress',
      result: {
        originalSize,
        compressedSize,
        compressionRatio: Math.round((1 - compressionRatio) * 100),
        format: fileData.options?.format || 'zip',
      },
      processingTime: 0, // Will be set by caller
      fileSize: compressedSize,
      metadata: {
        algorithm: 'deflate',
        level: fileData.options?.level || 6,
      },
    };
  }

  private async simulateConversion(fileData: FileProcessingData): Promise<FileProcessingResult> {
    const fromFormat = fileData.options?.from || 'pdf';
    const toFormat = fileData.options?.to || 'docx';
    const fileSize = Math.floor(Math.random() * 5000000) + 500000; // 0.5-5MB

    return {
      fileId: fileData.fileId,
      operation: 'convert',
      result: {
        fromFormat,
        toFormat,
        success: true,
        pages: Math.floor(Math.random() * 50) + 1,
      },
      processingTime: 0, // Will be set by caller
      fileSize,
      metadata: {
        quality: fileData.options?.quality || 'high',
        preserveFormatting: fileData.options?.preserveFormatting !== false,
      },
    };
  }

  private async simulateAnalysis(fileData: FileProcessingData): Promise<FileProcessingResult> {
    const fileSize = Math.floor(Math.random() * 20000000) + 1000000; // 1-20MB
    const analysisType = fileData.options?.type || 'content';

    const analysisResults = {
      content: {
        wordCount: Math.floor(Math.random() * 10000) + 100,
        characterCount: Math.floor(Math.random() * 50000) + 500,
        language: 'en',
        sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
      },
      security: {
        threats: Math.floor(Math.random() * 3),
        malwareScore: Math.random() * 100,
        safe: Math.random() > 0.1,
      },
      metadata: {
        format: 'detected',
        encoding: 'utf-8',
        created: new Date().toISOString(),
      },
    };

    return {
      fileId: fileData.fileId,
      operation: 'analyze',
      result:
        analysisResults[analysisType as keyof typeof analysisResults] || analysisResults.content,
      processingTime: 0, // Will be set by caller
      fileSize,
      metadata: {
        analysisType,
        confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      },
    };
  }

  private async simulateValidation(fileData: FileProcessingData): Promise<FileProcessingResult> {
    const fileSize = Math.floor(Math.random() * 1000000) + 100000; // 0.1-1MB
    const validationType = fileData.options?.type || 'format';
    const isValid = Math.random() > 0.2; // 80% chance of being valid

    const validationResults = {
      format: {
        valid: isValid,
        expectedFormat: fileData.options?.expectedFormat || 'json',
        actualFormat: isValid ? fileData.options?.expectedFormat || 'json' : 'unknown',
        errors: isValid ? [] : ['Invalid format structure'],
      },
      schema: {
        valid: isValid,
        schema: fileData.options?.schema || 'default',
        violations: isValid ? [] : ['Missing required field: name'],
      },
      integrity: {
        valid: isValid,
        checksum: 'abc123def456',
        corrupted: !isValid,
      },
    };

    return {
      fileId: fileData.fileId,
      operation: 'validate',
      result:
        validationResults[validationType as keyof typeof validationResults] ||
        validationResults.format,
      processingTime: 0, // Will be set by caller
      fileSize,
      metadata: {
        validationType,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

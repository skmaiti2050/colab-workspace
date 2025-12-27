import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { JobStatus } from '../../../entities';
import { JobData } from '../job-queue.service';
import { JobService } from '../job.service';

export interface CodeExecutionData {
  code: string;
  language: string;
  timeout?: number;
  environment?: Record<string, string>;
}

export interface CodeExecutionResult {
  output: string;
  error?: string;
  executionTime: number;
  exitCode: number;
  memoryUsage?: number;
}

@Processor('code-execution')
export class CodeExecutionProcessor {
  private readonly logger = new Logger(CodeExecutionProcessor.name);
  private readonly processedJobs = new Set<string>(); // For idempotency tracking

  constructor(private readonly jobService: JobService) {}

  @Process('execute-code')
  async handleCodeExecution(job: Job<JobData>): Promise<CodeExecutionResult> {
    const { jobId, data, userId } = job.data;
    const startTime = Date.now();

    this.logger.log(`Processing code execution job ${jobId} for user ${userId}`);

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
      const codeData = this.validateCodeExecutionData(data);

      // Set timeout (default 30 seconds, max 5 minutes)
      const timeout = Math.min(codeData.timeout || 30000, 300000);

      // Execute code with timeout and error handling
      const result = await this.executeCodeWithTimeout(codeData, timeout);

      // Calculate execution time
      const executionTime = Date.now() - startTime;
      const finalResult: CodeExecutionResult = {
        ...result,
        executionTime,
      };

      // Update job status to completed
      await this.jobService.updateJobStatus(jobId, JobStatus.COMPLETED, finalResult);

      this.logger.log(`Code execution job ${jobId} completed successfully in ${executionTime}ms`);
      return finalResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      this.logger.error(
        `Code execution job ${jobId} failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Update job status to failed
      await this.jobService.updateJobStatus(jobId, JobStatus.FAILED, undefined, errorMessage);

      // Remove from processed jobs on failure to allow retry
      this.processedJobs.delete(jobId);

      throw error; // Re-throw to trigger BullMQ retry logic
    }
  }

  private validateCodeExecutionData(data: Record<string, any>): CodeExecutionData {
    if (!data.code || typeof data.code !== 'string') {
      throw new Error('Invalid or missing code parameter');
    }

    if (!data.language || typeof data.language !== 'string') {
      throw new Error('Invalid or missing language parameter');
    }

    const supportedLanguages = ['javascript', 'python', 'bash', 'typescript'];
    if (!supportedLanguages.includes(data.language.toLowerCase())) {
      throw new Error(
        `Unsupported language: ${data.language}. Supported: ${supportedLanguages.join(', ')}`,
      );
    }

    return {
      code: data.code,
      language: data.language.toLowerCase(),
      timeout: data.timeout && typeof data.timeout === 'number' ? data.timeout : undefined,
      environment:
        data.environment && typeof data.environment === 'object' ? data.environment : undefined,
    };
  }

  private async executeCodeWithTimeout(
    codeData: CodeExecutionData,
    timeout: number,
  ): Promise<CodeExecutionResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Code execution timed out after ${timeout}ms`));
      }, timeout);

      // Simulate code execution (in a real implementation, this would use Docker containers or sandboxed environments)
      this.simulateCodeExecution(codeData)
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

  private async simulateCodeExecution(codeData: CodeExecutionData): Promise<CodeExecutionResult> {
    const startTime = Date.now();

    try {
      // Simulate different execution scenarios based on language
      switch (codeData.language) {
        case 'javascript':
          return this.simulateJavaScriptExecution(codeData);
        case 'python':
          return this.simulatePythonExecution(codeData);
        case 'bash':
          return this.simulateBashExecution(codeData);
        case 'typescript':
          return this.simulateTypeScriptExecution(codeData);
        default:
          throw new Error(`Execution not implemented for language: ${codeData.language}`);
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Execution failed';

      return {
        output: '',
        error: errorMessage,
        executionTime,
        exitCode: 1,
        memoryUsage: Math.floor(Math.random() * 50) + 10, // Simulated memory usage in MB
      };
    }
  }

  private async simulateJavaScriptExecution(
    codeData: CodeExecutionData,
  ): Promise<CodeExecutionResult> {
    const startTime = Date.now();

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));

    // Simulate different outcomes based on code content
    if (codeData.code.includes('throw')) {
      throw new Error('JavaScript execution error: Uncaught exception');
    }

    if (codeData.code.includes('console.log')) {
      const match = codeData.code.match(/console\.log\(['"`]([^'"`]*)['"`]\)/);
      const output = match ? match[1] : 'Hello, World!';

      return {
        output,
        executionTime: Date.now() - startTime,
        exitCode: 0,
        memoryUsage: Math.floor(Math.random() * 30) + 10,
      };
    }

    return {
      output: 'Code executed successfully',
      executionTime: Date.now() - startTime,
      exitCode: 0,
      memoryUsage: Math.floor(Math.random() * 25) + 8,
    };
  }

  private async simulatePythonExecution(codeData: CodeExecutionData): Promise<CodeExecutionResult> {
    const startTime = Date.now();

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1500 + 800));

    if (codeData.code.includes('raise')) {
      throw new Error('Python execution error: Exception raised');
    }

    if (codeData.code.includes('print')) {
      const match = codeData.code.match(/print\(['"`]([^'"`]*)['"`]\)/);
      const output = match ? match[1] : 'Hello, Python!';

      return {
        output,
        executionTime: Date.now() - startTime,
        exitCode: 0,
        memoryUsage: Math.floor(Math.random() * 40) + 15,
      };
    }

    return {
      output: 'Python code executed successfully',
      executionTime: Date.now() - startTime,
      exitCode: 0,
      memoryUsage: Math.floor(Math.random() * 35) + 12,
    };
  }

  private async simulateBashExecution(codeData: CodeExecutionData): Promise<CodeExecutionResult> {
    const startTime = Date.now();

    // Simulate execution delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 800 + 300));

    if (codeData.code.includes('exit 1')) {
      return {
        output: '',
        error: 'Command failed with exit code 1',
        executionTime: Date.now() - startTime,
        exitCode: 1,
        memoryUsage: Math.floor(Math.random() * 20) + 5,
      };
    }

    if (codeData.code.includes('echo')) {
      const match = codeData.code.match(/echo ['"`]([^'"`]*)['"`]/);
      const output = match ? match[1] : 'Hello, Bash!';

      return {
        output,
        executionTime: Date.now() - startTime,
        exitCode: 0,
        memoryUsage: Math.floor(Math.random() * 15) + 3,
      };
    }

    return {
      output: 'Bash script executed successfully',
      executionTime: Date.now() - startTime,
      exitCode: 0,
      memoryUsage: Math.floor(Math.random() * 18) + 4,
    };
  }

  private async simulateTypeScriptExecution(
    codeData: CodeExecutionData,
  ): Promise<CodeExecutionResult> {
    const startTime = Date.now();

    // Simulate compilation and execution delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000));

    if (codeData.code.includes('throw')) {
      throw new Error('TypeScript execution error: Compilation or runtime error');
    }

    if (codeData.code.includes('console.log')) {
      const match = codeData.code.match(/console\.log\(['"`]([^'"`]*)['"`]\)/);
      const output = match ? match[1] : 'Hello, TypeScript!';

      return {
        output,
        executionTime: Date.now() - startTime,
        exitCode: 0,
        memoryUsage: Math.floor(Math.random() * 45) + 20,
      };
    }

    return {
      output: 'TypeScript code compiled and executed successfully',
      executionTime: Date.now() - startTime,
      exitCode: 0,
      memoryUsage: Math.floor(Math.random() * 40) + 18,
    };
  }
}

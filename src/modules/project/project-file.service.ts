import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddFileDto } from '../../dto/add-file.dto';
import { ProjectFile } from '../../entities/project-file.entity';

/**
 * Service responsible for managing project files
 */
@Injectable()
export class ProjectFileService {
  constructor(
    @InjectRepository(ProjectFile)
    private readonly fileRepository: Repository<ProjectFile>,
  ) {}

  /**
   * Add or update a file in a project (upsert logic)
   */
  async addFile(projectId: string, fileData: AddFileDto, userId: string): Promise<ProjectFile> {
    const existingFile = await this.fileRepository.findOne({
      where: { projectId, filePath: fileData.path },
    });

    if (existingFile) {
      Object.assign(existingFile, {
        content: fileData.content,
        mimeType: fileData.mimeType,
        modifiedBy: userId,
        sizeBytes: Buffer.byteLength(fileData.content, 'utf8'),
      });
      return this.fileRepository.save(existingFile);
    } else {
      const newFile = this.fileRepository.create({
        projectId,
        filePath: fileData.path,
        content: fileData.content,
        mimeType: fileData.mimeType,
        createdBy: userId,
        modifiedBy: userId,
        sizeBytes: Buffer.byteLength(fileData.content, 'utf8'),
      });
      return this.fileRepository.save(newFile);
    }
  }

  /**
   * Get all files for a project with sorting
   */
  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    return this.fileRepository.find({
      where: { projectId },
      order: { filePath: 'ASC' },
    });
  }

  /**
   * Get a specific file by path
   */
  async getFile(projectId: string, filePath: string): Promise<ProjectFile | null> {
    return this.fileRepository.findOne({
      where: { projectId, filePath },
    });
  }

  /**
   * Delete a file from a project
   */
  async deleteFile(projectId: string, filePath: string): Promise<void> {
    const result = await this.fileRepository.delete({ projectId, filePath });

    if (result.affected === 0) {
      throw new NotFoundException(`File with path '${filePath}' not found in project ${projectId}`);
    }
  }

  /**
   * Check if a file exists in a project
   */
  async fileExists(projectId: string, filePath: string): Promise<boolean> {
    const count = await this.fileRepository.count({
      where: { projectId, filePath },
    });
    return count > 0;
  }

  /**
   * Get file count for a project
   */
  async getFileCount(projectId: string): Promise<number> {
    return this.fileRepository.count({
      where: { projectId },
    });
  }
}

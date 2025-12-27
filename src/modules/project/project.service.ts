import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddFileDto } from '../../dto/add-file.dto';
import { CreateProjectDto } from '../../dto/create-project.dto';
import { UpdateProjectDto } from '../../dto/update-project.dto';
import { Project } from '../../entities';
import { ProjectFile } from '../../entities/project-file.entity';
import { WorkspaceService } from '../workspace/workspace.service';
import { CollaborationEventService } from './collaboration-event.service';
import { ProjectFileService } from './project-file.service';

/**
 * Service responsible for managing projects within workspaces
 */
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly workspaceService: WorkspaceService,
    private readonly fileService: ProjectFileService,
    private readonly eventService: CollaborationEventService,
  ) {}

  /**
   * Create a new project within a workspace
   */
  async createProject(
    workspaceId: string,
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<Project> {
    await this.workspaceService.checkProjectModifyPermission(workspaceId, userId);

    const project = this.projectRepository.create({
      workspaceId,
      name: createProjectDto.name,
      description: createProjectDto.description,
      createdBy: userId,
      metadata: createProjectDto.metadata || {},
    });

    const savedProject = await this.projectRepository.save(project);

    await this.eventService.addEvent({
      projectId: savedProject.id,
      userId,
      action: 'create',
      resourceType: 'project',
      changes: {
        projectName: createProjectDto.name,
        description: createProjectDto.description,
        metadata: createProjectDto.metadata,
      },
    });

    return savedProject;
  }

  /**
   * Get project by ID with permission check
   */
  async getProject(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['workspace', 'creator'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    await this.workspaceService.checkWorkspaceAccess(project.workspaceId, userId);

    return project;
  }

  /**
   * Get all projects in a workspace
   */
  async getWorkspaceProjects(workspaceId: string, userId: string): Promise<Project[]> {
    await this.workspaceService.checkWorkspaceAccess(workspaceId, userId);

    return this.projectRepository.find({
      where: { workspaceId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update project (only owner and collaborators can update)
   */
  async updateProject(
    projectId: string,
    updateProjectDto: UpdateProjectDto,
    userId: string,
  ): Promise<Project> {
    const project = await this.getProject(projectId, userId);

    await this.workspaceService.checkProjectModifyPermission(project.workspaceId, userId);

    const oldData = {
      name: project.name,
      description: project.description,
      metadata: project.metadata,
    };

    Object.assign(project, updateProjectDto);
    const updatedProject = await this.projectRepository.save(project);

    await this.eventService.addEvent({
      projectId,
      userId,
      action: 'update',
      resourceType: 'project',
      changes: {
        old: oldData,
        new: updateProjectDto,
      },
    });

    return updatedProject;
  }

  /**
   * Delete project (only owner and collaborators can delete)
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    const project = await this.getProject(projectId, userId);

    await this.workspaceService.checkProjectModifyPermission(project.workspaceId, userId);

    await this.eventService.addEvent({
      projectId,
      userId,
      action: 'delete',
      resourceType: 'project',
      changes: {
        projectName: project.name,
        description: project.description,
      },
    });

    const result = await this.projectRepository.delete(projectId);
    if (result.affected === 0) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
  }

  /**
   * Add file to project using ProjectFileService
   */
  async addFile(projectId: string, fileData: AddFileDto, userId: string): Promise<Project> {
    await this.checkProjectModifyPermission(projectId, userId);

    const file = await this.fileService.addFile(projectId, fileData, userId);

    await this.eventService.addEvent({
      projectId,
      userId,
      action: 'create',
      resourceType: 'file',
      resourceId: file.filePath,
      changes: {
        file: {
          path: file.filePath,
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
        },
      },
    });

    return this.getProject(projectId, userId);
  }

  /**
   * Remove file from project using ProjectFileService
   */
  async removeFile(projectId: string, filePath: string, userId: string): Promise<Project> {
    await this.checkProjectModifyPermission(projectId, userId);

    const existingFile = await this.fileService.getFile(projectId, filePath);
    if (!existingFile) {
      throw new NotFoundException(`File with path '${filePath}' not found in project ${projectId}`);
    }

    await this.fileService.deleteFile(projectId, filePath);

    await this.eventService.addEvent({
      projectId,
      userId,
      action: 'delete',
      resourceType: 'file',
      resourceId: filePath,
      changes: {
        file: {
          path: filePath,
          mimeType: existingFile.mimeType,
          sizeBytes: existingFile.sizeBytes,
        },
      },
    });

    return this.getProject(projectId, userId);
  }

  /**
   * Get project files using ProjectFileService
   */
  async getProjectFiles(projectId: string, userId: string): Promise<ProjectFile[]> {
    await this.checkProjectViewPermission(projectId, userId);

    return this.fileService.getProjectFiles(projectId);
  }

  /**
   * Get specific file content using ProjectFileService
   */
  async getFile(projectId: string, filePath: string, userId: string): Promise<ProjectFile> {
    await this.checkProjectViewPermission(projectId, userId);

    const file = await this.fileService.getFile(projectId, filePath);

    if (!file) {
      throw new NotFoundException(`File with path '${filePath}' not found in project ${projectId}`);
    }

    return file;
  }

  /**
   * Update project metadata
   */
  async updateMetadata(
    projectId: string,
    metadata: Record<string, any>,
    userId: string,
  ): Promise<Project> {
    const project = await this.getProject(projectId, userId);

    await this.workspaceService.checkProjectModifyPermission(project.workspaceId, userId);

    const oldMetadata = { ...project.metadata };
    project.metadata = { ...project.metadata, ...metadata };

    const updatedProject = await this.projectRepository.save(project);

    await this.eventService.addEvent({
      projectId,
      userId,
      action: 'update',
      resourceType: 'metadata',
      changes: {
        metadataUpdate: {
          old: oldMetadata,
          new: project.metadata,
        },
      },
    });

    return updatedProject;
  }

  /**
   * Get collaboration history for a project using CollaborationEventService
   */
  async getCollaborationHistory(
    projectId: string,
    userId: string,
    page?: number,
    limit?: number,
  ): Promise<any> {
    await this.checkProjectViewPermission(projectId, userId);

    const historyResponse = await this.eventService.getProjectHistory(projectId, page, limit);

    return {
      history: historyResponse.events,
      total: historyResponse.total,
      page: historyResponse.page,
      limit: historyResponse.limit,
      totalPages: historyResponse.totalPages,
    };
  }

  /**
   * Get user activity across all projects using CollaborationEventService
   */
  async getUserActivity(userId: string, page?: number, limit?: number): Promise<any> {
    const activityResponse = await this.eventService.getUserActivity(userId, page, limit);

    return {
      activity: activityResponse.events,
      total: activityResponse.total,
      page: activityResponse.page,
      limit: activityResponse.limit,
      totalPages: activityResponse.totalPages,
    };
  }

  /**
   * Check if user can view project (any workspace member)
   */
  async checkProjectViewPermission(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    await this.workspaceService.checkWorkspaceAccess(project.workspaceId, userId);
  }

  /**
   * Check if user can modify project (owner or collaborator)
   */
  async checkProjectModifyPermission(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    await this.workspaceService.checkProjectModifyPermission(project.workspaceId, userId);
  }
}

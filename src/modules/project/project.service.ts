import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from '../../dto/create-project.dto';
import { UpdateProjectDto } from '../../dto/update-project.dto';
import { CollaborationEvent, Project, ProjectFile } from '../../entities/project.entity';
import { UserRole } from '../../entities/workspace-member.entity';
import { WorkspaceService } from '../workspace/workspace.service';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly workspaceService: WorkspaceService,
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
      files: [],
      collaborationHistory: [],
    });

    const savedProject = await this.projectRepository.save(project);

    await this.addCollaborationEvent(savedProject.id, {
      userId,
      action: 'create',
      timestamp: new Date(),
      changes: { projectName: createProjectDto.name },
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

    await this.addCollaborationEvent(projectId, {
      userId,
      action: 'update',
      timestamp: new Date(),
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

    const result = await this.projectRepository.delete(projectId);
    if (result.affected === 0) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
  }

  /**
   * Add file to project
   */
  async addFile(
    projectId: string,
    file: Omit<ProjectFile, 'lastModified' | 'modifiedBy'>,
    userId: string,
  ): Promise<Project> {
    const project = await this.getProject(projectId, userId);

    await this.workspaceService.checkProjectModifyPermission(project.workspaceId, userId);

    const existingFileIndex = project.files.findIndex((f) => f.path === file.path);

    const newFile: ProjectFile = {
      ...file,
      lastModified: new Date(),
      modifiedBy: userId,
    };

    if (existingFileIndex >= 0) {
      project.files[existingFileIndex] = newFile;
    } else {
      project.files.push(newFile);
    }

    const updatedProject = await this.projectRepository.save(project);

    await this.addCollaborationEvent(projectId, {
      userId,
      action: existingFileIndex >= 0 ? 'update' : 'create',
      timestamp: new Date(),
      changes: { file: newFile },
      filePath: file.path,
    });

    return updatedProject;
  }

  /**
   * Remove file from project
   */
  async removeFile(projectId: string, filePath: string, userId: string): Promise<Project> {
    const project = await this.getProject(projectId, userId);

    await this.workspaceService.checkProjectModifyPermission(project.workspaceId, userId);

    const fileIndex = project.files.findIndex((f) => f.path === filePath);
    if (fileIndex === -1) {
      throw new NotFoundException(`File ${filePath} not found in project`);
    }

    const removedFile = project.files[fileIndex];
    project.files.splice(fileIndex, 1);

    const updatedProject = await this.projectRepository.save(project);

    await this.addCollaborationEvent(projectId, {
      userId,
      action: 'delete',
      timestamp: new Date(),
      changes: { removedFile },
      filePath,
    });

    return updatedProject;
  }

  /**
   * Get project files
   */
  async getProjectFiles(projectId: string, userId: string): Promise<ProjectFile[]> {
    const project = await this.getProject(projectId, userId);
    return project.files;
  }

  /**
   * Get specific file content
   */
  async getFile(projectId: string, filePath: string, userId: string): Promise<ProjectFile> {
    const project = await this.getProject(projectId, userId);

    const file = project.files.find((f) => f.path === filePath);
    if (!file) {
      throw new NotFoundException(`File ${filePath} not found in project`);
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

    await this.addCollaborationEvent(projectId, {
      userId,
      action: 'update',
      timestamp: new Date(),
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
   * Get collaboration history for a project
   */
  async getCollaborationHistory(projectId: string, userId: string): Promise<CollaborationEvent[]> {
    const project = await this.getProject(projectId, userId);
    return project.collaborationHistory;
  }

  /**
   * Add collaboration event to project history
   */
  private async addCollaborationEvent(projectId: string, event: CollaborationEvent): Promise<void> {
    await this.projectRepository
      .createQueryBuilder()
      .update(Project)
      .set({
        collaborationHistory: () => `collaboration_history || '[${JSON.stringify(event)}]'::jsonb`,
      })
      .where('id = :projectId', { projectId })
      .execute();
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

  /**
   * Get user's role in project workspace
   */
  async getUserProjectRole(projectId: string, userId: string): Promise<UserRole | null> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      return null;
    }

    return this.workspaceService.getUserRole(project.workspaceId, userId);
  }
}

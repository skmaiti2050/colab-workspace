import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { User } from '../../auth/user.decorator';
import {
  AddFileDto,
  CreateProjectDto,
  ProjectCreatedDto,
  ProjectDeletedDto,
  ProjectDto,
  ProjectFileResponseDto,
  ProjectFilesDto,
  ProjectHistoryDto,
  ProjectListDto,
  ProjectUpdatedDto,
  UpdateMetadataDto,
  UpdateProjectDto,
} from '../../dto';
import { JwtPayload } from '../../interfaces/auth.interface';
import { ProjectService } from './project.service';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  /**
   * Create a new project in workspace
   */
  @Post('workspaces/:workspaceId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project in workspace' })
  @ApiParam({
    name: 'workspaceId',
    description: 'Workspace unique identifier',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @ApiBody({
    type: CreateProjectDto,
    description: 'Project creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    type: ProjectCreatedDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data - check project name length and description',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions to create project',
  })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async createProject(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() createProjectDto: CreateProjectDto,
    @User() user: JwtPayload,
  ): Promise<ProjectCreatedDto> {
    const project = await this.projectService.createProject(
      workspaceId,
      createProjectDto,
      user.sub,
    );

    return {
      message: 'Project created successfully',
      project,
    };
  }

  /**
   * Get all projects in workspace
   */
  @Get('workspaces/:workspaceId')
  @ApiOperation({ summary: 'Get all projects in workspace' })
  @ApiParam({
    name: 'workspaceId',
    description: 'Workspace unique identifier',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @ApiResponse({
    status: 200,
    description: 'Projects retrieved successfully',
    type: ProjectListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getWorkspaceProjects(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @User() user: JwtPayload,
  ): Promise<ProjectListDto> {
    const projects = await this.projectService.getWorkspaceProjects(workspaceId, user.sub);
    return { projects };
  }

  /**
   * Get project by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({
    name: 'id',
    description: 'Project unique identifier',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @ApiResponse({
    status: 200,
    description: 'Project retrieved successfully',
    type: ProjectDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this workspace' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getProject(
    @Param('id', ParseUUIDPipe) projectId: string,
    @User() user: JwtPayload,
  ): Promise<ProjectDto> {
    const project = await this.projectService.getProject(projectId, user.sub);
    return project;
  }

  /**
   * Update project
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update project (owner and collaborators only)' })
  @ApiParam({
    name: 'id',
    description: 'Project unique identifier',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @ApiBody({
    type: UpdateProjectDto,
    description: 'Project update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Project updated successfully',
    type: ProjectUpdatedDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data - check project name length and description',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions to modify project',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async updateProject(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @User() user: JwtPayload,
  ): Promise<ProjectUpdatedDto> {
    const project = await this.projectService.updateProject(projectId, updateProjectDto, user.sub);

    return {
      message: 'Project updated successfully',
      project,
    };
  }

  /**
   * Delete project
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete project (owner and collaborators only)' })
  @ApiParam({
    name: 'id',
    description: 'Project unique identifier',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @ApiResponse({
    status: 200,
    description: 'Project deleted successfully',
    type: ProjectDeletedDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions to delete project',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async deleteProject(
    @Param('id', ParseUUIDPipe) projectId: string,
    @User() user: JwtPayload,
  ): Promise<ProjectDeletedDto> {
    await this.projectService.deleteProject(projectId, user.sub);

    return {
      message: 'Project deleted successfully',
    };
  }

  /**
   * Get project files
   */
  @Get(':id/files')
  @ApiOperation({ summary: 'Get all files in project' })
  @ApiParam({
    name: 'id',
    description: 'Project unique identifier',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @ApiResponse({
    status: 200,
    description: 'Project files retrieved successfully',
    type: ProjectFilesDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getProjectFiles(
    @Param('id', ParseUUIDPipe) projectId: string,
    @User() user: JwtPayload,
  ): Promise<ProjectFilesDto> {
    const projectFiles = await this.projectService.getProjectFiles(projectId, user.sub);

    const files = projectFiles.map((f) => ({
      path: f.filePath,
      content: f.content,
      mimeType: f.mimeType || 'text/plain',
      lastModified: f.updatedAt,
      modifiedBy: f.modifiedBy,
    }));

    return { files };
  }

  /**
   * Add or update file in project
   */
  @Post(':id/files')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add or update file in project (owner and collaborators only)' })
  @ApiParam({
    name: 'id',
    description: 'Project unique identifier',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @ApiBody({
    type: AddFileDto,
    description: 'File data to add or update',
  })
  @ApiResponse({
    status: 201,
    description: 'File added/updated successfully',
    type: ProjectUpdatedDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data - check file path and content',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions to modify project',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async addFile(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() addFileDto: AddFileDto,
    @User() user: JwtPayload,
  ): Promise<ProjectUpdatedDto> {
    const project = await this.projectService.addFile(projectId, addFileDto, user.sub);

    return {
      message: 'File added/updated successfully',
      project,
    };
  }

  /**
   * Get specific file from project
   */
  @Get(':id/file')
  @ApiOperation({ summary: 'Get specific file from project' })
  @ApiParam({
    name: 'id',
    description: 'Project unique identifier',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @ApiQuery({
    name: 'path',
    description: 'File path within the project',
    example: 'src/components/Button.tsx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'File retrieved successfully',
    type: ProjectFileResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - missing file path parameter' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this project' })
  @ApiResponse({ status: 404, description: 'Project or file not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getFile(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Query('path') filePath: string,
    @User() user: JwtPayload,
  ): Promise<ProjectFileResponseDto> {
    if (!filePath) {
      throw new BadRequestException('File path is required');
    }

    const projectFile = await this.projectService.getFile(projectId, filePath, user.sub);

    const file = {
      path: projectFile.filePath,
      content: projectFile.content,
      mimeType: projectFile.mimeType || 'text/plain',
      lastModified: projectFile.updatedAt,
      modifiedBy: projectFile.modifiedBy,
    };

    return { file };
  }

  /**
   * Delete file from project
   */
  @Delete(':id/file')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete file from project (owner and collaborators only)' })
  @ApiParam({
    name: 'id',
    description: 'Project unique identifier',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @ApiQuery({
    name: 'path',
    description: 'File path within the project',
    example: 'src/components/Button.tsx',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    type: ProjectUpdatedDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - missing file path parameter' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions to modify project',
  })
  @ApiResponse({ status: 404, description: 'Project or file not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async removeFile(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Query('path') filePath: string,
    @User() user: JwtPayload,
  ): Promise<ProjectUpdatedDto> {
    if (!filePath) {
      throw new BadRequestException('File path is required');
    }

    const project = await this.projectService.removeFile(projectId, filePath, user.sub);

    return {
      message: 'File deleted successfully',
      project,
    };
  }

  /**
   * Update project metadata
   */
  @Patch(':id/metadata')
  @ApiOperation({ summary: 'Update project metadata (owner and collaborators only)' })
  @ApiParam({
    name: 'id',
    description: 'Project unique identifier',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @ApiBody({
    type: UpdateMetadataDto,
    description: 'Metadata to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Project metadata updated successfully',
    type: ProjectUpdatedDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data - check metadata format',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions to modify project',
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async updateMetadata(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Body() updateMetadataDto: UpdateMetadataDto,
    @User() user: JwtPayload,
  ): Promise<ProjectUpdatedDto> {
    const project = await this.projectService.updateMetadata(
      projectId,
      updateMetadataDto.metadata,
      user.sub,
    );

    return {
      message: 'Project metadata updated successfully',
      project,
    };
  }

  /**
   * Get project collaboration history
   */
  @Get(':id/history')
  @ApiOperation({ summary: 'Get project collaboration history' })
  @ApiParam({
    name: 'id',
    description: 'Project unique identifier',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number (1-based)',
    example: 1,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of events per page',
    example: 50,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Collaboration history retrieved successfully',
    type: ProjectHistoryDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this project' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getCollaborationHistory(
    @Param('id', ParseUUIDPipe) projectId: string,
    @User() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ProjectHistoryDto> {
    const result = await this.projectService.getCollaborationHistory(
      projectId,
      user.sub,
      page,
      limit,
    );

    return {
      history: result.history,
    };
  }
}

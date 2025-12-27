import { ApiProperty } from '@nestjs/swagger';

export class ProjectCreatorDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name!: string;
}

export class ProjectFileDto {
  @ApiProperty({
    description: 'File path within project',
    example: 'src/main.ts',
  })
  path!: string;

  @ApiProperty({
    description: 'File content',
    example: 'console.log("Hello World");',
  })
  content!: string;

  @ApiProperty({
    description: 'File MIME type',
    example: 'text/typescript',
  })
  mimeType!: string;

  @ApiProperty({
    description: 'Last modification timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  lastModified!: Date;

  @ApiProperty({
    description: 'User ID who last modified the file',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  modifiedBy!: string;
}

export class ProjectMetadataDto {
  @ApiProperty({
    description: 'Programming language',
    example: 'typescript',
    required: false,
  })
  language?: string;

  @ApiProperty({
    description: 'Framework used',
    example: 'nestjs',
    required: false,
  })
  framework?: string;

  @ApiProperty({
    description: 'Project dependencies',
    example: { '@nestjs/core': '^10.0.0', typescript: '^5.0.0' },
    required: false,
  })
  dependencies?: Record<string, string>;

  @ApiProperty({
    description: 'Project tags',
    example: ['backend', 'api', 'typescript'],
    required: false,
  })
  tags?: string[];
}

export class CollaborationEventDto {
  @ApiProperty({
    description: 'User ID who performed the action',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  userId!: string;

  @ApiProperty({
    description: 'Type of action performed',
    enum: ['create', 'update', 'delete', 'rename'],
    example: 'update',
  })
  action!: 'create' | 'update' | 'delete' | 'rename';

  @ApiProperty({
    description: 'Timestamp of the action',
    example: '2025-01-01T00:00:00.000Z',
  })
  timestamp!: Date;

  @ApiProperty({
    description: 'Changes made in the action',
    example: { fileName: 'main.ts', linesAdded: 5 },
  })
  changes!: any;

  @ApiProperty({
    description: 'File path affected (if applicable)',
    example: 'src/main.ts',
    required: false,
  })
  filePath?: string;
}

export class ProjectDto {
  @ApiProperty({
    description: 'Project unique identifier',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  id!: string;

  @ApiProperty({
    description: 'Workspace ID',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  workspaceId!: string;

  @ApiProperty({
    description: 'Project name',
    example: 'My API Project',
  })
  name!: string;

  @ApiProperty({
    description: 'Project description',
    example: 'A RESTful API for our application',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'User ID who created the project',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  createdBy!: string;

  @ApiProperty({
    description: 'Project files',
    type: [ProjectFileDto],
    required: false,
  })
  files?: ProjectFileDto[];

  @ApiProperty({
    description: 'Project metadata',
    type: ProjectMetadataDto,
    required: false,
  })
  metadata?: ProjectMetadataDto;

  @ApiProperty({
    description: 'Collaboration history',
    type: [CollaborationEventDto],
    required: false,
  })
  collaborationHistory?: CollaborationEventDto[];

  @ApiProperty({
    description: 'Project creation timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Project last update timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Project creator information',
    type: ProjectCreatorDto,
    required: false,
  })
  creator?: ProjectCreatorDto;
}

export class ProjectListDto {
  @ApiProperty({
    description: 'List of projects',
    type: [ProjectDto],
  })
  projects!: ProjectDto[];
}

export class ProjectCreatedDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Project created successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Created project information',
    type: ProjectDto,
  })
  project!: ProjectDto;
}

export class ProjectUpdatedDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Project updated successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Updated project information',
    type: ProjectDto,
  })
  project!: ProjectDto;
}

export class ProjectDeletedDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Project deleted successfully',
  })
  message!: string;
}

export class ProjectFilesDto {
  @ApiProperty({
    description: 'List of project files',
    type: [ProjectFileDto],
  })
  files!: ProjectFileDto[];
}

export class ProjectFileResponseDto {
  @ApiProperty({
    description: 'Project file information',
    type: ProjectFileDto,
  })
  file!: ProjectFileDto;
}

export class ProjectHistoryDto {
  @ApiProperty({
    description: 'Collaboration history',
    type: [CollaborationEventDto],
  })
  history!: CollaborationEventDto[];
}

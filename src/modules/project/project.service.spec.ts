import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddFileDto } from '../../dto/add-file.dto';
import { CreateProjectDto } from '../../dto/create-project.dto';
import { Project, ProjectFile } from '../../entities';
import { User } from '../../entities/user.entity';
import { UserRole, WorkspaceMember } from '../../entities/workspace-member.entity';
import { Workspace } from '../../entities/workspace.entity';
import { WorkspaceService } from '../workspace/workspace.service';
import { CollaborationEventService } from './collaboration-event.service';
import { ProjectFileService } from './project-file.service';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectRepository: jest.Mocked<Repository<Project>>;
  let workspaceService: jest.Mocked<WorkspaceService>;
  let fileService: jest.Mocked<ProjectFileService>;
  let eventService: jest.Mocked<CollaborationEventService>;

  const mockUser: User = {
    id: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
    email: 'john.doe@example.com',
    name: 'John Doe',
    passwordHash: 'hashedPassword',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
  };

  const mockWorkspace: Workspace = {
    id: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
    name: 'Test Workspace',
    description: 'Test Description',
    ownerId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    owner: mockUser,
    members: [],
    projects: [],
  };

  const mockMember: WorkspaceMember = {
    id: 'e7725f16-4cb2-465f-bc7a-309c76988aa0',
    workspaceId: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
    userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
    role: UserRole.OWNER,
    joinedAt: new Date('2025-01-01T00:00:00.000Z'),
    workspace: mockWorkspace,
    user: mockUser,
  };

  const mockProject: Project = {
    id: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
    workspaceId: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
    name: 'Test Project',
    description: 'Test Description',
    createdBy: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
    metadata: {},
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    workspace: mockWorkspace,
    creator: mockUser,
    projectFiles: [],
    events: [],
  };

  const mockFile: ProjectFile = {
    id: 'file-1',
    projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
    filePath: '/src/main.ts',
    content: 'console.log("Hello World");',
    mimeType: 'text/typescript',
    sizeBytes: 26,
    createdBy: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
    modifiedBy: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    project: {} as any,
    creator: {} as any,
    modifier: {} as any,
  };

  beforeEach(async () => {
    const mockProjectRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      })),
    };

    const mockWorkspaceService = {
      checkProjectModifyPermission: jest.fn(),
      checkWorkspaceAccess: jest.fn(),
      getUserRole: jest.fn(),
    };

    const mockFileService = {
      addFile: jest.fn(),
      getProjectFiles: jest.fn(),
      getFile: jest.fn(),
      deleteFile: jest.fn(),
      fileExists: jest.fn(),
      getFileCount: jest.fn(),
    };

    const mockEventService = {
      addEvent: jest.fn(),
      getProjectHistory: jest.fn(),
      getUserActivity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: mockProjectRepository,
        },
        {
          provide: WorkspaceService,
          useValue: mockWorkspaceService,
        },
        {
          provide: ProjectFileService,
          useValue: mockFileService,
        },
        {
          provide: CollaborationEventService,
          useValue: mockEventService,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    projectRepository = module.get(getRepositoryToken(Project));
    workspaceService = module.get(WorkspaceService);
    fileService = module.get(ProjectFileService);
    eventService = module.get(CollaborationEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProject', () => {
    it('should create a project with proper permissions', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Test Project',
        description: 'Test Description',
        metadata: { language: 'typescript' },
      };

      workspaceService.checkProjectModifyPermission.mockResolvedValue(undefined);
      projectRepository.create.mockReturnValue(mockProject);
      projectRepository.save.mockResolvedValue(mockProject);
      eventService.addEvent.mockResolvedValue({} as any);

      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      projectRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.createProject(
        '2204e384-f55a-49d8-920d-8fc9c8bb124f',
        createProjectDto,
        mockUser.id,
      );

      expect(workspaceService.checkProjectModifyPermission).toHaveBeenCalledWith(
        '2204e384-f55a-49d8-920d-8fc9c8bb124f',
        mockUser.id,
      );

      expect(projectRepository.create).toHaveBeenCalledWith({
        workspaceId: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
        name: 'Test Project',
        description: 'Test Description',
        createdBy: mockUser.id,
        metadata: { language: 'typescript' },
      });

      expect(eventService.addEvent).toHaveBeenCalledWith({
        projectId: mockProject.id,
        userId: mockUser.id,
        action: 'create',
        resourceType: 'project',
        changes: {
          projectName: createProjectDto.name,
          description: createProjectDto.description,
          metadata: createProjectDto.metadata,
        },
      });

      expect(result).toEqual(mockProject);
    });

    it('should throw ForbiddenException if user lacks permissions', async () => {
      const createProjectDto: CreateProjectDto = {
        name: 'Test Project',
      };

      workspaceService.checkProjectModifyPermission.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(
        service.createProject(
          '2204e384-f55a-49d8-920d-8fc9c8bb124f',
          createProjectDto,
          'other-user-id',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getProject', () => {
    it('should return project if user has access', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      workspaceService.checkWorkspaceAccess.mockResolvedValue(mockMember);

      const result = await service.getProject('fccbcd31-f0cb-433f-a308-71379cf865ac', mockUser.id);

      expect(workspaceService.checkWorkspaceAccess).toHaveBeenCalledWith(
        '2204e384-f55a-49d8-920d-8fc9c8bb124f',
        mockUser.id,
      );
      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      await expect(service.getProject('nonexistent-id', mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addFile', () => {
    it('should add file using ProjectFileService', async () => {
      const fileData: AddFileDto = {
        path: '/src/main.ts',
        content: 'console.log("Hello World");',
        mimeType: 'text/typescript',
      };

      workspaceService.checkProjectModifyPermission.mockResolvedValue(undefined);
      projectRepository.findOne.mockResolvedValue(mockProject);
      workspaceService.checkWorkspaceAccess.mockResolvedValue(mockMember);
      fileService.addFile.mockResolvedValue(mockFile);
      fileService.getProjectFiles.mockResolvedValue([mockFile]);
      eventService.addEvent.mockResolvedValue({} as any);

      const result = await service.addFile(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        fileData,
        mockUser.id,
      );

      expect(fileService.addFile).toHaveBeenCalledWith(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        fileData,
        mockUser.id,
      );

      expect(eventService.addEvent).toHaveBeenCalledWith({
        projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
        userId: mockUser.id,
        action: 'create',
        resourceType: 'file',
        resourceId: mockFile.filePath,
        changes: {
          file: {
            path: mockFile.filePath,
            mimeType: mockFile.mimeType,
            sizeBytes: mockFile.sizeBytes,
          },
        },
      });

      expect(result).toEqual(mockProject);
    });

    it('should throw ForbiddenException if user lacks permissions', async () => {
      const fileData: AddFileDto = {
        path: '/src/main.ts',
        content: 'console.log("Hello World");',
        mimeType: 'text/typescript',
      };

      projectRepository.findOne.mockResolvedValue(mockProject);
      workspaceService.checkProjectModifyPermission.mockRejectedValue(
        new ForbiddenException('Insufficient permissions'),
      );

      await expect(
        service.addFile('fccbcd31-f0cb-433f-a308-71379cf865ac', fileData, 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeFile', () => {
    it('should remove file using ProjectFileService', async () => {
      workspaceService.checkProjectModifyPermission.mockResolvedValue(undefined);
      projectRepository.findOne.mockResolvedValue(mockProject);
      workspaceService.checkWorkspaceAccess.mockResolvedValue(mockMember);
      fileService.getFile.mockResolvedValue(mockFile);
      fileService.deleteFile.mockResolvedValue(undefined);
      fileService.getProjectFiles.mockResolvedValue([]);
      eventService.addEvent.mockResolvedValue({} as any);

      const result = await service.removeFile(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        '/src/main.ts',
        mockUser.id,
      );

      expect(fileService.getFile).toHaveBeenCalledWith(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        '/src/main.ts',
      );
      expect(fileService.deleteFile).toHaveBeenCalledWith(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        '/src/main.ts',
      );

      expect(eventService.addEvent).toHaveBeenCalledWith({
        projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
        userId: mockUser.id,
        action: 'delete',
        resourceType: 'file',
        resourceId: '/src/main.ts',
        changes: {
          file: {
            path: '/src/main.ts',
            mimeType: mockFile.mimeType,
            sizeBytes: mockFile.sizeBytes,
          },
        },
      });

      expect(result).toEqual(mockProject);
    });

    it('should throw NotFoundException if file does not exist', async () => {
      workspaceService.checkProjectModifyPermission.mockResolvedValue(undefined);
      fileService.getFile.mockResolvedValue(null);

      await expect(
        service.removeFile('fccbcd31-f0cb-433f-a308-71379cf865ac', '/nonexistent.ts', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProjectFiles', () => {
    it('should return formatted project files', async () => {
      workspaceService.checkWorkspaceAccess.mockResolvedValue(mockMember);
      projectRepository.findOne.mockResolvedValue(mockProject);
      fileService.getProjectFiles.mockResolvedValue([mockFile]);

      const result = await service.getProjectFiles(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        mockUser.id,
      );

      expect(fileService.getProjectFiles).toHaveBeenCalledWith(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockFile);
    });
  });

  describe('getFile', () => {
    it('should return formatted file data', async () => {
      workspaceService.checkWorkspaceAccess.mockResolvedValue(mockMember);
      projectRepository.findOne.mockResolvedValue(mockProject);
      fileService.getFile.mockResolvedValue(mockFile);

      const result = await service.getFile(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        '/src/main.ts',
        mockUser.id,
      );

      expect(fileService.getFile).toHaveBeenCalledWith(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        '/src/main.ts',
      );
      expect(result).toEqual(mockFile);
    });

    it('should throw NotFoundException if file does not exist', async () => {
      workspaceService.checkWorkspaceAccess.mockResolvedValue(mockMember);
      projectRepository.findOne.mockResolvedValue(mockProject);
      fileService.getFile.mockResolvedValue(null);

      await expect(
        service.getFile('fccbcd31-f0cb-433f-a308-71379cf865ac', '/nonexistent.ts', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCollaborationHistory', () => {
    it('should return collaboration history using CollaborationEventService', async () => {
      const mockHistoryResponse = {
        events: [
          {
            userId: mockUser.id,
            action: 'create' as const,
            timestamp: new Date('2025-01-01T00:00:00.000Z'),
            changes: { file: { path: '/src/main.ts' } },
            filePath: '/src/main.ts',
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      workspaceService.checkWorkspaceAccess.mockResolvedValue(mockMember);
      projectRepository.findOne.mockResolvedValue(mockProject);
      eventService.getProjectHistory.mockResolvedValue(mockHistoryResponse);

      const result = await service.getCollaborationHistory(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        mockUser.id,
        1,
        50,
      );

      expect(eventService.getProjectHistory).toHaveBeenCalledWith(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        1,
        50,
      );
      expect(result).toEqual({
        history: mockHistoryResponse.events,
        total: mockHistoryResponse.total,
        page: mockHistoryResponse.page,
        limit: mockHistoryResponse.limit,
        totalPages: mockHistoryResponse.totalPages,
      });
    });
  });

  describe('getUserActivity', () => {
    it('should return user activity using CollaborationEventService', async () => {
      const mockActivityResponse = {
        events: [
          {
            userId: mockUser.id,
            action: 'create' as const,
            timestamp: new Date('2025-01-01T00:00:00.000Z'),
            changes: { file: { path: '/src/main.ts' } },
            filePath: '/src/main.ts',
          },
        ],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      };

      eventService.getUserActivity.mockResolvedValue(mockActivityResponse);

      const result = await service.getUserActivity(mockUser.id, 1, 50);

      expect(eventService.getUserActivity).toHaveBeenCalledWith(mockUser.id, 1, 50);
      expect(result).toEqual({
        activity: mockActivityResponse.events,
        total: mockActivityResponse.total,
        page: mockActivityResponse.page,
        limit: mockActivityResponse.limit,
        totalPages: mockActivityResponse.totalPages,
      });
    });
  });
});

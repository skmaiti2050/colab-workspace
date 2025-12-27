import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProjectDto } from '../../dto/create-project.dto';
import { Project, ProjectFile } from '../../entities/project.entity';
import { User } from '../../entities/user.entity';
import { UserRole, WorkspaceMember } from '../../entities/workspace-member.entity';
import { Workspace } from '../../entities/workspace.entity';
import { WorkspaceService } from '../workspace/workspace.service';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let projectRepository: jest.Mocked<Repository<Project>>;
  let workspaceService: jest.Mocked<WorkspaceService>;

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
    files: [],
    metadata: {},
    collaborationHistory: [],
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    workspace: mockWorkspace,
    creator: mockUser,
  };

  const mockFile: ProjectFile = {
    path: '/src/main.ts',
    content: 'console.log("Hello World");',
    mimeType: 'text/typescript',
    lastModified: new Date('2025-01-01T00:00:00.000Z'),
    modifiedBy: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
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
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    projectRepository = module.get(getRepositoryToken(Project));
    workspaceService = module.get(WorkspaceService);
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
        files: [],
        collaborationHistory: [],
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
    it('should add new file to project', async () => {
      const fileData = {
        path: '/src/main.ts',
        content: 'console.log("Hello World");',
        mimeType: 'text/typescript',
      };

      const projectWithFile = {
        ...mockProject,
        files: [mockFile],
      };

      projectRepository.findOne.mockResolvedValue(mockProject);
      workspaceService.checkWorkspaceAccess.mockResolvedValue(mockMember);
      workspaceService.checkProjectModifyPermission.mockResolvedValue(undefined);
      projectRepository.save.mockResolvedValue(projectWithFile);

      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      projectRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.addFile(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        fileData,
        mockUser.id,
      );

      expect(workspaceService.checkProjectModifyPermission).toHaveBeenCalledWith(
        '2204e384-f55a-49d8-920d-8fc9c8bb124f',
        mockUser.id,
      );
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe('/src/main.ts');
    });

    it('should update existing file in project', async () => {
      const fileData = {
        path: '/src/main.ts',
        content: 'console.log("Updated content");',
        mimeType: 'text/typescript',
      };

      const projectWithExistingFile = {
        ...mockProject,
        files: [mockFile],
      };

      projectRepository.findOne.mockResolvedValue(projectWithExistingFile);
      workspaceService.checkWorkspaceAccess.mockResolvedValue(mockMember);
      workspaceService.checkProjectModifyPermission.mockResolvedValue(undefined);
      projectRepository.save.mockResolvedValue(projectWithExistingFile);

      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      projectRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.addFile(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        fileData,
        mockUser.id,
      );

      expect(result.files).toHaveLength(1);
      expect(result.files[0].content).toBe('console.log("Updated content");');
    });
  });

  describe('removeFile', () => {
    it('should remove file from project', async () => {
      const projectWithFile = {
        ...mockProject,
        files: [mockFile],
      };

      const projectWithoutFile = {
        ...mockProject,
        files: [],
      };

      projectRepository.findOne.mockResolvedValue(projectWithFile);
      workspaceService.checkWorkspaceAccess.mockResolvedValue(mockMember);
      workspaceService.checkProjectModifyPermission.mockResolvedValue(undefined);
      projectRepository.save.mockResolvedValue(projectWithoutFile);

      const queryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      projectRepository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      const result = await service.removeFile(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        '/src/main.ts',
        mockUser.id,
      );

      expect(result.files).toHaveLength(0);
    });

    it('should throw NotFoundException if file does not exist', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      workspaceService.checkWorkspaceAccess.mockResolvedValue(mockMember);
      workspaceService.checkProjectModifyPermission.mockResolvedValue(undefined);

      await expect(
        service.removeFile('fccbcd31-f0cb-433f-a308-71379cf865ac', '/nonexistent.ts', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserProjectRole', () => {
    it('should return user role in project workspace', async () => {
      projectRepository.findOne.mockResolvedValue(mockProject);
      workspaceService.getUserRole.mockResolvedValue(UserRole.OWNER);

      const result = await service.getUserProjectRole(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        mockUser.id,
      );

      expect(workspaceService.getUserRole).toHaveBeenCalledWith(
        '2204e384-f55a-49d8-920d-8fc9c8bb124f',
        mockUser.id,
      );
      expect(result).toBe(UserRole.OWNER);
    });

    it('should return null if project does not exist', async () => {
      projectRepository.findOne.mockResolvedValue(null);

      const result = await service.getUserProjectRole('nonexistent-id', mockUser.id);

      expect(result).toBeNull();
    });
  });
});

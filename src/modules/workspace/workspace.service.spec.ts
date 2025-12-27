import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkspaceDto } from '../../dto/create-workspace.dto';
import { InviteUserDto } from '../../dto/invite-user.dto';
import { User } from '../../entities/user.entity';
import { UserRole, WorkspaceMember } from '../../entities/workspace-member.entity';
import { Workspace } from '../../entities/workspace.entity';
import { UserService } from '../user/user.service';
import { WorkspaceService } from './workspace.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let workspaceRepository: jest.Mocked<Repository<Workspace>>;
  let memberRepository: jest.Mocked<Repository<WorkspaceMember>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let userService: jest.Mocked<UserService>;

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

  beforeEach(async () => {
    const mockWorkspaceRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    const mockMemberRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };

    const mockUserRepository = {
      findOne: jest.fn(),
    };

    const mockUserService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        {
          provide: getRepositoryToken(Workspace),
          useValue: mockWorkspaceRepository,
        },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: mockMemberRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
    workspaceRepository = module.get(getRepositoryToken(Workspace));
    memberRepository = module.get(getRepositoryToken(WorkspaceMember));
    userRepository = module.get(getRepositoryToken(User));
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWorkspace', () => {
    it('should create a workspace and add owner as member', async () => {
      const createWorkspaceDto: CreateWorkspaceDto = {
        name: 'Test Workspace',
        description: 'Test Description',
      };

      userService.findOne.mockResolvedValue(mockUser);
      workspaceRepository.create.mockReturnValue(mockWorkspace);
      workspaceRepository.save.mockResolvedValue(mockWorkspace);
      memberRepository.create.mockReturnValue(mockMember);
      memberRepository.save.mockResolvedValue(mockMember);

      const result = await service.createWorkspace(createWorkspaceDto, mockUser.id);

      expect(userService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(workspaceRepository.create).toHaveBeenCalledWith({
        name: 'Test Workspace',
        description: 'Test Description',
        ownerId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      });
      expect(memberRepository.create).toHaveBeenCalledWith({
        workspaceId: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
        userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
        role: UserRole.OWNER,
      });
      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('getWorkspace', () => {
    it('should return workspace if user has access', async () => {
      memberRepository.findOne.mockResolvedValue(mockMember);
      workspaceRepository.findOne.mockResolvedValue(mockWorkspace);

      const result = await service.getWorkspace(
        '2204e384-f55a-49d8-920d-8fc9c8bb124f',
        mockUser.id,
      );

      expect(result).toEqual(mockWorkspace);
    });

    it('should throw ForbiddenException if user has no access', async () => {
      memberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getWorkspace('2204e384-f55a-49d8-920d-8fc9c8bb124f', 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('inviteUser', () => {
    it('should invite user with valid permissions', async () => {
      const inviteDto: InviteUserDto = {
        email: 'newuser@example.com',
        role: UserRole.COLLABORATOR,
      };

      const newUser: User = {
        ...mockUser,
        id: '7a456d6f-4cbc-42f1-9639-e63d289a514c',
        email: 'newuser@example.com',
        hashPassword: jest.fn(),
        comparePassword: jest.fn(),
      };

      memberRepository.findOne
        .mockResolvedValueOnce(mockMember) // inviter check
        .mockResolvedValueOnce(null); // existing member check
      userRepository.findOne.mockResolvedValue(newUser);
      memberRepository.create.mockReturnValue({
        ...mockMember,
        userId: '7a456d6f-4cbc-42f1-9639-e63d289a514c',
        role: UserRole.COLLABORATOR,
      });
      memberRepository.save.mockResolvedValue({
        ...mockMember,
        userId: '7a456d6f-4cbc-42f1-9639-e63d289a514c',
        role: UserRole.COLLABORATOR,
      });

      const result = await service.inviteUser(
        '2204e384-f55a-49d8-920d-8fc9c8bb124f',
        inviteDto,
        mockUser.id,
      );

      expect(result.role).toBe(UserRole.COLLABORATOR);
    });

    it('should throw ForbiddenException if viewer tries to invite', async () => {
      const inviteDto: InviteUserDto = {
        email: 'newuser@example.com',
        role: UserRole.COLLABORATOR,
      };

      memberRepository.findOne.mockResolvedValue({
        ...mockMember,
        role: UserRole.VIEWER,
      });

      await expect(
        service.inviteUser('2204e384-f55a-49d8-920d-8fc9c8bb124f', inviteDto, mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if user already member', async () => {
      const inviteDto: InviteUserDto = {
        email: 'existing@example.com',
        role: UserRole.COLLABORATOR,
      };

      memberRepository.findOne
        .mockResolvedValueOnce(mockMember) // inviter check
        .mockResolvedValueOnce(mockMember); // existing member check
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.inviteUser('2204e384-f55a-49d8-920d-8fc9c8bb124f', inviteDto, mockUser.id),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('checkWorkspaceOwnership', () => {
    it('should pass for workspace owner', async () => {
      workspaceRepository.findOne.mockResolvedValue(mockWorkspace);

      await expect(
        service.checkWorkspaceOwnership('2204e384-f55a-49d8-920d-8fc9c8bb124f', mockUser.id),
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException for non-owner', async () => {
      workspaceRepository.findOne.mockResolvedValue(mockWorkspace);

      await expect(
        service.checkWorkspaceOwnership('2204e384-f55a-49d8-920d-8fc9c8bb124f', 'other-user-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('checkProjectModifyPermission', () => {
    it('should allow owner to modify projects', async () => {
      memberRepository.findOne.mockResolvedValue(mockMember);

      await expect(
        service.checkProjectModifyPermission('2204e384-f55a-49d8-920d-8fc9c8bb124f', mockUser.id),
      ).resolves.not.toThrow();
    });

    it('should allow collaborator to modify projects', async () => {
      memberRepository.findOne.mockResolvedValue({
        ...mockMember,
        role: UserRole.COLLABORATOR,
      });

      await expect(
        service.checkProjectModifyPermission('2204e384-f55a-49d8-920d-8fc9c8bb124f', mockUser.id),
      ).resolves.not.toThrow();
    });

    it('should deny viewer from modifying projects', async () => {
      memberRepository.findOne.mockResolvedValue({
        ...mockMember,
        role: UserRole.VIEWER,
      });

      await expect(
        service.checkProjectModifyPermission('2204e384-f55a-49d8-920d-8fc9c8bb124f', mockUser.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

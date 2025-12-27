import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateCollaborationEventDto } from '../../dto';
import { CollaborationEvent } from '../../entities/collaboration-event.entity';
import { CollaborationEventService } from './collaboration-event.service';

describe('CollaborationEventService', () => {
  let service: CollaborationEventService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationEventService,
        {
          provide: getRepositoryToken(CollaborationEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CollaborationEventService>(CollaborationEventService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addEvent', () => {
    it('should create and save a collaboration event', async () => {
      const eventData: CreateCollaborationEventDto = {
        projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
        userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
        action: 'create',
        resourceType: 'file',
        resourceId: 'src/main.ts',
        changes: { fileName: 'main.ts' },
      };

      const mockEvent = { id: 'd7046133-cac4-4e83-9f34-f66f4277bdaf', ...eventData };
      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      const result = await service.addEvent(eventData);

      expect(mockRepository.create).toHaveBeenCalledWith(eventData);
      expect(mockRepository.save).toHaveBeenCalledWith(mockEvent);
      expect(result).toEqual(mockEvent);
    });
  });

  describe('getProjectHistory', () => {
    it('should return paginated project history', async () => {
      const projectId = 'fccbcd31-f0cb-433f-a308-71379cf865ac';
      const mockEvents = [
        {
          id: 'd7046133-cac4-4e83-9f34-f66f4277bdaf',
          projectId,
          userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
          action: 'create',
          createdAt: new Date(),
          changes: {},
          resourceId: 'file1.ts',
        },
        {
          id: 'b180239c-cc30-4d94-a00b-a955763e9285',
          projectId,
          userId: '7a456d6f-4cbc-42f1-9639-e63d289a514c',
          action: 'update',
          createdAt: new Date(),
          changes: {},
          resourceId: 'file2.ts',
        },
      ];

      mockRepository.findAndCount.mockResolvedValue([mockEvents, 2]);

      const result = await service.getProjectHistory(projectId, 1, 50);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { projectId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 50,
        relations: ['user'],
      });

      expect(result).toEqual({
        events: mockEvents.map((event) => ({
          userId: event.userId,
          action: event.action,
          timestamp: event.createdAt,
          changes: event.changes,
          filePath: event.resourceId,
        })),
        total: 2,
        page: 1,
        limit: 50,
        totalPages: 1,
      });
    });

    it('should handle pagination correctly', async () => {
      const projectId = 'fccbcd31-f0cb-433f-a308-71379cf865ac';
      mockRepository.findAndCount.mockResolvedValue([[], 150]);

      const result = await service.getProjectHistory(projectId, 2, 50);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { projectId },
        order: { createdAt: 'DESC' },
        skip: 50,
        take: 50,
        relations: ['user'],
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
      expect(result.totalPages).toBe(3);
    });

    it('should enforce minimum page and limit values', async () => {
      const projectId = 'fccbcd31-f0cb-433f-a308-71379cf865ac';
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getProjectHistory(projectId, 0, -5);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { projectId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 1,
        relations: ['user'],
      });
    });

    it('should cap limit at 100', async () => {
      const projectId = 'fccbcd31-f0cb-433f-a308-71379cf865ac';
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getProjectHistory(projectId, 1, 200);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { projectId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 100,
        relations: ['user'],
      });
    });
  });

  describe('getUserActivity', () => {
    it('should return paginated user activity', async () => {
      const userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      const mockEvents = [
        {
          id: 'd7046133-cac4-4e83-9f34-f66f4277bdaf',
          projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
          userId,
          action: 'create',
          createdAt: new Date(),
          changes: {},
          resourceId: 'file1.ts',
        },
      ];

      mockRepository.findAndCount.mockResolvedValue([mockEvents, 1]);

      const result = await service.getUserActivity(userId, 1, 50);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 50,
        relations: ['project'],
      });

      expect(result).toEqual({
        events: mockEvents.map((event) => ({
          userId: event.userId,
          action: event.action,
          timestamp: event.createdAt,
          changes: event.changes,
          filePath: event.resourceId,
        })),
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
      });
    });

    it('should handle pagination correctly for user activity', async () => {
      const userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      mockRepository.findAndCount.mockResolvedValue([[], 75]);

      const result = await service.getUserActivity(userId, 2, 25);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: 25,
        take: 25,
        relations: ['project'],
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(25);
      expect(result.totalPages).toBe(3);
    });
  });
});

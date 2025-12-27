import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddFileDto } from '../../dto/add-file.dto';
import { ProjectFile } from '../../entities/project-file.entity';
import { ProjectFileService } from './project-file.service';

describe('ProjectFileService', () => {
  let service: ProjectFileService;
  let repository: jest.Mocked<Repository<ProjectFile>>;

  const mockProjectFile: ProjectFile = {
    id: '6ff6ec44-1fc4-42d0-acc3-10a398a8ca12',
    projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
    filePath: 'src/test.ts',
    content: 'console.log("test");',
    mimeType: 'text/typescript',
    sizeBytes: 20,
    createdBy: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
    modifiedBy: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
    createdAt: new Date(),
    updatedAt: new Date(),
    project: {} as any,
    creator: {} as any,
    modifier: {} as any,
  };

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectFileService,
        {
          provide: getRepositoryToken(ProjectFile),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectFileService>(ProjectFileService);
    repository = module.get(getRepositoryToken(ProjectFile));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addFile', () => {
    const fileData: AddFileDto = {
      path: 'src/test.ts',
      content: 'console.log("test");',
      mimeType: 'text/typescript',
    };

    it('should create a new file when file does not exist', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockProjectFile);
      repository.save.mockResolvedValue(mockProjectFile);

      const result = await service.addFile(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        fileData,
        '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac', filePath: 'src/test.ts' },
      });
      expect(repository.create).toHaveBeenCalledWith({
        projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
        filePath: 'src/test.ts',
        content: 'console.log("test");',
        mimeType: 'text/typescript',
        createdBy: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
        modifiedBy: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
        sizeBytes: 20,
      });
      expect(result).toEqual(mockProjectFile);
    });

    it('should update existing file when file exists', async () => {
      const existingFile = { ...mockProjectFile };
      repository.findOne.mockResolvedValue(existingFile);
      repository.save.mockResolvedValue(existingFile);

      const result = await service.addFile(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        fileData,
        '7a456d6f-4cbc-42f1-9639-e63d289a514c',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac', filePath: 'src/test.ts' },
      });
      expect(existingFile.modifiedBy).toBe('7a456d6f-4cbc-42f1-9639-e63d289a514c');
      expect(existingFile.content).toBe('console.log("test");');
      expect(result).toEqual(existingFile);
    });
  });

  describe('getProjectFiles', () => {
    it('should return sorted files for a project', async () => {
      const files = [mockProjectFile];
      repository.find.mockResolvedValue(files);

      const result = await service.getProjectFiles('fccbcd31-f0cb-433f-a308-71379cf865ac');

      expect(repository.find).toHaveBeenCalledWith({
        where: { projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac' },
        order: { filePath: 'ASC' },
      });
      expect(result).toEqual(files);
    });
  });

  describe('getFile', () => {
    it('should return file when found', async () => {
      repository.findOne.mockResolvedValue(mockProjectFile);

      const result = await service.getFile('fccbcd31-f0cb-433f-a308-71379cf865ac', 'src/test.ts');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac', filePath: 'src/test.ts' },
      });
      expect(result).toEqual(mockProjectFile);
    });

    it('should return null when file not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getFile(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        'nonexistent.ts',
      );

      expect(result).toBeNull();
    });
  });

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      repository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.deleteFile('fccbcd31-f0cb-433f-a308-71379cf865ac', 'src/test.ts');

      expect(repository.delete).toHaveBeenCalledWith({
        projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
        filePath: 'src/test.ts',
      });
    });

    it('should throw NotFoundException when file not found', async () => {
      repository.delete.mockResolvedValue({ affected: 0, raw: {} });

      await expect(
        service.deleteFile('fccbcd31-f0cb-433f-a308-71379cf865ac', 'nonexistent.ts'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      repository.count.mockResolvedValue(1);

      const result = await service.fileExists(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        'src/test.ts',
      );

      expect(repository.count).toHaveBeenCalledWith({
        where: { projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac', filePath: 'src/test.ts' },
      });
      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      repository.count.mockResolvedValue(0);

      const result = await service.fileExists(
        'fccbcd31-f0cb-433f-a308-71379cf865ac',
        'nonexistent.ts',
      );

      expect(result).toBe(false);
    });
  });

  describe('getFileCount', () => {
    it('should return file count for project', async () => {
      repository.count.mockResolvedValue(5);

      const result = await service.getFileCount('fccbcd31-f0cb-433f-a308-71379cf865ac');

      expect(repository.count).toHaveBeenCalledWith({
        where: { projectId: 'fccbcd31-f0cb-433f-a308-71379cf865ac' },
      });
      expect(result).toBe(5);
    });
  });
});

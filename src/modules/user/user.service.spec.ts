import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../../dto/create-user.dto';
import { User } from '../../entities/user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<User>>;

  const mockUser: User = {
    id: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a user with hashed password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'plainPassword123',
        name: 'Test User',
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      repository.createQueryBuilder.mockReturnValue(queryBuilder as any);

      jest.spyOn(User, 'hashPassword').mockResolvedValue('hashedPassword123');

      repository.create.mockReturnValue(mockUser);
      repository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(User.hashPassword).toHaveBeenCalledWith('plainPassword123');

      expect(repository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashedPassword123',
      });

      expect(repository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'plainPassword123',
        name: 'Test User',
      };

      repository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('713df652-8eeb-4a41-9ec9-4fe03942b77b');

      expect(result).toEqual(mockUser);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '713df652-8eeb-4a41-9ec9-4fe03942b77b' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});

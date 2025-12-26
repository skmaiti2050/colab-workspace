import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UpdateUserDto } from '../../dto/update-user.dto';
import { User } from '../../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const isUnique = await this.isEmailUnique(createUserDto.email);
    if (!isUnique) {
      throw new ConflictException('Email address is already registered');
    }

    // Create user entity
    const user = this.userRepository.create({
      email: createUserDto.email.toLowerCase(),
      name: createUserDto.name,
      password: createUserDto.password, // Will be hashed by entity hook
    });

    return this.userRepository.save(user);
  }

  /**
   * Find all users
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * Find user by ID
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Find user by email (with password for authentication)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'name', 'passwordHash', 'createdAt', 'updatedAt'],
    });
  }

  /**
   * Update user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check email uniqueness if email is being updated
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const isUnique = await this.isEmailUnique(updateUserDto.email, id);
      if (!isUnique) {
        throw new ConflictException('Email address is already registered');
      }
      user.email = updateUserDto.email.toLowerCase();
    }

    // Update other fields
    if (updateUserDto.name) {
      user.name = updateUserDto.name;
    }

    return this.userRepository.save(user);
  }

  /**
   * Remove user
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  /**
   * Check if email is unique
   */
  async isEmailUnique(email: string, excludeUserId?: string): Promise<boolean> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email });

    if (excludeUserId) {
      query.andWhere('user.id != :excludeUserId', { excludeUserId });
    }

    const existingUser = await query.getOne();
    return !existingUser;
  }

  /**
   * Check if user exists by ID
   */
  async exists(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    return !!user;
  }

  /**
   * Check if user exists by email
   */
  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    return !!user;
  }
}

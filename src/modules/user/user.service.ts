import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../../dto/create-user.dto';
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
    const isUnique = await this.isEmailUnique(createUserDto.email);
    if (!isUnique) {
      throw new ConflictException('Email address is already registered');
    }

    const hashedPassword = await User.hashPassword(createUserDto.password);

    const user = this.userRepository.create({
      email: createUserDto.email.toLowerCase(),
      name: createUserDto.name,
      passwordHash: hashedPassword,
    });

    return this.userRepository.save(user);
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
   * Check if email is unique
   */
  async isEmailUnique(email: string): Promise<boolean> {
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    return !existingUser;
  }
}

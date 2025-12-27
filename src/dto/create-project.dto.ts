import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';
import { ProjectMetadata } from '../entities/project.entity';

export class CreateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'My Awesome Project',
    minLength: 2,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Project name is required' })
  @MinLength(2, { message: 'Project name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Project name cannot exceed 255 characters' })
  name!: string;

  @ApiProperty({
    description: 'Project description',
    example: 'A collaborative project for building amazing features',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    description: 'Project metadata as key-value pairs',
    example: { framework: 'React', language: 'TypeScript', version: '1.0.0' },
    required: false,
  })
  @IsOptional()
  metadata?: ProjectMetadata;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, MaxLength, MinLength } from 'class-validator';
import { ProjectMetadata } from '../entities/project.entity';

export class UpdateProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'Updated Project Name',
    required: false,
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @MinLength(2, { message: 'Project name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Project name cannot exceed 255 characters' })
  name?: string;

  @ApiProperty({
    description: 'Project description',
    example: 'Updated description for the project',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    description: 'Project metadata as key-value pairs',
    example: { framework: 'Vue', language: 'JavaScript', version: '2.0.0' },
    required: false,
  })
  @IsOptional()
  metadata?: ProjectMetadata;
}

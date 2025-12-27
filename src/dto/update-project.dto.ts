import { IsOptional, MaxLength, MinLength } from 'class-validator';
import { ProjectMetadata } from '../entities/project.entity';

export class UpdateProjectDto {
  @IsOptional()
  @MinLength(2, { message: 'Project name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Project name cannot exceed 255 characters' })
  name?: string;

  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @IsOptional()
  metadata?: ProjectMetadata;
}

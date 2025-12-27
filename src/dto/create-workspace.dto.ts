import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsNotEmpty({ message: 'Workspace name is required' })
  @MinLength(2, { message: 'Workspace name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Workspace name cannot exceed 255 characters' })
  name!: string;

  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;
}

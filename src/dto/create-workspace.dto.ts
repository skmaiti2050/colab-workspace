import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'Workspace name',
    example: 'My Development Team',
    minLength: 2,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Workspace name is required' })
  @MinLength(2, { message: 'Workspace name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Workspace name cannot exceed 255 characters' })
  name!: string;

  @ApiProperty({
    description: 'Workspace description',
    example: 'A collaborative workspace for our development team projects',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;
}

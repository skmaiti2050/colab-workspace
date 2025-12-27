import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateWorkspaceDto {
  @ApiProperty({
    description: 'Workspace name',
    example: 'Updated Team Name',
    required: false,
    minLength: 2,
    maxLength: 255,
  })
  @IsOptional()
  @MinLength(2, { message: 'Workspace name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Workspace name cannot exceed 255 characters' })
  name?: string;

  @ApiProperty({
    description: 'Workspace description',
    example: 'Updated description for our collaborative workspace',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;
}

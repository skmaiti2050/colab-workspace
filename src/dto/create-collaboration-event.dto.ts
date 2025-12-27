import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { CollaborationAction, ResourceType } from '../entities/collaboration-event.entity';

export class CreateCollaborationEventDto {
  @ApiProperty({
    description: 'Project ID where the event occurred',
    example: 'fccbcd31-f0cb-433f-a308-71379cf865ac',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    description: 'User ID who performed the action',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    description: 'Type of action performed',
    enum: ['create', 'update', 'delete', 'rename'],
    example: 'update',
  })
  @IsEnum(['create', 'update', 'delete', 'rename'])
  @IsNotEmpty()
  action!: CollaborationAction;

  @ApiProperty({
    description: 'Type of resource affected',
    enum: ['project', 'file', 'metadata'],
    example: 'file',
  })
  @IsEnum(['project', 'file', 'metadata'])
  @IsNotEmpty()
  resourceType!: ResourceType;

  @ApiProperty({
    description: 'Resource identifier (e.g., file path)',
    example: 'src/main.ts',
    required: false,
  })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiProperty({
    description: 'Specific changes made in the action',
    example: { fileName: 'main.ts', linesAdded: 5 },
    required: false,
  })
  @IsOptional()
  changes?: any;
}

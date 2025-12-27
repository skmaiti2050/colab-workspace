import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/workspace-member.entity';

export class WorkspaceOwnerDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  id!: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
  })
  email!: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
  })
  name!: string;
}

export class WorkspaceMemberDto {
  @ApiProperty({
    description: 'Member unique identifier',
    example: 'e7725f16-4cb2-465f-bc7a-309c76988aa0',
  })
  id!: string;

  @ApiProperty({
    description: 'Workspace ID',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  workspaceId!: string;

  @ApiProperty({
    description: 'User ID',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  userId!: string;

  @ApiProperty({
    description: 'User role in workspace',
    enum: UserRole,
    example: UserRole.COLLABORATOR,
  })
  role!: UserRole;

  @ApiProperty({
    description: 'Date when user joined workspace',
    example: '2025-01-01T00:00:00.000Z',
  })
  joinedAt!: Date;

  @ApiProperty({
    description: 'User information',
    type: WorkspaceOwnerDto,
  })
  user!: WorkspaceOwnerDto;
}

export class WorkspaceDto {
  @ApiProperty({
    description: 'Workspace unique identifier',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  id!: string;

  @ApiProperty({
    description: 'Workspace name',
    example: 'My Development Workspace',
  })
  name!: string;

  @ApiProperty({
    description: 'Workspace description',
    example: 'A collaborative workspace for our team projects',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Workspace owner ID',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  ownerId!: string;

  @ApiProperty({
    description: 'Workspace creation timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Workspace last update timestamp',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Workspace owner information',
    type: WorkspaceOwnerDto,
    required: false,
  })
  owner?: WorkspaceOwnerDto;

  @ApiProperty({
    description: 'Workspace members',
    type: [WorkspaceMemberDto],
    required: false,
  })
  members?: WorkspaceMemberDto[];
}

export class WorkspaceListDto {
  @ApiProperty({
    description: 'List of workspaces',
    type: [WorkspaceDto],
  })
  workspaces!: WorkspaceDto[];
}

export class WorkspaceMemberListDto {
  @ApiProperty({
    description: 'List of workspace members',
    type: [WorkspaceMemberDto],
  })
  members!: WorkspaceMemberDto[];
}

export class WorkspaceCreatedDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Workspace created successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Created workspace information',
    type: WorkspaceDto,
  })
  workspace!: WorkspaceDto;
}

export class WorkspaceUpdatedDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Workspace updated successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Updated workspace information',
    type: WorkspaceDto,
  })
  workspace!: WorkspaceDto;
}

export class WorkspaceDeletedDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Workspace deleted successfully',
  })
  message!: string;
}

export class UserInvitedDto {
  @ApiProperty({
    description: 'Success message',
    example: 'User invited successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Workspace member information',
    type: WorkspaceMemberDto,
  })
  member!: WorkspaceMemberDto;
}

export class UserRemovedDto {
  @ApiProperty({
    description: 'Success message',
    example: 'User removed from workspace successfully',
  })
  message!: string;
}

export class UserRoleUpdatedDto {
  @ApiProperty({
    description: 'Success message',
    example: 'User role updated successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Updated workspace member information',
    type: WorkspaceMemberDto,
  })
  member!: WorkspaceMemberDto;
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { User } from '../../auth/user.decorator';
import {
  CreateWorkspaceDto,
  InviteUserDto,
  UpdateRoleDto,
  UpdateWorkspaceDto,
  UserInvitedDto,
  UserRemovedDto,
  UserRoleUpdatedDto,
  WorkspaceCreatedDto,
  WorkspaceDeletedDto,
  WorkspaceDto,
  WorkspaceListDto,
  WorkspaceMemberListDto,
  WorkspaceUpdatedDto,
} from '../../dto';
import { JwtPayload } from '../../interfaces/auth.interface';
import { WorkspaceService } from './workspace.service';

@ApiTags('Workspaces')
@Controller('workspaces')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth()
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /**
   * Create a new workspace
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiBody({
    type: CreateWorkspaceDto,
    description: 'Workspace creation data',
  })
  @ApiResponse({
    status: 201,
    description: 'Workspace created successfully',
    type: WorkspaceCreatedDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data - check workspace name length and description',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async createWorkspace(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @User() user: JwtPayload,
  ): Promise<WorkspaceCreatedDto> {
    const workspace = await this.workspaceService.createWorkspace(createWorkspaceDto, user.sub);

    return {
      message: 'Workspace created successfully',
      workspace,
    };
  }

  /**
   * Get all workspaces for the current user
   */
  @Get()
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Workspaces retrieved successfully',
    type: WorkspaceListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getUserWorkspaces(@User() user: JwtPayload): Promise<WorkspaceListDto> {
    const workspaces = await this.workspaceService.getUserWorkspaces(user.sub);

    return { workspaces };
  }

  /**
   * Get workspace by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get workspace by ID' })
  @ApiParam({
    name: 'id',
    description: 'Workspace unique identifier',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace retrieved successfully',
    type: WorkspaceDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getWorkspace(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @User() user: JwtPayload,
  ): Promise<WorkspaceDto> {
    const workspace = await this.workspaceService.getWorkspace(workspaceId, user.sub);
    return workspace;
  }

  /**
   * Update workspace
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update workspace (owner only)' })
  @ApiParam({
    name: 'id',
    description: 'Workspace unique identifier',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @ApiBody({
    type: UpdateWorkspaceDto,
    description: 'Workspace update data',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace updated successfully',
    type: WorkspaceUpdatedDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data - check workspace name length and description',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - only workspace owner can update' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async updateWorkspace(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
    @User() user: JwtPayload,
  ): Promise<WorkspaceUpdatedDto> {
    const workspace = await this.workspaceService.updateWorkspace(
      workspaceId,
      updateWorkspaceDto,
      user.sub,
    );

    return {
      message: 'Workspace updated successfully',
      workspace,
    };
  }

  /**
   * Delete workspace
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete workspace (owner only)' })
  @ApiParam({
    name: 'id',
    description: 'Workspace unique identifier',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace deleted successfully',
    type: WorkspaceDeletedDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - only workspace owner can delete' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async deleteWorkspace(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @User() user: JwtPayload,
  ): Promise<WorkspaceDeletedDto> {
    await this.workspaceService.deleteWorkspace(workspaceId, user.sub);

    return {
      message: 'Workspace deleted successfully',
    };
  }

  /**
   * Get workspace members
   */
  @Get(':id/members')
  @ApiOperation({ summary: 'Get workspace members' })
  @ApiParam({
    name: 'id',
    description: 'Workspace unique identifier',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @ApiResponse({
    status: 200,
    description: 'Workspace members retrieved successfully',
    type: WorkspaceMemberListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - no access to this workspace' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getWorkspaceMembers(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @User() user: JwtPayload,
  ): Promise<WorkspaceMemberListDto> {
    const members = await this.workspaceService.getWorkspaceMembers(workspaceId, user.sub);

    return { members };
  }

  /**
   * Invite user to workspace
   */
  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invite user to workspace (owner and collaborators only)' })
  @ApiParam({
    name: 'id',
    description: 'Workspace unique identifier',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @ApiBody({
    type: InviteUserDto,
    description: 'User invitation data',
  })
  @ApiResponse({
    status: 201,
    description: 'User invited successfully',
    type: UserInvitedDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data - check email format and role',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only owners and collaborators can invite users',
  })
  @ApiResponse({ status: 404, description: 'Workspace or user not found' })
  @ApiResponse({ status: 409, description: 'User is already a member of this workspace' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async inviteUser(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Body() inviteUserDto: InviteUserDto,
    @User() user: JwtPayload,
  ): Promise<UserInvitedDto> {
    const member = await this.workspaceService.inviteUser(workspaceId, inviteUserDto, user.sub);

    return {
      message: 'User invited successfully',
      member,
    };
  }

  /**
   * Remove user from workspace
   */
  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove user from workspace (owner only)' })
  @ApiParam({
    name: 'id',
    description: 'Workspace unique identifier',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  @ApiResponse({
    status: 200,
    description: 'User removed from workspace successfully',
    type: UserRemovedDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - only workspace owner can remove users' })
  @ApiResponse({ status: 404, description: 'Workspace or user not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async removeUser(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @User() user: JwtPayload,
  ): Promise<UserRemovedDto> {
    await this.workspaceService.removeUser(workspaceId, userId, user.sub);

    return {
      message: 'User removed from workspace successfully',
    };
  }

  /**
   * Update user role in workspace
   */
  @Patch(':id/members/:userId/role')
  @ApiOperation({ summary: 'Update user role in workspace (owner only)' })
  @ApiParam({
    name: 'id',
    description: 'Workspace unique identifier',
    example: '2204e384-f55a-49d8-920d-8fc9c8bb124f',
  })
  @ApiParam({
    name: 'userId',
    description: 'User unique identifier',
    example: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
  })
  @ApiBody({
    type: UpdateRoleDto,
    description: 'Role update data',
  })
  @ApiResponse({
    status: 200,
    description: 'User role updated successfully',
    type: UserRoleUpdatedDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data - check role value',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 403, description: 'Forbidden - only workspace owner can update roles' })
  @ApiResponse({ status: 404, description: 'Workspace or user not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async updateUserRole(
    @Param('id', ParseUUIDPipe) workspaceId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @User() user: JwtPayload,
  ): Promise<UserRoleUpdatedDto> {
    const member = await this.workspaceService.updateUserRole(
      workspaceId,
      userId,
      updateRoleDto.role,
      user.sub,
    );

    return {
      message: 'User role updated successfully',
      member,
    };
  }
}

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWorkspaceDto } from '../../dto/create-workspace.dto';
import { InviteUserDto } from '../../dto/invite-user.dto';
import { UpdateWorkspaceDto } from '../../dto/update-workspace.dto';
import { User } from '../../entities/user.entity';
import { UserRole, WorkspaceMember } from '../../entities/workspace-member.entity';
import { Workspace } from '../../entities/workspace.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class WorkspaceService {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
  ) {}

  /**
   * Create a new workspace with the user as owner
   */
  async createWorkspace(
    createWorkspaceDto: CreateWorkspaceDto,
    userId: string,
  ): Promise<Workspace> {
    await this.userService.findOne(userId);

    const workspace = this.workspaceRepository.create({
      name: createWorkspaceDto.name,
      description: createWorkspaceDto.description,
      ownerId: userId,
    });

    const savedWorkspace = await this.workspaceRepository.save(workspace);

    const ownerMember = this.workspaceMemberRepository.create({
      workspaceId: savedWorkspace.id,
      userId: userId,
      role: UserRole.OWNER,
    });

    await this.workspaceMemberRepository.save(ownerMember);

    return savedWorkspace;
  }

  /**
   * Get workspace by ID with permission check
   */
  async getWorkspace(workspaceId: string, userId: string): Promise<Workspace> {
    await this.checkWorkspaceAccess(workspaceId, userId);

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['owner', 'members', 'members.user', 'projects'],
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    return workspace;
  }

  /**
   * Get all workspaces for a user
   */
  async getUserWorkspaces(userId: string): Promise<Workspace[]> {
    const memberWorkspaces = await this.workspaceMemberRepository.find({
      where: { userId },
      relations: ['workspace', 'workspace.owner'],
    });

    return memberWorkspaces.map((member) => member.workspace);
  }

  /**
   * Update workspace (only owner can update)
   */
  async updateWorkspace(
    workspaceId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
    userId: string,
  ): Promise<Workspace> {
    await this.checkWorkspaceOwnership(workspaceId, userId);

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    Object.assign(workspace, updateWorkspaceDto);
    return this.workspaceRepository.save(workspace);
  }

  /**
   * Delete workspace (only owner can delete)
   */
  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    await this.checkWorkspaceOwnership(workspaceId, userId);

    const result = await this.workspaceRepository.delete(workspaceId);
    if (result.affected === 0) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }
  }

  /**
   * Invite user to workspace (only owner and collaborators can invite)
   */
  async inviteUser(
    workspaceId: string,
    inviteUserDto: InviteUserDto,
    inviterId: string,
  ): Promise<WorkspaceMember> {
    const inviterMember = await this.getWorkspaceMember(workspaceId, inviterId);
    if (!inviterMember || inviterMember.role === UserRole.VIEWER) {
      throw new ForbiddenException('Only owners and collaborators can invite users');
    }

    if (inviteUserDto.role === UserRole.OWNER && inviterMember.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only owners can invite other owners');
    }

    const user = await this.userRepository.findOne({
      where: { email: inviteUserDto.email.toLowerCase() },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${inviteUserDto.email} not found`);
    }

    const existingMember = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId: user.id },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    const member = this.workspaceMemberRepository.create({
      workspaceId,
      userId: user.id,
      role: inviteUserDto.role,
    });

    return this.workspaceMemberRepository.save(member);
  }

  /**
   * Remove user from workspace (only owner can remove)
   */
  async removeUser(workspaceId: string, userId: string, removerId: string): Promise<void> {
    await this.checkWorkspaceOwnership(workspaceId, removerId);

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (workspace?.ownerId === userId) {
      throw new ForbiddenException('Cannot remove workspace owner');
    }

    const result = await this.workspaceMemberRepository.delete({
      workspaceId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User is not a member of this workspace');
    }
  }

  /**
   * Get workspace members
   */
  async getWorkspaceMembers(workspaceId: string, userId: string): Promise<WorkspaceMember[]> {
    await this.checkWorkspaceAccess(workspaceId, userId);

    return this.workspaceMemberRepository.find({
      where: { workspaceId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  /**
   * Update user role in workspace (only owner can update roles)
   */
  async updateUserRole(
    workspaceId: string,
    userId: string,
    newRole: UserRole,
    updaterId: string,
  ): Promise<WorkspaceMember> {
    await this.checkWorkspaceOwnership(workspaceId, updaterId);

    const member = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new NotFoundException('User is not a member of this workspace');
    }

    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (workspace?.ownerId === userId) {
      throw new ForbiddenException('Cannot change workspace owner role');
    }

    member.role = newRole;
    return this.workspaceMemberRepository.save(member);
  }

  /**
   * Check if user has access to workspace
   */
  async checkWorkspaceAccess(workspaceId: string, userId: string): Promise<WorkspaceMember> {
    const member = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!member) {
      throw new ForbiddenException('Access denied to this workspace');
    }

    return member;
  }

  /**
   * Check if user is workspace owner
   */
  async checkWorkspaceOwnership(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.workspaceRepository.findOne({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${workspaceId} not found`);
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenException('Only workspace owner can perform this action');
    }
  }

  /**
   * Check if user can modify projects (owner or collaborator)
   */
  async checkProjectModifyPermission(workspaceId: string, userId: string): Promise<void> {
    const member = await this.getWorkspaceMember(workspaceId, userId);

    if (!member || member.role === UserRole.VIEWER) {
      throw new ForbiddenException('Insufficient permissions to modify projects');
    }
  }

  /**
   * Get workspace member by user ID
   */
  async getWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });
  }

  /**
   * Get user role in workspace
   */
  async getUserRole(workspaceId: string, userId: string): Promise<UserRole | null> {
    const member = await this.getWorkspaceMember(workspaceId, userId);
    return member?.role || null;
  }
}

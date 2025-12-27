import { validate } from 'class-validator';
import { UserRole, Workspace, WorkspaceMember } from './index';

describe('Workspace Entity', () => {
  describe('validation', () => {
    it('should validate a valid workspace', async () => {
      const workspace = new Workspace();
      workspace.name = 'Test Workspace';
      workspace.description = 'A test workspace';
      workspace.ownerId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      const errors = await validate(workspace);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for empty name', async () => {
      const workspace = new Workspace();
      workspace.name = '';
      workspace.ownerId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      const errors = await validate(workspace);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation for name too short', async () => {
      const workspace = new Workspace();
      workspace.name = 'A';
      workspace.ownerId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      const errors = await validate(workspace);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation for name too long', async () => {
      const workspace = new Workspace();
      workspace.name = 'A'.repeat(256);
      workspace.ownerId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      const errors = await validate(workspace);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });
  });
});

describe('WorkspaceMember Entity', () => {
  describe('validation', () => {
    it('should validate a valid workspace member', async () => {
      const member = new WorkspaceMember();
      member.workspaceId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
      member.userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      member.role = UserRole.COLLABORATOR;

      const errors = await validate(member);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for invalid role', async () => {
      const member = new WorkspaceMember();
      member.workspaceId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
      member.userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      member.role = 'invalid' as UserRole;

      const errors = await validate(member);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
    });

    it('should fail validation for empty role', async () => {
      const member = new WorkspaceMember();
      member.workspaceId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
      member.userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      member.role = '' as UserRole;

      const errors = await validate(member);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('role');
    });
  });

  describe('UserRole enum', () => {
    it('should have correct role values', () => {
      expect(UserRole.OWNER).toBe('owner');
      expect(UserRole.COLLABORATOR).toBe('collaborator');
      expect(UserRole.VIEWER).toBe('viewer');
    });
  });
});

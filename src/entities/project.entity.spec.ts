import { validate } from 'class-validator';
import { CollaborationEvent, Project, ProjectFile, ProjectMetadata } from './index';

describe('Project Entity', () => {
  describe('validation', () => {
    it('should validate a valid project', async () => {
      const project = new Project();
      project.workspaceId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
      project.name = 'Test Project';
      project.description = 'A test project';
      project.createdBy = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      project.files = [];
      project.metadata = {};
      project.collaborationHistory = [];

      const errors = await validate(project);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation for empty name', async () => {
      const project = new Project();
      project.workspaceId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
      project.name = '';
      project.createdBy = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      const errors = await validate(project);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation for name too short', async () => {
      const project = new Project();
      project.workspaceId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
      project.name = 'A';
      project.createdBy = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      const errors = await validate(project);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });

    it('should fail validation for name too long', async () => {
      const project = new Project();
      project.workspaceId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
      project.name = 'A'.repeat(256);
      project.createdBy = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      const errors = await validate(project);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('name');
    });
  });

  describe('JSONB fields', () => {
    it('should handle files array correctly', () => {
      const project = new Project();
      const file: ProjectFile = {
        path: '/src/main.ts',
        content: 'console.log("Hello World");',
        mimeType: 'text/typescript',
        lastModified: new Date('2025-01-01T00:00:00.000Z'),
        modifiedBy: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
      };

      project.files = [file];
      expect(project.files).toHaveLength(1);
      expect(project.files[0].path).toBe('/src/main.ts');
      expect(project.files[0].mimeType).toBe('text/typescript');
    });

    it('should handle metadata object correctly', () => {
      const project = new Project();
      const metadata: ProjectMetadata = {
        language: 'typescript',
        framework: 'nestjs',
        dependencies: {
          '@nestjs/core': '^11.0.0',
          typescript: '^5.0.0',
        },
        tags: ['backend', 'api'],
      };

      project.metadata = metadata;
      expect(project.metadata.language).toBe('typescript');
      expect(project.metadata.framework).toBe('nestjs');
      expect(project.metadata.dependencies).toEqual({
        '@nestjs/core': '^11.0.0',
        typescript: '^5.0.0',
      });
      expect(project.metadata.tags).toEqual(['backend', 'api']);
    });

    it('should handle collaboration history correctly', () => {
      const project = new Project();
      const event: CollaborationEvent = {
        userId: '713df652-8eeb-4a41-9ec9-4fe03942b77b',
        action: 'create',
        timestamp: new Date('2025-01-01T00:00:00.000Z'),
        changes: { type: 'file_created', path: '/src/main.ts' },
        filePath: '/src/main.ts',
      };

      project.collaborationHistory = [event];
      expect(project.collaborationHistory).toHaveLength(1);
      expect(project.collaborationHistory[0].action).toBe('create');
      expect(project.collaborationHistory[0].filePath).toBe('/src/main.ts');
    });
  });
});

import { validate } from 'class-validator';
import { Project, ProjectMetadata } from './index';

describe('Project Entity', () => {
  describe('validation', () => {
    it('should validate a valid project', async () => {
      const project = new Project();
      project.workspaceId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
      project.name = 'Test Project';
      project.description = 'A test project';
      project.createdBy = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      project.metadata = {};

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

  describe('metadata field', () => {
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

    it('should handle empty metadata object', () => {
      const project = new Project();
      project.metadata = {};

      expect(project.metadata).toEqual({});
    });

    it('should handle custom metadata fields', () => {
      const project = new Project();
      project.metadata = {
        customField: 'customValue',
        anotherField: 123,
        nestedObject: {
          key: 'value',
        },
      };

      expect(project.metadata.customField).toBe('customValue');
      expect(project.metadata.anotherField).toBe(123);
      expect(project.metadata.nestedObject.key).toBe('value');
    });
  });
});

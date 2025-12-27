import { ProjectFile } from './project-file.entity';

describe('ProjectFile Entity', () => {
  describe('properties', () => {
    it('should create a project file with all properties', () => {
      const projectFile = new ProjectFile();
      projectFile.projectId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
      projectFile.filePath = '/src/main.ts';
      projectFile.content = 'console.log("Hello World");';
      projectFile.mimeType = 'text/typescript';
      projectFile.sizeBytes = 28;
      projectFile.createdBy = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      projectFile.modifiedBy = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      expect(projectFile.projectId).toBe('2204e384-f55a-49d8-920d-8fc9c8bb124f');
      expect(projectFile.filePath).toBe('/src/main.ts');
      expect(projectFile.content).toBe('console.log("Hello World");');
      expect(projectFile.mimeType).toBe('text/typescript');
      expect(projectFile.sizeBytes).toBe(28);
      expect(projectFile.createdBy).toBe('713df652-8eeb-4a41-9ec9-4fe03942b77b');
      expect(projectFile.modifiedBy).toBe('713df652-8eeb-4a41-9ec9-4fe03942b77b');
    });

    it('should create a project file without optional fields', () => {
      const projectFile = new ProjectFile();
      projectFile.projectId = '2204e384-f55a-49d8-920d-8fc9c8bb124f';
      projectFile.filePath = '/src/main.ts';
      projectFile.content = 'console.log("Hello World");';
      projectFile.createdBy = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      projectFile.modifiedBy = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      expect(projectFile.projectId).toBe('2204e384-f55a-49d8-920d-8fc9c8bb124f');
      expect(projectFile.filePath).toBe('/src/main.ts');
      expect(projectFile.content).toBe('console.log("Hello World");');
      expect(projectFile.createdBy).toBe('713df652-8eeb-4a41-9ec9-4fe03942b77b');
      expect(projectFile.modifiedBy).toBe('713df652-8eeb-4a41-9ec9-4fe03942b77b');
      expect(projectFile.mimeType).toBeUndefined();
      expect(projectFile.sizeBytes).toBeUndefined();
    });

    it('should handle file path correctly', () => {
      const projectFile = new ProjectFile();
      projectFile.filePath = '/src/components/Button.tsx';

      expect(projectFile.filePath).toBe('/src/components/Button.tsx');
    });

    it('should handle content correctly', () => {
      const projectFile = new ProjectFile();
      const content = 'export const Button = () => <button>Click me</button>;';
      projectFile.content = content;

      expect(projectFile.content).toBe(content);
    });

    it('should handle mime type correctly', () => {
      const projectFile = new ProjectFile();
      projectFile.mimeType = 'text/typescript';

      expect(projectFile.mimeType).toBe('text/typescript');
    });

    it('should handle size bytes correctly', () => {
      const projectFile = new ProjectFile();
      projectFile.sizeBytes = 1024;

      expect(projectFile.sizeBytes).toBe(1024);
    });

    it('should handle user IDs correctly', () => {
      const projectFile = new ProjectFile();
      const userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      projectFile.createdBy = userId;
      projectFile.modifiedBy = userId;

      expect(projectFile.createdBy).toBe(userId);
      expect(projectFile.modifiedBy).toBe(userId);
    });
  });
});

import { CollaborationEvent } from './collaboration-event.entity';

describe('CollaborationEvent Entity', () => {
  describe('properties', () => {
    it('should create a collaboration event with all properties', () => {
      const event = new CollaborationEvent();
      event.projectId = 'fccbcd31-f0cb-433f-a308-71379cf865ac';
      event.userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      event.action = 'create';
      event.resourceType = 'file';
      event.resourceId = '/src/main.ts';
      event.changes = { type: 'file_created', path: '/src/main.ts' };

      expect(event.projectId).toBe('fccbcd31-f0cb-433f-a308-71379cf865ac');
      expect(event.userId).toBe('713df652-8eeb-4a41-9ec9-4fe03942b77b');
      expect(event.action).toBe('create');
      expect(event.resourceType).toBe('file');
      expect(event.resourceId).toBe('/src/main.ts');
      expect(event.changes).toEqual({ type: 'file_created', path: '/src/main.ts' });
    });

    it('should create an event without optional fields', () => {
      const event = new CollaborationEvent();
      event.projectId = 'fccbcd31-f0cb-433f-a308-71379cf865ac';
      event.userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';
      event.action = 'update';
      event.resourceType = 'project';

      expect(event.projectId).toBe('fccbcd31-f0cb-433f-a308-71379cf865ac');
      expect(event.userId).toBe('713df652-8eeb-4a41-9ec9-4fe03942b77b');
      expect(event.action).toBe('update');
      expect(event.resourceType).toBe('project');
      expect(event.resourceId).toBeUndefined();
      expect(event.changes).toBeUndefined();
    });

    it('should handle action types correctly', () => {
      const event = new CollaborationEvent();

      event.action = 'create';
      expect(event.action).toBe('create');

      event.action = 'update';
      expect(event.action).toBe('update');

      event.action = 'delete';
      expect(event.action).toBe('delete');

      event.action = 'rename';
      expect(event.action).toBe('rename');
    });

    it('should handle resource types correctly', () => {
      const event = new CollaborationEvent();

      event.resourceType = 'project';
      expect(event.resourceType).toBe('project');

      event.resourceType = 'file';
      expect(event.resourceType).toBe('file');

      event.resourceType = 'metadata';
      expect(event.resourceType).toBe('metadata');
    });

    it('should handle resource ID correctly', () => {
      const event = new CollaborationEvent();
      event.resourceId = '/src/components/Button.tsx';

      expect(event.resourceId).toBe('/src/components/Button.tsx');
    });

    it('should handle changes object correctly', () => {
      const event = new CollaborationEvent();
      const changes = {
        old: { name: 'Old Project Name' },
        new: { name: 'New Project Name' },
      };
      event.changes = changes;

      expect(event.changes).toEqual(changes);
      expect(event.changes.old.name).toBe('Old Project Name');
      expect(event.changes.new.name).toBe('New Project Name');
    });

    it('should handle user and project IDs correctly', () => {
      const event = new CollaborationEvent();
      const projectId = 'fccbcd31-f0cb-433f-a308-71379cf865ac';
      const userId = '713df652-8eeb-4a41-9ec9-4fe03942b77b';

      event.projectId = projectId;
      event.userId = userId;

      expect(event.projectId).toBe(projectId);
      expect(event.userId).toBe(userId);
    });
  });
});

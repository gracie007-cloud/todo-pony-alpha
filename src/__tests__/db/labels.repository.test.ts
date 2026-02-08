/**
 * Labels Repository Tests
 * 
 * Tests for CRUD operations and task-label associations.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { createTestLabel, DEFAULT_LIST_ID } from '../utils/fixtures';
import type { Label } from '@/lib/db/schema';

// Helper to create LabelsRepository with test database
function createLabelsRepository() {
  const db = getTestDatabase();
  
  return {
    findAll(): Label[] {
      return db.prepare('SELECT * FROM labels ORDER BY name ASC').all() as Label[];
    },
    
    findById(id: string): Label | undefined {
      return db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as Label | undefined;
    },
    
    findByName(name: string): Label | undefined {
      return db.prepare('SELECT * FROM labels WHERE name = ?').get(name) as Label | undefined;
    },
    
    create(data: { name: string; color?: string; icon?: string | null }): Label {
      const id = testUuid.generate();
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO labels (id, name, color, icon, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, data.name, data.color ?? '#8b5cf6', data.icon ?? null, now);
      
      return this.findById(id)!;
    },
    
    update(id: string, data: Partial<{ name: string; color: string; icon: string | null }>): Label | undefined {
      const existing = this.findById(id);
      if (!existing) return undefined;
      
      const updates: string[] = [];
      const values: unknown[] = [];
      
      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.color !== undefined) {
        updates.push('color = ?');
        values.push(data.color);
      }
      if (data.icon !== undefined) {
        updates.push('icon = ?');
        values.push(data.icon);
      }
      
      if (updates.length === 0) return existing;
      
      values.push(id);
      db.prepare(`UPDATE labels SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      
      return this.findById(id);
    },
    
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM labels WHERE id = ?').run(id);
      return result.changes > 0;
    },
    
    nameExists(name: string, excludeId?: string): boolean {
      let sql = 'SELECT 1 FROM labels WHERE name = ?';
      const values: unknown[] = [name];
      
      if (excludeId) {
        sql += ' AND id != ?';
        values.push(excludeId);
      }
      
      const result = db.prepare(sql).get(...values);
      return result !== undefined;
    },
    
    findByTaskId(taskId: string): Label[] {
      return db.prepare(`
        SELECT l.* FROM labels l
        INNER JOIN task_labels tl ON l.id = tl.label_id
        WHERE tl.task_id = ?
        ORDER BY l.name ASC
      `).all(taskId) as Label[];
    },
    
    addToTask(taskId: string, labelId: string): boolean {
      const result = db.prepare(`
        INSERT OR IGNORE INTO task_labels (task_id, label_id)
        VALUES (?, ?)
      `).run(taskId, labelId);
      return result.changes > 0;
    },
    
    removeFromTask(taskId: string, labelId: string): boolean {
      const result = db.prepare(`
        DELETE FROM task_labels 
        WHERE task_id = ? AND label_id = ?
      `).run(taskId, labelId);
      return result.changes > 0;
    },
    
    setTaskLabels(taskId: string, labelIds: string[]): void {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM task_labels WHERE task_id = ?').run(taskId);
        for (const labelId of labelIds) {
          this.addToTask(taskId, labelId);
        }
      });
      transaction();
    },
    
    getTaskCount(labelId: string): number {
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM task_labels WHERE label_id = ?
      `).get(labelId) as { count: number };
      return result.count;
    },
  };
}

// Helper to create a test task
function createTestTaskInDb(): string {
  const db = getTestDatabase();
  const id = testUuid.generate();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO tasks (id, list_id, name, priority, completed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, DEFAULT_LIST_ID, 'Test Task', 'none', 0, now, now);
  
  return id;
}

describe('LabelsRepository', () => {
  let repo: ReturnType<typeof createLabelsRepository>;
  
  beforeEach(() => {
    clearTestDatabase();
    repo = createLabelsRepository();
  });
  
  describe('findAll', () => {
    test('should return empty array when no labels', () => {
      const labels = repo.findAll();
      expect(labels).toEqual([]);
    });
    
    test('should return all labels sorted by name', () => {
      repo.create({ name: 'Zebra' });
      repo.create({ name: 'Alpha' });
      repo.create({ name: 'Middle' });
      
      const labels = repo.findAll();
      expect(labels[0].name).toBe('Alpha');
      expect(labels[1].name).toBe('Middle');
      expect(labels[2].name).toBe('Zebra');
    });
  });
  
  describe('findById', () => {
    test('should return label by ID', () => {
      const created = repo.create({ name: 'Test Label' });
      const found = repo.findById(created.id);
      
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Label');
    });
    
    test('should return undefined for non-existent ID', () => {
      const found = repo.findById(testUuid.generate());
      expect(found).toBeUndefined();
    });
  });
  
  describe('findByName', () => {
    test('should return label by name', () => {
      repo.create({ name: 'Unique Label' });
      const found = repo.findByName('Unique Label');
      
      expect(found).toBeDefined();
      expect(found?.name).toBe('Unique Label');
    });
    
    test('should return undefined for non-existent name', () => {
      const found = repo.findByName('Non-existent');
      expect(found).toBeUndefined();
    });
  });
  
  describe('create', () => {
    test('should create a label with required fields', () => {
      const label = repo.create({ name: 'New Label' });
      
      expect(label.id).toBeDefined();
      expect(label.name).toBe('New Label');
      expect(label.color).toBe('#8b5cf6');
      expect(label.icon).toBeNull();
      expect(label.created_at).toBeDefined();
    });
    
    test('should create a label with custom color', () => {
      const label = repo.create({ name: 'Custom', color: '#ff0000' });
      expect(label.color).toBe('#ff0000');
    });
    
    test('should create a label with icon', () => {
      const label = repo.create({ name: 'With Icon', icon: '🏷️' });
      expect(label.icon).toBe('🏷️');
    });
    
    test('should enforce unique name constraint', () => {
      repo.create({ name: 'Unique' });
      
      expect(() => {
        repo.create({ name: 'Unique' });
      }).toThrow();
    });
  });
  
  describe('update', () => {
    test('should update label name', () => {
      const created = repo.create({ name: 'Original' });
      const updated = repo.update(created.id, { name: 'Updated' });
      
      expect(updated?.name).toBe('Updated');
    });
    
    test('should update label color', () => {
      const created = repo.create({ name: 'Test', color: '#000000' });
      const updated = repo.update(created.id, { color: '#ffffff' });
      
      expect(updated?.color).toBe('#ffffff');
    });
    
    test('should update label icon', () => {
      const created = repo.create({ name: 'Test', icon: 'old' });
      const updated = repo.update(created.id, { icon: 'new' });
      
      expect(updated?.icon).toBe('new');
    });
    
    test('should return undefined for non-existent label', () => {
      const result = repo.update(testUuid.generate(), { name: 'New' });
      expect(result).toBeUndefined();
    });
    
    test('should return unchanged label if no updates', () => {
      const created = repo.create({ name: 'Test' });
      const updated = repo.update(created.id, {});
      
      expect(updated?.name).toBe('Test');
    });
  });
  
  describe('delete', () => {
    test('should delete an existing label', () => {
      const created = repo.create({ name: 'To Delete' });
      const result = repo.delete(created.id);
      
      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeUndefined();
    });
    
    test('should return false for non-existent label', () => {
      const result = repo.delete(testUuid.generate());
      expect(result).toBe(false);
    });
    
    test('should cascade delete task-label associations', () => {
      const db = getTestDatabase();
      const label = repo.create({ name: 'Test' });
      const taskId = createTestTaskInDb();
      
      // Add label to task
      repo.addToTask(taskId, label.id);
      
      // Delete label
      repo.delete(label.id);
      
      // Verify association is deleted
      const associations = db.prepare('SELECT * FROM task_labels WHERE label_id = ?').all(label.id);
      expect(associations.length).toBe(0);
    });
  });
  
  describe('nameExists', () => {
    test('should return true for existing name', () => {
      repo.create({ name: 'Existing' });
      expect(repo.nameExists('Existing')).toBe(true);
    });
    
    test('should return false for non-existent name', () => {
      expect(repo.nameExists('Non-existent')).toBe(false);
    });
    
    test('should exclude specific ID from check', () => {
      const created = repo.create({ name: 'Existing' });
      
      // Name exists when not excluding
      expect(repo.nameExists('Existing')).toBe(true);
      
      // Name doesn't "exist" when excluding the same label
      expect(repo.nameExists('Existing', created.id)).toBe(false);
    });
    
    test('should return true if different label has same name', () => {
      const created = repo.create({ name: 'Existing' });
      repo.create({ name: 'Other' });
      
      // Check if 'Other' exists, excluding first label
      expect(repo.nameExists('Other', created.id)).toBe(true);
    });
  });
  
  describe('Task-Label Associations', () => {
    let taskId: string;
    let label1: Label;
    let label2: Label;
    
    beforeEach(() => {
      taskId = createTestTaskInDb();
      label1 = repo.create({ name: 'Label 1' });
      label2 = repo.create({ name: 'Label 2' });
    });
    
    describe('addToTask', () => {
      test('should add label to task', () => {
        const result = repo.addToTask(taskId, label1.id);
        expect(result).toBe(true);
        
        const labels = repo.findByTaskId(taskId);
        expect(labels.length).toBe(1);
        expect(labels[0].id).toBe(label1.id);
      });
      
      test('should not add duplicate label', () => {
        repo.addToTask(taskId, label1.id);
        const result = repo.addToTask(taskId, label1.id);
        
        expect(result).toBe(false); // No change (ignored)
        
        const labels = repo.findByTaskId(taskId);
        expect(labels.length).toBe(1);
      });
      
      test('should allow multiple labels on same task', () => {
        repo.addToTask(taskId, label1.id);
        repo.addToTask(taskId, label2.id);
        
        const labels = repo.findByTaskId(taskId);
        expect(labels.length).toBe(2);
      });
    });
    
    describe('removeFromTask', () => {
      test('should remove label from task', () => {
        repo.addToTask(taskId, label1.id);
        const result = repo.removeFromTask(taskId, label1.id);
        
        expect(result).toBe(true);
        
        const labels = repo.findByTaskId(taskId);
        expect(labels.length).toBe(0);
      });
      
      test('should return false if label not associated', () => {
        const result = repo.removeFromTask(taskId, label1.id);
        expect(result).toBe(false);
      });
    });
    
    describe('setTaskLabels', () => {
      test('should replace all task labels', () => {
        repo.addToTask(taskId, label1.id);
        repo.setTaskLabels(taskId, [label2.id]);
        
        const labels = repo.findByTaskId(taskId);
        expect(labels.length).toBe(1);
        expect(labels[0].id).toBe(label2.id);
      });
      
      test('should set multiple labels', () => {
        repo.setTaskLabels(taskId, [label1.id, label2.id]);
        
        const labels = repo.findByTaskId(taskId);
        expect(labels.length).toBe(2);
      });
      
      test('should clear all labels with empty array', () => {
        repo.addToTask(taskId, label1.id);
        repo.setTaskLabels(taskId, []);
        
        const labels = repo.findByTaskId(taskId);
        expect(labels.length).toBe(0);
      });
    });
    
    describe('findByTaskId', () => {
      test('should return empty array for task with no labels', () => {
        const labels = repo.findByTaskId(taskId);
        expect(labels).toEqual([]);
      });
      
      test('should return labels sorted by name', () => {
        repo.addToTask(taskId, label1.id); // 'Label 1'
        repo.addToTask(taskId, label2.id); // 'Label 2'
        
        const labels = repo.findByTaskId(taskId);
        expect(labels[0].name).toBe('Label 1');
        expect(labels[1].name).toBe('Label 2');
      });
    });
    
    describe('getTaskCount', () => {
      test('should return 0 for unused label', () => {
        expect(repo.getTaskCount(label1.id)).toBe(0);
      });
      
      test('should count tasks using label', () => {
        const taskId2 = createTestTaskInDb();
        
        repo.addToTask(taskId, label1.id);
        repo.addToTask(taskId2, label1.id);
        
        expect(repo.getTaskCount(label1.id)).toBe(2);
      });
    });
  });
});

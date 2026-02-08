/**
 * Subtasks Repository Tests
 * 
 * Tests for CRUD operations and ordering.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { DEFAULT_LIST_ID } from '../utils/fixtures';
import type { Subtask } from '@/lib/db/schema';

// Helper to create SubtasksRepository with test database
function createSubtasksRepository() {
  const db = getTestDatabase();
  
  return {
    findAll(): Subtask[] {
      return db.prepare('SELECT * FROM subtasks ORDER BY "order" ASC').all() as Subtask[];
    },
    
    findById(id: string): Subtask | undefined {
      return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as Subtask | undefined;
    },
    
    create(data: { task_id: string; name: string; completed?: boolean; order?: number }): Subtask {
      const id = testUuid.generate();
      const now = new Date().toISOString();
      
      // Get max order if not specified
      const maxOrder = this.getMaxOrder(data.task_id);
      const order = data.order ?? maxOrder + 1;
      
      db.prepare(`
        INSERT INTO subtasks (id, task_id, name, completed, "order", created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, data.task_id, data.name, data.completed ? 1 : 0, order, now);
      
      return this.findById(id)!;
    },
    
    update(id: string, data: Partial<{ task_id: string; name: string; completed: boolean; order: number }>): Subtask | undefined {
      const existing = this.findById(id);
      if (!existing) return undefined;
      
      const updates: string[] = [];
      const values: unknown[] = [];
      
      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.completed !== undefined) {
        updates.push('completed = ?');
        values.push(data.completed ? 1 : 0);
      }
      if (data.order !== undefined) {
        updates.push('"order" = ?');
        values.push(data.order);
      }
      if (data.task_id !== undefined) {
        updates.push('task_id = ?');
        values.push(data.task_id);
      }
      
      if (updates.length === 0) return existing;
      
      values.push(id);
      db.prepare(`UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      
      return this.findById(id);
    },
    
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
      return result.changes > 0;
    },
    
    findByTaskId(taskId: string): Subtask[] {
      return db.prepare(`
        SELECT * FROM subtasks 
        WHERE task_id = ? 
        ORDER BY "order" ASC
      `).all(taskId) as Subtask[];
    },
    
    countByTaskId(taskId: string): number {
      const result = db.prepare('SELECT COUNT(*) as count FROM subtasks WHERE task_id = ?').get(taskId) as { count: number };
      return result.count;
    },
    
    completedCountByTaskId(taskId: string): number {
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM subtasks 
        WHERE task_id = ? AND completed = 1
      `).get(taskId) as { count: number };
      return result.count;
    },
    
    getMaxOrder(taskId: string): number {
      const result = db.prepare(`
        SELECT COALESCE(MAX("order"), -1) as max_order 
        FROM subtasks 
        WHERE task_id = ?
      `).get(taskId) as { max_order: number };
      return result.max_order;
    },
    
    reorder(taskId: string, subtaskIds: string[]): void {
      const transaction = db.transaction(() => {
        subtaskIds.forEach((id, index) => {
          db.prepare(
            `UPDATE subtasks SET "order" = ? WHERE id = ? AND task_id = ?`
          ).run(index, id, taskId);
        });
      });
      transaction();
    },
    
    toggleComplete(id: string): Subtask | undefined {
      const existing = this.findById(id);
      if (!existing) return undefined;
      return this.update(id, { completed: !existing.completed });
    },
    
    markAllComplete(taskId: string): number {
      const result = db.prepare(`
        UPDATE subtasks 
        SET completed = 1 
        WHERE task_id = ? AND completed = 0
      `).run(taskId);
      return result.changes;
    },
    
    markAllIncomplete(taskId: string): number {
      const result = db.prepare(`
        UPDATE subtasks 
        SET completed = 0 
        WHERE task_id = ? AND completed = 1
      `).run(taskId);
      return result.changes;
    },
    
    deleteByTaskId(taskId: string): number {
      const result = db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(taskId);
      return result.changes;
    },
    
    getCompletionPercentage(taskId: string): number {
      const total = this.countByTaskId(taskId);
      if (total === 0) return 0;
      const completed = this.completedCountByTaskId(taskId);
      return Math.round((completed / total) * 100);
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

describe('SubtasksRepository', () => {
  let repo: ReturnType<typeof createSubtasksRepository>;
  let taskId: string;
  
  beforeEach(() => {
    clearTestDatabase();
    repo = createSubtasksRepository();
    taskId = createTestTaskInDb();
  });
  
  describe('findAll', () => {
    test('should return empty array when no subtasks', () => {
      const subtasks = repo.findAll();
      expect(subtasks).toEqual([]);
    });
    
    test('should return all subtasks', () => {
      repo.create({ task_id: taskId, name: 'Subtask 1' });
      repo.create({ task_id: taskId, name: 'Subtask 2' });
      
      const subtasks = repo.findAll();
      expect(subtasks.length).toBe(2);
    });
  });
  
  describe('findById', () => {
    test('should return subtask by ID', () => {
      const created = repo.create({ task_id: taskId, name: 'Test Subtask' });
      const found = repo.findById(created.id);
      
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Subtask');
    });
    
    test('should return undefined for non-existent ID', () => {
      const found = repo.findById(testUuid.generate());
      expect(found).toBeUndefined();
    });
  });
  
  describe('create', () => {
    test('should create a subtask with required fields', () => {
      const subtask = repo.create({ task_id: taskId, name: 'New Subtask' });
      
      expect(subtask.id).toBeDefined();
      expect(subtask.task_id).toBe(taskId);
      expect(subtask.name).toBe('New Subtask');
      expect(subtask.completed).toBe(false);
      expect(subtask.order).toBe(0);
      expect(subtask.created_at).toBeDefined();
    });
    
    test('should create a completed subtask', () => {
      const subtask = repo.create({ task_id: taskId, name: 'Done', completed: true });
      expect(subtask.completed).toBe(true);
    });
    
    test('should auto-increment order', () => {
      const subtask1 = repo.create({ task_id: taskId, name: 'First' });
      const subtask2 = repo.create({ task_id: taskId, name: 'Second' });
      const subtask3 = repo.create({ task_id: taskId, name: 'Third' });
      
      expect(subtask1.order).toBe(0);
      expect(subtask2.order).toBe(1);
      expect(subtask3.order).toBe(2);
    });
    
    test('should allow custom order', () => {
      const subtask = repo.create({ task_id: taskId, name: 'Custom', order: 5 });
      expect(subtask.order).toBe(5);
    });
  });
  
  describe('update', () => {
    test('should update subtask name', () => {
      const created = repo.create({ task_id: taskId, name: 'Original' });
      const updated = repo.update(created.id, { name: 'Updated' });
      
      expect(updated?.name).toBe('Updated');
    });
    
    test('should update subtask completion', () => {
      const created = repo.create({ task_id: taskId, name: 'Test' });
      const updated = repo.update(created.id, { completed: true });
      
      expect(updated?.completed).toBe(true);
    });
    
    test('should update subtask order', () => {
      const created = repo.create({ task_id: taskId, name: 'Test' });
      const updated = repo.update(created.id, { order: 10 });
      
      expect(updated?.order).toBe(10);
    });
    
    test('should return undefined for non-existent subtask', () => {
      const result = repo.update(testUuid.generate(), { name: 'New' });
      expect(result).toBeUndefined();
    });
  });
  
  describe('delete', () => {
    test('should delete an existing subtask', () => {
      const created = repo.create({ task_id: taskId, name: 'To Delete' });
      const result = repo.delete(created.id);
      
      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeUndefined();
    });
    
    test('should return false for non-existent subtask', () => {
      const result = repo.delete(testUuid.generate());
      expect(result).toBe(false);
    });
  });
  
  describe('findByTaskId', () => {
    test('should return subtasks for a specific task', () => {
      const taskId2 = createTestTaskInDb();
      
      repo.create({ task_id: taskId, name: 'Task 1 Subtask' });
      repo.create({ task_id: taskId2, name: 'Task 2 Subtask' });
      repo.create({ task_id: taskId, name: 'Another Task 1 Subtask' });
      
      const subtasks = repo.findByTaskId(taskId);
      expect(subtasks.length).toBe(2);
      expect(subtasks.every(s => s.task_id === taskId)).toBe(true);
    });
    
    test('should return subtasks ordered by order field', () => {
      repo.create({ task_id: taskId, name: 'Third', order: 2 });
      repo.create({ task_id: taskId, name: 'First', order: 0 });
      repo.create({ task_id: taskId, name: 'Second', order: 1 });
      
      const subtasks = repo.findByTaskId(taskId);
      expect(subtasks[0].name).toBe('First');
      expect(subtasks[1].name).toBe('Second');
      expect(subtasks[2].name).toBe('Third');
    });
    
    test('should return empty array for task with no subtasks', () => {
      const subtasks = repo.findByTaskId(taskId);
      expect(subtasks).toEqual([]);
    });
  });
  
  describe('countByTaskId', () => {
    test('should count subtasks for a task', () => {
      repo.create({ task_id: taskId, name: 'Subtask 1' });
      repo.create({ task_id: taskId, name: 'Subtask 2' });
      
      expect(repo.countByTaskId(taskId)).toBe(2);
    });
    
    test('should return 0 for task with no subtasks', () => {
      expect(repo.countByTaskId(taskId)).toBe(0);
    });
  });
  
  describe('completedCountByTaskId', () => {
    test('should count completed subtasks', () => {
      repo.create({ task_id: taskId, name: 'Incomplete 1' });
      repo.create({ task_id: taskId, name: 'Complete 1', completed: true });
      repo.create({ task_id: taskId, name: 'Incomplete 2' });
      repo.create({ task_id: taskId, name: 'Complete 2', completed: true });
      
      expect(repo.completedCountByTaskId(taskId)).toBe(2);
    });
    
    test('should return 0 when no completed subtasks', () => {
      repo.create({ task_id: taskId, name: 'Incomplete' });
      expect(repo.completedCountByTaskId(taskId)).toBe(0);
    });
  });
  
  describe('getMaxOrder', () => {
    test('should return -1 for task with no subtasks', () => {
      expect(repo.getMaxOrder(taskId)).toBe(-1);
    });
    
    test('should return max order value', () => {
      repo.create({ task_id: taskId, name: 'First', order: 0 });
      repo.create({ task_id: taskId, name: 'Second', order: 5 });
      repo.create({ task_id: taskId, name: 'Third', order: 2 });
      
      expect(repo.getMaxOrder(taskId)).toBe(5);
    });
  });
  
  describe('reorder', () => {
    test('should reorder subtasks', () => {
      const subtask1 = repo.create({ task_id: taskId, name: 'First', order: 0 });
      const subtask2 = repo.create({ task_id: taskId, name: 'Second', order: 1 });
      const subtask3 = repo.create({ task_id: taskId, name: 'Third', order: 2 });
      
      // Reverse the order
      repo.reorder(taskId, [subtask3.id, subtask2.id, subtask1.id]);
      
      const subtasks = repo.findByTaskId(taskId);
      expect(subtasks[0].name).toBe('Third');
      expect(subtasks[1].name).toBe('Second');
      expect(subtasks[2].name).toBe('First');
    });
    
    test('should only update subtasks for specified task', () => {
      const taskId2 = createTestTaskInDb();
      
      const subtask1 = repo.create({ task_id: taskId, name: 'Task 1' });
      const subtask2 = repo.create({ task_id: taskId2, name: 'Task 2' });
      
      repo.reorder(taskId, [subtask1.id]);
      
      // Task 2's subtask should not be affected
      const task2Subtask = repo.findById(subtask2.id);
      expect(task2Subtask?.order).toBe(0);
    });
  });
  
  describe('toggleComplete', () => {
    test('should toggle incomplete to complete', () => {
      const created = repo.create({ task_id: taskId, name: 'Test' });
      const updated = repo.toggleComplete(created.id);
      
      expect(updated?.completed).toBe(true);
    });
    
    test('should toggle complete to incomplete', () => {
      const created = repo.create({ task_id: taskId, name: 'Test', completed: true });
      const updated = repo.toggleComplete(created.id);
      
      expect(updated?.completed).toBe(false);
    });
    
    test('should return undefined for non-existent subtask', () => {
      const result = repo.toggleComplete(testUuid.generate());
      expect(result).toBeUndefined();
    });
  });
  
  describe('markAllComplete', () => {
    test('should mark all subtasks as complete', () => {
      repo.create({ task_id: taskId, name: 'Subtask 1' });
      repo.create({ task_id: taskId, name: 'Subtask 2' });
      repo.create({ task_id: taskId, name: 'Subtask 3' });
      
      const changes = repo.markAllComplete(taskId);
      
      expect(changes).toBe(3);
      expect(repo.completedCountByTaskId(taskId)).toBe(3);
    });
    
    test('should only mark incomplete subtasks', () => {
      repo.create({ task_id: taskId, name: 'Complete', completed: true });
      repo.create({ task_id: taskId, name: 'Incomplete' });
      
      const changes = repo.markAllComplete(taskId);
      
      expect(changes).toBe(1);
    });
    
    test('should return 0 if all already complete', () => {
      repo.create({ task_id: taskId, name: 'Complete', completed: true });
      
      const changes = repo.markAllComplete(taskId);
      expect(changes).toBe(0);
    });
  });
  
  describe('markAllIncomplete', () => {
    test('should mark all subtasks as incomplete', () => {
      repo.create({ task_id: taskId, name: 'Subtask 1', completed: true });
      repo.create({ task_id: taskId, name: 'Subtask 2', completed: true });
      
      const changes = repo.markAllIncomplete(taskId);
      
      expect(changes).toBe(2);
      expect(repo.completedCountByTaskId(taskId)).toBe(0);
    });
  });
  
  describe('deleteByTaskId', () => {
    test('should delete all subtasks for a task', () => {
      repo.create({ task_id: taskId, name: 'Subtask 1' });
      repo.create({ task_id: taskId, name: 'Subtask 2' });
      
      const changes = repo.deleteByTaskId(taskId);
      
      expect(changes).toBe(2);
      expect(repo.countByTaskId(taskId)).toBe(0);
    });
    
    test('should not affect other tasks subtasks', () => {
      const taskId2 = createTestTaskInDb();
      
      repo.create({ task_id: taskId, name: 'Task 1' });
      repo.create({ task_id: taskId2, name: 'Task 2' });
      
      repo.deleteByTaskId(taskId);
      
      expect(repo.countByTaskId(taskId2)).toBe(1);
    });
  });
  
  describe('getCompletionPercentage', () => {
    test('should return 0 for task with no subtasks', () => {
      expect(repo.getCompletionPercentage(taskId)).toBe(0);
    });
    
    test('should calculate correct percentage', () => {
      repo.create({ task_id: taskId, name: 'Complete 1', completed: true });
      repo.create({ task_id: taskId, name: 'Incomplete' });
      repo.create({ task_id: taskId, name: 'Complete 2', completed: true });
      repo.create({ task_id: taskId, name: 'Complete 3', completed: true });
      
      // 3 out of 4 = 75%
      expect(repo.getCompletionPercentage(taskId)).toBe(75);
    });
    
    test('should return 100 when all complete', () => {
      repo.create({ task_id: taskId, name: 'Complete 1', completed: true });
      repo.create({ task_id: taskId, name: 'Complete 2', completed: true });
      
      expect(repo.getCompletionPercentage(taskId)).toBe(100);
    });
    
    test('should return 0 when none complete', () => {
      repo.create({ task_id: taskId, name: 'Incomplete 1' });
      repo.create({ task_id: taskId, name: 'Incomplete 2' });
      
      expect(repo.getCompletionPercentage(taskId)).toBe(0);
    });
  });
});

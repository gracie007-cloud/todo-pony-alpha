/**
 * Task History Repository Tests
 * 
 * Tests for history queries.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { createTestHistory, DEFAULT_LIST_ID, testDates } from '../utils/fixtures';
import type { TaskHistory } from '@/lib/db/schema';

// Helper to create TaskHistoryRepository with test database
function createTaskHistoryRepository() {
  const db = getTestDatabase();
  
  return {
    findAll(): TaskHistory[] {
      return db.prepare('SELECT * FROM task_history ORDER BY changed_at DESC').all() as TaskHistory[];
    },
    
    findById(id: string): TaskHistory | undefined {
      return db.prepare('SELECT * FROM task_history WHERE id = ?').get(id) as TaskHistory | undefined;
    },
    
    create(data: { 
      task_id: string; 
      field_name: string; 
      old_value: string | null; 
      new_value: string | null; 
    }): TaskHistory {
      const id = testUuid.generate();
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, data.task_id, data.field_name, data.old_value, data.new_value, now);
      
      return this.findById(id)!;
    },
    
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM task_history WHERE id = ?').run(id);
      return result.changes > 0;
    },
    
    findByTaskId(taskId: string): TaskHistory[] {
      return db.prepare(`
        SELECT * FROM task_history 
        WHERE task_id = ? 
        ORDER BY changed_at DESC
      `).all(taskId) as TaskHistory[];
    },
    
    findByTaskIdAndField(taskId: string, fieldName: string): TaskHistory[] {
      return db.prepare(`
        SELECT * FROM task_history 
        WHERE task_id = ? AND field_name = ?
        ORDER BY changed_at DESC
      `).all(taskId, fieldName) as TaskHistory[];
    },
    
    findRecent(limit: number = 50): TaskHistory[] {
      return db.prepare(`
        SELECT * FROM task_history 
        ORDER BY changed_at DESC
        LIMIT ?
      `).all(limit) as TaskHistory[];
    },
    
    findByDateRange(from: string, to: string): TaskHistory[] {
      return db.prepare(`
        SELECT * FROM task_history 
        WHERE changed_at >= ? AND changed_at <= ?
        ORDER BY changed_at DESC
      `).all(from, to) as TaskHistory[];
    },
    
    findByTaskIdWithDetails(taskId: string): Array<TaskHistory & { task_name: string }> {
      return db.prepare(`
        SELECT th.*, t.name as task_name
        FROM task_history th
        INNER JOIN tasks t ON th.task_id = t.id
        WHERE th.task_id = ?
        ORDER BY th.changed_at DESC
      `).all(taskId) as Array<TaskHistory & { task_name: string }>;
    },
    
    countByTaskId(taskId: string): number {
      const result = db.prepare('SELECT COUNT(*) as count FROM task_history WHERE task_id = ?').get(taskId) as { count: number };
      return result.count;
    },
    
    deleteByTaskId(taskId: string): number {
      const result = db.prepare('DELETE FROM task_history WHERE task_id = ?').run(taskId);
      return result.changes;
    },
    
    getLastChange(taskId: string, fieldName: string): TaskHistory | undefined {
      return db.prepare(`
        SELECT * FROM task_history 
        WHERE task_id = ? AND field_name = ?
        ORDER BY changed_at DESC
        LIMIT 1
      `).get(taskId, fieldName) as TaskHistory | undefined;
    },
    
    getChangeSummary(taskId: string): Array<{ field_name: string; change_count: number }> {
      return db.prepare(`
        SELECT field_name, COUNT(*) as change_count
        FROM task_history
        WHERE task_id = ?
        GROUP BY field_name
        ORDER BY change_count DESC
      `).all(taskId) as Array<{ field_name: string; change_count: number }>;
    },
    
    deleteOlderThan(date: string): number {
      const result = db.prepare('DELETE FROM task_history WHERE changed_at < ?').run(date);
      return result.changes;
    },
  };
}

// Helper to create a test task
function createTestTaskInDb(name: string = 'Test Task'): string {
  const db = getTestDatabase();
  const id = testUuid.generate();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO tasks (id, list_id, name, priority, completed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, DEFAULT_LIST_ID, name, 'none', 0, now, now);
  
  return id;
}

describe('TaskHistoryRepository', () => {
  let repo: ReturnType<typeof createTaskHistoryRepository>;
  let taskId: string;
  
  beforeEach(() => {
    clearTestDatabase();
    repo = createTaskHistoryRepository();
    taskId = createTestTaskInDb();
  });
  
  describe('findAll', () => {
    test('should return empty array when no history', () => {
      const history = repo.findAll();
      expect(history).toEqual([]);
    });
    
    test('should return all history entries', () => {
      repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: '"Task 1"' });
      repo.create({ task_id: taskId, field_name: 'priority', old_value: '"none"', new_value: '"high"' });
      
      const history = repo.findAll();
      expect(history.length).toBe(2);
    });
  });
  
  describe('findById', () => {
    test('should return history entry by ID', () => {
      const created = repo.create({ 
        task_id: taskId, 
        field_name: 'name', 
        old_value: null, 
        new_value: '"New Name"' 
      });
      
      const found = repo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.field_name).toBe('name');
    });
    
    test('should return undefined for non-existent ID', () => {
      const found = repo.findById(testUuid.generate());
      expect(found).toBeUndefined();
    });
  });
  
  describe('create', () => {
    test('should create a history entry', () => {
      const history = repo.create({
        task_id: taskId,
        field_name: 'name',
        old_value: '"Old Name"',
        new_value: '"New Name"',
      });
      
      expect(history.id).toBeDefined();
      expect(history.task_id).toBe(taskId);
      expect(history.field_name).toBe('name');
      expect(history.old_value).toBe('"Old Name"');
      expect(history.new_value).toBe('"New Name"');
      expect(history.changed_at).toBeDefined();
    });
    
    test('should create entry with null values', () => {
      const history = repo.create({
        task_id: taskId,
        field_name: 'description',
        old_value: null,
        new_value: '"New description"',
      });
      
      expect(history.old_value).toBeNull();
    });
  });
  
  describe('delete', () => {
    test('should delete an existing history entry', () => {
      const created = repo.create({ 
        task_id: taskId, 
        field_name: 'name', 
        old_value: null, 
        new_value: '"Test"' 
      });
      
      const result = repo.delete(created.id);
      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeUndefined();
    });
    
    test('should return false for non-existent entry', () => {
      const result = repo.delete(testUuid.generate());
      expect(result).toBe(false);
    });
  });
  
  describe('findByTaskId', () => {
    test('should return history for a specific task', () => {
      const taskId2 = createTestTaskInDb('Task 2');
      
      repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: '"Task 1"' });
      repo.create({ task_id: taskId2, field_name: 'name', old_value: null, new_value: '"Task 2"' });
      repo.create({ task_id: taskId, field_name: 'priority', old_value: '"none"', new_value: '"high"' });
      
      const history = repo.findByTaskId(taskId);
      expect(history.length).toBe(2);
      expect(history.every(h => h.task_id === taskId)).toBe(true);
    });
    
    test('should return empty array for task with no history', () => {
      const history = repo.findByTaskId(taskId);
      expect(history).toEqual([]);
    });
    
    test('should return history sorted by changed_at DESC', () => {
      const db = getTestDatabase();
      
      // Create entries with specific timestamps
      const now = new Date();
      const earlier = new Date(now.getTime() - 1000).toISOString();
      const later = new Date(now.getTime() + 1000).toISOString();
      
      db.prepare(`
        INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), taskId, 'name', null, '"First"', earlier);
      
      db.prepare(`
        INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), taskId, 'name', '"First"', '"Second"', later);
      
      const history = repo.findByTaskId(taskId);
      expect(history[0].new_value).toBe('"Second"');
      expect(history[1].new_value).toBe('"First"');
    });
  });
  
  describe('findByTaskIdAndField', () => {
    test('should return history for specific field', () => {
      repo.create({ task_id: taskId, field_name: 'name', old_value: '"A"', new_value: '"B"' });
      repo.create({ task_id: taskId, field_name: 'priority', old_value: '"none"', new_value: '"high"' });
      repo.create({ task_id: taskId, field_name: 'name', old_value: '"B"', new_value: '"C"' });
      
      const nameHistory = repo.findByTaskIdAndField(taskId, 'name');
      expect(nameHistory.length).toBe(2);
      expect(nameHistory.every(h => h.field_name === 'name')).toBe(true);
    });
    
    test('should return empty array for field with no changes', () => {
      repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: '"Test"' });
      
      const priorityHistory = repo.findByTaskIdAndField(taskId, 'priority');
      expect(priorityHistory).toEqual([]);
    });
  });
  
  describe('findRecent', () => {
    test('should return recent history with default limit', () => {
      for (let i = 0; i < 60; i++) {
        repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: `"${i}"` });
      }
      
      const recent = repo.findRecent();
      expect(recent.length).toBe(50);
    });
    
    test('should respect custom limit', () => {
      for (let i = 0; i < 20; i++) {
        repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: `"${i}"` });
      }
      
      const recent = repo.findRecent(10);
      expect(recent.length).toBe(10);
    });
    
    test('should return all if fewer than limit', () => {
      repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: '"Test"' });
      
      const recent = repo.findRecent(10);
      expect(recent.length).toBe(1);
    });
  });
  
  describe('findByDateRange', () => {
    test('should return history within date range', () => {
      const db = getTestDatabase();
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000).toISOString();
      const tomorrow = new Date(now.getTime() + 86400000).toISOString();
      const lastWeek = new Date(now.getTime() - 7 * 86400000).toISOString();
      
      db.prepare(`
        INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), taskId, 'name', null, '"Recent"', now.toISOString());
      
      db.prepare(`
        INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), taskId, 'name', '"Recent"', '"Old"', lastWeek);
      
      const history = repo.findByDateRange(yesterday, tomorrow);
      expect(history.length).toBe(1);
      expect(history[0].new_value).toBe('"Recent"');
    });
    
    test('should return empty array if no history in range', () => {
      const history = repo.findByDateRange(testDates.lastWeek, testDates.yesterday);
      expect(history).toEqual([]);
    });
  });
  
  describe('findByTaskIdWithDetails', () => {
    test('should return history with task name', () => {
      repo.create({ task_id: taskId, field_name: 'name', old_value: '"Old"', new_value: '"New"' });
      
      const history = repo.findByTaskIdWithDetails(taskId);
      expect(history.length).toBe(1);
      expect(history[0].task_name).toBe('Test Task');
    });
    
    test('should return empty array for task with no history', () => {
      const history = repo.findByTaskIdWithDetails(taskId);
      expect(history).toEqual([]);
    });
  });
  
  describe('countByTaskId', () => {
    test('should count history entries for a task', () => {
      repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: '"A"' });
      repo.create({ task_id: taskId, field_name: 'priority', old_value: '"none"', new_value: '"high"' });
      
      expect(repo.countByTaskId(taskId)).toBe(2);
    });
    
    test('should return 0 for task with no history', () => {
      expect(repo.countByTaskId(taskId)).toBe(0);
    });
  });
  
  describe('deleteByTaskId', () => {
    test('should delete all history for a task', () => {
      repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: '"A"' });
      repo.create({ task_id: taskId, field_name: 'priority', old_value: '"none"', new_value: '"high"' });
      
      const changes = repo.deleteByTaskId(taskId);
      expect(changes).toBe(2);
      expect(repo.findByTaskId(taskId)).toEqual([]);
    });
    
    test('should not affect other tasks history', () => {
      const taskId2 = createTestTaskInDb('Task 2');
      
      repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: '"A"' });
      repo.create({ task_id: taskId2, field_name: 'name', old_value: null, new_value: '"B"' });
      
      repo.deleteByTaskId(taskId);
      
      expect(repo.countByTaskId(taskId2)).toBe(1);
    });
  });
  
  describe('getLastChange', () => {
    test('should return most recent change for a field', () => {
      const db = getTestDatabase();
      
      const now = new Date();
      const earlier = new Date(now.getTime() - 1000).toISOString();
      const later = new Date(now.getTime() + 1000).toISOString();
      
      db.prepare(`
        INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), taskId, 'name', null, '"First"', earlier);
      
      db.prepare(`
        INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), taskId, 'name', '"First"', '"Second"', later);
      
      const lastChange = repo.getLastChange(taskId, 'name');
      expect(lastChange?.new_value).toBe('"Second"');
    });
    
    test('should return undefined if no changes for field', () => {
      repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: '"Test"' });
      
      const lastChange = repo.getLastChange(taskId, 'priority');
      expect(lastChange).toBeUndefined();
    });
  });
  
  describe('getChangeSummary', () => {
    test('should return summary of changes by field', () => {
      repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: '"A"' });
      repo.create({ task_id: taskId, field_name: 'name', old_value: '"A"', new_value: '"B"' });
      repo.create({ task_id: taskId, field_name: 'name', old_value: '"B"', new_value: '"C"' });
      repo.create({ task_id: taskId, field_name: 'priority', old_value: '"none"', new_value: '"high"' });
      
      const summary = repo.getChangeSummary(taskId);
      
      expect(summary.length).toBe(2);
      expect(summary.find(s => s.field_name === 'name')?.change_count).toBe(3);
      expect(summary.find(s => s.field_name === 'priority')?.change_count).toBe(1);
    });
    
    test('should return empty array for task with no history', () => {
      const summary = repo.getChangeSummary(taskId);
      expect(summary).toEqual([]);
    });
    
    test('should sort by change count DESC', () => {
      repo.create({ task_id: taskId, field_name: 'priority', old_value: null, new_value: '"high"' });
      repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: '"A"' });
      repo.create({ task_id: taskId, field_name: 'name', old_value: '"A"', new_value: '"B"' });
      
      const summary = repo.getChangeSummary(taskId);
      expect(summary[0].field_name).toBe('name');
      expect(summary[1].field_name).toBe('priority');
    });
  });
  
  describe('deleteOlderThan', () => {
    test('should delete history older than date', () => {
      const db = getTestDatabase();
      
      const now = new Date();
      const lastMonth = new Date(now.getTime() - 30 * 86400000).toISOString();
      const yesterday = new Date(now.getTime() - 86400000).toISOString();
      
      db.prepare(`
        INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), taskId, 'name', null, '"Old"', lastMonth);
      
      db.prepare(`
        INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), taskId, 'name', '"Old"', '"Recent"', yesterday);
      
      const cutoff = new Date(now.getTime() - 7 * 86400000).toISOString();
      const deleted = repo.deleteOlderThan(cutoff);
      
      expect(deleted).toBe(1);
      expect(repo.countByTaskId(taskId)).toBe(1);
    });
    
    test('should return 0 if nothing to delete', () => {
      const deleted = repo.deleteOlderThan(testDates.tomorrow);
      expect(deleted).toBe(0);
    });
  });
});

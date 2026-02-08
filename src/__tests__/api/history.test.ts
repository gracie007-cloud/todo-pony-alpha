/**
 * Task History API Tests
 * 
 * Tests for history endpoint.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { DEFAULT_LIST_ID } from '../utils/fixtures';
import type { TaskHistory } from '@/lib/db/schema';

function createMockTaskHistoryRepository() {
  const db = getTestDatabase();
  
  return {
    findByTaskId(taskId: string): TaskHistory[] {
      return db.prepare(`SELECT * FROM task_history WHERE task_id = ? ORDER BY changed_at DESC`).all(taskId) as TaskHistory[];
    },
    
    findByTaskIdAndField(taskId: string, fieldName: string): TaskHistory[] {
      return db.prepare(`SELECT * FROM task_history WHERE task_id = ? AND field_name = ? ORDER BY changed_at DESC`).all(taskId, fieldName) as TaskHistory[];
    },
    
    create(data: { task_id: string; field_name: string; old_value: string | null; new_value: string | null }): TaskHistory {
      const id = testUuid.generate();
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, data.task_id, data.field_name, data.old_value, data.new_value, now);
      
      return db.prepare('SELECT * FROM task_history WHERE id = ?').get(id) as TaskHistory;
    },
    
    countByTaskId(taskId: string): number {
      const result = db.prepare('SELECT COUNT(*) as count FROM task_history WHERE task_id = ?').get(taskId) as { count: number };
      return result.count;
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
  };
}

function createMockRequest(options: { method: string; body?: unknown }) {
  return { method: options.method, json: async () => options.body } as any;
}

function createTestTask(): string {
  const db = getTestDatabase();
  const id = testUuid.generate();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO tasks (id, list_id, name, priority, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, DEFAULT_LIST_ID, 'Test Task', 'none', 0, now, now);
  return id;
}

function createHistoryApiHandler() {
  const repo = createMockTaskHistoryRepository();
  return {
    repo,
    
    async GET(request: any, context: { params: { id: string } }) {
      try {
        const history = repo.findByTaskId(context.params.id);
        return { status: 200, data: { success: true, data: history, count: history.length } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to fetch history' } };
      }
    },
  };
}

describe('Task History API', () => {
  let handler: ReturnType<typeof createHistoryApiHandler>;
  let taskId: string;
  
  beforeEach(() => {
    clearTestDatabase();
    handler = createHistoryApiHandler();
    taskId = createTestTask();
  });
  
  describe('GET /api/tasks/[id]/history', () => {
    test('should return all history for a task', async () => {
      handler.repo.create({ task_id: taskId, field_name: 'name', old_value: '"Old"', new_value: '"New"' });
      handler.repo.create({ task_id: taskId, field_name: 'priority', old_value: '"none"', new_value: '"high"' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.length).toBe(2);
      expect(response.data.count).toBe(2);
    });
    
    test('should return empty array for task with no history', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.data.data).toEqual([]);
      expect(response.data.count).toBe(0);
    });
    
    test('should return history sorted by changed_at DESC', async () => {
      const db = getTestDatabase();
      const now = new Date();
      const earlier = new Date(now.getTime() - 1000).toISOString();
      const later = new Date(now.getTime() + 1000).toISOString();
      
      db.prepare(`INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at) VALUES (?, ?, ?, ?, ?, ?)`).run(testUuid.generate(), taskId, 'name', null, '"First"', earlier);
      db.prepare(`INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at) VALUES (?, ?, ?, ?, ?, ?)`).run(testUuid.generate(), taskId, 'name', '"First"', '"Second"', later);
      
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.data.data[0].new_value).toBe('"Second"');
      expect(response.data.data[1].new_value).toBe('"First"');
    });
    
    test('should include all history fields', async () => {
      handler.repo.create({ task_id: taskId, field_name: 'name', old_value: '"Old"', new_value: '"New"' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      const history = response.data.data[0];
      expect(history.id).toBeDefined();
      expect(history.task_id).toBe(taskId);
      expect(history.field_name).toBe('name');
      expect(history.old_value).toBe('"Old"');
      expect(history.new_value).toBe('"New"');
      expect(history.changed_at).toBeDefined();
    });
    
    test('should handle multiple changes to same field', async () => {
      handler.repo.create({ task_id: taskId, field_name: 'name', old_value: null, new_value: '"First"' });
      handler.repo.create({ task_id: taskId, field_name: 'name', old_value: '"First"', new_value: '"Second"' });
      handler.repo.create({ task_id: taskId, field_name: 'name', old_value: '"Second"', new_value: '"Third"' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.data.data.length).toBe(3);
      
      // All should be for 'name' field
      const allName = response.data.data.every((h: TaskHistory) => h.field_name === 'name');
      expect(allName).toBe(true);
    });
    
    test('should handle different field types', async () => {
      handler.repo.create({ task_id: taskId, field_name: 'name', old_value: '"Old"', new_value: '"New"' });
      handler.repo.create({ task_id: taskId, field_name: 'priority', old_value: '"none"', new_value: '"high"' });
      handler.repo.create({ task_id: taskId, field_name: 'completed', old_value: 'false', new_value: 'true' });
      handler.repo.create({ task_id: taskId, field_name: 'date', old_value: 'null', new_value: '"2024-01-01"' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.data.data.length).toBe(4);
      
      const fieldNames = response.data.data.map((h: TaskHistory) => h.field_name);
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('priority');
      expect(fieldNames).toContain('completed');
      expect(fieldNames).toContain('date');
    });
    
    test('should handle null values', async () => {
      handler.repo.create({ task_id: taskId, field_name: 'description', old_value: null, new_value: '"Added description"' });
      handler.repo.create({ task_id: taskId, field_name: 'description', old_value: '"Added description"', new_value: null });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.data.data.length).toBe(2);
      
      // First entry (most recent) should have null new_value
      expect(response.data.data[0].new_value).toBeNull();
      expect(response.data.data[0].old_value).toBe('"Added description"');
      
      // Second entry should have null old_value
      expect(response.data.data[1].old_value).toBeNull();
      expect(response.data.data[1].new_value).toBe('"Added description"');
    });
  });
});

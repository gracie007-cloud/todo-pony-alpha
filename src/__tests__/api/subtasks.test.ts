/**
 * Subtasks API Tests
 * 
 * Tests for subtask endpoints.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { DEFAULT_LIST_ID } from '../utils/fixtures';
import type { Subtask } from '@/lib/db/schema';

// Helper to create SubtasksRepository with test database
function createMockSubtasksRepository() {
  const db = getTestDatabase();
  
  return {
    findById(id: string): Subtask | undefined {
      return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as Subtask | undefined;
    },
    
    findByTaskId(taskId: string): Subtask[] {
      return db.prepare(`SELECT * FROM subtasks WHERE task_id = ? ORDER BY "order" ASC`).all(taskId) as Subtask[];
    },
    
    create(data: { task_id: string; name: string; completed?: boolean; order?: number }): Subtask {
      const id = testUuid.generate();
      const now = new Date().toISOString();
      const maxOrder = this.getMaxOrder(data.task_id);
      const order = data.order ?? maxOrder + 1;
      
      db.prepare(`
        INSERT INTO subtasks (id, task_id, name, completed, "order", created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, data.task_id, data.name, data.completed ? 1 : 0, order, now);
      
      return this.findById(id)!;
    },
    
    update(id: string, data: Partial<{ name: string; completed: boolean; order: number }>): Subtask | undefined {
      const existing = this.findById(id);
      if (!existing) return undefined;
      
      const updates: string[] = [];
      const values: unknown[] = [];
      
      if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
      if (data.completed !== undefined) { updates.push('completed = ?'); values.push(data.completed ? 1 : 0); }
      if (data.order !== undefined) { updates.push('"order" = ?'); values.push(data.order); }
      
      if (updates.length === 0) return existing;
      
      values.push(id);
      db.prepare(`UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      
      return this.findById(id);
    },
    
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
      return result.changes > 0;
    },
    
    getMaxOrder(taskId: string): number {
      const result = db.prepare(`SELECT COALESCE(MAX("order"), -1) as max_order FROM subtasks WHERE task_id = ?`).get(taskId) as { max_order: number };
      return result.max_order;
    },
    
    reorder(taskId: string, subtaskIds: string[]): void {
      const transaction = db.transaction(() => {
        subtaskIds.forEach((id, index) => {
          db.prepare(`UPDATE subtasks SET "order" = ? WHERE id = ? AND task_id = ?`).run(index, id, taskId);
        });
      });
      transaction();
    },
    
    toggleComplete(id: string): Subtask | undefined {
      const existing = this.findById(id);
      if (!existing) return undefined;
      return this.update(id, { completed: !existing.completed });
    },
    
    countByTaskId(taskId: string): number {
      const result = db.prepare('SELECT COUNT(*) as count FROM subtasks WHERE task_id = ?').get(taskId) as { count: number };
      return result.count;
    },
  };
}

function createMockRequest(options: { method: string; body?: unknown }) {
  return {
    method: options.method,
    json: async () => options.body,
  } as any;
}

function createTestTask(): string {
  const db = getTestDatabase();
  const id = testUuid.generate();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO tasks (id, list_id, name, priority, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, DEFAULT_LIST_ID, 'Test Task', 'none', 0, now, now);
  return id;
}

function createSubtasksApiHandler() {
  const repo = createMockSubtasksRepository();
  return {
    repo,
    
    async GET(request: any, context: { params: { id: string } }) {
      try {
        const subtasks = repo.findByTaskId(context.params.id);
        return { status: 200, data: { success: true, data: subtasks } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to fetch subtasks' } };
      }
    },
    
    async POST(request: any, context: { params: { id: string } }) {
      try {
        const body = await request.json();
        
        if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
          return { status: 400, data: { success: false, error: 'Subtask name is required' } };
        }
        
        const subtask = repo.create({ task_id: context.params.id, name: body.name, completed: body.completed });
        return { status: 201, data: { success: true, data: subtask } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to create subtask' } };
      }
    },
  };
}

function createSubtaskByIdApiHandler() {
  const repo = createMockSubtasksRepository();
  return {
    repo,
    
    async GET(request: any, context: { params: { id: string; subtaskId: string } }) {
      try {
        const subtask = repo.findById(context.params.subtaskId);
        if (!subtask) {
          return { status: 404, data: { success: false, error: 'Subtask not found' } };
        }
        return { status: 200, data: { success: true, data: subtask } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to fetch subtask' } };
      }
    },
    
    async PUT(request: any, context: { params: { id: string; subtaskId: string } }) {
      try {
        const body = await request.json();
        const updated = repo.update(context.params.subtaskId, body);
        if (!updated) {
          return { status: 404, data: { success: false, error: 'Subtask not found' } };
        }
        return { status: 200, data: { success: true, data: updated } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to update subtask' } };
      }
    },
    
    async DELETE(request: any, context: { params: { id: string; subtaskId: string } }) {
      try {
        const subtask = repo.findById(context.params.subtaskId);
        if (!subtask) {
          return { status: 404, data: { success: false, error: 'Subtask not found' } };
        }
        const deleted = repo.delete(context.params.subtaskId);
        if (!deleted) {
          return { status: 500, data: { success: false, error: 'Failed to delete subtask' } };
        }
        return { status: 200, data: { success: true, data: null } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to delete subtask' } };
      }
    },
  };
}

describe('Subtasks API', () => {
  let handler: ReturnType<typeof createSubtasksApiHandler>;
  let byIdHandler: ReturnType<typeof createSubtaskByIdApiHandler>;
  let taskId: string;
  
  beforeEach(() => {
    clearTestDatabase();
    handler = createSubtasksApiHandler();
    byIdHandler = createSubtaskByIdApiHandler();
    taskId = createTestTask();
  });
  
  describe('GET /api/tasks/[id]/subtasks', () => {
    test('should return all subtasks for a task', async () => {
      handler.repo.create({ task_id: taskId, name: 'Subtask 1' });
      handler.repo.create({ task_id: taskId, name: 'Subtask 2' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.length).toBe(2);
    });
    
    test('should return empty array for task with no subtasks', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.data.data).toEqual([]);
    });
    
    test('should return subtasks ordered by order field', async () => {
      handler.repo.create({ task_id: taskId, name: 'Third', order: 2 });
      handler.repo.create({ task_id: taskId, name: 'First', order: 0 });
      handler.repo.create({ task_id: taskId, name: 'Second', order: 1 });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.data.data[0].name).toBe('First');
      expect(response.data.data[1].name).toBe('Second');
      expect(response.data.data[2].name).toBe('Third');
    });
  });
  
  describe('POST /api/tasks/[id]/subtasks', () => {
    test('should create a new subtask', async () => {
      const request = createMockRequest({ method: 'POST', body: { name: 'New Subtask' } });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.status).toBe(201);
      expect(response.data.data.name).toBe('New Subtask');
      expect(response.data.data.task_id).toBe(taskId);
    });
    
    test('should create completed subtask', async () => {
      const request = createMockRequest({ method: 'POST', body: { name: 'Done', completed: true } });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.data.data.completed).toBe(true);
    });
    
    test('should auto-increment order', async () => {
      const request1 = createMockRequest({ method: 'POST', body: { name: 'First' } });
      const response1 = await handler.POST(request1, { params: { id: taskId } });
      
      const request2 = createMockRequest({ method: 'POST', body: { name: 'Second' } });
      const response2 = await handler.POST(request2, { params: { id: taskId } });
      
      expect(response1.data.data.order).toBe(0);
      expect(response2.data.data.order).toBe(1);
    });
    
    test('should reject empty name', async () => {
      const request = createMockRequest({ method: 'POST', body: { name: '' } });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('GET /api/tasks/[id]/subtasks/[subtaskId]', () => {
    test('should return subtask by ID', async () => {
      const subtask = handler.repo.create({ task_id: taskId, name: 'Test' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: taskId, subtaskId: subtask.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Test');
    });
    
    test('should return 404 for non-existent subtask', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: taskId, subtaskId: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('PUT /api/tasks/[id]/subtasks/[subtaskId]', () => {
    test('should update subtask name', async () => {
      const subtask = handler.repo.create({ task_id: taskId, name: 'Original' });
      
      const request = createMockRequest({ method: 'PUT', body: { name: 'Updated' } });
      const response = await byIdHandler.PUT(request, { params: { id: taskId, subtaskId: subtask.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Updated');
    });
    
    test('should update subtask completion', async () => {
      const subtask = handler.repo.create({ task_id: taskId, name: 'Test' });
      
      const request = createMockRequest({ method: 'PUT', body: { completed: true } });
      const response = await byIdHandler.PUT(request, { params: { id: taskId, subtaskId: subtask.id } });
      
      expect(response.data.data.completed).toBe(true);
    });
    
    test('should update subtask order', async () => {
      const subtask = handler.repo.create({ task_id: taskId, name: 'Test', order: 0 });
      
      const request = createMockRequest({ method: 'PUT', body: { order: 5 } });
      const response = await byIdHandler.PUT(request, { params: { id: taskId, subtaskId: subtask.id } });
      
      expect(response.data.data.order).toBe(5);
    });
    
    test('should return 404 for non-existent subtask', async () => {
      const request = createMockRequest({ method: 'PUT', body: { name: 'Updated' } });
      const response = await byIdHandler.PUT(request, { params: { id: taskId, subtaskId: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('DELETE /api/tasks/[id]/subtasks/[subtaskId]', () => {
    test('should delete an existing subtask', async () => {
      const subtask = handler.repo.create({ task_id: taskId, name: 'To Delete' });
      
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: taskId, subtaskId: subtask.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
    
    test('should return 404 for non-existent subtask', async () => {
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: taskId, subtaskId: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
  });
});

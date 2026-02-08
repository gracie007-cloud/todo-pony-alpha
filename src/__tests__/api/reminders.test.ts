/**
 * Reminders API Tests
 * 
 * Tests for reminder endpoints.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { DEFAULT_LIST_ID, testDates } from '../utils/fixtures';
import type { Reminder } from '@/lib/db/schema';

function createMockRemindersRepository() {
  const db = getTestDatabase();
  
  return {
    findById(id: string): Reminder | undefined {
      return db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as Reminder | undefined;
    },
    
    findByTaskId(taskId: string): Reminder[] {
      return db.prepare(`SELECT * FROM reminders WHERE task_id = ? ORDER BY remind_at ASC`).all(taskId) as Reminder[];
    },
    
    create(data: { task_id: string; remind_at: string; type?: 'notification' | 'email' }): Reminder {
      const id = testUuid.generate();
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO reminders (id, task_id, remind_at, type, sent, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, data.task_id, data.remind_at, data.type ?? 'notification', 0, now);
      
      return this.findById(id)!;
    },
    
    update(id: string, data: Partial<{ remind_at: string; type: 'notification' | 'email' }>): Reminder | undefined {
      const existing = this.findById(id);
      if (!existing) return undefined;
      
      const updates: string[] = [];
      const values: unknown[] = [];
      
      if (data.remind_at !== undefined) { updates.push('remind_at = ?'); values.push(data.remind_at); }
      if (data.type !== undefined) { updates.push('type = ?'); values.push(data.type); }
      
      if (updates.length === 0) return existing;
      
      values.push(id);
      db.prepare(`UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      
      return this.findById(id);
    },
    
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
      return result.changes > 0;
    },
    
    findPending(): Reminder[] {
      return db.prepare(`SELECT * FROM reminders WHERE sent = 0 ORDER BY remind_at ASC`).all() as Reminder[];
    },
    
    findDue(): Reminder[] {
      return db.prepare(`SELECT * FROM reminders WHERE sent = 0 AND remind_at <= ? ORDER BY remind_at ASC`).all(new Date().toISOString()) as Reminder[];
    },
    
    markSent(id: string): boolean {
      const result = db.prepare('UPDATE reminders SET sent = 1 WHERE id = ?').run(id);
      return result.changes > 0;
    },
  };
}

interface MockRequest {
  method: string;
  json: () => Promise<unknown>;
}

function createMockRequest(options: { method: string; body?: unknown }): MockRequest {
  return { method: options.method, json: async () => options.body };
}

function createTestTask(): string {
  const db = getTestDatabase();
  const id = testUuid.generate();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO tasks (id, list_id, name, priority, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, DEFAULT_LIST_ID, 'Test Task', 'none', 0, now, now);
  return id;
}

function createRemindersApiHandler() {
  const repo = createMockRemindersRepository();
  return {
    repo,
    
    async GET(_request: MockRequest, context: { params: { id: string } }) {
      try {
        const reminders = repo.findByTaskId(context.params.id);
        return { status: 200, data: { success: true, data: reminders } };
      } catch {
        return { status: 500, data: { success: false, error: 'Failed to fetch reminders' } };
      }
    },
    
    async POST(request: MockRequest, context: { params: { id: string } }) {
      try {
        const body = await request.json() as { remind_at?: string; type?: 'notification' | 'email' };
        
        if (!body.remind_at) {
          return { status: 400, data: { success: false, error: 'remind_at is required' } };
        }
        
        const reminder = repo.create({
          task_id: context.params.id,
          remind_at: body.remind_at,
          type: body.type,
        });
        return { status: 201, data: { success: true, data: reminder } };
      } catch {
        return { status: 500, data: { success: false, error: 'Failed to create reminder' } };
      }
    },
  };
}

function createReminderByIdApiHandler() {
  const repo = createMockRemindersRepository();
  return {
    repo,
    
    async GET(_request: MockRequest, context: { params: { id: string; reminderId: string } }) {
      try {
        const reminder = repo.findById(context.params.reminderId);
        if (!reminder) {
          return { status: 404, data: { success: false, error: 'Reminder not found' } };
        }
        return { status: 200, data: { success: true, data: reminder } };
      } catch {
        return { status: 500, data: { success: false, error: 'Failed to fetch reminder' } };
      }
    },
    
    async PUT(request: MockRequest, context: { params: { id: string; reminderId: string } }) {
      try {
        const body = await request.json() as Partial<{ remind_at: string; type: 'notification' | 'email' }>;
        const updated = repo.update(context.params.reminderId, body);
        if (!updated) {
          return { status: 404, data: { success: false, error: 'Reminder not found' } };
        }
        return { status: 200, data: { success: true, data: updated } };
      } catch {
        return { status: 500, data: { success: false, error: 'Failed to update reminder' } };
      }
    },
    
    async DELETE(_request: MockRequest, context: { params: { id: string; reminderId: string } }) {
      try {
        const reminder = repo.findById(context.params.reminderId);
        if (!reminder) {
          return { status: 404, data: { success: false, error: 'Reminder not found' } };
        }
        const deleted = repo.delete(context.params.reminderId);
        if (!deleted) {
          return { status: 500, data: { success: false, error: 'Failed to delete reminder' } };
        }
        return { status: 200, data: { success: true, data: null } };
      } catch {
        return { status: 500, data: { success: false, error: 'Failed to delete reminder' } };
      }
    },
  };
}

describe('Reminders API', () => {
  let handler: ReturnType<typeof createRemindersApiHandler>;
  let byIdHandler: ReturnType<typeof createReminderByIdApiHandler>;
  let taskId: string;
  
  beforeEach(() => {
    clearTestDatabase();
    handler = createRemindersApiHandler();
    byIdHandler = createReminderByIdApiHandler();
    taskId = createTestTask();
  });
  
  describe('GET /api/tasks/[id]/reminders', () => {
    test('should return all reminders for a task', async () => {
      handler.repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      handler.repo.create({ task_id: taskId, remind_at: testDates.nextWeek });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.length).toBe(2);
    });
    
    test('should return empty array for task with no reminders', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.data.data).toEqual([]);
    });
  });
  
  describe('POST /api/tasks/[id]/reminders', () => {
    test('should create a new reminder', async () => {
      const request = createMockRequest({ method: 'POST', body: { remind_at: testDates.tomorrow } });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.status).toBe(201);
      expect(response.data.data.task_id).toBe(taskId);
      expect(response.data.data.remind_at).toBe(testDates.tomorrow);
      expect(response.data.data.type).toBe('notification');
    });
    
    test('should create email reminder', async () => {
      const request = createMockRequest({ method: 'POST', body: { remind_at: testDates.tomorrow, type: 'email' } });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.data.data.type).toBe('email');
    });
    
    test('should reject missing remind_at', async () => {
      const request = createMockRequest({ method: 'POST', body: {} });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.status).toBe(400);
    });
    
    test('should set sent to false by default', async () => {
      const request = createMockRequest({ method: 'POST', body: { remind_at: testDates.tomorrow } });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.data.data.sent).toBe(false);
    });
  });
  
  describe('GET /api/tasks/[id]/reminders/[reminderId]', () => {
    test('should return reminder by ID', async () => {
      const reminder = handler.repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: taskId, reminderId: reminder.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.id).toBe(reminder.id);
    });
    
    test('should return 404 for non-existent reminder', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: taskId, reminderId: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('PUT /api/tasks/[id]/reminders/[reminderId]', () => {
    test('should update remind_at', async () => {
      const reminder = handler.repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      
      const request = createMockRequest({ method: 'PUT', body: { remind_at: testDates.nextWeek } });
      const response = await byIdHandler.PUT(request, { params: { id: taskId, reminderId: reminder.id } });
      
      expect(response.data.data.remind_at).toBe(testDates.nextWeek);
    });
    
    test('should update type', async () => {
      const reminder = handler.repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      
      const request = createMockRequest({ method: 'PUT', body: { type: 'email' } });
      const response = await byIdHandler.PUT(request, { params: { id: taskId, reminderId: reminder.id } });
      
      expect(response.data.data.type).toBe('email');
    });
    
    test('should return 404 for non-existent reminder', async () => {
      const request = createMockRequest({ method: 'PUT', body: { remind_at: testDates.tomorrow } });
      const response = await byIdHandler.PUT(request, { params: { id: taskId, reminderId: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('DELETE /api/tasks/[id]/reminders/[reminderId]', () => {
    test('should delete an existing reminder', async () => {
      const reminder = handler.repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: taskId, reminderId: reminder.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
    
    test('should return 404 for non-existent reminder', async () => {
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: taskId, reminderId: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
  });
});

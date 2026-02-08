/**
 * Labels API Tests
 * 
 * Tests for all CRUD operations.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { createTestLabel, DEFAULT_LIST_ID } from '../utils/fixtures';
import type { Label } from '@/lib/db/schema';

// Helper to create LabelsRepository with test database
function createMockLabelsRepository() {
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
      
      if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
      if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
      if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
      
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
      if (excludeId) { sql += ' AND id != ?'; values.push(excludeId); }
      return db.prepare(sql).get(...values) !== undefined;
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
      const result = db.prepare(`INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)`).run(taskId, labelId);
      return result.changes > 0;
    },
    
    removeFromTask(taskId: string, labelId: string): boolean {
      const result = db.prepare(`DELETE FROM task_labels WHERE task_id = ? AND label_id = ?`).run(taskId, labelId);
      return result.changes > 0;
    },
    
    getTaskCount(labelId: string): number {
      const result = db.prepare(`SELECT COUNT(*) as count FROM task_labels WHERE label_id = ?`).get(labelId) as { count: number };
      return result.count;
    },
  };
}

function createMockRequest(options: { method: string; body?: unknown; url?: string }) {
  return {
    method: options.method,
    url: options.url || 'http://localhost/api/labels',
    json: async () => options.body,
  } as any;
}

function createLabelsApiHandler() {
  const repo = createMockLabelsRepository();
  
  return {
    repo,
    
    async GET() {
      try {
        const labels = repo.findAll();
        return { status: 200, data: { success: true, data: labels } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to fetch labels' } };
      }
    },
    
    async POST(request: any) {
      try {
        const body = await request.json();
        
        if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
          return { status: 400, data: { success: false, error: 'Validation error', details: [{ message: 'Label name is required' }] } };
        }
        
        if (body.name.length > 50) {
          return { status: 400, data: { success: false, error: 'Validation error', details: [{ message: 'Label name must be at most 50 characters' }] } };
        }
        
        if (repo.nameExists(body.name)) {
          return { status: 409, data: { success: false, error: 'Label with this name already exists' } };
        }
        
        const label = repo.create({ name: body.name, color: body.color, icon: body.icon });
        return { status: 201, data: { success: true, data: label } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to create label' } };
      }
    },
  };
}

function createLabelByIdApiHandler() {
  const repo = createMockLabelsRepository();
  
  return {
    repo,
    
    async GET(request: any, context: { params: { id: string } }) {
      try {
        const label = repo.findById(context.params.id);
        if (!label) {
          return { status: 404, data: { success: false, error: 'Label not found' } };
        }
        return { status: 200, data: { success: true, data: label } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to fetch label' } };
      }
    },
    
    async PUT(request: any, context: { params: { id: string } }) {
      try {
        const body = await request.json();
        
        if (body.name && repo.nameExists(body.name, context.params.id)) {
          return { status: 409, data: { success: false, error: 'Label with this name already exists' } };
        }
        
        const updated = repo.update(context.params.id, body);
        if (!updated) {
          return { status: 404, data: { success: false, error: 'Label not found' } };
        }
        return { status: 200, data: { success: true, data: updated } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to update label' } };
      }
    },
    
    async DELETE(request: any, context: { params: { id: string } }) {
      try {
        const label = repo.findById(context.params.id);
        if (!label) {
          return { status: 404, data: { success: false, error: 'Label not found' } };
        }
        
        const deleted = repo.delete(context.params.id);
        if (!deleted) {
          return { status: 500, data: { success: false, error: 'Failed to delete label' } };
        }
        return { status: 200, data: { success: true, data: null } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to delete label' } };
      }
    },
  };
}

describe('Labels API', () => {
  let handler: ReturnType<typeof createLabelsApiHandler>;
  let byIdHandler: ReturnType<typeof createLabelByIdApiHandler>;
  
  beforeEach(() => {
    clearTestDatabase();
    handler = createLabelsApiHandler();
    byIdHandler = createLabelByIdApiHandler();
  });
  
  describe('GET /api/labels', () => {
    test('should return all labels', async () => {
      handler.repo.create({ name: 'Work' });
      handler.repo.create({ name: 'Personal' });
      
      const response = await handler.GET();
      
      expect(response.status).toBe(200);
      expect(response.data.data.length).toBe(2);
    });
    
    test('should return empty array when no labels', async () => {
      const response = await handler.GET();
      expect(response.data.data).toEqual([]);
    });
    
    test('should return labels sorted by name', async () => {
      handler.repo.create({ name: 'Zebra' });
      handler.repo.create({ name: 'Alpha' });
      
      const response = await handler.GET();
      
      expect(response.data.data[0].name).toBe('Alpha');
      expect(response.data.data[1].name).toBe('Zebra');
    });
  });
  
  describe('POST /api/labels', () => {
    test('should create a new label', async () => {
      const request = createMockRequest({ method: 'POST', body: { name: 'Work' } });
      const response = await handler.POST(request);
      
      expect(response.status).toBe(201);
      expect(response.data.data.name).toBe('Work');
    });
    
    test('should create label with custom color', async () => {
      const request = createMockRequest({ method: 'POST', body: { name: 'Urgent', color: '#ff0000' } });
      const response = await handler.POST(request);
      
      expect(response.data.data.color).toBe('#ff0000');
    });
    
    test('should create label with icon', async () => {
      const request = createMockRequest({ method: 'POST', body: { name: 'Home', icon: '🏠' } });
      const response = await handler.POST(request);
      
      expect(response.data.data.icon).toBe('🏠');
    });
    
    test('should reject empty name', async () => {
      const request = createMockRequest({ method: 'POST', body: { name: '' } });
      const response = await handler.POST(request);
      
      expect(response.status).toBe(400);
    });
    
    test('should reject duplicate name', async () => {
      handler.repo.create({ name: 'Work' });
      
      const request = createMockRequest({ method: 'POST', body: { name: 'Work' } });
      const response = await handler.POST(request);
      
      expect(response.status).toBe(409);
    });
    
    test('should reject name longer than 50 characters', async () => {
      const request = createMockRequest({ method: 'POST', body: { name: 'a'.repeat(51) } });
      const response = await handler.POST(request);
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('GET /api/labels/[id]', () => {
    test('should return label by ID', async () => {
      const label = handler.repo.create({ name: 'Test' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: label.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Test');
    });
    
    test('should return 404 for non-existent label', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('PUT /api/labels/[id]', () => {
    test('should update label name', async () => {
      const label = handler.repo.create({ name: 'Original' });
      
      const request = createMockRequest({ method: 'PUT', body: { name: 'Updated' } });
      const response = await byIdHandler.PUT(request, { params: { id: label.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Updated');
    });
    
    test('should update label color', async () => {
      const label = handler.repo.create({ name: 'Test', color: '#000000' });
      
      const request = createMockRequest({ method: 'PUT', body: { color: '#ffffff' } });
      const response = await byIdHandler.PUT(request, { params: { id: label.id } });
      
      expect(response.data.data.color).toBe('#ffffff');
    });
    
    test('should reject duplicate name on update', async () => {
      handler.repo.create({ name: 'Existing' });
      const label = handler.repo.create({ name: 'Original' });
      
      const request = createMockRequest({ method: 'PUT', body: { name: 'Existing' } });
      const response = await byIdHandler.PUT(request, { params: { id: label.id } });
      
      expect(response.status).toBe(409);
    });
    
    test('should allow keeping same name', async () => {
      const label = handler.repo.create({ name: 'Test' });
      
      const request = createMockRequest({ method: 'PUT', body: { name: 'Test', color: '#ff0000' } });
      const response = await byIdHandler.PUT(request, { params: { id: label.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Test');
      expect(response.data.data.color).toBe('#ff0000');
    });
    
    test('should return 404 for non-existent label', async () => {
      const request = createMockRequest({ method: 'PUT', body: { name: 'Updated' } });
      const response = await byIdHandler.PUT(request, { params: { id: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('DELETE /api/labels/[id]', () => {
    test('should delete an existing label', async () => {
      const label = handler.repo.create({ name: 'To Delete' });
      
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: label.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
    
    test('should return 404 for non-existent label', async () => {
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
    
    test('should cascade delete task associations', async () => {
      const db = getTestDatabase();
      const label = handler.repo.create({ name: 'Test' });
      
      // Create task and add label
      const taskId = testUuid.generate();
      db.prepare(`INSERT INTO tasks (id, list_id, name, priority, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(taskId, DEFAULT_LIST_ID, 'Task', 'none', 0, new Date().toISOString(), new Date().toISOString());
      handler.repo.addToTask(taskId, label.id);
      
      const request = createMockRequest({ method: 'DELETE' });
      await byIdHandler.DELETE(request, { params: { id: label.id } });
      
      // Verify association is deleted
      const associations = db.prepare('SELECT * FROM task_labels WHERE label_id = ?').all(label.id);
      expect(associations.length).toBe(0);
    });
  });
});

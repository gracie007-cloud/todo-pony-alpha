/**
 * Lists API Tests
 * 
 * Tests for GET, POST, PUT, DELETE endpoints.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { DEFAULT_LIST_ID } from '../utils/fixtures';
import type { List } from '@/lib/db/schema';

// Mock repository
function createMockListsRepository() {
  const db = getTestDatabase();
  
  return {
    findAll(): List[] {
      return db.prepare('SELECT * FROM lists ORDER BY is_default DESC, name ASC').all() as List[];
    },
    
    findById(id: string): List | undefined {
      return db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as List | undefined;
    },
    
    findDefault(): List | undefined {
      return db.prepare('SELECT * FROM lists WHERE is_default = 1').get() as List | undefined;
    },
    
    findAllWithTaskCounts(): Array<List & { task_count: number; completed_count: number }> {
      return db.prepare(`
        SELECT 
          l.*,
          COUNT(t.id) as task_count,
          SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) as completed_count
        FROM lists l
        LEFT JOIN tasks t ON l.id = t.list_id
        GROUP BY l.id
        ORDER BY l.is_default DESC, l.name ASC
      `).all() as Array<List & { task_count: number; completed_count: number }>;
    },
    
    create(data: { name: string; color?: string; emoji?: string | null; is_default?: boolean }): List {
      const id = testUuid.generate();
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.name,
        data.color ?? '#6366f1',
        data.emoji ?? null,
        data.is_default ? 1 : 0,
        now,
        now
      );
      
      return this.findById(id)!;
    },
    
    update(id: string, data: Partial<{ name: string; color: string; emoji: string | null; is_default: boolean }>): List | undefined {
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
      if (data.emoji !== undefined) {
        updates.push('emoji = ?');
        values.push(data.emoji);
      }
      if (data.is_default !== undefined) {
        updates.push('is_default = ?');
        values.push(data.is_default ? 1 : 0);
      }
      
      if (updates.length === 0) return existing;
      
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);
      
      db.prepare(`UPDATE lists SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      
      return this.findById(id);
    },
    
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM lists WHERE id = ?').run(id);
      return result.changes > 0;
    },
    
    hasTasks(id: string): boolean {
      const result = db.prepare('SELECT 1 FROM tasks WHERE list_id = ? LIMIT 1').get(id);
      return result !== undefined;
    },
    
    setAsDefault(id: string): List | undefined {
      const existing = this.findById(id);
      if (!existing) return undefined;
      
      const transaction = db.transaction(() => {
        db.prepare('UPDATE lists SET is_default = 0 WHERE is_default = 1').run();
        db.prepare('UPDATE lists SET is_default = 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
      });
      
      transaction();
      return this.findById(id);
    },
  };
}

// Mock NextRequest and NextResponse
interface MockRequest {
  method: string;
  url: string;
  json: () => Promise<unknown>;
  nextUrl: URL;
}

function createMockRequest(options: {
  method: string;
  body?: unknown;
  url?: string;
}): MockRequest {
  const url = new URL(options.url || 'http://localhost/api/lists');
  
  return {
    method: options.method,
    url: options.url || 'http://localhost/api/lists',
    json: async () => options.body,
    nextUrl: url,
  };
}

// Simulate API handlers
function createListsApiHandler() {
  const repo = createMockListsRepository();
  
  return {
    repo,
    
    async GET() {
      try {
        const lists = repo.findAllWithTaskCounts();
        return { status: 200, data: { success: true, data: lists } };
      } catch {
        return { status: 500, data: { success: false, error: 'Failed to fetch lists' } };
      }
    },
    
    async POST(request: MockRequest) {
      try {
        const body = await request.json() as { name?: string; color?: string; emoji?: string; is_default?: boolean };
        
        // Validate required fields
        if (!body.name || typeof body.name !== 'string' || body.name.length === 0) {
          return { status: 400, data: { success: false, error: 'Validation error', details: [{ message: 'List name is required' }] } };
        }
        
        if (body.name.length > 100) {
          return { status: 400, data: { success: false, error: 'Validation error', details: [{ message: 'List name must be at most 100 characters' }] } };
        }
        
        const list = repo.create({
          name: body.name,
          color: body.color,
          emoji: body.emoji,
          is_default: body.is_default,
        });
        
        return { status: 201, data: { success: true, data: list } };
      } catch {
        return { status: 500, data: { success: false, error: 'Failed to create list' } };
      }
    },
  };
}

function createListByIdApiHandler() {
  const repo = createMockListsRepository();
  
  return {
    repo,
    
    async GET(_request: MockRequest, context: { params: { id: string } }) {
      try {
        const list = repo.findById(context.params.id);
        
        if (!list) {
          return { status: 404, data: { success: false, error: 'List not found' } };
        }
        
        return { status: 200, data: { success: true, data: list } };
      } catch {
        return { status: 500, data: { success: false, error: 'Failed to fetch list' } };
      }
    },
    
    async PUT(request: MockRequest, context: { params: { id: string } }) {
      try {
        const body = await request.json() as Partial<{ name: string; color: string; emoji: string | null; is_default: boolean }>;
        const updated = repo.update(context.params.id, body);
        
        if (!updated) {
          return { status: 404, data: { success: false, error: 'List not found' } };
        }
        
        return { status: 200, data: { success: true, data: updated } };
      } catch {
        return { status: 500, data: { success: false, error: 'Failed to update list' } };
      }
    },
    
    async DELETE(_request: MockRequest, context: { params: { id: string } }) {
      try {
        // Check if list exists
        const list = repo.findById(context.params.id);
        if (!list) {
          return { status: 404, data: { success: false, error: 'List not found' } };
        }
        
        // Prevent deletion of default list
        if (list.is_default) {
          return { status: 400, data: { success: false, error: 'Cannot delete the default list' } };
        }
        
        // Check if list has tasks
        if (repo.hasTasks(context.params.id)) {
          return { status: 400, data: { success: false, error: 'Cannot delete a list that has tasks' } };
        }
        
        const deleted = repo.delete(context.params.id);
        
        if (!deleted) {
          return { status: 500, data: { success: false, error: 'Failed to delete list' } };
        }
        
        return { status: 200, data: { success: true, data: null } };
      } catch {
        return { status: 500, data: { success: false, error: 'Failed to delete list' } };
      }
    },
  };
}

describe('Lists API', () => {
  let handler: ReturnType<typeof createListsApiHandler>;
  let byIdHandler: ReturnType<typeof createListByIdApiHandler>;
  
  beforeEach(() => {
    clearTestDatabase();
    handler = createListsApiHandler();
    byIdHandler = createListByIdApiHandler();
    // Share the same repo between handlers
    byIdHandler.repo = handler.repo;
  });
  
  describe('GET /api/lists', () => {
    test('should return all lists with task counts', async () => {
      const response = await handler.GET();
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.data.length).toBe(1); // Default list
    });
    
    test('should include default list', async () => {
      const response = await handler.GET();
      const lists = response.data.data as Array<List & { task_count: number; completed_count: number }>;
      
      const defaultList = lists.find((l) => l.is_default);
      expect(defaultList).toBeDefined();
      expect(defaultList!.name).toBe('Inbox');
    });
    
    test('should return lists with task counts', async () => {
      handler.repo.create({ name: 'Custom List' });
      
      const response = await handler.GET();
      const lists = response.data.data as Array<List & { task_count: number; completed_count: number }>;
      const customList = lists.find((l) => l.name === 'Custom List');
      
      expect(customList!.task_count).toBeDefined();
      expect(customList!.completed_count).toBeDefined();
    });
  });
  
  describe('POST /api/lists', () => {
    test('should create a new list', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { name: 'New List' },
      });
      
      const response = await handler.POST(request);
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('New List');
    });
    
    test('should create list with custom color', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { name: 'Colored List', color: '#ff0000' },
      });
      
      const response = await handler.POST(request);
      
      expect(response.data.data.color).toBe('#ff0000');
    });
    
    test('should create list with emoji', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { name: 'Emoji List', emoji: '🔥' },
      });
      
      const response = await handler.POST(request);
      
      expect(response.data.data.emoji).toBe('🔥');
    });
    
    test('should reject empty name', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { name: '' },
      });
      
      const response = await handler.POST(request);
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
    
    test('should reject missing name', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {},
      });
      
      const response = await handler.POST(request);
      
      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
    
    test('should reject name longer than 100 characters', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { name: 'a'.repeat(101) },
      });
      
      const response = await handler.POST(request);
      
      expect(response.status).toBe(400);
    });
  });
  
  describe('GET /api/lists/[id]', () => {
    test('should return list by ID', async () => {
      const list = handler.repo.create({ name: 'Test List' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: list.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Test List');
    });
    
    test('should return 404 for non-existent list', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: testUuid.generate() } });
      
      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });
    
    test('should return default list', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: DEFAULT_LIST_ID } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.is_default).toBe(true);
    });
  });
  
  describe('PUT /api/lists/[id]', () => {
    test('should update list name', async () => {
      const list = handler.repo.create({ name: 'Original' });
      
      const request = createMockRequest({
        method: 'PUT',
        body: { name: 'Updated' },
      });
      
      const response = await byIdHandler.PUT(request, { params: { id: list.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Updated');
    });
    
    test('should update list color', async () => {
      const list = handler.repo.create({ name: 'Test', color: '#000000' });
      
      const request = createMockRequest({
        method: 'PUT',
        body: { color: '#ffffff' },
      });
      
      const response = await byIdHandler.PUT(request, { params: { id: list.id } });
      
      expect(response.data.data.color).toBe('#ffffff');
    });
    
    test('should return 404 for non-existent list', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: { name: 'Updated' },
      });
      
      const response = await byIdHandler.PUT(request, { params: { id: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
    
    test('should allow partial updates', async () => {
      const list = handler.repo.create({ name: 'Test', color: '#000000', emoji: '📋' });
      
      const request = createMockRequest({
        method: 'PUT',
        body: { name: 'New Name' },
      });
      
      const response = await byIdHandler.PUT(request, { params: { id: list.id } });
      
      expect(response.data.data.name).toBe('New Name');
      expect(response.data.data.color).toBe('#000000');
      expect(response.data.data.emoji).toBe('📋');
    });
  });
  
  describe('DELETE /api/lists/[id]', () => {
    test('should delete an empty list', async () => {
      const list = handler.repo.create({ name: 'To Delete' });
      
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: list.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify list is deleted
      const getResponse = await byIdHandler.GET(request, { params: { id: list.id } });
      expect(getResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent list', async () => {
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
    
    test('should not delete default list', async () => {
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: DEFAULT_LIST_ID } });
      
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('default');
    });
    
    test('should not delete list with tasks', async () => {
      const list = handler.repo.create({ name: 'List with Tasks' });
      
      // Add a task to the list
      const db = getTestDatabase();
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, priority, completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), list.id, 'Test Task', 'none', 0, new Date().toISOString(), new Date().toISOString());
      
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: list.id } });
      
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('tasks');
    });
  });
});

/**
 * Tasks API Tests
 * 
 * Tests for GET with filters, POST, PUT, DELETE endpoints.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { createTestTask, DEFAULT_LIST_ID, testDates } from '../utils/fixtures';
import type { Task, Priority } from '@/lib/db/schema';

// Helper to create TasksRepository with test database
function createMockTasksRepository() {
  const db = getTestDatabase();
  
  return {
    findAll(): Task[] {
      return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as Task[];
    },
    
    findById(id: string): Task | undefined {
      return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
    },
    
    create(data: {
      list_id: string;
      name: string;
      description?: string | null;
      date?: string | null;
      deadline?: string | null;
      estimate_minutes?: number | null;
      actual_minutes?: number | null;
      priority?: Priority;
      recurring_rule?: string | null;
    }): Task {
      const id = testUuid.generate();
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO tasks (
          id, list_id, name, description, date, deadline,
          estimate_minutes, actual_minutes, priority, recurring_rule,
          completed, completed_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.list_id,
        data.name,
        data.description ?? null,
        data.date ?? null,
        data.deadline ?? null,
        data.estimate_minutes ?? null,
        data.actual_minutes ?? null,
        data.priority ?? 'none',
        data.recurring_rule ?? null,
        0,
        null,
        now,
        now
      );
      
      return this.findById(id)!;
    },
    
    update(id: string, data: Partial<{
      list_id: string;
      name: string;
      description: string | null;
      date: string | null;
      deadline: string | null;
      estimate_minutes: number | null;
      actual_minutes: number | null;
      priority: Priority;
      recurring_rule: string | null;
      completed: boolean;
    }>): Task | undefined {
      const existing = this.findById(id);
      if (!existing) return undefined;
      
      const updates: string[] = [];
      const values: unknown[] = [];
      
      if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
      if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
      if (data.list_id !== undefined) { updates.push('list_id = ?'); values.push(data.list_id); }
      if (data.date !== undefined) { updates.push('date = ?'); values.push(data.date); }
      if (data.deadline !== undefined) { updates.push('deadline = ?'); values.push(data.deadline); }
      if (data.estimate_minutes !== undefined) { updates.push('estimate_minutes = ?'); values.push(data.estimate_minutes); }
      if (data.actual_minutes !== undefined) { updates.push('actual_minutes = ?'); values.push(data.actual_minutes); }
      if (data.priority !== undefined) { updates.push('priority = ?'); values.push(data.priority); }
      if (data.recurring_rule !== undefined) { updates.push('recurring_rule = ?'); values.push(data.recurring_rule); }
      if (data.completed !== undefined) {
        updates.push('completed = ?');
        values.push(data.completed ? 1 : 0);
        updates.push('completed_at = ?');
        values.push(data.completed ? new Date().toISOString() : null);
      }
      
      if (updates.length === 0) return existing;
      
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);
      
      db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      return this.findById(id);
    },
    
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
      return result.changes > 0;
    },
    
    findWithFilters(options: {
      listId?: string;
      dateFrom?: string;
      dateTo?: string;
      completed?: boolean;
      priority?: Priority;
      overdue?: boolean;
      search?: string;
      labelId?: string;
    }): Task[] {
      const conditions: string[] = [];
      const values: unknown[] = [];
      
      if (options.listId) { conditions.push('list_id = ?'); values.push(options.listId); }
      if (options.dateFrom) { conditions.push('date >= ?'); values.push(options.dateFrom); }
      if (options.dateTo) { conditions.push('date <= ?'); values.push(options.dateTo); }
      if (options.completed !== undefined) { conditions.push('completed = ?'); values.push(options.completed ? 1 : 0); }
      if (options.priority) { conditions.push('priority = ?'); values.push(options.priority); }
      if (options.overdue) {
        conditions.push('deadline < ?');
        conditions.push('completed = 0');
        values.push(new Date().toISOString());
      }
      if (options.search) {
        conditions.push('(name LIKE ? OR description LIKE ?)');
        values.push(`%${options.search}%`, `%${options.search}%`);
      }
      if (options.labelId) {
        conditions.push('id IN (SELECT task_id FROM task_labels WHERE label_id = ?)');
        values.push(options.labelId);
      }
      
      let sql = 'SELECT * FROM tasks';
      if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
      sql += ' ORDER BY date ASC, created_at DESC';
      
      return db.prepare(sql).all(...values) as Task[];
    },
  };
}

// Mock request helper
function createMockRequest(options: {
  method: string;
  body?: unknown;
  url?: string;
}) {
  const url = new URL(options.url || 'http://localhost/api/tasks');
  
  return {
    method: options.method,
    url: options.url || 'http://localhost/api/tasks',
    json: async () => options.body,
    nextUrl: url,
  } as any;
}

// Simulate API handlers
function createTasksApiHandler() {
  const repo = createMockTasksRepository();
  
  return {
    repo,
    
    async GET(request: any) {
      try {
        const { searchParams } = new URL(request.url);
        
        const filters: any = {};
        
        const listId = searchParams.get('listId');
        if (listId) filters.listId = listId;
        
        const dateFrom = searchParams.get('dateFrom');
        if (dateFrom) filters.dateFrom = dateFrom;
        
        const dateTo = searchParams.get('dateTo');
        if (dateTo) filters.dateTo = dateTo;
        
        const completed = searchParams.get('completed');
        if (completed !== null) filters.completed = completed === 'true';
        
        const priority = searchParams.get('priority');
        if (priority && ['high', 'medium', 'low', 'none'].includes(priority)) {
          filters.priority = priority;
        }
        
        const overdue = searchParams.get('overdue');
        if (overdue === 'true') filters.overdue = true;
        
        const search = searchParams.get('search');
        if (search) filters.search = search;
        
        const labelId = searchParams.get('labelId');
        if (labelId) filters.labelId = labelId;
        
        let tasks;
        if (Object.keys(filters).length === 0) {
          tasks = repo.findAll();
        } else {
          tasks = repo.findWithFilters(filters);
        }
        
        return { status: 200, data: { success: true, data: tasks, count: tasks.length } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to fetch tasks' } };
      }
    },
    
    async POST(request: any) {
      try {
        const body = await request.json();
        
        // Validate required fields
        if (!body.name || typeof body.name !== 'string' || body.name.length === 0) {
          return { status: 400, data: { success: false, error: 'Validation error', details: [{ message: 'Task name is required' }] } };
        }
        
        if (!body.list_id) {
          return { status: 400, data: { success: false, error: 'Validation error', details: [{ message: 'List ID is required' }] } };
        }
        
        const task = repo.create({
          list_id: body.list_id,
          name: body.name,
          description: body.description,
          date: body.date,
          deadline: body.deadline,
          estimate_minutes: body.estimate_minutes,
          actual_minutes: body.actual_minutes,
          priority: body.priority,
          recurring_rule: body.recurring_rule,
        });
        
        return { status: 201, data: { success: true, data: task } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to create task' } };
      }
    },
  };
}

function createTaskByIdApiHandler() {
  const repo = createMockTasksRepository();
  
  return {
    repo,
    
    async GET(request: any, context: { params: { id: string } }) {
      try {
        const task = repo.findById(context.params.id);
        
        if (!task) {
          return { status: 404, data: { success: false, error: 'Task not found' } };
        }
        
        return { status: 200, data: { success: true, data: task } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to fetch task' } };
      }
    },
    
    async PUT(request: any, context: { params: { id: string } }) {
      try {
        const body = await request.json();
        const updated = repo.update(context.params.id, body);
        
        if (!updated) {
          return { status: 404, data: { success: false, error: 'Task not found' } };
        }
        
        return { status: 200, data: { success: true, data: updated } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to update task' } };
      }
    },
    
    async DELETE(request: any, context: { params: { id: string } }) {
      try {
        const task = repo.findById(context.params.id);
        if (!task) {
          return { status: 404, data: { success: false, error: 'Task not found' } };
        }
        
        const deleted = repo.delete(context.params.id);
        
        if (!deleted) {
          return { status: 500, data: { success: false, error: 'Failed to delete task' } };
        }
        
        return { status: 200, data: { success: true, data: null } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to delete task' } };
      }
    },
  };
}

describe('Tasks API', () => {
  let handler: ReturnType<typeof createTasksApiHandler>;
  let byIdHandler: ReturnType<typeof createTaskByIdApiHandler>;
  
  beforeEach(() => {
    clearTestDatabase();
    handler = createTasksApiHandler();
    byIdHandler = createTaskByIdApiHandler();
  });
  
  describe('GET /api/tasks', () => {
    test('should return all tasks', async () => {
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task 1' });
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task 2' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.count).toBe(2);
    });
    
    test('should return empty array when no tasks', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request);
      
      expect(response.data.data).toEqual([]);
      expect(response.data.count).toBe(0);
    });
    
    test('should filter by listId', async () => {
      const db = getTestDatabase();
      const listId = testUuid.generate();
      db.prepare(`INSERT INTO lists (id, name, color, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`).run(listId, 'Custom', '#000', 0, new Date().toISOString(), new Date().toISOString());
      
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Inbox Task' });
      handler.repo.create({ list_id: listId, name: 'Custom Task' });
      
      const request = createMockRequest({ method: 'GET', url: `http://localhost/api/tasks?listId=${listId}` });
      const response = await handler.GET(request);
      
      expect(response.data.count).toBe(1);
      expect(response.data.data[0].name).toBe('Custom Task');
    });
    
    test('should filter by completion status', async () => {
      const task1 = handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Incomplete' });
      const task2 = handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Complete' });
      handler.repo.update(task2.id, { completed: true });
      
      const request = createMockRequest({ method: 'GET', url: 'http://localhost/api/tasks?completed=false' });
      const response = await handler.GET(request);
      
      expect(response.data.count).toBe(1);
      expect(response.data.data[0].name).toBe('Incomplete');
    });
    
    test('should filter by priority', async () => {
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'High', priority: 'high' });
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Low', priority: 'low' });
      
      const request = createMockRequest({ method: 'GET', url: 'http://localhost/api/tasks?priority=high' });
      const response = await handler.GET(request);
      
      expect(response.data.count).toBe(1);
      expect(response.data.data[0].priority).toBe('high');
    });
    
    test('should filter by date range', async () => {
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Today', date: testDates.today });
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Tomorrow', date: testDates.tomorrow });
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Next Week', date: testDates.nextWeek });
      
      const request = createMockRequest({ 
        method: 'GET', 
        url: `http://localhost/api/tasks?dateFrom=${testDates.today}&dateTo=${testDates.tomorrow}` 
      });
      const response = await handler.GET(request);
      
      expect(response.data.count).toBe(2);
    });
    
    test('should filter by search term', async () => {
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Buy groceries' });
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Walk the dog' });
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Buy tickets', description: 'Concert tickets' });
      
      const request = createMockRequest({ method: 'GET', url: 'http://localhost/api/tasks?search=buy' });
      const response = await handler.GET(request);
      
      expect(response.data.count).toBe(2);
    });
    
    test('should combine multiple filters', async () => {
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'High Priority Incomplete', priority: 'high' });
      handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'High Priority Complete', priority: 'high' });
      const complete = handler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Low Priority', priority: 'low' });
      handler.repo.update(complete.id, { completed: true });
      
      const request = createMockRequest({ 
        method: 'GET', 
        url: 'http://localhost/api/tasks?priority=high&completed=false' 
      });
      const response = await handler.GET(request);
      
      expect(response.data.count).toBe(1);
    });
  });
  
  describe('POST /api/tasks', () => {
    test('should create a new task', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { list_id: DEFAULT_LIST_ID, name: 'New Task' },
      });
      
      const response = await handler.POST(request);
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('New Task');
      expect(response.data.data.list_id).toBe(DEFAULT_LIST_ID);
    });
    
    test('should create task with all fields', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          list_id: DEFAULT_LIST_ID,
          name: 'Full Task',
          description: 'Description',
          date: testDates.today,
          deadline: testDates.tomorrow,
          estimate_minutes: 60,
          priority: 'high',
        },
      });
      
      const response = await handler.POST(request);
      
      expect(response.data.data.description).toBe('Description');
      expect(response.data.data.date).toBe(testDates.today);
      expect(response.data.data.deadline).toBe(testDates.tomorrow);
      expect(response.data.data.estimate_minutes).toBe(60);
      expect(response.data.data.priority).toBe('high');
    });
    
    test('should reject missing name', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { list_id: DEFAULT_LIST_ID },
      });
      
      const response = await handler.POST(request);
      
      expect(response.status).toBe(400);
    });
    
    test('should reject missing list_id', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { name: 'Task without list' },
      });
      
      const response = await handler.POST(request);
      
      expect(response.status).toBe(400);
    });
    
    test('should set default priority', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { list_id: DEFAULT_LIST_ID, name: 'Task' },
      });
      
      const response = await handler.POST(request);
      expect(response.data.data.priority).toBe('none');
    });
    
    test('should set completed to false by default', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { list_id: DEFAULT_LIST_ID, name: 'Task' },
      });
      
      const response = await handler.POST(request);
      expect(response.data.data.completed).toBe(false);
    });
  });
  
  describe('GET /api/tasks/[id]', () => {
    test('should return task by ID', async () => {
      const task = byIdHandler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Test Task' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: task.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Test Task');
    });
    
    test('should return 404 for non-existent task', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('PUT /api/tasks/[id]', () => {
    test('should update task name', async () => {
      const task = byIdHandler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Original' });
      
      const request = createMockRequest({
        method: 'PUT',
        body: { name: 'Updated' },
      });
      
      const response = await byIdHandler.PUT(request, { params: { id: task.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.name).toBe('Updated');
    });
    
    test('should update task completion', async () => {
      const task = byIdHandler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task' });
      
      const request = createMockRequest({
        method: 'PUT',
        body: { completed: true },
      });
      
      const response = await byIdHandler.PUT(request, { params: { id: task.id } });
      
      expect(response.data.data.completed).toBe(true);
      expect(response.data.data.completed_at).toBeDefined();
    });
    
    test('should clear completed_at when uncompleting', async () => {
      const task = byIdHandler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task' });
      byIdHandler.repo.update(task.id, { completed: true });
      
      const request = createMockRequest({
        method: 'PUT',
        body: { completed: false },
      });
      
      const response = await byIdHandler.PUT(request, { params: { id: task.id } });
      
      expect(response.data.data.completed).toBe(false);
      expect(response.data.data.completed_at).toBeNull();
    });
    
    test('should update task priority', async () => {
      const task = byIdHandler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task' });
      
      const request = createMockRequest({
        method: 'PUT',
        body: { priority: 'high' },
      });
      
      const response = await byIdHandler.PUT(request, { params: { id: task.id } });
      
      expect(response.data.data.priority).toBe('high');
    });
    
    test('should return 404 for non-existent task', async () => {
      const request = createMockRequest({
        method: 'PUT',
        body: { name: 'Updated' },
      });
      
      const response = await byIdHandler.PUT(request, { params: { id: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
    
    test('should allow partial updates', async () => {
      const task = byIdHandler.repo.create({ 
        list_id: DEFAULT_LIST_ID, 
        name: 'Task', 
        description: 'Desc',
        priority: 'low' 
      });
      
      const request = createMockRequest({
        method: 'PUT',
        body: { priority: 'high' },
      });
      
      const response = await byIdHandler.PUT(request, { params: { id: task.id } });
      
      expect(response.data.data.name).toBe('Task');
      expect(response.data.data.description).toBe('Desc');
      expect(response.data.data.priority).toBe('high');
    });
  });
  
  describe('DELETE /api/tasks/[id]', () => {
    test('should delete an existing task', async () => {
      const task = byIdHandler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'To Delete' });
      
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: task.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify task is deleted
      const getResponse = await byIdHandler.GET(request, { params: { id: task.id } });
      expect(getResponse.status).toBe(404);
    });
    
    test('should return 404 for non-existent task', async () => {
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
    
    test('should cascade delete related records', async () => {
      const db = getTestDatabase();
      const task = byIdHandler.repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task with relations' });
      
      // Add subtask
      db.prepare(`
        INSERT INTO subtasks (id, task_id, name, completed, "order", created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), task.id, 'Subtask', 0, 0, new Date().toISOString());
      
      const request = createMockRequest({ method: 'DELETE' });
      await byIdHandler.DELETE(request, { params: { id: task.id } });
      
      // Verify subtask is deleted
      const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(task.id);
      expect(subtasks.length).toBe(0);
    });
  });
});

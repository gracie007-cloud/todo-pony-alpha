/**
 * Tasks Repository Tests
 * 
 * Tests for CRUD operations, filtering, and change logging.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { createTestTask, createTestList, DEFAULT_LIST_ID, testDates } from '../utils/fixtures';
import type { Task, Priority } from '@/lib/db/schema';

// Helper to create TasksRepository with test database
function createTasksRepository() {
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
      
      if (data.name !== undefined) {
        updates.push('name = ?');
        values.push(data.name);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description);
      }
      if (data.list_id !== undefined) {
        updates.push('list_id = ?');
        values.push(data.list_id);
      }
      if (data.date !== undefined) {
        updates.push('date = ?');
        values.push(data.date);
      }
      if (data.deadline !== undefined) {
        updates.push('deadline = ?');
        values.push(data.deadline);
      }
      if (data.estimate_minutes !== undefined) {
        updates.push('estimate_minutes = ?');
        values.push(data.estimate_minutes);
      }
      if (data.actual_minutes !== undefined) {
        updates.push('actual_minutes = ?');
        values.push(data.actual_minutes);
      }
      if (data.priority !== undefined) {
        updates.push('priority = ?');
        values.push(data.priority);
      }
      if (data.recurring_rule !== undefined) {
        updates.push('recurring_rule = ?');
        values.push(data.recurring_rule);
      }
      if (data.completed !== undefined) {
        updates.push('completed = ?');
        values.push(data.completed ? 1 : 0);
        if (data.completed) {
          updates.push('completed_at = ?');
          values.push(new Date().toISOString());
        } else {
          updates.push('completed_at = ?');
          values.push(null);
        }
      }
      
      if (updates.length === 0) return existing;
      
      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);
      
      const transaction = db.transaction(() => {
        db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        
        // Log changes to history
        const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];
        if (data.name !== undefined && data.name !== existing.name) {
          changes.push({ field: 'name', oldValue: existing.name, newValue: data.name });
        }
        if (data.completed !== undefined && data.completed !== Boolean(existing.completed)) {
          changes.push({ field: 'completed', oldValue: existing.completed, newValue: data.completed });
        }
        
        for (const change of changes) {
          const historyId = testUuid.generate();
          db.prepare(`
            INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            historyId,
            id,
            change.field,
            change.oldValue !== null ? JSON.stringify(change.oldValue) : null,
            change.newValue !== null ? JSON.stringify(change.newValue) : null,
            new Date().toISOString()
          );
        }
      });
      
      transaction();
      return this.findById(id);
    },
    
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
      return result.changes > 0;
    },
    
    findByList(listId: string): Task[] {
      return db.prepare('SELECT * FROM tasks WHERE list_id = ? ORDER BY created_at DESC').all(listId) as Task[];
    },
    
    findByDate(date: string): Task[] {
      return db.prepare('SELECT * FROM tasks WHERE date(date) = date(?) ORDER BY date ASC').all(date) as Task[];
    },
    
    findOverdue(): Task[] {
      return db.prepare(`
        SELECT * FROM tasks 
        WHERE deadline IS NOT NULL 
          AND deadline < ? 
          AND completed = 0
        ORDER BY deadline ASC
      `).all(new Date().toISOString()) as Task[];
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
      
      if (options.listId) {
        conditions.push('list_id = ?');
        values.push(options.listId);
      }
      if (options.dateFrom) {
        conditions.push('date >= ?');
        values.push(options.dateFrom);
      }
      if (options.dateTo) {
        conditions.push('date <= ?');
        values.push(options.dateTo);
      }
      if (options.completed !== undefined) {
        conditions.push('completed = ?');
        values.push(options.completed ? 1 : 0);
      }
      if (options.priority) {
        conditions.push('priority = ?');
        values.push(options.priority);
      }
      if (options.overdue) {
        conditions.push('deadline < ?');
        conditions.push('completed = 0');
        values.push(new Date().toISOString());
      }
      if (options.search) {
        conditions.push('(name LIKE ? OR description LIKE ?)');
        const searchTerm = `%${options.search}%`;
        values.push(searchTerm, searchTerm);
      }
      if (options.labelId) {
        conditions.push('id IN (SELECT task_id FROM task_labels WHERE label_id = ?)');
        values.push(options.labelId);
      }
      
      let sql = 'SELECT * FROM tasks';
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
      sql += ' ORDER BY date ASC, created_at DESC';
      
      return db.prepare(sql).all(...values) as Task[];
    },
    
    markComplete(id: string): Task | undefined {
      return this.update(id, { completed: true });
    },
    
    markIncomplete(id: string): Task | undefined {
      return this.update(id, { completed: false });
    },
    
    countByList(listId: string): number {
      const result = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE list_id = ?').get(listId) as { count: number };
      return result.count;
    },
    
    getHistory(taskId: string): Array<{ id: string; task_id: string; field_name: string; old_value: string | null; new_value: string | null; changed_at: string }> {
      return db.prepare('SELECT * FROM task_history WHERE task_id = ? ORDER BY changed_at DESC').all(taskId) as Array<{ id: string; task_id: string; field_name: string; old_value: string | null; new_value: string | null; changed_at: string }>;
    },
  };
}

// Helper to create a test list
function createTestListInDb(name: string): string {
  const db = getTestDatabase();
  const id = testUuid.generate();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, '#6366f1', null, 0, now, now);
  
  return id;
}

describe('TasksRepository', () => {
  let repo: ReturnType<typeof createTasksRepository>;
  
  beforeEach(() => {
    clearTestDatabase();
    repo = createTasksRepository();
  });
  
  describe('findAll', () => {
    test('should return empty array when no tasks', () => {
      const tasks = repo.findAll();
      expect(tasks).toEqual([]);
    });
    
    test('should return all tasks', () => {
      repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task 1' });
      repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task 2' });
      
      const tasks = repo.findAll();
      expect(tasks.length).toBe(2);
    });
  });
  
  describe('findById', () => {
    test('should return task by ID', () => {
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'Test Task' });
      const found = repo.findById(created.id);
      
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Task');
    });
    
    test('should return undefined for non-existent ID', () => {
      const found = repo.findById(testUuid.generate());
      expect(found).toBeUndefined();
    });
  });
  
  describe('create', () => {
    test('should create a task with required fields', () => {
      const task = repo.create({ list_id: DEFAULT_LIST_ID, name: 'New Task' });
      
      expect(task.id).toBeDefined();
      expect(task.list_id).toBe(DEFAULT_LIST_ID);
      expect(task.name).toBe('New Task');
      expect(task.completed).toBe(false);
      expect(task.priority).toBe('none');
      expect(task.created_at).toBeDefined();
      expect(task.updated_at).toBeDefined();
    });
    
    test('should create a task with all optional fields', () => {
      const task = repo.create({
        list_id: DEFAULT_LIST_ID,
        name: 'Full Task',
        description: 'Task description',
        date: testDates.today,
        deadline: testDates.tomorrow,
        estimate_minutes: 60,
        actual_minutes: 45,
        priority: 'high',
        recurring_rule: 'FREQ=DAILY',
      });
      
      expect(task.description).toBe('Task description');
      expect(task.date).toBe(testDates.today);
      expect(task.deadline).toBe(testDates.tomorrow);
      expect(task.estimate_minutes).toBe(60);
      expect(task.actual_minutes).toBe(45);
      expect(task.priority).toBe('high');
      expect(task.recurring_rule).toBe('FREQ=DAILY');
    });
    
    test('should create task with null optional fields', () => {
      const task = repo.create({
        list_id: DEFAULT_LIST_ID,
        name: 'Minimal Task',
        description: null,
        date: null,
        deadline: null,
      });
      
      expect(task.description).toBeNull();
      expect(task.date).toBeNull();
      expect(task.deadline).toBeNull();
    });
  });
  
  describe('update', () => {
    test('should update task name', () => {
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'Original' });
      const updated = repo.update(created.id, { name: 'Updated' });
      
      expect(updated?.name).toBe('Updated');
    });
    
    test('should update task description', () => {
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task' });
      const updated = repo.update(created.id, { description: 'New description' });
      
      expect(updated?.description).toBe('New description');
    });
    
    test('should update task priority', () => {
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task' });
      const updated = repo.update(created.id, { priority: 'high' });
      
      expect(updated?.priority).toBe('high');
    });
    
    test('should update task completion status', () => {
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task' });
      const updated = repo.update(created.id, { completed: true });
      
      expect(updated?.completed).toBe(true);
      expect(updated?.completed_at).toBeDefined();
    });
    
    test('should clear completed_at when marking incomplete', () => {
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task' });
      repo.update(created.id, { completed: true });
      const updated = repo.update(created.id, { completed: false });
      
      expect(updated?.completed).toBe(false);
      expect(updated?.completed_at).toBeNull();
    });
    
    test('should return undefined for non-existent task', () => {
      const result = repo.update(testUuid.generate(), { name: 'New Name' });
      expect(result).toBeUndefined();
    });
    
    test('should log changes to task_history', () => {
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'Original' });
      repo.update(created.id, { name: 'Updated' });
      
      const history = repo.getHistory(created.id);
      expect(history.length).toBe(1);
      expect(history[0].field_name).toBe('name');
      expect(JSON.parse(history[0].old_value!)).toBe('Original');
      expect(JSON.parse(history[0].new_value!)).toBe('Updated');
    });
  });
  
  describe('delete', () => {
    test('should delete an existing task', () => {
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'To Delete' });
      const result = repo.delete(created.id);
      
      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeUndefined();
    });
    
    test('should return false for non-existent task', () => {
      const result = repo.delete(testUuid.generate());
      expect(result).toBe(false);
    });
    
    test('should cascade delete related records', () => {
      const db = getTestDatabase();
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task with relations' });
      
      // Add subtask
      db.prepare(`
        INSERT INTO subtasks (id, task_id, name, completed, "order", created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), created.id, 'Subtask', 0, 0, new Date().toISOString());
      
      // Delete task
      repo.delete(created.id);
      
      // Verify subtask is deleted
      const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(created.id);
      expect(subtasks.length).toBe(0);
    });
  });
  
  describe('findByList', () => {
    test('should return tasks for a specific list', () => {
      const listId = createTestListInDb('Custom List');
      
      repo.create({ list_id: DEFAULT_LIST_ID, name: 'Inbox Task' });
      repo.create({ list_id: listId, name: 'Custom List Task' });
      repo.create({ list_id: listId, name: 'Another Custom Task' });
      
      const tasks = repo.findByList(listId);
      expect(tasks.length).toBe(2);
      expect(tasks.every(t => t.list_id === listId)).toBe(true);
    });
    
    test('should return empty array for list with no tasks', () => {
      const listId = createTestListInDb('Empty List');
      const tasks = repo.findByList(listId);
      expect(tasks).toEqual([]);
    });
  });
  
  describe('findByDate', () => {
    test('should return tasks for a specific date', () => {
      repo.create({ list_id: DEFAULT_LIST_ID, name: 'Today Task', date: testDates.today });
      repo.create({ list_id: DEFAULT_LIST_ID, name: 'Tomorrow Task', date: testDates.tomorrow });
      
      const tasks = repo.findByDate(testDates.today);
      expect(tasks.length).toBe(1);
      expect(tasks[0].name).toBe('Today Task');
    });
  });
  
  describe('findOverdue', () => {
    test('should return overdue incomplete tasks', () => {
      repo.create({ 
        list_id: DEFAULT_LIST_ID, 
        name: 'Overdue Task', 
        deadline: testDates.lastWeek 
      });
      repo.create({ 
        list_id: DEFAULT_LIST_ID, 
        name: 'Future Task', 
        deadline: testDates.nextWeek 
      });
      repo.create({ 
        list_id: DEFAULT_LIST_ID, 
        name: 'Completed Overdue', 
        deadline: testDates.lastWeek,
        completed: true 
      });
      
      const overdue = repo.findOverdue();
      expect(overdue.length).toBe(1);
      expect(overdue[0].name).toBe('Overdue Task');
    });
    
    test('should return empty array when no overdue tasks', () => {
      repo.create({ 
        list_id: DEFAULT_LIST_ID, 
        name: 'Future Task', 
        deadline: testDates.nextWeek 
      });
      
      const overdue = repo.findOverdue();
      expect(overdue).toEqual([]);
    });
  });
  
  describe('findWithFilters', () => {
    beforeEach(() => {
      // Create test tasks with various properties
      repo.create({ 
        list_id: DEFAULT_LIST_ID, 
        name: 'High Priority Task', 
        priority: 'high',
        date: testDates.today 
      });
      repo.create({ 
        list_id: DEFAULT_LIST_ID, 
        name: 'Completed Task', 
        priority: 'medium',
        completed: true 
      });
      repo.create({ 
        list_id: DEFAULT_LIST_ID, 
        name: 'Low Priority Task', 
        priority: 'low',
        date: testDates.tomorrow 
      });
      repo.create({ 
        list_id: DEFAULT_LIST_ID, 
        name: 'Searchable Task', 
        description: 'Contains search term',
        priority: 'none' 
      });
    });
    
    test('should filter by list ID', () => {
      const tasks = repo.findWithFilters({ listId: DEFAULT_LIST_ID });
      expect(tasks.length).toBe(4);
    });
    
    test('should filter by completion status', () => {
      const incomplete = repo.findWithFilters({ completed: false });
      expect(incomplete.length).toBe(3);
      
      const completed = repo.findWithFilters({ completed: true });
      expect(completed.length).toBe(1);
    });
    
    test('should filter by priority', () => {
      const highPriority = repo.findWithFilters({ priority: 'high' });
      expect(highPriority.length).toBe(1);
      expect(highPriority[0].name).toBe('High Priority Task');
    });
    
    test('should filter by date range', () => {
      const tasks = repo.findWithFilters({ 
        dateFrom: testDates.today, 
        dateTo: testDates.today 
      });
      expect(tasks.length).toBe(1);
      expect(tasks[0].name).toBe('High Priority Task');
    });
    
    test('should filter by search term', () => {
      const tasks = repo.findWithFilters({ search: 'Searchable' });
      expect(tasks.length).toBe(1);
      expect(tasks[0].name).toBe('Searchable Task');
    });
    
    test('should search in description', () => {
      const tasks = repo.findWithFilters({ search: 'search term' });
      expect(tasks.length).toBe(1);
    });
    
    test('should filter overdue tasks', () => {
      // Add an overdue task
      repo.create({ 
        list_id: DEFAULT_LIST_ID, 
        name: 'Overdue', 
        deadline: testDates.lastWeek 
      });
      
      const overdue = repo.findWithFilters({ overdue: true });
      expect(overdue.length).toBe(1);
      expect(overdue[0].name).toBe('Overdue');
    });
    
    test('should combine multiple filters', () => {
      const tasks = repo.findWithFilters({ 
        listId: DEFAULT_LIST_ID, 
        completed: false,
        priority: 'high' 
      });
      expect(tasks.length).toBe(1);
    });
  });
  
  describe('markComplete', () => {
    test('should mark task as complete', () => {
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task' });
      const updated = repo.markComplete(created.id);
      
      expect(updated?.completed).toBe(true);
      expect(updated?.completed_at).toBeDefined();
    });
    
    test('should log completion in history', () => {
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task' });
      repo.markComplete(created.id);
      
      const history = repo.getHistory(created.id);
      const completionEntry = history.find(h => h.field_name === 'completed');
      expect(completionEntry).toBeDefined();
    });
  });
  
  describe('markIncomplete', () => {
    test('should mark task as incomplete', () => {
      const created = repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task' });
      repo.markComplete(created.id);
      const updated = repo.markIncomplete(created.id);
      
      expect(updated?.completed).toBe(false);
      expect(updated?.completed_at).toBeNull();
    });
  });
  
  describe('countByList', () => {
    test('should count tasks in a list', () => {
      repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task 1' });
      repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task 2' });
      repo.create({ list_id: DEFAULT_LIST_ID, name: 'Task 3' });
      
      expect(repo.countByList(DEFAULT_LIST_ID)).toBe(3);
    });
    
    test('should return 0 for empty list', () => {
      const listId = createTestListInDb('Empty List');
      expect(repo.countByList(listId)).toBe(0);
    });
  });
});

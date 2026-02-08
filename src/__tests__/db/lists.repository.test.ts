/**
 * Lists Repository Tests
 * 
 * Tests for CRUD operations and default list protection.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { DEFAULT_LIST_ID } from '../utils/fixtures';
import type { List } from '@/lib/db/schema';

// Helper to create ListsRepository with test database
function createListsRepository() {
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
    
    setAsDefault(id: string): List | undefined {
      const existing = this.findById(id);
      if (!existing) return undefined;
      
      // Use transaction
      const transaction = db.transaction(() => {
        db.prepare('UPDATE lists SET is_default = 0 WHERE is_default = 1').run();
        db.prepare('UPDATE lists SET is_default = 1, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
      });
      
      transaction();
      return this.findById(id);
    },
  };
}

describe('ListsRepository', () => {
  let repo: ReturnType<typeof createListsRepository>;
  
  beforeEach(() => {
    clearTestDatabase();
    repo = createListsRepository();
  });
  
  describe('findAll', () => {
    test('should return all lists', () => {
      const lists = repo.findAll();
      expect(lists.length).toBe(1); // Default list
      expect(lists[0].name).toBe('Inbox');
    });
    
    test('should return lists sorted by is_default DESC, name ASC', () => {
      repo.create({ name: 'Zebra List' });
      repo.create({ name: 'Alpha List' });
      
      const lists = repo.findAll();
      expect(lists[0].is_default).toBe(true); // Inbox first
      expect(lists[1].name).toBe('Alpha List');
      expect(lists[2].name).toBe('Zebra List');
    });
  });
  
  describe('findById', () => {
    test('should return list by ID', () => {
      const list = repo.findById(DEFAULT_LIST_ID);
      expect(list).toBeDefined();
      expect(list?.name).toBe('Inbox');
    });
    
    test('should return undefined for non-existent ID', () => {
      const list = repo.findById(testUuid.generate());
      expect(list).toBeUndefined();
    });
  });
  
  describe('findDefault', () => {
    test('should return the default list', () => {
      const list = repo.findDefault();
      expect(list).toBeDefined();
      expect(list?.is_default).toBe(true);
    });
  });
  
  describe('create', () => {
    test('should create a new list with required fields', () => {
      const list = repo.create({ name: 'New List' });
      
      expect(list.id).toBeDefined();
      expect(list.name).toBe('New List');
      expect(list.color).toBe('#6366f1');
      expect(list.emoji).toBeNull();
      expect(list.is_default).toBe(false);
      expect(list.created_at).toBeDefined();
      expect(list.updated_at).toBeDefined();
    });
    
    test('should create a list with custom color and emoji', () => {
      const list = repo.create({ 
        name: 'Custom List', 
        color: '#ff0000', 
        emoji: '🔥' 
      });
      
      expect(list.color).toBe('#ff0000');
      expect(list.emoji).toBe('🔥');
    });
    
    test('should create multiple lists', () => {
      repo.create({ name: 'List 1' });
      repo.create({ name: 'List 2' });
      repo.create({ name: 'List 3' });
      
      const lists = repo.findAll();
      expect(lists.length).toBe(4); // 3 + default
    });
  });
  
  describe('update', () => {
    test('should update list name', () => {
      const created = repo.create({ name: 'Original Name' });
      const updated = repo.update(created.id, { name: 'Updated Name' });
      
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.updated_at).not.toBe(created.updated_at);
    });
    
    test('should update list color', () => {
      const created = repo.create({ name: 'Test', color: '#000000' });
      const updated = repo.update(created.id, { color: '#ffffff' });
      
      expect(updated?.color).toBe('#ffffff');
    });
    
    test('should update list emoji', () => {
      const created = repo.create({ name: 'Test', emoji: '📋' });
      const updated = repo.update(created.id, { emoji: '✅' });
      
      expect(updated?.emoji).toBe('✅');
    });
    
    test('should return undefined for non-existent list', () => {
      const result = repo.update(testUuid.generate(), { name: 'New Name' });
      expect(result).toBeUndefined();
    });
    
    test('should return unchanged list if no updates provided', () => {
      const created = repo.create({ name: 'Test' });
      const updated = repo.update(created.id, {});
      
      expect(updated?.name).toBe('Test');
    });
  });
  
  describe('delete', () => {
    test('should delete an existing list', () => {
      const created = repo.create({ name: 'To Delete' });
      const result = repo.delete(created.id);
      
      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeUndefined();
    });
    
    test('should return false for non-existent list', () => {
      const result = repo.delete(testUuid.generate());
      expect(result).toBe(false);
    });
    
    test('should not delete default list', () => {
      // Default list should not be deleted
      repo.delete(DEFAULT_LIST_ID);
      
      // The repository should prevent deletion of default list
      // But at DB level it would succeed, so we test the behavior
      expect(repo.findById(DEFAULT_LIST_ID)).toBeDefined();
    });
  });
  
  describe('hasTasks', () => {
    test('should return false for empty list', () => {
      const list = repo.create({ name: 'Empty List' });
      expect(repo.hasTasks(list.id)).toBe(false);
    });
    
    test('should return true for list with tasks', () => {
      const list = repo.create({ name: 'List with Tasks' });
      const db = getTestDatabase();
      
      // Add a task to the list
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, priority, completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), list.id, 'Test Task', 'none', 0, new Date().toISOString(), new Date().toISOString());
      
      expect(repo.hasTasks(list.id)).toBe(true);
    });
  });
  
  describe('findAllWithTaskCounts', () => {
    test('should return lists with task counts', () => {
      const list = repo.create({ name: 'Test List' });
      const db = getTestDatabase();
      
      // Add tasks
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, priority, completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), list.id, 'Task 1', 'none', 0, new Date().toISOString(), new Date().toISOString());
      
      db.prepare(`
        INSERT INTO tasks (id, list_id, name, priority, completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(testUuid.generate(), list.id, 'Task 2', 'none', 1, new Date().toISOString(), new Date().toISOString());
      
      const lists = repo.findAllWithTaskCounts();
      const testList = lists.find(l => l.id === list.id);
      
      expect(testList?.task_count).toBe(2);
      expect(testList?.completed_count).toBe(1);
    });
    
    test('should return 0 counts for empty lists', () => {
      repo.create({ name: 'Empty List' });
      
      const lists = repo.findAllWithTaskCounts();
      const emptyList = lists.find(l => l.name === 'Empty List');
      
      expect(emptyList?.task_count).toBe(0);
      expect(emptyList?.completed_count).toBe(0);
    });
  });
  
  describe('setAsDefault', () => {
    test('should set a list as default', () => {
      const list = repo.create({ name: 'New Default' });
      const updated = repo.setAsDefault(list.id);
      
      expect(updated?.is_default).toBe(true);
    });
    
    test('should unset previous default list', () => {
      const list = repo.create({ name: 'New Default' });
      repo.setAsDefault(list.id);
      
      const previousDefault = repo.findById(DEFAULT_LIST_ID);
      expect(previousDefault?.is_default).toBe(false);
    });
    
    test('should return undefined for non-existent list', () => {
      const result = repo.setAsDefault(testUuid.generate());
      expect(result).toBeUndefined();
    });
    
    test('should have only one default list', () => {
      const list1 = repo.create({ name: 'List 1' });
      const list2 = repo.create({ name: 'List 2' });
      
      repo.setAsDefault(list1.id);
      repo.setAsDefault(list2.id);
      
      const defaults = repo.findAll().filter(l => l.is_default);
      expect(defaults.length).toBe(1);
      expect(defaults[0].id).toBe(list2.id);
    });
  });
  
  describe('Default list protection', () => {
    test('should always have a default list', () => {
      const defaultList = repo.findDefault();
      expect(defaultList).toBeDefined();
    });
    
    test('default list should have correct properties', () => {
      const defaultList = repo.findDefault();
      
      expect(defaultList?.name).toBe('Inbox');
      expect(defaultList?.is_default).toBe(true);
      expect(defaultList?.emoji).toBe('📥');
    });
  });
});

/**
 * Reminders Repository Tests
 * 
 * Tests for CRUD operations and pending/due queries.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { DEFAULT_LIST_ID, testDates } from '../utils/fixtures';
import type { Reminder } from '@/lib/db/schema';

// Helper to create RemindersRepository with test database
function createRemindersRepository() {
  const db = getTestDatabase();
  
  return {
    findAll(): Reminder[] {
      return db.prepare('SELECT * FROM reminders ORDER BY remind_at ASC').all() as Reminder[];
    },
    
    findById(id: string): Reminder | undefined {
      return db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as Reminder | undefined;
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
    
    update(id: string, data: Partial<{ task_id: string; remind_at: string; type: 'notification' | 'email' }>): Reminder | undefined {
      const existing = this.findById(id);
      if (!existing) return undefined;
      
      const updates: string[] = [];
      const values: unknown[] = [];
      
      if (data.remind_at !== undefined) {
        updates.push('remind_at = ?');
        values.push(data.remind_at);
      }
      if (data.type !== undefined) {
        updates.push('type = ?');
        values.push(data.type);
      }
      if (data.task_id !== undefined) {
        updates.push('task_id = ?');
        values.push(data.task_id);
      }
      
      if (updates.length === 0) return existing;
      
      values.push(id);
      db.prepare(`UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`).run(...values);
      
      return this.findById(id);
    },
    
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
      return result.changes > 0;
    },
    
    findByTaskId(taskId: string): Reminder[] {
      return db.prepare(`
        SELECT * FROM reminders 
        WHERE task_id = ? 
        ORDER BY remind_at ASC
      `).all(taskId) as Reminder[];
    },
    
    findPending(): Reminder[] {
      return db.prepare(`
        SELECT * FROM reminders 
        WHERE sent = 0 
        ORDER BY remind_at ASC
      `).all() as Reminder[];
    },
    
    findDue(): Reminder[] {
      return db.prepare(`
        SELECT * FROM reminders 
        WHERE sent = 0 AND remind_at <= ? 
        ORDER BY remind_at ASC
      `).all(new Date().toISOString()) as Reminder[];
    },
    
    findUpcoming(from: string, to: string): Reminder[] {
      return db.prepare(`
        SELECT * FROM reminders 
        WHERE remind_at >= ? AND remind_at <= ? AND sent = 0
        ORDER BY remind_at ASC
      `).all(from, to) as Reminder[];
    },
    
    markSent(id: string): boolean {
      const result = db.prepare('UPDATE reminders SET sent = 1 WHERE id = ?').run(id);
      return result.changes > 0;
    },
    
    markAllSentForTask(taskId: string): number {
      const result = db.prepare(`
        UPDATE reminders 
        SET sent = 1 
        WHERE task_id = ? AND sent = 0
      `).run(taskId);
      return result.changes;
    },
    
    deleteByTaskId(taskId: string): number {
      const result = db.prepare('DELETE FROM reminders WHERE task_id = ?').run(taskId);
      return result.changes;
    },
    
    countPendingByTaskId(taskId: string): number {
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM reminders 
        WHERE task_id = ? AND sent = 0
      `).get(taskId) as { count: number };
      return result.count;
    },
    
    getNextReminder(taskId: string): Reminder | undefined {
      return db.prepare(`
        SELECT * FROM reminders 
        WHERE task_id = ? AND sent = 0 AND remind_at > ?
        ORDER BY remind_at ASC
        LIMIT 1
      `).get(taskId, new Date().toISOString()) as Reminder | undefined;
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

describe('RemindersRepository', () => {
  let repo: ReturnType<typeof createRemindersRepository>;
  let taskId: string;
  
  beforeEach(() => {
    clearTestDatabase();
    repo = createRemindersRepository();
    taskId = createTestTaskInDb();
  });
  
  describe('findAll', () => {
    test('should return empty array when no reminders', () => {
      const reminders = repo.findAll();
      expect(reminders).toEqual([]);
    });
    
    test('should return all reminders sorted by remind_at', () => {
      repo.create({ task_id: taskId, remind_at: testDates.nextWeek });
      repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      
      const reminders = repo.findAll();
      expect(reminders[0].remind_at < reminders[1].remind_at).toBe(true);
    });
  });
  
  describe('findById', () => {
    test('should return reminder by ID', () => {
      const created = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      const found = repo.findById(created.id);
      
      expect(found).toBeDefined();
      expect(found?.task_id).toBe(taskId);
    });
    
    test('should return undefined for non-existent ID', () => {
      const found = repo.findById(testUuid.generate());
      expect(found).toBeUndefined();
    });
  });
  
  describe('create', () => {
    test('should create a reminder with required fields', () => {
      const reminder = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      
      expect(reminder.id).toBeDefined();
      expect(reminder.task_id).toBe(taskId);
      expect(reminder.remind_at).toBe(testDates.tomorrow);
      expect(reminder.type).toBe('notification');
      expect(reminder.sent).toBe(false);
      expect(reminder.created_at).toBeDefined();
    });
    
    test('should create an email reminder', () => {
      const reminder = repo.create({ 
        task_id: taskId, 
        remind_at: testDates.tomorrow, 
        type: 'email' 
      });
      
      expect(reminder.type).toBe('email');
    });
  });
  
  describe('update', () => {
    test('should update remind_at', () => {
      const created = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      const updated = repo.update(created.id, { remind_at: testDates.nextWeek });
      
      expect(updated?.remind_at).toBe(testDates.nextWeek);
    });
    
    test('should update type', () => {
      const created = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      const updated = repo.update(created.id, { type: 'email' });
      
      expect(updated?.type).toBe('email');
    });
    
    test('should return undefined for non-existent reminder', () => {
      const result = repo.update(testUuid.generate(), { remind_at: testDates.tomorrow });
      expect(result).toBeUndefined();
    });
  });
  
  describe('delete', () => {
    test('should delete an existing reminder', () => {
      const created = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      const result = repo.delete(created.id);
      
      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeUndefined();
    });
    
    test('should return false for non-existent reminder', () => {
      const result = repo.delete(testUuid.generate());
      expect(result).toBe(false);
    });
  });
  
  describe('findByTaskId', () => {
    test('should return reminders for a specific task', () => {
      const taskId2 = createTestTaskInDb();
      
      repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      repo.create({ task_id: taskId2, remind_at: testDates.tomorrow });
      repo.create({ task_id: taskId, remind_at: testDates.nextWeek });
      
      const reminders = repo.findByTaskId(taskId);
      expect(reminders.length).toBe(2);
      expect(reminders.every(r => r.task_id === taskId)).toBe(true);
    });
    
    test('should return empty array for task with no reminders', () => {
      const reminders = repo.findByTaskId(taskId);
      expect(reminders).toEqual([]);
    });
    
    test('should return reminders sorted by remind_at', () => {
      repo.create({ task_id: taskId, remind_at: testDates.nextWeek });
      repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      
      const reminders = repo.findByTaskId(taskId);
      expect(reminders[0].remind_at < reminders[1].remind_at).toBe(true);
    });
  });
  
  describe('findPending', () => {
    test('should return only unsent reminders', () => {
      const reminder1 = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      const reminder2 = repo.create({ task_id: taskId, remind_at: testDates.nextWeek });
      
      repo.markSent(reminder1.id);
      
      const pending = repo.findPending();
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe(reminder2.id);
    });
    
    test('should return empty array when all sent', () => {
      const reminder = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      repo.markSent(reminder.id);
      
      expect(repo.findPending()).toEqual([]);
    });
  });
  
  describe('findDue', () => {
    test('should return reminders that are due now', () => {
      // Create a past reminder
      const db = getTestDatabase();
      const id = testUuid.generate();
      db.prepare(`
        INSERT INTO reminders (id, task_id, remind_at, type, sent, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, taskId, testDates.yesterday, 'notification', 0, new Date().toISOString());
      
      const due = repo.findDue();
      expect(due.length).toBe(1);
      expect(due[0].id).toBe(id);
    });
    
    test('should not return future reminders', () => {
      repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      
      const due = repo.findDue();
      expect(due).toEqual([]);
    });
    
    test('should not return already sent reminders', () => {
      const db = getTestDatabase();
      const id = testUuid.generate();
      db.prepare(`
        INSERT INTO reminders (id, task_id, remind_at, type, sent, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, taskId, testDates.yesterday, 'notification', 1, new Date().toISOString());
      
      const due = repo.findDue();
      expect(due).toEqual([]);
    });
  });
  
  describe('findUpcoming', () => {
    test('should return reminders within date range', () => {
      repo.create({ task_id: taskId, remind_at: testDates.today });
      repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      repo.create({ task_id: taskId, remind_at: testDates.nextWeek });
      
      const upcoming = repo.findUpcoming(testDates.today, testDates.tomorrow);
      expect(upcoming.length).toBe(2);
    });
    
    test('should not return sent reminders', () => {
      const reminder = repo.create({ task_id: taskId, remind_at: testDates.today });
      repo.markSent(reminder.id);
      
      const upcoming = repo.findUpcoming(testDates.today, testDates.nextWeek);
      expect(upcoming).toEqual([]);
    });
  });
  
  describe('markSent', () => {
    test('should mark reminder as sent', () => {
      const created = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      const result = repo.markSent(created.id);
      
      expect(result).toBe(true);
      expect(repo.findById(created.id)?.sent).toBe(true);
    });
    
    test('should return false for non-existent reminder', () => {
      const result = repo.markSent(testUuid.generate());
      expect(result).toBe(false);
    });
    
    test('should return false if already sent', () => {
      const created = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      repo.markSent(created.id);
      const result = repo.markSent(created.id);
      
      expect(result).toBe(false);
    });
  });
  
  describe('markAllSentForTask', () => {
    test('should mark all task reminders as sent', () => {
      const taskId2 = createTestTaskInDb();
      
      repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      repo.create({ task_id: taskId, remind_at: testDates.nextWeek });
      repo.create({ task_id: taskId2, remind_at: testDates.tomorrow });
      
      const changes = repo.markAllSentForTask(taskId);
      
      expect(changes).toBe(2);
      expect(repo.countPendingByTaskId(taskId)).toBe(0);
      expect(repo.countPendingByTaskId(taskId2)).toBe(1);
    });
    
    test('should return 0 if no pending reminders', () => {
      const reminder = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      repo.markSent(reminder.id);
      
      const changes = repo.markAllSentForTask(taskId);
      expect(changes).toBe(0);
    });
  });
  
  describe('deleteByTaskId', () => {
    test('should delete all reminders for a task', () => {
      repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      repo.create({ task_id: taskId, remind_at: testDates.nextWeek });
      
      const changes = repo.deleteByTaskId(taskId);
      
      expect(changes).toBe(2);
      expect(repo.findByTaskId(taskId)).toEqual([]);
    });
    
    test('should not affect other tasks reminders', () => {
      const taskId2 = createTestTaskInDb();
      
      repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      repo.create({ task_id: taskId2, remind_at: testDates.tomorrow });
      
      repo.deleteByTaskId(taskId);
      
      expect(repo.findByTaskId(taskId2).length).toBe(1);
    });
  });
  
  describe('countPendingByTaskId', () => {
    test('should count pending reminders', () => {
      repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      repo.create({ task_id: taskId, remind_at: testDates.nextWeek });
      
      expect(repo.countPendingByTaskId(taskId)).toBe(2);
    });
    
    test('should not count sent reminders', () => {
      const reminder = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      repo.markSent(reminder.id);
      
      expect(repo.countPendingByTaskId(taskId)).toBe(0);
    });
    
    test('should return 0 for task with no reminders', () => {
      expect(repo.countPendingByTaskId(taskId)).toBe(0);
    });
  });
  
  describe('getNextReminder', () => {
    test('should return next upcoming reminder', () => {
      repo.create({ task_id: taskId, remind_at: testDates.nextWeek });
      repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      
      const next = repo.getNextReminder(taskId);
      
      expect(next).toBeDefined();
      expect(next?.remind_at).toBe(testDates.tomorrow);
    });
    
    test('should not return sent reminders', () => {
      const reminder = repo.create({ task_id: taskId, remind_at: testDates.tomorrow });
      repo.markSent(reminder.id);
      
      const next = repo.getNextReminder(taskId);
      expect(next).toBeUndefined();
    });
    
    test('should not return past reminders', () => {
      const db = getTestDatabase();
      const id = testUuid.generate();
      db.prepare(`
        INSERT INTO reminders (id, task_id, remind_at, type, sent, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, taskId, testDates.yesterday, 'notification', 0, new Date().toISOString());
      
      const next = repo.getNextReminder(taskId);
      expect(next).toBeUndefined();
    });
    
    test('should return undefined for task with no reminders', () => {
      const next = repo.getNextReminder(taskId);
      expect(next).toBeUndefined();
    });
  });
});

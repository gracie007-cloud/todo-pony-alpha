/**
 * Reminders Repository
 * 
 * Handles CRUD operations for reminders.
 */

import { BaseRepository } from './base.repository';
import { 
  Reminder, 
  CreateReminderInput, 
  UpdateReminderInput 
} from '../schema';

export class RemindersRepository extends BaseRepository<Reminder, CreateReminderInput, UpdateReminderInput> {
  constructor() {
    super('reminders', 'id');
  }

  /**
   * Create a new reminder
   */
  create(data: CreateReminderInput): Reminder {
    const id = this.generateId();
    const timestamp = this.timestamp();
    
    const sql = `
      INSERT INTO reminders (id, task_id, remind_at, type, sent, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    this.query(
      sql,
      id,
      data.task_id,
      data.remind_at,
      data.type ?? 'notification',
      0, // sent
      timestamp
    );
    
    return this.findById(id)!;
  }

  /**
   * Update a reminder
   */
  update(id: string, data: UpdateReminderInput): Reminder | undefined {
    const existing = this.findById(id);
    if (!existing) {
      return undefined;
    }

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

    if (updates.length === 0) {
      return existing;
    }

    values.push(id);

    const sql = `UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`;
    this.query(sql, ...values);

    return this.findById(id);
  }

  /**
   * Find all reminders for a task
   */
  findByTaskId(taskId: string): Reminder[] {
    const sql = `
      SELECT * FROM reminders 
      WHERE task_id = ? 
      ORDER BY remind_at ASC
    `;
    return this.queryAll<Reminder>(sql, taskId);
  }

  /**
   * Find pending reminders (not yet sent)
   */
  findPending(): Reminder[] {
    const sql = `
      SELECT * FROM reminders 
      WHERE sent = 0 
      ORDER BY remind_at ASC
    `;
    return this.queryAll<Reminder>(sql);
  }

  /**
   * Find due reminders (should be sent now)
   */
  findDue(): Reminder[] {
    const sql = `
      SELECT * FROM reminders 
      WHERE sent = 0 AND remind_at <= ? 
      ORDER BY remind_at ASC
    `;
    return this.queryAll<Reminder>(sql, this.timestamp());
  }

  /**
   * Find upcoming reminders within a time range
   */
  findUpcoming(from: string, to: string): Reminder[] {
    const sql = `
      SELECT * FROM reminders 
      WHERE remind_at >= ? AND remind_at <= ? AND sent = 0
      ORDER BY remind_at ASC
    `;
    return this.queryAll<Reminder>(sql, from, to);
  }

  /**
   * Mark a reminder as sent
   */
  markSent(id: string): boolean {
    const sql = `UPDATE reminders SET sent = 1 WHERE id = ?`;
    const result = this.query(sql, id);
    return result.changes > 0;
  }

  /**
   * Mark all reminders for a task as sent
   */
  markAllSentForTask(taskId: string): number {
    const sql = `
      UPDATE reminders 
      SET sent = 1 
      WHERE task_id = ? AND sent = 0
    `;
    const result = this.query(sql, taskId);
    return result.changes;
  }

  /**
   * Delete all reminders for a task
   */
  deleteByTaskId(taskId: string): number {
    const result = this.query(
      'DELETE FROM reminders WHERE task_id = ?',
      taskId
    );
    return result.changes;
  }

  /**
   * Count pending reminders for a task
   */
  countPendingByTaskId(taskId: string): number {
    const sql = `
      SELECT COUNT(*) as count FROM reminders 
      WHERE task_id = ? AND sent = 0
    `;
    const result = this.queryOne<{ count: number }>(sql, taskId);
    return result?.count ?? 0;
  }

  /**
   * Get next upcoming reminder for a task
   */
  getNextReminder(taskId: string): Reminder | undefined {
    const sql = `
      SELECT * FROM reminders 
      WHERE task_id = ? AND sent = 0 AND remind_at > ?
      ORDER BY remind_at ASC
      LIMIT 1
    `;
    return this.queryOne<Reminder>(sql, taskId, this.timestamp());
  }
}

// Singleton instance
let instance: RemindersRepository | null = null;

export function getRemindersRepository(): RemindersRepository {
  if (!instance) {
    instance = new RemindersRepository();
  }
  return instance;
}

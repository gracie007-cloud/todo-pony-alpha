/**
 * Task History Repository
 * 
 * Handles reading task change history.
 * Note: History entries are created automatically by the TasksRepository.
 */

import { BaseRepository } from './base.repository';
import { TaskHistory, CreateTaskHistoryInput } from '../schema';

export interface TaskHistoryWithDetails extends TaskHistory {
  task_name: string;
}

export class TaskHistoryRepository extends BaseRepository<TaskHistory, CreateTaskHistoryInput, never> {
  constructor() {
    super('task_history', 'id');
  }

  /**
   * Create is handled internally by TasksRepository
   * This method is exposed for internal use only
   */
  create(data: CreateTaskHistoryInput): TaskHistory {
    const id = this.generateId();
    const timestamp = this.timestamp();
    
    const sql = `
      INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    this.query(
      sql,
      id,
      data.task_id,
      data.field_name,
      data.old_value ?? null,
      data.new_value ?? null,
      timestamp
    );
    
    return this.findById(id)!;
  }

  /**
   * Update is not supported for history entries
   */
  update(): never {
    throw new Error('History entries cannot be updated');
  }

  /**
   * Find all history entries for a task
   */
  findByTaskId(taskId: string): TaskHistory[] {
    const sql = `
      SELECT * FROM task_history 
      WHERE task_id = ? 
      ORDER BY changed_at DESC
    `;
    return this.queryAll<TaskHistory>(sql, taskId);
  }

  /**
   * Find history entries for a specific field on a task
   */
  findByTaskIdAndField(taskId: string, fieldName: string): TaskHistory[] {
    const sql = `
      SELECT * FROM task_history 
      WHERE task_id = ? AND field_name = ?
      ORDER BY changed_at DESC
    `;
    return this.queryAll<TaskHistory>(sql, taskId, fieldName);
  }

  /**
   * Find recent history across all tasks
   */
  findRecent(limit: number = 50): TaskHistory[] {
    const sql = `
      SELECT * FROM task_history 
      ORDER BY changed_at DESC
      LIMIT ?
    `;
    return this.queryAll<TaskHistory>(sql, limit);
  }

  /**
   * Find history entries within a date range
   */
  findByDateRange(from: string, to: string): TaskHistory[] {
    const sql = `
      SELECT * FROM task_history 
      WHERE changed_at >= ? AND changed_at <= ?
      ORDER BY changed_at DESC
    `;
    return this.queryAll<TaskHistory>(sql, from, to);
  }

  /**
   * Find history for a task with task details
   */
  findByTaskIdWithDetails(taskId: string): TaskHistoryWithDetails[] {
    const sql = `
      SELECT th.*, t.name as task_name
      FROM task_history th
      INNER JOIN tasks t ON th.task_id = t.id
      WHERE th.task_id = ?
      ORDER BY th.changed_at DESC
    `;
    return this.queryAll<TaskHistoryWithDetails>(sql, taskId);
  }

  /**
   * Get count of history entries for a task
   */
  countByTaskId(taskId: string): number {
    return this.countBy('task_id', taskId);
  }

  /**
   * Delete all history for a task (usually handled by cascade)
   */
  deleteByTaskId(taskId: string): number {
    const result = this.query(
      'DELETE FROM task_history WHERE task_id = ?',
      taskId
    );
    return result.changes;
  }

  /**
   * Get the last change for a specific field on a task
   */
  getLastChange(taskId: string, fieldName: string): TaskHistory | undefined {
    const sql = `
      SELECT * FROM task_history 
      WHERE task_id = ? AND field_name = ?
      ORDER BY changed_at DESC
      LIMIT 1
    `;
    return this.queryOne<TaskHistory>(sql, taskId, fieldName);
  }

  /**
   * Get summary of changes by field for a task
   */
  getChangeSummary(taskId: string): { field_name: string; change_count: number }[] {
    const sql = `
      SELECT field_name, COUNT(*) as change_count
      FROM task_history
      WHERE task_id = ?
      GROUP BY field_name
      ORDER BY change_count DESC
    `;
    return this.queryAll<{ field_name: string; change_count: number }>(sql, taskId);
  }

  /**
   * Clean up old history entries (for maintenance)
   */
  deleteOlderThan(date: string): number {
    const result = this.query(
      'DELETE FROM task_history WHERE changed_at < ?',
      date
    );
    return result.changes;
  }
}

// Singleton instance
let instance: TaskHistoryRepository | null = null;

export function getTaskHistoryRepository(): TaskHistoryRepository {
  if (!instance) {
    instance = new TaskHistoryRepository();
  }
  return instance;
}

/**
 * Subtasks Repository
 * 
 * Handles CRUD operations for subtasks.
 */

import { BaseRepository } from './base.repository';
import { 
  Subtask, 
  CreateSubtaskInput, 
  UpdateSubtaskInput 
} from '../schema';

export class SubtasksRepository extends BaseRepository<Subtask, CreateSubtaskInput, UpdateSubtaskInput> {
  constructor() {
    super('subtasks', 'id');
  }

  /**
   * Create a new subtask
   */
  create(data: CreateSubtaskInput): Subtask {
    const id = this.generateId();
    const timestamp = this.timestamp();
    
    // Get the next order number for this task
    const maxOrder = this.getMaxOrder(data.task_id);
    const order = data.order ?? maxOrder + 1;
    
    const sql = `
      INSERT INTO subtasks (id, task_id, name, completed, "order", created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    this.query(
      sql,
      id,
      data.task_id,
      data.name,
      data.completed ? 1 : 0,
      order,
      timestamp
    );
    
    return this.findById(id)!;
  }

  /**
   * Update a subtask
   */
  update(id: string, data: UpdateSubtaskInput): Subtask | undefined {
    const existing = this.findById(id);
    if (!existing) {
      return undefined;
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.completed !== undefined) {
      updates.push('completed = ?');
      values.push(data.completed ? 1 : 0);
    }
    if (data.order !== undefined) {
      updates.push('"order" = ?');
      values.push(data.order);
    }
    if (data.task_id !== undefined) {
      updates.push('task_id = ?');
      values.push(data.task_id);
    }

    if (updates.length === 0) {
      return existing;
    }

    values.push(id);

    const sql = `UPDATE subtasks SET ${updates.join(', ')} WHERE id = ?`;
    this.query(sql, ...values);

    return this.findById(id);
  }

  /**
   * Find all subtasks for a task
   */
  findByTaskId(taskId: string): Subtask[] {
    const sql = `
      SELECT * FROM subtasks 
      WHERE task_id = ? 
      ORDER BY "order" ASC
    `;
    return this.queryAll<Subtask>(sql, taskId);
  }

  /**
   * Count subtasks for a task
   */
  countByTaskId(taskId: string): number {
    return this.countBy('task_id', taskId);
  }

  /**
   * Count completed subtasks for a task
   */
  completedCountByTaskId(taskId: string): number {
    const sql = `
      SELECT COUNT(*) as count FROM subtasks 
      WHERE task_id = ? AND completed = 1
    `;
    const result = this.queryOne<{ count: number }>(sql, taskId);
    return result?.count ?? 0;
  }

  /**
   * Get the maximum order number for a task's subtasks
   */
  getMaxOrder(taskId: string): number {
    const sql = `
      SELECT COALESCE(MAX("order"), -1) as max_order 
      FROM subtasks 
      WHERE task_id = ?
    `;
    const result = this.queryOne<{ max_order: number }>(sql, taskId);
    return result?.max_order ?? -1;
  }

  /**
   * Reorder subtasks
   */
  reorder(taskId: string, subtaskIds: string[]): void {
    this.transaction(() => {
      subtaskIds.forEach((id, index) => {
        this.query(
          `UPDATE subtasks SET "order" = ? WHERE id = ? AND task_id = ?`,
          index,
          id,
          taskId
        );
      });
    });
  }

  /**
   * Toggle subtask completion
   */
  toggleComplete(id: string): Subtask | undefined {
    const existing = this.findById(id);
    if (!existing) {
      return undefined;
    }

    return this.update(id, { completed: !existing.completed });
  }

  /**
   * Mark all subtasks as complete for a task
   */
  markAllComplete(taskId: string): number {
    const sql = `
      UPDATE subtasks 
      SET completed = 1 
      WHERE task_id = ? AND completed = 0
    `;
    const result = this.query(sql, taskId);
    return result.changes;
  }

  /**
   * Mark all subtasks as incomplete for a task
   */
  markAllIncomplete(taskId: string): number {
    const sql = `
      UPDATE subtasks 
      SET completed = 0 
      WHERE task_id = ? AND completed = 1
    `;
    const result = this.query(sql, taskId);
    return result.changes;
  }

  /**
   * Delete all subtasks for a task
   */
  deleteByTaskId(taskId: string): number {
    const result = this.query(
      'DELETE FROM subtasks WHERE task_id = ?',
      taskId
    );
    return result.changes;
  }

  /**
   * Get completion percentage for a task's subtasks
   */
  getCompletionPercentage(taskId: string): number {
    const total = this.countByTaskId(taskId);
    if (total === 0) return 0;
    
    const completed = this.completedCountByTaskId(taskId);
    return Math.round((completed / total) * 100);
  }
}

// Singleton instance
let instance: SubtasksRepository | null = null;

export function getSubtasksRepository(): SubtasksRepository {
  if (!instance) {
    instance = new SubtasksRepository();
  }
  return instance;
}

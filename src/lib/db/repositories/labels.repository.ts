/**
 * Labels Repository
 * 
 * Handles CRUD operations for labels and task-label associations.
 */

import { BaseRepository, CompositeKeyRepository } from './base.repository';
import { 
  Label, 
  CreateLabelInput, 
  UpdateLabelInput,
  TaskLabel,
  CreateTaskLabelInput
} from '../schema';

export class LabelsRepository extends BaseRepository<Label, CreateLabelInput, UpdateLabelInput> {
  constructor() {
    super('labels', 'id');
  }

  /**
   * Create a new label
   */
  create(data: CreateLabelInput): Label {
    const id = this.generateId();
    const timestamp = this.timestamp();
    
    const sql = `
      INSERT INTO labels (id, name, color, icon, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    this.query(
      sql,
      id,
      data.name,
      data.color ?? '#8b5cf6',
      data.icon ?? null,
      timestamp
    );
    
    return this.findById(id)!;
  }

  /**
   * Update a label
   */
  update(id: string, data: UpdateLabelInput): Label | undefined {
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
    if (data.color !== undefined) {
      updates.push('color = ?');
      values.push(data.color);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      values.push(data.icon);
    }

    if (updates.length === 0) {
      return existing;
    }

    values.push(id);

    const sql = `UPDATE labels SET ${updates.join(', ')} WHERE id = ?`;
    this.query(sql, ...values);

    return this.findById(id);
  }

  /**
   * Find a label by name
   */
  findByName(name: string): Label | undefined {
    return this.findOneBy('name', name);
  }

  /**
   * Check if a label name already exists
   */
  nameExists(name: string, excludeId?: string): boolean {
    let sql = 'SELECT 1 FROM labels WHERE name = ?';
    const values: unknown[] = [name];
    
    if (excludeId) {
      sql += ' AND id != ?';
      values.push(excludeId);
    }
    
    const result = this.queryOne(sql, ...values);
    return result !== undefined;
  }

  /**
   * Get all labels for a task
   */
  findByTaskId(taskId: string): Label[] {
    const sql = `
      SELECT l.* FROM labels l
      INNER JOIN task_labels tl ON l.id = tl.label_id
      WHERE tl.task_id = ?
      ORDER BY l.name ASC
    `;
    return this.queryAll<Label>(sql, taskId);
  }

  /**
   * Add a label to a task
   */
  addToTask(taskId: string, labelId: string): boolean {
    const sql = `
      INSERT OR IGNORE INTO task_labels (task_id, label_id)
      VALUES (?, ?)
    `;
    const result = this.query(sql, taskId, labelId);
    return result.changes > 0;
  }

  /**
   * Remove a label from a task
   */
  removeFromTask(taskId: string, labelId: string): boolean {
    const sql = `
      DELETE FROM task_labels 
      WHERE task_id = ? AND label_id = ?
    `;
    const result = this.query(sql, taskId, labelId);
    return result.changes > 0;
  }

  /**
   * Set all labels for a task (replaces existing)
   */
  setTaskLabels(taskId: string, labelIds: string[]): void {
    this.transaction(() => {
      // Remove existing labels
      this.query('DELETE FROM task_labels WHERE task_id = ?', taskId);
      
      // Add new labels
      for (const labelId of labelIds) {
        this.addToTask(taskId, labelId);
      }
    });
  }

  /**
   * Get count of tasks using a label
   */
  getTaskCount(labelId: string): number {
    const sql = `
      SELECT COUNT(*) as count FROM task_labels WHERE label_id = ?
    `;
    const result = this.queryOne<{ count: number }>(sql, labelId);
    return result?.count ?? 0;
  }

  /**
   * Delete a label (removes all task associations)
   */
  delete(id: string): boolean {
    // Cascade delete will handle task_labels automatically
    return super.delete(id);
  }
}

/**
 * Task Labels Repository (junction table)
 */
export class TaskLabelsRepository extends CompositeKeyRepository<TaskLabel, CreateTaskLabelInput> {
  constructor() {
    super('task_labels');
  }

  /**
   * Create a task-label association
   */
  create(data: CreateTaskLabelInput): TaskLabel {
    const sql = `
      INSERT OR IGNORE INTO task_labels (task_id, label_id)
      VALUES (?, ?)
    `;
    this.query(sql, data.task_id, data.label_id);
    
    return { task_id: data.task_id, label_id: data.label_id };
  }

  /**
   * Delete a task-label association
   */
  delete(taskId: string, labelId: string): boolean {
    const sql = `
      DELETE FROM task_labels 
      WHERE task_id = ? AND label_id = ?
    `;
    const result = this.query(sql, taskId, labelId);
    return result.changes > 0;
  }

  /**
   * Find all labels for a task
   */
  findByTaskId(taskId: string): TaskLabel[] {
    return this.queryAll<TaskLabel>(
      'SELECT * FROM task_labels WHERE task_id = ?',
      taskId
    );
  }

  /**
   * Find all tasks with a specific label
   */
  findByLabelId(labelId: string): TaskLabel[] {
    return this.queryAll<TaskLabel>(
      'SELECT * FROM task_labels WHERE label_id = ?',
      labelId
    );
  }

  /**
   * Delete all label associations for a task
   */
  deleteByTaskId(taskId: string): number {
    const result = this.query(
      'DELETE FROM task_labels WHERE task_id = ?',
      taskId
    );
    return result.changes;
  }

  /**
   * Delete all task associations for a label
   */
  deleteByLabelId(labelId: string): number {
    const result = this.query(
      'DELETE FROM task_labels WHERE label_id = ?',
      labelId
    );
    return result.changes;
  }
}

// Singleton instances
let labelsInstance: LabelsRepository | null = null;
let taskLabelsInstance: TaskLabelsRepository | null = null;

export function getLabelsRepository(): LabelsRepository {
  if (!labelsInstance) {
    labelsInstance = new LabelsRepository();
  }
  return labelsInstance;
}

export function getTaskLabelsRepository(): TaskLabelsRepository {
  if (!taskLabelsInstance) {
    taskLabelsInstance = new TaskLabelsRepository();
  }
  return taskLabelsInstance;
}

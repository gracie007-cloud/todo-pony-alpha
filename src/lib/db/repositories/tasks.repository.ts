/**
 * Tasks Repository
 *
 * Handles CRUD operations for tasks with filtering support
 * and automatic change logging.
 */

import { BaseRepository } from './base.repository';
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskWithRelations,
  Priority
} from '../schema';

/**
 * Escape special characters in SQL LIKE pattern
 * Escapes %, _, and \ to prevent them from being interpreted as wildcards
 */
export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&');
}

export interface TaskFilterOptions {
  listId?: string;
  dateFrom?: string;
  dateTo?: string;
  completed?: boolean;
  priority?: Priority;
  overdue?: boolean;
  search?: string;
  labelId?: string;
  /** Include soft-deleted tasks in results */
  includeDeleted?: boolean;
  /** Only return soft-deleted tasks */
  deletedOnly?: boolean;
}

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class TasksRepository extends BaseRepository<Task, CreateTaskInput, UpdateTaskInput> {
  constructor() {
    super('tasks', 'id');
  }

  /**
   * Create a new task
   */
  create(data: CreateTaskInput): Task {
    const id = this.generateId();
    const timestamp = this.timestamp();
    
    const sql = `
      INSERT INTO tasks (
        id, list_id, name, description, date, deadline,
        estimate_minutes, actual_minutes, priority, recurring_rule,
        completed, completed_at, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    this.query(
      sql,
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
      0, // completed
      null, // completed_at
      timestamp,
      timestamp
    );
    
    return this.findById(id)!;
  }

  /**
   * Update a task with automatic change logging
   */
  update(id: string, data: UpdateTaskInput): Task | undefined {
    const existing = this.findById(id);
    if (!existing) {
      return undefined;
    }

    const updates: string[] = [];
    const values: unknown[] = [];
    const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];

    // Track changes for logging
    const trackChange = (field: string, oldValue: unknown, newValue: unknown) => {
      if (oldValue !== newValue) {
        changes.push({ field, oldValue, newValue });
      }
    };

    if (data.name !== undefined && data.name !== existing.name) {
      trackChange('name', existing.name, data.name);
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      const newDesc = data.description ?? null;
      if (existing.description !== newDesc) {
        trackChange('description', existing.description, newDesc);
        updates.push('description = ?');
        values.push(newDesc);
      }
    }
    if (data.list_id !== undefined && data.list_id !== existing.list_id) {
      trackChange('list_id', existing.list_id, data.list_id);
      updates.push('list_id = ?');
      values.push(data.list_id);
    }
    if (data.date !== undefined) {
      const newDate = data.date ?? null;
      if (existing.date !== newDate) {
        trackChange('date', existing.date, newDate);
        updates.push('date = ?');
        values.push(newDate);
      }
    }
    if (data.deadline !== undefined) {
      const newDeadline = data.deadline ?? null;
      if (existing.deadline !== newDeadline) {
        trackChange('deadline', existing.deadline, newDeadline);
        updates.push('deadline = ?');
        values.push(newDeadline);
      }
    }
    if (data.estimate_minutes !== undefined) {
      const newEstimate = data.estimate_minutes ?? null;
      if (existing.estimate_minutes !== newEstimate) {
        trackChange('estimate_minutes', existing.estimate_minutes, newEstimate);
        updates.push('estimate_minutes = ?');
        values.push(newEstimate);
      }
    }
    if (data.actual_minutes !== undefined) {
      const newActual = data.actual_minutes ?? null;
      if (existing.actual_minutes !== newActual) {
        trackChange('actual_minutes', existing.actual_minutes, newActual);
        updates.push('actual_minutes = ?');
        values.push(newActual);
      }
    }
    if (data.priority !== undefined && data.priority !== existing.priority) {
      trackChange('priority', existing.priority, data.priority);
      updates.push('priority = ?');
      values.push(data.priority);
    }
    if (data.recurring_rule !== undefined) {
      const newRule = data.recurring_rule ?? null;
      if (existing.recurring_rule !== newRule) {
        trackChange('recurring_rule', existing.recurring_rule, newRule);
        updates.push('recurring_rule = ?');
        values.push(newRule);
      }
    }

    // Handle completion status specially
    if (data.completed !== undefined) {
      const currentCompleted = Boolean(existing.completed);
      if (data.completed !== currentCompleted) {
        trackChange('completed', currentCompleted, data.completed);
        updates.push('completed = ?');
        values.push(data.completed ? 1 : 0);
        
        if (data.completed) {
          const completedAt = this.timestamp();
          trackChange('completed_at', existing.completed_at, completedAt);
          updates.push('completed_at = ?');
          values.push(completedAt);
        } else {
          trackChange('completed_at', existing.completed_at, null);
          updates.push('completed_at = ?');
          values.push(null);
        }
      }
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = ?');
    values.push(this.timestamp());
    values.push(id);

    const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
    
    this.transaction(() => {
      this.query(sql, ...values);
      
      // Log all changes to task_history
      for (const change of changes) {
        this.logChange(id, change.field, change.oldValue, change.newValue);
      }
    });

    return this.findById(id);
  }

  /**
   * Log a change to the task_history table
   */
  private logChange(taskId: string, fieldName: string, oldValue: unknown, newValue: unknown): void {
    const id = this.generateId();
    const timestamp = this.timestamp();
    
    const sql = `
      INSERT INTO task_history (id, task_id, field_name, old_value, new_value, changed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    this.query(
      sql,
      id,
      taskId,
      fieldName,
      oldValue !== null ? JSON.stringify(oldValue) : null,
      newValue !== null ? JSON.stringify(newValue) : null,
      timestamp
    );
  }

  /**
   * Find tasks with filtering options
   */
  findWithFilters(options: TaskFilterOptions): Task[] {
    const conditions: string[] = [];
    const values: unknown[] = [];

    // Handle soft delete filtering
    if (options.deletedOnly) {
      conditions.push('deleted_at IS NOT NULL');
    } else if (!options.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

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
      values.push(this.timestamp());
    }

    if (options.search) {
      conditions.push('(name LIKE ? ESCAPE \'\\\' OR description LIKE ? ESCAPE \'\\\')');
      const escapedSearch = escapeLikePattern(options.search);
      const searchTerm = `%${escapedSearch}%`;
      values.push(searchTerm, searchTerm);
    }

    if (options.labelId) {
      conditions.push(`
        id IN (SELECT task_id FROM task_labels WHERE label_id = ?)
      `);
      values.push(options.labelId);
    }

    let sql = 'SELECT * FROM tasks';
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY date ASC, created_at DESC';

    return this.queryAll<Task>(sql, ...values);
  }

  /**
   * Find tasks with filtering and pagination options
   */
  findWithFiltersPaginated(
    options: TaskFilterOptions,
    pagination: PaginationOptions
  ): PaginatedResult<Task> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    // Handle soft delete filtering
    if (options.deletedOnly) {
      conditions.push('deleted_at IS NOT NULL');
    } else if (!options.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

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
      values.push(this.timestamp());
    }

    if (options.search) {
      conditions.push('(name LIKE ? ESCAPE \'\\\' OR description LIKE ? ESCAPE \'\\\')');
      const escapedSearch = escapeLikePattern(options.search);
      const searchTerm = `%${escapedSearch}%`;
      values.push(searchTerm, searchTerm);
    }

    if (options.labelId) {
      conditions.push(`
        id IN (SELECT task_id FROM task_labels WHERE label_id = ?)
      `);
      values.push(options.labelId);
    }

    const whereClause = conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';
    
    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM tasks${whereClause}`;
    const countResult = this.queryOne<{ count: number }>(countSql, ...values);
    const total = countResult?.count ?? 0;
    
    // Calculate pagination values
    const totalPages = Math.ceil(total / pagination.limit);
    const offset = (pagination.page - 1) * pagination.limit;
    
    // Get paginated data
    const dataSql = `SELECT * FROM tasks${whereClause} ORDER BY date ASC, created_at DESC LIMIT ? OFFSET ?`;
    const data = this.queryAll<Task>(dataSql, ...values, pagination.limit, offset);

    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1
      }
    };
  }

  /**
   * Find all tasks for a specific list
   */
  findByList(listId: string): Task[] {
    return this.findBy('list_id', listId);
  }

  /**
   * Find tasks by date
   */
  findByDate(date: string): Task[] {
    const sql = `SELECT * FROM tasks WHERE date(date) = date(?) ORDER BY date ASC`;
    return this.queryAll<Task>(sql, date);
  }

  /**
   * Find overdue tasks
   */
  findOverdue(): Task[] {
    const sql = `
      SELECT * FROM tasks 
      WHERE deadline IS NOT NULL 
        AND deadline < ? 
        AND completed = 0
      ORDER BY deadline ASC
    `;
    return this.queryAll<Task>(sql, this.timestamp());
  }

  /**
   * Find tasks with all relations
   */
  findWithRelations(id: string): TaskWithRelations | undefined {
    const task = this.findById(id);
    if (!task) {
      return undefined;
    }

    // Get related data
    const list = this.queryOne<{ id: string; name: string; color: string; emoji: string | null; is_default: number; created_at: string; updated_at: string }>(
      'SELECT * FROM lists WHERE id = ?', 
      task.list_id
    );
    
    const subtasks = this.queryAll<{ id: string; task_id: string; name: string; completed: number; order: number; created_at: string }>(
      'SELECT * FROM subtasks WHERE task_id = ? ORDER BY "order" ASC',
      id
    );
    
    const labels = this.queryAll<{ id: string; name: string; color: string; icon: string | null; created_at: string }>(
      `SELECT l.* FROM labels l
       INNER JOIN task_labels tl ON l.id = tl.label_id
       WHERE tl.task_id = ?`,
      id
    );
    
    const reminders = this.queryAll<{ id: string; task_id: string; remind_at: string; type: string; sent: number; created_at: string }>(
      'SELECT * FROM reminders WHERE task_id = ? ORDER BY remind_at ASC',
      id
    );
    
    const attachments = this.queryAll<{ id: string; task_id: string; filename: string; file_path: string; file_size: number; mime_type: string; created_at: string }>(
      'SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at DESC',
      id
    );

    return {
      ...task,
      list: {
        ...list!,
        is_default: Boolean(list!.is_default)
      },
      subtasks: subtasks.map(s => ({ ...s, completed: Boolean(s.completed) })),
      labels,
      reminders: reminders.map(r => ({ ...r, sent: Boolean(r.sent) })),
      attachments
    } as TaskWithRelations;
  }

  /**
   * Mark a task as complete
   */
  markComplete(id: string): Task | undefined {
    return this.update(id, { completed: true });
  }

  /**
   * Mark a task as incomplete
   */
  markIncomplete(id: string): Task | undefined {
    return this.update(id, { completed: false });
  }

  /**
   * Move task to a different list
   */
  moveToList(id: string, listId: string): Task | undefined {
    return this.update(id, { list_id: listId });
  }

  /**
   * Get task count by list
   */
  countByList(listId: string): number {
    return this.countBy('list_id', listId);
  }

  /**
   * Get completed task count by list
   */
  completedCountByList(listId: string): number {
    const sql = `SELECT COUNT(*) as count FROM tasks WHERE list_id = ? AND completed = 1 AND deleted_at IS NULL`;
    const result = this.queryOne<{ count: number }>(sql, listId);
    return result?.count ?? 0;
  }

  /**
   * Soft delete a task (sets deleted_at timestamp)
   */
  softDelete(id: string): Task | undefined {
    const existing = this.findById(id);
    if (!existing) {
      return undefined;
    }

    const timestamp = this.timestamp();
    const sql = `UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?`;
    this.query(sql, timestamp, timestamp, id);

    // Log the deletion
    this.logChange(id, 'deleted_at', null, timestamp);

    return this.findById(id);
  }

  /**
   * Restore a soft-deleted task (clears deleted_at timestamp)
   */
  restore(id: string): Task | undefined {
    const existing = this.findById(id);
    if (!existing) {
      return undefined;
    }

    const timestamp = this.timestamp();
    const sql = `UPDATE tasks SET deleted_at = NULL, updated_at = ? WHERE id = ?`;
    this.query(sql, timestamp, id);

    // Log the restoration
    this.logChange(id, 'deleted_at', existing.deleted_at, null);

    return this.findById(id);
  }

  /**
   * Permanently delete a task (use with caution)
   * This will also delete all related data (subtasks, reminders, etc.) via CASCADE
   */
  permanentDelete(id: string): boolean {
    return this.delete(id);
  }

  /**
   * Find all soft-deleted tasks
   */
  findDeleted(): Task[] {
    const sql = `SELECT * FROM tasks WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC`;
    return this.queryAll<Task>(sql);
  }

  /**
   * Find soft-deleted tasks for a specific list
   */
  findDeletedByList(listId: string): Task[] {
    const sql = `SELECT * FROM tasks WHERE list_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`;
    return this.queryAll<Task>(sql, listId);
  }

  /**
   * Permanently delete all soft-deleted tasks (cleanup operation)
   */
  purgeDeleted(): number {
    const sql = `DELETE FROM tasks WHERE deleted_at IS NOT NULL`;
    const result = this.query(sql);
    return result.changes;
  }

  /**
   * Permanently delete soft-deleted tasks older than a specified date
   */
  purgeDeletedOlderThan(date: string): number {
    const sql = `DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at < ?`;
    const result = this.query(sql, date);
    return result.changes;
  }
}

// Singleton instance
let instance: TasksRepository | null = null;

export function getTasksRepository(): TasksRepository {
  if (!instance) {
    instance = new TasksRepository();
  }
  return instance;
}

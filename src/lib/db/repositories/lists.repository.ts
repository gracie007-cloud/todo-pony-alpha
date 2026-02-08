/**
 * Lists Repository
 * 
 * Handles CRUD operations for lists.
 */

import { BaseRepository } from './base.repository';
import { 
  List, 
  CreateListInput, 
  UpdateListInput, 
  ListWithTaskCount 
} from '../schema';

export class ListsRepository extends BaseRepository<List, CreateListInput, UpdateListInput> {
  constructor() {
    super('lists', 'id');
  }

  /**
   * Create a new list
   */
  create(data: CreateListInput): List {
    const id = this.generateId();
    const timestamp = this.timestamp();
    
    const sql = `
      INSERT INTO lists (id, name, color, emoji, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    this.query(
      sql,
      id,
      data.name,
      data.color ?? '#6366f1',
      data.emoji ?? null,
      data.is_default ? 1 : 0,
      timestamp,
      timestamp
    );
    
    return this.findById(id)!;
  }

  /**
   * Update a list
   */
  update(id: string, data: UpdateListInput): List | undefined {
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
    if (data.emoji !== undefined) {
      updates.push('emoji = ?');
      values.push(data.emoji);
    }
    if (data.is_default !== undefined) {
      updates.push('is_default = ?');
      values.push(data.is_default ? 1 : 0);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = ?');
    values.push(this.timestamp());
    values.push(id);

    const sql = `UPDATE lists SET ${updates.join(', ')} WHERE id = ?`;
    this.query(sql, ...values);

    return this.findById(id);
  }

  /**
   * Get the default Inbox list
   */
  findDefault(): List | undefined {
    return this.findOneBy('is_default', 1);
  }

  /**
   * Get all lists with task counts
   */
  findAllWithTaskCounts(): ListWithTaskCount[] {
    const sql = `
      SELECT 
        l.*,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.completed = 1 THEN 1 ELSE 0 END) as completed_count
      FROM lists l
      LEFT JOIN tasks t ON l.id = t.list_id
      GROUP BY l.id
      ORDER BY l.is_default DESC, l.name ASC
    `;
    
    return this.queryAll<ListWithTaskCount>(sql);
  }

  /**
   * Check if a list has any tasks
   */
  hasTasks(id: string): boolean {
    const sql = `SELECT 1 FROM tasks WHERE list_id = ? LIMIT 1`;
    const result = this.queryOne(sql, id);
    return result !== undefined;
  }

  /**
   * Set a list as the default (and unset any previous default)
   */
  setAsDefault(id: string): List | undefined {
    const existing = this.findById(id);
    if (!existing) {
      return undefined;
    }

    return this.transaction(() => {
      // Unset any existing default
      this.query(`UPDATE lists SET is_default = 0 WHERE is_default = 1`);
      
      // Set the new default
      this.query(`UPDATE lists SET is_default = 1, updated_at = ? WHERE id = ?`, this.timestamp(), id);
      
      return this.findById(id);
    });
  }
}

// Singleton instance
let instance: ListsRepository | null = null;

export function getListsRepository(): ListsRepository {
  if (!instance) {
    instance = new ListsRepository();
  }
  return instance;
}

/**
 * Attachments Repository
 * 
 * Handles CRUD operations for file attachments.
 */

import { BaseRepository } from './base.repository';
import { 
  Attachment, 
  CreateAttachmentInput 
} from '../schema';

export class AttachmentsRepository extends BaseRepository<Attachment, CreateAttachmentInput, never> {
  constructor() {
    super('attachments', 'id');
  }

  /**
   * Create a new attachment
   */
  create(data: CreateAttachmentInput): Attachment {
    const id = this.generateId();
    const timestamp = this.timestamp();
    
    const sql = `
      INSERT INTO attachments (id, task_id, filename, file_path, file_size, mime_type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    this.query(
      sql,
      id,
      data.task_id,
      data.filename,
      data.file_path,
      data.file_size,
      data.mime_type,
      timestamp
    );
    
    return this.findById(id)!;
  }

  /**
   * Update is not supported for attachments - delete and recreate instead
   */
  update(): never {
    throw new Error('Attachments cannot be updated. Delete and recreate instead.');
  }

  /**
   * Find all attachments for a task
   */
  findByTaskId(taskId: string): Attachment[] {
    const sql = `
      SELECT * FROM attachments 
      WHERE task_id = ? 
      ORDER BY created_at DESC
    `;
    return this.queryAll<Attachment>(sql, taskId);
  }

  /**
   * Find attachment by filename for a specific task
   */
  findByFilename(taskId: string, filename: string): Attachment | undefined {
    const sql = `
      SELECT * FROM attachments 
      WHERE task_id = ? AND filename = ?
      LIMIT 1
    `;
    return this.queryOne<Attachment>(sql, taskId, filename);
  }

  /**
   * Delete all attachments for a task
   */
  deleteByTaskId(taskId: string): number {
    const result = this.query(
      'DELETE FROM attachments WHERE task_id = ?',
      taskId
    );
    return result.changes;
  }

  /**
   * Get total file size for a task's attachments
   */
  getTotalSizeByTaskId(taskId: string): number {
    const sql = `
      SELECT COALESCE(SUM(file_size), 0) as total_size 
      FROM attachments 
      WHERE task_id = ?
    `;
    const result = this.queryOne<{ total_size: number }>(sql, taskId);
    return result?.total_size ?? 0;
  }

  /**
   * Count attachments for a task
   */
  countByTaskId(taskId: string): number {
    return this.countBy('task_id', taskId);
  }

  /**
   * Find attachments by MIME type prefix (e.g., 'image/', 'video/')
   */
  findByMimeType(taskId: string, mimeTypePrefix: string): Attachment[] {
    const sql = `
      SELECT * FROM attachments 
      WHERE task_id = ? AND mime_type LIKE ?
      ORDER BY created_at DESC
    `;
    return this.queryAll<Attachment>(sql, taskId, `${mimeTypePrefix}%`);
  }

  /**
   * Find image attachments for a task
   */
  findImages(taskId: string): Attachment[] {
    return this.findByMimeType(taskId, 'image/');
  }

  /**
   * Find document attachments for a task
   */
  findDocuments(taskId: string): Attachment[] {
    const sql = `
      SELECT * FROM attachments 
      WHERE task_id = ? AND (
        mime_type LIKE 'application/%' OR 
        mime_type LIKE 'text/%'
      )
      ORDER BY created_at DESC
    `;
    return this.queryAll<Attachment>(sql, taskId);
  }

  /**
   * Check if a file with the same name exists for a task
   */
  filenameExists(taskId: string, filename: string): boolean {
    const sql = `
      SELECT 1 FROM attachments 
      WHERE task_id = ? AND filename = ?
      LIMIT 1
    `;
    const result = this.queryOne(sql, taskId, filename);
    return result !== undefined;
  }

  /**
   * Rename an attachment (updates filename only)
   */
  rename(id: string, newFilename: string): Attachment | undefined {
    const existing = this.findById(id);
    if (!existing) {
      return undefined;
    }

    const sql = `UPDATE attachments SET filename = ? WHERE id = ?`;
    this.query(sql, newFilename, id);

    return this.findById(id);
  }
}

// Singleton instance
let instance: AttachmentsRepository | null = null;

export function getAttachmentsRepository(): AttachmentsRepository {
  if (!instance) {
    instance = new AttachmentsRepository();
  }
  return instance;
}

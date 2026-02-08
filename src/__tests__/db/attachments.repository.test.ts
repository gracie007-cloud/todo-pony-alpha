/**
 * Attachments Repository Tests
 * 
 * Tests for CRUD operations.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { createTestAttachment, DEFAULT_LIST_ID } from '../utils/fixtures';
import type { Attachment } from '@/lib/db/schema';

// Helper to create AttachmentsRepository with test database
function createAttachmentsRepository() {
  const db = getTestDatabase();
  
  return {
    findAll(): Attachment[] {
      return db.prepare('SELECT * FROM attachments ORDER BY created_at DESC').all() as Attachment[];
    },
    
    findById(id: string): Attachment | undefined {
      return db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as Attachment | undefined;
    },
    
    create(data: { 
      task_id: string; 
      filename: string; 
      file_path: string; 
      file_size: number; 
      mime_type: string; 
    }): Attachment {
      const id = testUuid.generate();
      const now = new Date().toISOString();
      
      db.prepare(`
        INSERT INTO attachments (id, task_id, filename, file_path, file_size, mime_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, data.task_id, data.filename, data.file_path, data.file_size, data.mime_type, now);
      
      return this.findById(id)!;
    },
    
    delete(id: string): boolean {
      const result = db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
      return result.changes > 0;
    },
    
    findByTaskId(taskId: string): Attachment[] {
      return db.prepare(`
        SELECT * FROM attachments 
        WHERE task_id = ? 
        ORDER BY created_at DESC
      `).all(taskId) as Attachment[];
    },
    
    findByFilename(taskId: string, filename: string): Attachment | undefined {
      return db.prepare(`
        SELECT * FROM attachments 
        WHERE task_id = ? AND filename = ?
        LIMIT 1
      `).get(taskId, filename) as Attachment | undefined;
    },
    
    deleteByTaskId(taskId: string): number {
      const result = db.prepare('DELETE FROM attachments WHERE task_id = ?').run(taskId);
      return result.changes;
    },
    
    getTotalSizeByTaskId(taskId: string): number {
      const result = db.prepare(`
        SELECT COALESCE(SUM(file_size), 0) as total_size 
        FROM attachments 
        WHERE task_id = ?
      `).get(taskId) as { total_size: number };
      return result.total_size;
    },
    
    countByTaskId(taskId: string): number {
      const result = db.prepare('SELECT COUNT(*) as count FROM attachments WHERE task_id = ?').get(taskId) as { count: number };
      return result.count;
    },
    
    findByMimeType(taskId: string, mimeTypePrefix: string): Attachment[] {
      return db.prepare(`
        SELECT * FROM attachments 
        WHERE task_id = ? AND mime_type LIKE ?
        ORDER BY created_at DESC
      `).all(taskId, `${mimeTypePrefix}%`) as Attachment[];
    },
    
    findImages(taskId: string): Attachment[] {
      return this.findByMimeType(taskId, 'image/');
    },
    
    findDocuments(taskId: string): Attachment[] {
      return db.prepare(`
        SELECT * FROM attachments 
        WHERE task_id = ? AND (
          mime_type LIKE 'application/%' OR 
          mime_type LIKE 'text/%'
        )
        ORDER BY created_at DESC
      `).all(taskId) as Attachment[];
    },
    
    filenameExists(taskId: string, filename: string): boolean {
      const result = db.prepare(`
        SELECT 1 FROM attachments 
        WHERE task_id = ? AND filename = ?
        LIMIT 1
      `).get(taskId, filename);
      return result !== undefined;
    },
    
    rename(id: string, newFilename: string): Attachment | undefined {
      const existing = this.findById(id);
      if (!existing) return undefined;
      
      db.prepare('UPDATE attachments SET filename = ? WHERE id = ?').run(newFilename, id);
      return this.findById(id);
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

describe('AttachmentsRepository', () => {
  let repo: ReturnType<typeof createAttachmentsRepository>;
  let taskId: string;
  
  beforeEach(() => {
    clearTestDatabase();
    repo = createAttachmentsRepository();
    taskId = createTestTaskInDb();
  });
  
  describe('findAll', () => {
    test('should return empty array when no attachments', () => {
      const attachments = repo.findAll();
      expect(attachments).toEqual([]);
    });
    
    test('should return all attachments', () => {
      repo.create({
        task_id: taskId,
        filename: 'file1.pdf',
        file_path: '/uploads/file1.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      repo.create({
        task_id: taskId,
        filename: 'file2.pdf',
        file_path: '/uploads/file2.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
      });
      
      const attachments = repo.findAll();
      expect(attachments.length).toBe(2);
    });
  });
  
  describe('findById', () => {
    test('should return attachment by ID', () => {
      const created = repo.create({
        task_id: taskId,
        filename: 'test.pdf',
        file_path: '/uploads/test.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      
      const found = repo.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.filename).toBe('test.pdf');
    });
    
    test('should return undefined for non-existent ID', () => {
      const found = repo.findById(testUuid.generate());
      expect(found).toBeUndefined();
    });
  });
  
  describe('create', () => {
    test('should create an attachment with all fields', () => {
      const attachment = repo.create({
        task_id: taskId,
        filename: 'document.pdf',
        file_path: '/uploads/documents/document.pdf',
        file_size: 5120,
        mime_type: 'application/pdf',
      });
      
      expect(attachment.id).toBeDefined();
      expect(attachment.task_id).toBe(taskId);
      expect(attachment.filename).toBe('document.pdf');
      expect(attachment.file_path).toBe('/uploads/documents/document.pdf');
      expect(attachment.file_size).toBe(5120);
      expect(attachment.mime_type).toBe('application/pdf');
      expect(attachment.created_at).toBeDefined();
    });
    
    test('should create image attachment', () => {
      const attachment = repo.create({
        task_id: taskId,
        filename: 'image.png',
        file_path: '/uploads/images/image.png',
        file_size: 10240,
        mime_type: 'image/png',
      });
      
      expect(attachment.mime_type).toBe('image/png');
    });
    
    test('should create text attachment', () => {
      const attachment = repo.create({
        task_id: taskId,
        filename: 'notes.txt',
        file_path: '/uploads/notes.txt',
        file_size: 256,
        mime_type: 'text/plain',
      });
      
      expect(attachment.mime_type).toBe('text/plain');
    });
  });
  
  describe('delete', () => {
    test('should delete an existing attachment', () => {
      const created = repo.create({
        task_id: taskId,
        filename: 'to-delete.pdf',
        file_path: '/uploads/to-delete.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      
      const result = repo.delete(created.id);
      expect(result).toBe(true);
      expect(repo.findById(created.id)).toBeUndefined();
    });
    
    test('should return false for non-existent attachment', () => {
      const result = repo.delete(testUuid.generate());
      expect(result).toBe(false);
    });
  });
  
  describe('findByTaskId', () => {
    test('should return attachments for a specific task', () => {
      const taskId2 = createTestTaskInDb();
      
      repo.create({
        task_id: taskId,
        filename: 'task1-file.pdf',
        file_path: '/uploads/task1-file.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      repo.create({
        task_id: taskId2,
        filename: 'task2-file.pdf',
        file_path: '/uploads/task2-file.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
      });
      
      const attachments = repo.findByTaskId(taskId);
      expect(attachments.length).toBe(1);
      expect(attachments[0].task_id).toBe(taskId);
    });
    
    test('should return empty array for task with no attachments', () => {
      const attachments = repo.findByTaskId(taskId);
      expect(attachments).toEqual([]);
    });
    
    test('should return attachments sorted by created_at DESC', () => {
      repo.create({
        task_id: taskId,
        filename: 'first.pdf',
        file_path: '/uploads/first.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      
      // Small delay to ensure different timestamps
      repo.create({
        task_id: taskId,
        filename: 'second.pdf',
        file_path: '/uploads/second.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      
      const attachments = repo.findByTaskId(taskId);
      expect(attachments[0].filename).toBe('second.pdf');
    });
  });
  
  describe('findByFilename', () => {
    test('should find attachment by filename', () => {
      repo.create({
        task_id: taskId,
        filename: 'unique-file.pdf',
        file_path: '/uploads/unique-file.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      
      const found = repo.findByFilename(taskId, 'unique-file.pdf');
      expect(found).toBeDefined();
      expect(found?.filename).toBe('unique-file.pdf');
    });
    
    test('should return undefined for non-existent filename', () => {
      const found = repo.findByFilename(taskId, 'non-existent.pdf');
      expect(found).toBeUndefined();
    });
    
    test('should only search within task', () => {
      const taskId2 = createTestTaskInDb();
      
      repo.create({
        task_id: taskId,
        filename: 'shared-name.pdf',
        file_path: '/uploads/shared-name.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      
      const found = repo.findByFilename(taskId2, 'shared-name.pdf');
      expect(found).toBeUndefined();
    });
  });
  
  describe('deleteByTaskId', () => {
    test('should delete all attachments for a task', () => {
      repo.create({
        task_id: taskId,
        filename: 'file1.pdf',
        file_path: '/uploads/file1.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      repo.create({
        task_id: taskId,
        filename: 'file2.pdf',
        file_path: '/uploads/file2.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
      });
      
      const changes = repo.deleteByTaskId(taskId);
      expect(changes).toBe(2);
      expect(repo.findByTaskId(taskId)).toEqual([]);
    });
    
    test('should not affect other tasks attachments', () => {
      const taskId2 = createTestTaskInDb();
      
      repo.create({
        task_id: taskId,
        filename: 'file1.pdf',
        file_path: '/uploads/file1.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      repo.create({
        task_id: taskId2,
        filename: 'file2.pdf',
        file_path: '/uploads/file2.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
      });
      
      repo.deleteByTaskId(taskId);
      
      expect(repo.findByTaskId(taskId2).length).toBe(1);
    });
  });
  
  describe('getTotalSizeByTaskId', () => {
    test('should return total size of all attachments', () => {
      repo.create({
        task_id: taskId,
        filename: 'file1.pdf',
        file_path: '/uploads/file1.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      repo.create({
        task_id: taskId,
        filename: 'file2.pdf',
        file_path: '/uploads/file2.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
      });
      
      expect(repo.getTotalSizeByTaskId(taskId)).toBe(3072);
    });
    
    test('should return 0 for task with no attachments', () => {
      expect(repo.getTotalSizeByTaskId(taskId)).toBe(0);
    });
  });
  
  describe('countByTaskId', () => {
    test('should count attachments for a task', () => {
      repo.create({
        task_id: taskId,
        filename: 'file1.pdf',
        file_path: '/uploads/file1.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      repo.create({
        task_id: taskId,
        filename: 'file2.pdf',
        file_path: '/uploads/file2.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
      });
      
      expect(repo.countByTaskId(taskId)).toBe(2);
    });
    
    test('should return 0 for task with no attachments', () => {
      expect(repo.countByTaskId(taskId)).toBe(0);
    });
  });
  
  describe('findByMimeType', () => {
    test('should find attachments by MIME type prefix', () => {
      repo.create({
        task_id: taskId,
        filename: 'image.png',
        file_path: '/uploads/image.png',
        file_size: 1024,
        mime_type: 'image/png',
      });
      repo.create({
        task_id: taskId,
        filename: 'doc.pdf',
        file_path: '/uploads/doc.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
      });
      repo.create({
        task_id: taskId,
        filename: 'image.jpg',
        file_path: '/uploads/image.jpg',
        file_size: 3072,
        mime_type: 'image/jpeg',
      });
      
      const images = repo.findByMimeType(taskId, 'image/');
      expect(images.length).toBe(2);
      expect(images.every(a => a.mime_type.startsWith('image/'))).toBe(true);
    });
  });
  
  describe('findImages', () => {
    test('should return only image attachments', () => {
      repo.create({
        task_id: taskId,
        filename: 'photo.png',
        file_path: '/uploads/photo.png',
        file_size: 1024,
        mime_type: 'image/png',
      });
      repo.create({
        task_id: taskId,
        filename: 'document.pdf',
        file_path: '/uploads/document.pdf',
        file_size: 2048,
        mime_type: 'application/pdf',
      });
      
      const images = repo.findImages(taskId);
      expect(images.length).toBe(1);
      expect(images[0].filename).toBe('photo.png');
    });
  });
  
  describe('findDocuments', () => {
    test('should return application and text documents', () => {
      repo.create({
        task_id: taskId,
        filename: 'report.pdf',
        file_path: '/uploads/report.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      repo.create({
        task_id: taskId,
        filename: 'notes.txt',
        file_path: '/uploads/notes.txt',
        file_size: 256,
        mime_type: 'text/plain',
      });
      repo.create({
        task_id: taskId,
        filename: 'photo.png',
        file_path: '/uploads/photo.png',
        file_size: 2048,
        mime_type: 'image/png',
      });
      
      const docs = repo.findDocuments(taskId);
      expect(docs.length).toBe(2);
      expect(docs.every(a => 
        a.mime_type.startsWith('application/') || 
        a.mime_type.startsWith('text/')
      )).toBe(true);
    });
  });
  
  describe('filenameExists', () => {
    test('should return true for existing filename', () => {
      repo.create({
        task_id: taskId,
        filename: 'existing.pdf',
        file_path: '/uploads/existing.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      
      expect(repo.filenameExists(taskId, 'existing.pdf')).toBe(true);
    });
    
    test('should return false for non-existent filename', () => {
      expect(repo.filenameExists(taskId, 'non-existent.pdf')).toBe(false);
    });
    
    test('should check within task scope', () => {
      const taskId2 = createTestTaskInDb();
      
      repo.create({
        task_id: taskId,
        filename: 'shared.pdf',
        file_path: '/uploads/shared.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      
      expect(repo.filenameExists(taskId, 'shared.pdf')).toBe(true);
      expect(repo.filenameExists(taskId2, 'shared.pdf')).toBe(false);
    });
  });
  
  describe('rename', () => {
    test('should rename an attachment', () => {
      const created = repo.create({
        task_id: taskId,
        filename: 'original.pdf',
        file_path: '/uploads/original.pdf',
        file_size: 1024,
        mime_type: 'application/pdf',
      });
      
      const renamed = repo.rename(created.id, 'renamed.pdf');
      
      expect(renamed?.filename).toBe('renamed.pdf');
      // File path should remain unchanged
      expect(renamed?.file_path).toBe('/uploads/original.pdf');
    });
    
    test('should return undefined for non-existent attachment', () => {
      const result = repo.rename(testUuid.generate(), 'new-name.pdf');
      expect(result).toBeUndefined();
    });
  });
});

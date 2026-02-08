/**
 * Attachments API Tests
 * 
 * Tests for attachment endpoints.
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { getTestDatabase, clearTestDatabase, testUuid } from '../utils/mock-db';
import { DEFAULT_LIST_ID } from '../utils/fixtures';
import type { Attachment } from '@/lib/db/schema';

function createMockAttachmentsRepository() {
  const db = getTestDatabase();
  
  return {
    findById(id: string): Attachment | undefined {
      return db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as Attachment | undefined;
    },
    
    findByTaskId(taskId: string): Attachment[] {
      return db.prepare(`SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at DESC`).all(taskId) as Attachment[];
    },
    
    create(data: { task_id: string; filename: string; file_path: string; file_size: number; mime_type: string }): Attachment {
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
    
    findByFilename(taskId: string, filename: string): Attachment | undefined {
      return db.prepare(`SELECT * FROM attachments WHERE task_id = ? AND filename = ? LIMIT 1`).get(taskId, filename) as Attachment | undefined;
    },
    
    filenameExists(taskId: string, filename: string): boolean {
      return db.prepare(`SELECT 1 FROM attachments WHERE task_id = ? AND filename = ? LIMIT 1`).get(taskId, filename) !== undefined;
    },
    
    countByTaskId(taskId: string): number {
      const result = db.prepare('SELECT COUNT(*) as count FROM attachments WHERE task_id = ?').get(taskId) as { count: number };
      return result.count;
    },
    
    getTotalSizeByTaskId(taskId: string): number {
      const result = db.prepare(`SELECT COALESCE(SUM(file_size), 0) as total_size FROM attachments WHERE task_id = ?`).get(taskId) as { total_size: number };
      return result.total_size;
    },
  };
}

function createMockRequest(options: { method: string; body?: unknown }) {
  return { method: options.method, json: async () => options.body } as any;
}

function createTestTask(): string {
  const db = getTestDatabase();
  const id = testUuid.generate();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO tasks (id, list_id, name, priority, completed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(id, DEFAULT_LIST_ID, 'Test Task', 'none', 0, now, now);
  return id;
}

function createAttachmentsApiHandler() {
  const repo = createMockAttachmentsRepository();
  return {
    repo,
    
    async GET(request: any, context: { params: { id: string } }) {
      try {
        const attachments = repo.findByTaskId(context.params.id);
        return { status: 200, data: { success: true, data: attachments } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to fetch attachments' } };
      }
    },
    
    async POST(request: any, context: { params: { id: string } }) {
      try {
        const body = await request.json();
        
        if (!body.filename) {
          return { status: 400, data: { success: false, error: 'filename is required' } };
        }
        if (!body.file_path) {
          return { status: 400, data: { success: false, error: 'file_path is required' } };
        }
        if (typeof body.file_size !== 'number') {
          return { status: 400, data: { success: false, error: 'file_size is required and must be a number' } };
        }
        if (!body.mime_type) {
          return { status: 400, data: { success: false, error: 'mime_type is required' } };
        }
        
        // Check file size limit (100MB)
        if (body.file_size > 104857600) {
          return { status: 400, data: { success: false, error: 'File size exceeds 100MB limit' } };
        }
        
        // Check for duplicate filename
        if (repo.filenameExists(context.params.id, body.filename)) {
          return { status: 409, data: { success: false, error: 'A file with this name already exists for this task' } };
        }
        
        const attachment = repo.create({
          task_id: context.params.id,
          filename: body.filename,
          file_path: body.file_path,
          file_size: body.file_size,
          mime_type: body.mime_type,
        });
        return { status: 201, data: { success: true, data: attachment } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to create attachment' } };
      }
    },
  };
}

function createAttachmentByIdApiHandler() {
  const repo = createMockAttachmentsRepository();
  return {
    repo,
    
    async GET(request: any, context: { params: { id: string; attachmentId: string } }) {
      try {
        const attachment = repo.findById(context.params.attachmentId);
        if (!attachment) {
          return { status: 404, data: { success: false, error: 'Attachment not found' } };
        }
        return { status: 200, data: { success: true, data: attachment } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to fetch attachment' } };
      }
    },
    
    async DELETE(request: any, context: { params: { id: string; attachmentId: string } }) {
      try {
        const attachment = repo.findById(context.params.attachmentId);
        if (!attachment) {
          return { status: 404, data: { success: false, error: 'Attachment not found' } };
        }
        const deleted = repo.delete(context.params.attachmentId);
        if (!deleted) {
          return { status: 500, data: { success: false, error: 'Failed to delete attachment' } };
        }
        return { status: 200, data: { success: true, data: null } };
      } catch (error) {
        return { status: 500, data: { success: false, error: 'Failed to delete attachment' } };
      }
    },
  };
}

describe('Attachments API', () => {
  let handler: ReturnType<typeof createAttachmentsApiHandler>;
  let byIdHandler: ReturnType<typeof createAttachmentByIdApiHandler>;
  let taskId: string;
  
  beforeEach(() => {
    clearTestDatabase();
    handler = createAttachmentsApiHandler();
    byIdHandler = createAttachmentByIdApiHandler();
    taskId = createTestTask();
  });
  
  describe('GET /api/tasks/[id]/attachments', () => {
    test('should return all attachments for a task', async () => {
      handler.repo.create({ task_id: taskId, filename: 'file1.pdf', file_path: '/uploads/file1.pdf', file_size: 1024, mime_type: 'application/pdf' });
      handler.repo.create({ task_id: taskId, filename: 'file2.pdf', file_path: '/uploads/file2.pdf', file_size: 2048, mime_type: 'application/pdf' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.length).toBe(2);
    });
    
    test('should return empty array for task with no attachments', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await handler.GET(request, { params: { id: taskId } });
      
      expect(response.data.data).toEqual([]);
    });
  });
  
  describe('POST /api/tasks/[id]/attachments', () => {
    test('should create a new attachment', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          filename: 'document.pdf',
          file_path: '/uploads/document.pdf',
          file_size: 5120,
          mime_type: 'application/pdf',
        },
      });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.status).toBe(201);
      expect(response.data.data.filename).toBe('document.pdf');
      expect(response.data.data.task_id).toBe(taskId);
    });
    
    test('should create image attachment', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          filename: 'image.png',
          file_path: '/uploads/image.png',
          file_size: 10240,
          mime_type: 'image/png',
        },
      });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.data.data.mime_type).toBe('image/png');
    });
    
    test('should reject missing filename', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { file_path: '/uploads/test', file_size: 100, mime_type: 'text/plain' },
      });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.status).toBe(400);
    });
    
    test('should reject missing file_path', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { filename: 'test.txt', file_size: 100, mime_type: 'text/plain' },
      });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.status).toBe(400);
    });
    
    test('should reject missing file_size', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { filename: 'test.txt', file_path: '/uploads/test', mime_type: 'text/plain' },
      });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.status).toBe(400);
    });
    
    test('should reject missing mime_type', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: { filename: 'test.txt', file_path: '/uploads/test', file_size: 100 },
      });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.status).toBe(400);
    });
    
    test('should reject file size over 100MB', async () => {
      const request = createMockRequest({
        method: 'POST',
        body: {
          filename: 'large.pdf',
          file_path: '/uploads/large.pdf',
          file_size: 150000000, // 150MB
          mime_type: 'application/pdf',
        },
      });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.status).toBe(400);
      expect(response.data.error).toContain('100MB');
    });
    
    test('should reject duplicate filename', async () => {
      handler.repo.create({ task_id: taskId, filename: 'existing.pdf', file_path: '/uploads/existing.pdf', file_size: 1024, mime_type: 'application/pdf' });
      
      const request = createMockRequest({
        method: 'POST',
        body: {
          filename: 'existing.pdf',
          file_path: '/uploads/new.pdf',
          file_size: 2048,
          mime_type: 'application/pdf',
        },
      });
      const response = await handler.POST(request, { params: { id: taskId } });
      
      expect(response.status).toBe(409);
    });
  });
  
  describe('GET /api/tasks/[id]/attachments/[attachmentId]', () => {
    test('should return attachment by ID', async () => {
      const attachment = handler.repo.create({ task_id: taskId, filename: 'test.pdf', file_path: '/uploads/test.pdf', file_size: 1024, mime_type: 'application/pdf' });
      
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: taskId, attachmentId: attachment.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.data.filename).toBe('test.pdf');
    });
    
    test('should return 404 for non-existent attachment', async () => {
      const request = createMockRequest({ method: 'GET' });
      const response = await byIdHandler.GET(request, { params: { id: taskId, attachmentId: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
  });
  
  describe('DELETE /api/tasks/[id]/attachments/[attachmentId]', () => {
    test('should delete an existing attachment', async () => {
      const attachment = handler.repo.create({ task_id: taskId, filename: 'to-delete.pdf', file_path: '/uploads/to-delete.pdf', file_size: 1024, mime_type: 'application/pdf' });
      
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: taskId, attachmentId: attachment.id } });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
    
    test('should return 404 for non-existent attachment', async () => {
      const request = createMockRequest({ method: 'DELETE' });
      const response = await byIdHandler.DELETE(request, { params: { id: taskId, attachmentId: testUuid.generate() } });
      
      expect(response.status).toBe(404);
    });
  });
});

/**
 * Task Attachments API Routes
 * 
 * GET /api/tasks/[id]/attachments - Get all attachments for a task
 * POST /api/tasks/[id]/attachments - Create a new attachment for a task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAttachmentsRepository, getTasksRepository } from '@/lib/db/repositories';
import { createAttachmentSchema, uuidSchema } from '@/lib/db/schema';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Validate task ID
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }
    
    // Check if task exists
    const tasksRepo = getTasksRepository();
    const task = tasksRepo.findById(id);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    const repo = getAttachmentsRepository();
    const attachments = repo.findByTaskId(id);
    
    return NextResponse.json({ 
      success: true, 
      data: attachments,
      count: attachments.length
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Validate task ID
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }
    
    // Check if task exists
    const tasksRepo = getTasksRepository();
    const task = tasksRepo.findById(id);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    const body = await request.json();
    
    // Ensure task_id matches the URL parameter
    const dataWithTaskId = {
      ...body,
      task_id: id
    };
    
    // Validate input
    const validatedData = createAttachmentSchema.parse(dataWithTaskId);
    
    const repo = getAttachmentsRepository();
    
    // Check if file with same name already exists
    if (repo.filenameExists(id, validatedData.filename)) {
      return NextResponse.json(
        { success: false, error: 'A file with this name already exists for this task' },
        { status: 409 }
      );
    }
    
    const attachment = repo.create(validatedData);
    
    return NextResponse.json(
      { success: true, data: attachment },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating attachment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create attachment' },
      { status: 500 }
    );
  }
}

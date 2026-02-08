/**
 * Single Subtask API Routes
 * 
 * GET /api/tasks/[id]/subtasks/[subtaskId] - Get a single subtask
 * PUT /api/tasks/[id]/subtasks/[subtaskId] - Update a subtask
 * DELETE /api/tasks/[id]/subtasks/[subtaskId] - Delete a subtask
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSubtasksRepository } from '@/lib/db/repositories';
import { updateSubtaskSchema, uuidSchema } from '@/lib/db/schema';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string; subtaskId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, subtaskId } = await params;
    
    // Validate IDs
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(subtaskId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }
    
    const repo = getSubtasksRepository();
    const subtask = repo.findById(subtaskId);
    
    if (!subtask || subtask.task_id !== id) {
      return NextResponse.json(
        { success: false, error: 'Subtask not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: subtask 
    });
  } catch (error) {
    console.error('Error fetching subtask:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subtask' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, subtaskId } = await params;
    
    // Validate IDs
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(subtaskId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = updateSubtaskSchema.parse(body);
    
    const repo = getSubtasksRepository();
    
    // Verify subtask belongs to this task
    const existing = repo.findById(subtaskId);
    if (!existing || existing.task_id !== id) {
      return NextResponse.json(
        { success: false, error: 'Subtask not found' },
        { status: 404 }
      );
    }
    
    const subtask = repo.update(subtaskId, validatedData);
    
    return NextResponse.json({ 
      success: true, 
      data: subtask 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating subtask:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subtask' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, subtaskId } = await params;
    
    // Validate IDs
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(subtaskId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }
    
    const repo = getSubtasksRepository();
    
    // Verify subtask belongs to this task
    const existing = repo.findById(subtaskId);
    if (!existing || existing.task_id !== id) {
      return NextResponse.json(
        { success: false, error: 'Subtask not found' },
        { status: 404 }
      );
    }
    
    const deleted = repo.delete(subtaskId);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete subtask' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subtask deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete subtask' },
      { status: 500 }
    );
  }
}

/**
 * Single Task API Routes
 * 
 * GET /api/tasks/[id] - Get a single task
 * PUT /api/tasks/[id] - Update a task
 * DELETE /api/tasks/[id] - Delete a task
 * 
 * Query Parameters for GET:
 * - includeRelations: Include related entities (true/false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTasksRepository } from '@/lib/db/repositories';
import { updateTaskSchema, uuidSchema } from '@/lib/db/schema';
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
    
    // Validate ID
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }
    
    const repo = getTasksRepository();
    
    // Check if we should include relations
    const { searchParams } = new URL(request.url);
    const includeRelations = searchParams.get('includeRelations') === 'true';
    
    const task = includeRelations 
      ? repo.findWithRelations(id)
      : repo.findById(id);
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: task 
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Validate ID
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = updateTaskSchema.parse(body);
    
    const repo = getTasksRepository();
    const task = repo.update(id, validatedData);
    
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: task 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    // Validate ID
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }
    
    const repo = getTasksRepository();
    
    // Check if task exists
    const task = repo.findById(id);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    const deleted = repo.delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete task' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Task deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

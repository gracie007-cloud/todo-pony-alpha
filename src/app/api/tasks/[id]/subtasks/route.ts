/**
 * Task Subtasks API Routes
 * 
 * GET /api/tasks/[id]/subtasks - Get all subtasks for a task
 * POST /api/tasks/[id]/subtasks - Create a new subtask for a task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSubtasksRepository, getTasksRepository } from '@/lib/db/repositories';
import { createSubtaskSchema, uuidSchema } from '@/lib/db/schema';
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
    
    const repo = getSubtasksRepository();
    const subtasks = repo.findByTaskId(id);
    
    return NextResponse.json({ 
      success: true, 
      data: subtasks,
      count: subtasks.length
    });
  } catch (error) {
    console.error('Error fetching subtasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subtasks' },
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
    const validatedData = createSubtaskSchema.parse(dataWithTaskId);
    
    const repo = getSubtasksRepository();
    const subtask = repo.create(validatedData);
    
    return NextResponse.json(
      { success: true, data: subtask },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating subtask:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subtask' },
      { status: 500 }
    );
  }
}

/**
 * Task Reminders API Routes
 * 
 * GET /api/tasks/[id]/reminders - Get all reminders for a task
 * POST /api/tasks/[id]/reminders - Create a new reminder for a task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRemindersRepository, getTasksRepository } from '@/lib/db/repositories';
import { createReminderSchema, uuidSchema } from '@/lib/db/schema';
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
    
    const repo = getRemindersRepository();
    const reminders = repo.findByTaskId(id);
    
    return NextResponse.json({ 
      success: true, 
      data: reminders,
      count: reminders.length
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reminders' },
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
    const validatedData = createReminderSchema.parse(dataWithTaskId);
    
    const repo = getRemindersRepository();
    const reminder = repo.create(validatedData);
    
    return NextResponse.json(
      { success: true, data: reminder },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}

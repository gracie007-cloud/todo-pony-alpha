/**
 * Single Reminder API Routes
 * 
 * GET /api/tasks/[id]/reminders/[reminderId] - Get a single reminder
 * PUT /api/tasks/[id]/reminders/[reminderId] - Update a reminder
 * DELETE /api/tasks/[id]/reminders/[reminderId] - Delete a reminder
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRemindersRepository } from '@/lib/db/repositories';
import { updateReminderSchema, uuidSchema } from '@/lib/db/schema';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string; reminderId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, reminderId } = await params;
    
    // Validate IDs
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(reminderId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }
    
    const repo = getRemindersRepository();
    const reminder = repo.findById(reminderId);
    
    if (!reminder || reminder.task_id !== id) {
      return NextResponse.json(
        { success: false, error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: reminder 
    });
  } catch (error) {
    console.error('Error fetching reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reminder' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, reminderId } = await params;
    
    // Validate IDs
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(reminderId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = updateReminderSchema.parse(body);
    
    const repo = getRemindersRepository();
    
    // Verify reminder belongs to this task
    const existing = repo.findById(reminderId);
    if (!existing || existing.task_id !== id) {
      return NextResponse.json(
        { success: false, error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    const reminder = repo.update(reminderId, validatedData);
    
    return NextResponse.json({ 
      success: true, 
      data: reminder 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, reminderId } = await params;
    
    // Validate IDs
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(reminderId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }
    
    const repo = getRemindersRepository();
    
    // Verify reminder belongs to this task
    const existing = repo.findById(reminderId);
    if (!existing || existing.task_id !== id) {
      return NextResponse.json(
        { success: false, error: 'Reminder not found' },
        { status: 404 }
      );
    }
    
    const deleted = repo.delete(reminderId);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete reminder' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Reminder deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete reminder' },
      { status: 500 }
    );
  }
}

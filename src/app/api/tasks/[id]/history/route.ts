/**
 * Task History API Routes
 * 
 * GET /api/tasks/[id]/history - Get change history for a task
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTaskHistoryRepository, getTasksRepository } from '@/lib/db/repositories';
import { uuidSchema } from '@/lib/db/schema';

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
    
    const repo = getTaskHistoryRepository();
    
    // Check for query parameters
    const { searchParams } = new URL(request.url);
    const field = searchParams.get('field');
    const limit = searchParams.get('limit');
    
    let history;
    if (field) {
      history = repo.findByTaskIdAndField(id, field);
    } else {
      history = repo.findByTaskId(id);
    }
    
    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        history = history.slice(0, limitNum);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching task history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task history' },
      { status: 500 }
    );
  }
}

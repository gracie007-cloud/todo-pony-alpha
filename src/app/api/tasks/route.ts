/**
 * Tasks API Routes
 *
 * GET /api/tasks - Get all tasks with optional filtering and pagination
 * POST /api/tasks - Create a new task
 *
 * Query Parameters:
 * - listId: Filter by list
 * - dateFrom, dateTo: Date range filter
 * - completed: Filter by completion status (true/false)
 * - priority: Filter by priority (high/medium/low/none)
 * - overdue: Get overdue tasks only (true)
 * - search: Search in name/description
 * - labelId: Filter by label
 * - page: Page number for pagination (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTasksRepository, TaskFilterOptions, PaginationOptions } from '@/lib/db/repositories';
import { createTaskSchema, uuidSchema, prioritySchema } from '@/lib/db/schema';
import { z } from 'zod';
import { withApiMiddleware, rateLimitPresets } from '@/lib/api';

/**
 * GET /api/tasks - Get all tasks with optional filtering and pagination
 */
async function getTasksHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build filter options from query parameters
    const filters: TaskFilterOptions = {};
    
    const listId = searchParams.get('listId');
    if (listId && uuidSchema.safeParse(listId).success) {
      filters.listId = listId;
    }
    
    const dateFrom = searchParams.get('dateFrom');
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }
    
    const dateTo = searchParams.get('dateTo');
    if (dateTo) {
      filters.dateTo = dateTo;
    }
    
    const completed = searchParams.get('completed');
    if (completed !== null) {
      filters.completed = completed === 'true';
    }
    
    const priority = searchParams.get('priority');
    if (priority && prioritySchema.safeParse(priority).success) {
      filters.priority = priority as 'high' | 'medium' | 'low' | 'none';
    }
    
    const overdue = searchParams.get('overdue');
    if (overdue === 'true') {
      filters.overdue = true;
    }
    
    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }
    
    const labelId = searchParams.get('labelId');
    if (labelId && uuidSchema.safeParse(labelId).success) {
      filters.labelId = labelId;
    }
    
    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const pagination: PaginationOptions = { page, limit };
    
    const repo = getTasksRepository();
    
    // Use paginated method
    const result = repo.findWithFiltersPaginated(filters, pagination);
    
    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks - Create a new task
 */
async function createTaskHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createTaskSchema.parse(body);
    
    const repo = getTasksRepository();
    const task = repo.create(validatedData);
    
    return NextResponse.json(
      { success: true, data: task },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

// Export handlers wrapped with API middleware (logging + rate limiting)
export const GET = withApiMiddleware(getTasksHandler, {
  rateLimit: rateLimitPresets.relaxed
});

export const POST = withApiMiddleware(createTaskHandler, {
  rateLimit: rateLimitPresets.standard
});

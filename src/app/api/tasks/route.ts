/**
 * Tasks API Routes
 * 
 * GET /api/tasks - Get all tasks with optional filtering
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
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTasksRepository, TaskFilterOptions } from '@/lib/db/repositories';
import { createTaskSchema, uuidSchema, prioritySchema } from '@/lib/db/schema';
import { z } from 'zod';

export async function GET(request: NextRequest) {
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
    
    const repo = getTasksRepository();
    
    // Use appropriate method based on filters
    let tasks;
    if (Object.keys(filters).length === 0) {
      tasks = repo.findAll();
    } else {
      tasks = repo.findWithFilters(filters);
    }
    
    return NextResponse.json({ 
      success: true, 
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

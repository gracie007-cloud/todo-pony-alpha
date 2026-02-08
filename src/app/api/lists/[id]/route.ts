/**
 * Single List API Routes
 * 
 * GET /api/lists/[id] - Get a single list
 * PUT /api/lists/[id] - Update a list
 * DELETE /api/lists/[id] - Delete a list
 */

import { NextRequest, NextResponse } from 'next/server';
import { getListsRepository } from '@/lib/db/repositories';
import { updateListSchema, uuidSchema } from '@/lib/db/schema';
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
        { success: false, error: 'Invalid list ID' },
        { status: 400 }
      );
    }
    
    const repo = getListsRepository();
    const list = repo.findById(id);
    
    if (!list) {
      return NextResponse.json(
        { success: false, error: 'List not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: list 
    });
  } catch (error) {
    console.error('Error fetching list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch list' },
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
        { success: false, error: 'Invalid list ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = updateListSchema.parse(body);
    
    const repo = getListsRepository();
    const list = repo.update(id, validatedData);
    
    if (!list) {
      return NextResponse.json(
        { success: false, error: 'List not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: list 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update list' },
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
        { success: false, error: 'Invalid list ID' },
        { status: 400 }
      );
    }
    
    const repo = getListsRepository();
    
    // Check if list exists
    const list = repo.findById(id);
    if (!list) {
      return NextResponse.json(
        { success: false, error: 'List not found' },
        { status: 404 }
      );
    }
    
    // Prevent deletion of default list
    if (list.is_default) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the default Inbox list' },
        { status: 400 }
      );
    }
    
    const deleted = repo.delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete list' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'List deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete list' },
      { status: 500 }
    );
  }
}

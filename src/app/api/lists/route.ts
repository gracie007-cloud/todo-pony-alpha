/**
 * Lists API Routes
 * 
 * GET /api/lists - Get all lists
 * POST /api/lists - Create a new list
 */

import { NextRequest, NextResponse } from 'next/server';
import { getListsRepository } from '@/lib/db/repositories';
import { createListSchema, schemas } from '@/lib/db/schema';
import { z } from 'zod';

export async function GET() {
  try {
    const repo = getListsRepository();
    const lists = repo.findAllWithTaskCounts();
    
    return NextResponse.json({ 
      success: true, 
      data: lists 
    });
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createListSchema.parse(body);
    
    const repo = getListsRepository();
    const list = repo.create(validatedData);
    
    return NextResponse.json(
      { success: true, data: list },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating list:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create list' },
      { status: 500 }
    );
  }
}

/**
 * Single Label API Routes
 * 
 * GET /api/labels/[id] - Get a single label
 * PUT /api/labels/[id] - Update a label
 * DELETE /api/labels/[id] - Delete a label
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLabelsRepository } from '@/lib/db/repositories';
import { updateLabelSchema, uuidSchema } from '@/lib/db/schema';
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
        { success: false, error: 'Invalid label ID' },
        { status: 400 }
      );
    }
    
    const repo = getLabelsRepository();
    const label = repo.findById(id);
    
    if (!label) {
      return NextResponse.json(
        { success: false, error: 'Label not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: label 
    });
  } catch (error) {
    console.error('Error fetching label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch label' },
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
        { success: false, error: 'Invalid label ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = updateLabelSchema.parse(body);
    
    const repo = getLabelsRepository();
    
    // Check if new name conflicts with existing label
    if (validatedData.name && repo.nameExists(validatedData.name, id)) {
      return NextResponse.json(
        { success: false, error: 'Label with this name already exists' },
        { status: 409 }
      );
    }
    
    const label = repo.update(id, validatedData);
    
    if (!label) {
      return NextResponse.json(
        { success: false, error: 'Label not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: label 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update label' },
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
        { success: false, error: 'Invalid label ID' },
        { status: 400 }
      );
    }
    
    const repo = getLabelsRepository();
    
    // Check if label exists
    const label = repo.findById(id);
    if (!label) {
      return NextResponse.json(
        { success: false, error: 'Label not found' },
        { status: 404 }
      );
    }
    
    const deleted = repo.delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete label' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Label deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete label' },
      { status: 500 }
    );
  }
}

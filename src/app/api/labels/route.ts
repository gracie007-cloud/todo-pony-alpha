/**
 * Labels API Routes
 * 
 * GET /api/labels - Get all labels
 * POST /api/labels - Create a new label
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLabelsRepository } from '@/lib/db/repositories';
import { createLabelSchema } from '@/lib/db/schema';
import { z } from 'zod';

export async function GET() {
  try {
    const repo = getLabelsRepository();
    const labels = repo.findAll();
    
    return NextResponse.json({ 
      success: true, 
      data: labels 
    });
  } catch (error) {
    console.error('Error fetching labels:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch labels' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createLabelSchema.parse(body);
    
    const repo = getLabelsRepository();
    
    // Check if label name already exists
    if (repo.nameExists(validatedData.name)) {
      return NextResponse.json(
        { success: false, error: 'Label with this name already exists' },
        { status: 409 }
      );
    }
    
    const label = repo.create(validatedData);
    
    return NextResponse.json(
      { success: true, data: label },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating label:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create label' },
      { status: 500 }
    );
  }
}

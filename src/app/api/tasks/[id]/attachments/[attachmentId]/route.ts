/**
 * Single Attachment API Routes
 * 
 * GET /api/tasks/[id]/attachments/[attachmentId] - Get a single attachment
 * DELETE /api/tasks/[id]/attachments/[attachmentId] - Delete an attachment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAttachmentsRepository } from '@/lib/db/repositories';
import { uuidSchema } from '@/lib/db/schema';

interface RouteParams {
  params: Promise<{ id: string; attachmentId: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, attachmentId } = await params;
    
    // Validate IDs
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(attachmentId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }
    
    const repo = getAttachmentsRepository();
    const attachment = repo.findById(attachmentId);
    
    if (!attachment || attachment.task_id !== id) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data: attachment 
    });
  } catch (error) {
    console.error('Error fetching attachment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch attachment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id, attachmentId } = await params;
    
    // Validate IDs
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(attachmentId).success) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID' },
        { status: 400 }
      );
    }
    
    const repo = getAttachmentsRepository();
    
    // Verify attachment belongs to this task
    const existing = repo.findById(attachmentId);
    if (!existing || existing.task_id !== id) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 }
      );
    }
    
    const deleted = repo.delete(attachmentId);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete attachment' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Attachment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete attachment' },
      { status: 500 }
    );
  }
}

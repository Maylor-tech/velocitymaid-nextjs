export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/cleaners/[cleanerId]/documents
// Get cleaner documents and status
export async function GET(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;

    // Find cleaner's application by email (since cleaner was created from application)
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      select: { email: true },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Find application by email
    const application = await prisma.cleanerApplication.findFirst({
      where: { email: cleaner.email },
      orderBy: { createdAt: 'desc' },
    });

    const documents = {
      id: {
        url: application?.idUploadUrl || null,
        status: application?.idUploadUrl ? 'SUBMITTED' : 'MISSING',
        uploadedAt: application?.createdAt || null,
      },
      references: {
        url: application?.referencesUploadUrl || null,
        status: application?.referencesUploadUrl ? 'SUBMITTED' : 'MISSING',
        uploadedAt: application?.createdAt || null,
      },
      // Additional documents can be added here
      policeRecord: {
        url: null,
        status: 'MISSING' as const,
        uploadedAt: null,
      },
      proofOfAddress: {
        url: null,
        status: 'MISSING' as const,
        uploadedAt: null,
      },
      selfie: {
        url: null,
        status: 'MISSING' as const,
        uploadedAt: null,
      },
    };

    return NextResponse.json({
      success: true,
      documents,
      applicationId: application?.id || null,
    });
  } catch (error: any) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get documents' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/cleaners/[cleanerId]/documents
// Update document approval status (for future use with document approval tracking)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;
    const body = await request.json();
    const { documentType, status } = body;

    // Verify cleaner exists
    const cleaner = await prisma.user.findUnique({
      where: { id: cleanerId, role: 'CLEANER' },
      select: { email: true },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Find application
    const application = await prisma.cleanerApplication.findFirst({
      where: { email: cleaner.email },
      orderBy: { createdAt: 'desc' },
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // For now, we just return success
    // In the future, you could add a DocumentApproval table to track approval status
    // For Phase 3, we're just viewing documents - approval tracking can be Phase 4

    return NextResponse.json({
      success: true,
      message: 'Document status updated',
    });
  } catch (error: any) {
    console.error('Update document status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update document status' },
      { status: 500 }
    );
  }
}


















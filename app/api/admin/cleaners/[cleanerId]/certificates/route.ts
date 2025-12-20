import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/cleaners/[cleanerId]/certificates
 * 
 * Get all certificates for a cleaner
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Cleaner ID is required' },
        { status: 400 }
      );
    }

    const certs = await prisma.trainingCertificate.findMany({
      where: { cleanerId },
      include: {
        trainingStatus: true,
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, certificates: certs });
  } catch (error: any) {
    console.error('Error loading certificates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load certificates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/cleaners/[cleanerId]/certificates
 * 
 * Issue a new certificate
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Cleaner ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { certificateId, statusId } = body;

    if (!certificateId || !statusId) {
      return NextResponse.json(
        { success: false, error: 'certificateId and statusId are required' },
        { status: 400 }
      );
    }

    const cert = await prisma.trainingCertificate.create({
      data: {
        certificateId,
        cleanerId,
        trainingStatusId: statusId,
      },
      include: {
        trainingStatus: true,
      },
    });

    return NextResponse.json({ success: true, certificate: cert });
  } catch (error: any) {
    console.error('Create certificate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create certificate' },
      { status: 500 }
    );
  }
}








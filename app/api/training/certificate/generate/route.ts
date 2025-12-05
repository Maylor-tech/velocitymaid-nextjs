export const dynamic = 'force-dynamic';

/**
 * Generate Certificate API
 * POST /api/training/certificate/generate
 * 
 * Generates a certificate when training is marked as PASSED
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createCertificate } from '@/utils/certificateGenerator';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cleanerId = cookieStore.get('cleanerId')?.value;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify cleaner exists and training is PASSED
    const trainingStatus = await prisma.trainingStatus.findUnique({
      where: { cleanerId },
    });

    if (!trainingStatus) {
      return NextResponse.json(
        { success: false, error: 'Training status not found' },
        { status: 404 }
      );
    }

    if (trainingStatus.overallStatus !== 'PASSED') {
      return NextResponse.json(
        { success: false, error: 'Training must be completed (PASSED) before generating certificate' },
        { status: 400 }
      );
    }

    // Create certificate
    const certificate = await createCertificate(cleanerId);

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        certificateId: certificate.certificateId,
        issuedAt: certificate.issuedAt,
        url: `/cleaners/certificate/${certificate.certificateId}`,
      },
    });
  } catch (error: any) {
    console.error('Generate certificate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}


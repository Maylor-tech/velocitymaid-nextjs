/**
 * Get Certificate API
 * GET /api/training/certificate/[certificateId]
 * 
 * Returns certificate details for the authenticated cleaner
 */

export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateId: string } }
) {
  try {
    const cookieStore = await cookies();
    const cleanerId = cookieStore.get('cleanerId')?.value;

    if (!cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { certificateId } = params;

    const certificate = await prisma.trainingCertificate.findUnique({
      where: { certificateId },
      include: {
        cleaner: {
          include: {
            primaryBranch: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Verify certificate belongs to authenticated cleaner
    if (certificate.cleanerId !== cleanerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://velocitymaid.com';
    const verificationUrl = `${baseUrl}/verify/certificate/${certificateId}`;

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        certificateId: certificate.certificateId,
        cleanerName: certificate.cleaner.name || 'Unknown',
        branchName: certificate.cleaner.primaryBranch?.name || 'Unknown',
        issuedAt: certificate.issuedAt,
        verificationUrl,
      },
    });
  } catch (error: any) {
    console.error('Get certificate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}



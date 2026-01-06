import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/requireAuth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    const auth = await requireAuth(req);

    if (!auth.tenantId) {
      return NextResponse.json(
        { error: 'User must be associated with a tenant', requestId },
        { status: 400 }
      );
    }

    // Fetch contractors (users with role CLEANER) for this tenant
    const contractors = await prisma.user.findMany({
      where: {
        tenantId: auth.tenantId,
        role: 'CLEANER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get job completion stats for each contractor
    const contractorsWithStats = await Promise.all(
      contractors.map(async (contractor) => {
        const completedJobs = await prisma.job.count({
          where: {
            cleanerId: contractor.id,
            status: 'COMPLETED',
          },
        });

        const avgRating = await prisma.cleanerRating.aggregate({
          where: {
            cleanerId: contractor.id,
          },
          _avg: {
            rating: true,
          },
        });

        return {
          id: contractor.id,
          name: contractor.name || 'Unknown',
          email: contractor.email,
          isActive: contractor.isActive,
          createdAt: contractor.createdAt.toISOString(),
          completedJobs,
          rating: avgRating._avg.rating || null,
        };
      })
    );

    return NextResponse.json({
      contractors: contractorsWithStats,
      requestId,
    });
  } catch (error: any) {
    console.error(`[${requestId}] Error fetching contractors:`, error);
    
    // If it's a NextResponse (from requireAuth), re-throw it
    if (error instanceof NextResponse) {
      throw error;
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch contractors', requestId },
      { status: 500 }
    );
  }
}


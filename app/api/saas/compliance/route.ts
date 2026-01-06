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

    // Fetch compliance issues for contractors in this tenant
    const contractors = await prisma.user.findMany({
      where: {
        tenantId: auth.tenantId,
        role: 'CLEANER',
      },
      select: {
        id: true,
        name: true,
      },
    });

    const contractorIds = contractors.map((c) => c.id);

    // Get compliance issues
    const complianceIssues = await prisma.complianceIssue.findMany({
      where: {
        cleanerId: {
          in: contractorIds,
        },
      },
      select: {
        id: true,
        cleanerId: true,
        type: true,
        status: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate metrics
    const total = complianceIssues.length;
    const verified = complianceIssues.filter((issue) => issue.status === 'RESOLVED').length;
    const pending = complianceIssues.filter((issue) => issue.status === 'OPEN' || issue.status === 'ESCALATED').length;
    const expired = complianceIssues.filter((issue) => {
      // Check if issue is expired (older than 1 year and not resolved)
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return issue.status !== 'RESOLVED' && new Date(issue.createdAt) < oneYearAgo;
    }).length;

    // Create compliance items
    const contractorMap = new Map(contractors.map((c) => [c.id, c.name || 'Unknown']));
    
    const items = complianceIssues.map((issue) => ({
      id: issue.id,
      contractorName: contractorMap.get(issue.cleanerId) || 'Unknown',
      documentType: issue.type || 'Compliance Document',
      status: issue.status === 'RESOLVED' ? 'verified' : (issue.status === 'OPEN' || issue.status === 'ESCALATED') ? 'pending' : 'expired',
      expiryDate: issue.resolvedAt ? null : (() => {
        const expiry = new Date(issue.createdAt);
        expiry.setFullYear(expiry.getFullYear() + 1);
        return expiry.toISOString().split('T')[0];
      })(),
      lastUpdated: issue.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      metrics: {
        total,
        verified,
        pending,
        expired,
      },
      items,
      requestId,
    });
  } catch (error: any) {
    console.error(`[${requestId}] Error fetching compliance data:`, error);
    
    // If it's a NextResponse (from requireAuth), re-throw it
    if (error instanceof NextResponse) {
      throw error;
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch compliance data', requestId },
      { status: 500 }
    );
  }
}


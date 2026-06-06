export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

// GET /api/admin/compliance/overview
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build date range
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fromDate = dateFrom ? new Date(dateFrom) : thirtyDaysAgo;
    const toDate = dateTo ? new Date(dateTo) : now;

    // Build where clauses
    const branchWhere = branchId ? { id: branchId } : {};
    const cleanerWhere = branchId ? { primaryBranchId: branchId } : {};
    const customerWhere = branchId ? { branchId } : {};
    const issueWhere = branchId ? { branchId } : {};
    const complaintWhere = branchId ? { Job: { branchId } } : {};

    // Get branch info
    const branch = branchId
      ? await prisma.branch.findUnique({
          where: { id: branchId },
          select: { id: true, name: true },
        })
      : null;

    // Cleaner Compliance
    const totalCleaners = await prisma.user.count({
      where: {
        ...cleanerWhere,
        role: 'CLEANER',
      },
    });

    const suspendedCleaners = await prisma.user.count({
      where: {
        ...cleanerWhere,
        role: 'CLEANER',
        isSuspended: true,
      },
    });

    // Missing documents (check CleanerApplication)
    const cleanersWithApps = await prisma.user.findMany({
      where: {
        ...cleanerWhere,
        role: 'CLEANER',
      },
      select: { email: true },
    });

    let missingDocuments = 0;
    for (const cleaner of cleanersWithApps) {
      const app = await prisma.cleanerApplication.findFirst({
        where: {
          email: cleaner.email,
          status: 'APPROVED',
        },
        select: {
          idUploadUrl: true,
          referencesUploadUrl: true,
        },
      });

      if (!app || !app.idUploadUrl || !app.referencesUploadUrl) {
        missingDocuments++;
      }
    }

    const trainingPending = await prisma.trainingStatus.count({
      where: {
        User: {
          ...cleanerWhere,
          role: 'CLEANER',
        },
        overallStatus: {
          in: ['PENDING', 'IN_REVIEW', 'NOT_STARTED'],
        },
      },
    });

    const highSeverityIssues = await prisma.complianceIssue.count({
      where: {
        ...issueWhere,
        cleanerId: { not: null },
        severity: { gte: 4 },
        status: 'OPEN',
      },
    });

    // Customer Risk
    const totalCustomers = await prisma.customer.count({
      where: customerWhere,
    });

    const blockedCustomers = await prisma.customer.count({
      where: {
        ...customerWhere,
        isBlocked: true,
      },
    });

    const highRiskCustomers = await prisma.customer.count({
      where: {
        ...customerWhere,
        riskScore: { gte: 70 },
      },
    });

    const avgRiskResult = await prisma.customer.aggregate({
      where: customerWhere,
      _avg: {
        riskScore: true,
      },
    });

    // Compliance Issues
    const openIssues = await prisma.complianceIssue.count({
      where: {
        ...issueWhere,
        status: 'OPEN',
      },
    });

    const resolvedIssuesLast30Days = await prisma.complianceIssue.count({
      where: {
        ...issueWhere,
        status: 'RESOLVED',
        resolvedAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const issuesBySeverity = await prisma.complianceIssue.groupBy({
      by: ['severity'],
      where: {
        ...issueWhere,
        status: 'OPEN',
      },
      _count: {
        id: true,
      },
    });

    // Complaints (using placeholder - Complaint model needs to be added)
    // TODO: Replace with actual Complaint model queries when schema is updated
    const openComplaints = 0; // Placeholder
    const complaintsLast30Days = 0; // Placeholder
    const avgSeverityLast30Days = null; // Placeholder

    // Risk Report - Top Risk Customers
    const topRiskCustomers = await prisma.customer.findMany({
      where: {
        ...customerWhere,
        riskScore: { gt: 0 },
      },
      orderBy: {
        riskScore: 'desc',
      },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        riskScore: true,
        riskFlags: true,
      },
    });

    // Risk Report - Top Risk Cleaners
    const topRiskCleaners = await prisma.user.findMany({
      where: {
        ...cleanerWhere,
        role: 'CLEANER',
        OR: [
          { warningCount: { gt: 0 } },
          { isSuspended: true },
        ],
      },
      orderBy: [
        { isSuspended: 'desc' },
        { warningCount: 'desc' },
      ],
      take: 5,
      select: {
        id: true,
        name: true,
        warningCount: true,
      },
    });

    // Get open issues count for each cleaner
    const cleanersWithIssues = await Promise.all(
      topRiskCleaners.map(async (cleaner) => {
        const openIssuesCount = await prisma.complianceIssue.count({
          where: {
            cleanerId: cleaner.id,
            status: 'OPEN',
          },
        });
        return {
          cleanerId: cleaner.id,
          name: cleaner.name || 'Unknown',
          warningCount: cleaner.warningCount,
          openIssues: openIssuesCount,
        };
      })
    );

    // Revoked certificates count
    const revokedCertificatesCount = await prisma.trainingCertificate.count({
      where: {
        status: 'REVOKED',
        ...(branchId ? {
          cleaner: {
            primaryBranchId: branchId,
          },
        } : {}),
      },
    });

    // Last 5 revoked certificates
    const lastRevokedCertificates = await prisma.trainingCertificate.findMany({
      where: {
        status: 'REVOKED',
        ...(branchId ? {
          cleaner: {
            primaryBranchId: branchId,
          },
        } : {}),
      },
      include: {
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isSuspended: true,
            warningCount: true,
          },
        },
        trainingStatus: {
          select: {
            id: true,
            overallStatus: true,
          },
        },
      },
      orderBy: {
        revokedAt: 'desc',
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      branch: {
        id: branch?.id || null,
        name: branch?.name || null,
      },
      cleanerCompliance: {
        totalCleaners,
        suspendedCleaners,
        missingDocuments,
        trainingPending,
        highSeverityIssues,
      },
      customerRisk: {
        totalCustomers,
        blockedCustomers,
        highRiskCustomers,
        averageRiskScore: avgRiskResult._avg.riskScore
          ? Math.round(avgRiskResult._avg.riskScore)
          : null,
      },
      issues: {
        openIssues,
        resolvedIssuesLast30Days,
        bySeverity: issuesBySeverity.map((item) => ({
          severity: item.severity,
          count: item._count.id,
        })),
      },
      complaints: {
        openComplaints,
        avgSeverityLast30Days,
        complaintsLast30Days,
      },
      riskReport: {
        topRiskCustomers: topRiskCustomers.map((c) => ({
          customerId: c.id,
          name: `${c.firstName} ${c.lastName}`,
          riskScore: c.riskScore,
          riskFlags: c.riskFlags,
        })),
        topRiskCleaners: cleanersWithIssues,
      },
      revokedCertificatesCount,
      lastRevokedCertificates: lastRevokedCertificates.map((cert) => ({
        id: cert.id,
        certificateId: cert.certificateId,
        status: cert.status,
        revokedAt: cert.revokedAt?.toISOString() || null,
        cleaner: cert.cleaner
          ? {
              id: cert.cleaner.id,
              name: cert.cleaner.name || null,
              email: cert.cleaner.email || null,
              role: cert.cleaner.role || null,
              isSuspended: cert.cleaner.isSuspended || false,
              warningCount: cert.cleaner.warningCount || 0,
            }
          : null,
      })),
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error('COMPLIANCE_OVERVIEW_ERROR:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch compliance overview',
      },
      { status: 500 }
    );
  }
}


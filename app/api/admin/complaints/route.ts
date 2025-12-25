export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from '@/lib/prisma';

// GET /api/admin/complaints
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');
    const severity = searchParams.get('severity');

    // TODO: Replace with actual Complaint model queries when schema is updated
    // For now, return placeholder structure
    // const where: any = {};
    // if (status) where.status = status;
    // if (branchId) where.job = { branchId };
    // if (severity) where.severity = parseInt(severity);
    //
    // const complaints = await prisma.complaint.findMany({
    //   where,
    //   include: {
    //     Job: { select: { id: true, customerName: true, address: true } },
    //     User: { select: { id: true, name: true, email: true } },
    //   },
    //   orderBy: { createdAt: 'desc' },
    // });

    const complaints: any[] = [];

    return NextResponse.json({
      success: true,
      complaints,
      count: complaints.length,
    });
  } catch (error: any) {
    console.error('Get complaints error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get complaints' },
      { status: 500 }
    );
  }
}

// POST /api/admin/complaints
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, customerId, cleanerId, severity, notes } = body;

    if (!jobId || !customerId || !cleanerId || !severity) {
      return NextResponse.json(
        { success: false, error: 'jobId, customerId, cleanerId, and severity are required' },
        { status: 400 }
      );
    }

    if (severity < 1 || severity > 5) {
      return NextResponse.json(
        { success: false, error: 'Severity must be between 1 and 5' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual Complaint model creation when schema is updated
    // const complaint = await prisma.complaint.create({
    //   data: {
    //     jobId,
    //     customerId,
    //     cleanerId,
    //     severity,
    //     notes: notes || null,
    //     status: 'OPEN',
    //   },
    //   include: {
    //     Job: { select: { id: true, customerName: true } },
    //     User: { select: { id: true, name: true } },
    //   },
    // });

    // Placeholder response
    const complaint = {
      id: `complaint_${Date.now()}`,
      jobId,
      customerId,
      cleanerId,
      severity,
      notes: notes || null,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      complaint,
    });
  } catch (error: any) {
    console.error('Create complaint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create complaint' },
      { status: 500 }
    );
  }
}

















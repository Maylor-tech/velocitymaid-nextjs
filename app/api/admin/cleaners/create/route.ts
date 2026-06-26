export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { createInternalCleaner } from '@/lib/cleaners/internalCleanerService';

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const body = await request.json();

    if (!body.firstName?.trim() || !body.lastName?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }
    if (!body.branchId) {
      return NextResponse.json({ success: false, error: 'Branch is required' }, { status: 400 });
    }

    const result = await createInternalCleaner({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      publicDisplayName: body.publicDisplayName,
      jobTitle: body.jobTitle,
      branchId: body.branchId,
      serviceAreas: body.serviceAreas,
      memberStatus: body.memberStatus,
      certificationLabel: body.certificationLabel,
      internalNotes: body.internalNotes,
      isInternalTeam: body.isInternalTeam ?? true,
      trainingPassed: body.trainingPassed ?? false,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to create cleaner';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

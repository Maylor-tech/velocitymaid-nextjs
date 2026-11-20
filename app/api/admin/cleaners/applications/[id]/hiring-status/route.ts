import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import {
  isHiringStatus,
  parseVermontWorkApplication,
  prismaStatusForHiring,
} from '@/lib/marketing/vermontWorkWithUs';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const body = await request.json();
    if (!isHiringStatus(body.hiringStatus)) {
      return NextResponse.json({ success: false, error: 'Choose a status.' }, { status: 400 });
    }
    const existing = await prisma.cleanerApplication.findUnique({
      where: { id: params.id },
      select: { applicationData: true },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'That applicant was not found.' }, { status: 404 });
    }
    const application = parseVermontWorkApplication(existing.applicationData);
    if (!application) {
      return NextResponse.json(
        { success: false, error: 'This application does not use the Vermont hiring statuses.' },
        { status: 400 }
      );
    }
    const next = { ...application, hiringStatus: body.hiringStatus };
    await prisma.cleanerApplication.update({
      where: { id: params.id },
      data: {
        applicationData: next,
        status: prismaStatusForHiring(body.hiringStatus),
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, hiringStatus: body.hiringStatus });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not update the status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

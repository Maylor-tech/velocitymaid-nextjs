import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    const body = await request.json();
    const agreementId = String(body.agreementId || '');
    const hours = Number(body.hours);
    if (!agreementId || !Number.isFinite(hours) || hours <= 0) {
      return NextResponse.json({ success: false, error: 'Verified hours must be greater than zero.' }, { status: 400 });
    }
    const agreement = await prisma.compensationAgreement.findUnique({ where: { id: agreementId } });
    if (!agreement) {
      return NextResponse.json({ success: false, error: 'Agreement not found.' }, { status: 404 });
    }
    if (agreement.hoursVerifiedAt) {
      return NextResponse.json({
        success: true,
        verifiedHours: Number(agreement.verifiedHours),
        unchanged: true,
      });
    }
    const updated = await prisma.compensationAgreement.update({
      where: { id: agreementId },
      data: {
        verifiedHours: hours,
        hoursVerifiedBy: admin.userId,
        hoursVerifiedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, verifiedHours: Number(updated.verifiedHours) });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not confirm hours';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import { TAX_PAPERWORK_TYPES, type TaxPaperworkType } from '@/lib/cleanerComp/pay';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const cleanerId = params.cleanerId;
    const cleaner = await prisma.user.findFirst({
      where: { id: cleanerId, role: 'CLEANER' },
      select: { id: true },
    });
    if (!cleaner) {
      return NextResponse.json({ success: false, error: 'That cleaner was not found.' }, { status: 404 });
    }
    const body = await request.json();
    const type = String(body.type || '') as TaxPaperworkType;
    const on = new Date(`${String(body.on || '')}T00:00:00.000Z`);
    if (!TAX_PAPERWORK_TYPES.includes(type) || type === 'NONE' || Number.isNaN(on.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Tax paperwork needs a W-9 or W-4 and I-9, and a date.' },
        { status: 400 }
      );
    }
    await prisma.cleanerProfile.upsert({
      where: { userId: cleanerId },
      update: { taxPaperworkType: type, taxPaperworkStatus: 'ON_FILE', taxPaperworkOn: on },
      create: { userId: cleanerId, taxPaperworkType: type, taxPaperworkStatus: 'ON_FILE', taxPaperworkOn: on },
    });
    return NextResponse.json({
      success: true,
      paperwork: { type, status: 'ON_FILE', on: on.toISOString().slice(0, 10) },
    });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not save tax paperwork';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

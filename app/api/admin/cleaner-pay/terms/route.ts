import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import { COMPENSATION_METHODS, W9_STATUSES, type CompensationMethod, type W9Status } from '@/lib/cleanerComp/pay';

export const dynamic = 'force-dynamic';

function methodOr(value: unknown, fallback: CompensationMethod): CompensationMethod {
  return COMPENSATION_METHODS.includes(value as CompensationMethod)
    ? (value as CompensationMethod)
    : fallback;
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const cleanerId = request.nextUrl.searchParams.get('cleanerId') || '';
    if (!cleanerId) {
      return NextResponse.json({ success: false, error: 'Choose a cleaner.' }, { status: 400 });
    }
    const [terms, profile] = await Promise.all([
      prisma.cleanerCompTerms.findUnique({ where: { cleanerId } }),
      prisma.cleanerProfile.findUnique({
        where: { userId: cleanerId },
        select: { w9Status: true, w9StatusOn: true },
      }),
    ]);
    return NextResponse.json({
      success: true,
      terms: terms
        ? {
            soloMethod: terms.soloMethod,
            soloRate: Number(terms.soloRate),
            assistedMethod: terms.assistedMethod,
            assistedRate: Number(terms.assistedRate),
            effectiveFrom: terms.effectiveFrom.toISOString().slice(0, 10),
          }
        : null,
      w9Status: profile?.w9Status ?? 'MISSING',
      w9StatusOn: profile?.w9StatusOn?.toISOString().slice(0, 10) ?? null,
    });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not load terms';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(request, 'ADMIN');
    const body = await request.json();
    const cleanerId = String(body.cleanerId || '');
    const soloRate = Number(body.soloRate);
    const assistedRate = Number(body.assistedRate);
    const effectiveFrom = new Date(`${String(body.effectiveFrom || '')}T00:00:00.000Z`);
    if (!cleanerId || !Number.isFinite(soloRate) || soloRate <= 0 || !Number.isFinite(assistedRate) || assistedRate <= 0) {
      return NextResponse.json({ success: false, error: 'Cleaner, solo rate, and assisted rate are required.' }, { status: 400 });
    }
    if (Number.isNaN(effectiveFrom.getTime())) {
      return NextResponse.json({ success: false, error: 'Terms need an effective date.' }, { status: 400 });
    }
    const soloMethod = methodOr(body.soloMethod, 'PERCENTAGE');
    const assistedMethod = methodOr(body.assistedMethod, 'HOURLY');
    const terms = await prisma.cleanerCompTerms.upsert({
      where: { cleanerId },
      update: { soloMethod, soloRate, assistedMethod, assistedRate, effectiveFrom, setBy: admin.userId, setAt: new Date() },
      create: {
        cleanerId,
        soloMethod,
        soloRate,
        assistedMethod,
        assistedRate,
        effectiveFrom,
        setBy: admin.userId,
      },
    });

    let w9Status: W9Status | null = null;
    if (body.w9Status != null) {
      if (!W9_STATUSES.includes(body.w9Status)) {
        return NextResponse.json({ success: false, error: 'W-9 status is on file or missing.' }, { status: 400 });
      }
      w9Status = body.w9Status;
      const w9StatusOn = body.w9StatusOn ? new Date(String(body.w9StatusOn)) : new Date();
      await prisma.cleanerProfile.upsert({
        where: { userId: cleanerId },
        update: { w9Status, w9StatusOn: Number.isNaN(w9StatusOn.getTime()) ? new Date() : w9StatusOn },
        create: { userId: cleanerId, w9Status, w9StatusOn: Number.isNaN(w9StatusOn.getTime()) ? new Date() : w9StatusOn },
      });
    }

    return NextResponse.json({
      success: true,
      effectiveFrom: terms.effectiveFrom.toISOString().slice(0, 10),
      w9Status,
    });
  } catch (error) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Could not save terms';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

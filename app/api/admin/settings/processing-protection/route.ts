export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { DEFAULT_PROCESSING_POLICY_VERSION } from '@/lib/pricing/processingPolicy';

async function ensureSettingsRow() {
  return prisma.adminPlatformSettings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    await ensureSettingsRow();
    const row = await prisma.adminPlatformSettings.findUnique({
      where: { id: 'default' },
      select: {
        processingProtectionEnabled: true,
        processingPercentageRate: true,
        processingFixedFee: true,
        processingRoundingIncrement: true,
        processingPolicyVersion: true,
      },
    });

    return NextResponse.json({
      success: true,
      enabled: Boolean(row?.processingProtectionEnabled),
      percentageRate:
        row?.processingPercentageRate != null ? Number(row.processingPercentageRate) : null,
      fixedFee: row?.processingFixedFee != null ? Number(row.processingFixedFee) : null,
      roundingIncrement: row?.processingRoundingIncrement ?? 5,
      policyVersion: row?.processingPolicyVersion ?? DEFAULT_PROCESSING_POLICY_VERSION,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    await ensureSettingsRow();
    const body = await request.json().catch(() => ({}));

    const data: {
      processingProtectionEnabled?: boolean;
      processingPercentageRate?: number | null;
      processingFixedFee?: number | null;
      processingRoundingIncrement?: number;
      processingPolicyVersion?: string | null;
    } = {};

    if (typeof body.enabled === 'boolean') {
      data.processingProtectionEnabled = body.enabled;
    }
    if (body.percentageRate !== undefined) {
      const n = body.percentageRate === null ? null : Number(body.percentageRate);
      if (n != null && (!Number.isFinite(n) || n < 0 || n >= 1)) {
        return NextResponse.json(
          { success: false, error: 'percentageRate must be >= 0 and < 1' },
          { status: 400 }
        );
      }
      data.processingPercentageRate = n;
    }
    if (body.fixedFee !== undefined) {
      const n = body.fixedFee === null ? null : Number(body.fixedFee);
      if (n != null && (!Number.isFinite(n) || n < 0)) {
        return NextResponse.json(
          { success: false, error: 'fixedFee must be a non-negative number' },
          { status: 400 }
        );
      }
      data.processingFixedFee = n;
    }
    if (body.roundingIncrement !== undefined) {
      const n = Number(body.roundingIncrement);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json(
          { success: false, error: 'roundingIncrement must be > 0' },
          { status: 400 }
        );
      }
      data.processingRoundingIncrement = Math.round(n);
    }
    if (body.policyVersion !== undefined) {
      data.processingPolicyVersion =
        typeof body.policyVersion === 'string' && body.policyVersion.trim()
          ? body.policyVersion.trim()
          : DEFAULT_PROCESSING_POLICY_VERSION;
    }

    const row = await prisma.adminPlatformSettings.update({
      where: { id: 'default' },
      data,
      select: {
        processingProtectionEnabled: true,
        processingPercentageRate: true,
        processingFixedFee: true,
        processingRoundingIncrement: true,
        processingPolicyVersion: true,
      },
    });

    return NextResponse.json({
      success: true,
      enabled: Boolean(row.processingProtectionEnabled),
      percentageRate:
        row.processingPercentageRate != null ? Number(row.processingPercentageRate) : null,
      fixedFee: row.processingFixedFee != null ? Number(row.processingFixedFee) : null,
      roundingIncrement: row.processingRoundingIncrement ?? 5,
      policyVersion: row.processingPolicyVersion ?? DEFAULT_PROCESSING_POLICY_VERSION,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to update settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

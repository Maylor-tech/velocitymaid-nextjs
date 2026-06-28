export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { runLeadAutomations } from '@/lib/leadCenter/automation';
import { serializeLead } from '@/lib/leadCenter/serialize';
import type { CreateLeadInput } from '@/lib/leadCenter/types';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');

    const stage = request.nextUrl.searchParams.get('stage');

    const leads = await prisma.pipelineLead.findMany({
      where: stage ? { stage: stage as never } : undefined,
      orderBy: [{ nextActionDate: 'asc' }, { updatedAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      leads: leads.map(serializeLead),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list leads';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');

    const body = (await request.json()) as CreateLeadInput;

    if (!body.name?.trim() || !body.phone?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    const lead = await prisma.pipelineLead.create({
      data: {
        name: body.name.trim(),
        phone: body.phone.trim(),
        email: body.email?.trim() || null,
        propertyAddress: body.propertyAddress?.trim() || null,
        bedrooms: body.bedrooms ?? null,
        bathrooms: body.bathrooms ?? null,
        propertyType: body.propertyType || null,
        leadSource: body.leadSource || null,
        estimatedRevenue: body.estimatedRevenue ?? null,
        notes: body.notes?.trim() || null,
        stage: body.stage ?? 'NEW_LEAD',
        nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : null,
        isRecurring: body.isRecurring ?? false,
      },
    });

    await runLeadAutomations(prisma, lead.id, { isNew: true });

    const refreshed = await prisma.pipelineLead.findUniqueOrThrow({ where: { id: lead.id } });

    return NextResponse.json({ success: true, lead: serializeLead(refreshed) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create lead';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

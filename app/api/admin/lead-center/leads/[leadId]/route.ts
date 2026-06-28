export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { runLeadAutomations } from '@/lib/leadCenter/automation';
import { serializeLead } from '@/lib/leadCenter/serialize';
import type { UpdateLeadInput } from '@/lib/leadCenter/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');

    const lead = await prisma.pipelineLead.findUnique({
      where: { id: params.leadId },
      include: {
        tasks: { orderBy: { dueAt: 'asc' } },
      },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      lead: serializeLead(lead),
      tasks: lead.tasks.map((t) => ({
        id: t.id,
        leadId: t.leadId,
        type: t.type,
        title: t.title,
        dueAt: t.dueAt.toISOString(),
        status: t.status,
        completedAt: t.completedAt?.toISOString() ?? null,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load lead';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');

    const existing = await prisma.pipelineLead.findUnique({
      where: { id: params.leadId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const body = (await request.json()) as UpdateLeadInput;

    const lead = await prisma.pipelineLead.update({
      where: { id: params.leadId },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.phone !== undefined && { phone: body.phone.trim() }),
        ...(body.email !== undefined && { email: body.email?.trim() || null }),
        ...(body.propertyAddress !== undefined && {
          propertyAddress: body.propertyAddress?.trim() || null,
        }),
        ...(body.bedrooms !== undefined && { bedrooms: body.bedrooms }),
        ...(body.bathrooms !== undefined && { bathrooms: body.bathrooms }),
        ...(body.propertyType !== undefined && { propertyType: body.propertyType || null }),
        ...(body.leadSource !== undefined && { leadSource: body.leadSource || null }),
        ...(body.estimatedRevenue !== undefined && { estimatedRevenue: body.estimatedRevenue }),
        ...(body.notes !== undefined && { notes: body.notes?.trim() || null }),
        ...(body.stage !== undefined && { stage: body.stage }),
        ...(body.nextActionDate !== undefined && {
          nextActionDate: body.nextActionDate ? new Date(body.nextActionDate) : null,
        }),
        ...(body.isRecurring !== undefined && { isRecurring: body.isRecurring }),
      },
    });

    if (body.stage && body.stage !== existing.stage) {
      await runLeadAutomations(prisma, lead.id, {
        previousStage: existing.stage,
        newStage: body.stage,
      });
    }

    const refreshed = await prisma.pipelineLead.findUniqueOrThrow({
      where: { id: lead.id },
    });

    return NextResponse.json({ success: true, lead: serializeLead(refreshed) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update lead';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');

    await prisma.pipelineLead.delete({ where: { id: params.leadId } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete lead';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

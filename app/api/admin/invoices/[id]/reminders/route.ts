export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, assertSuperAdmin } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { contactDate } from '@/lib/invoices/reminderPolicy';
import { logAuditEntry } from '@/lib/audit';

type Context = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    assertSuperAdmin(auth);
    const invoice = await prisma.invoice.findUnique({ where: { id: params.id }, select: {
      remindersPaused: true, reminderSentAt: true,
      reminderDeliveries: { orderBy: { updatedAt: 'desc' }, take: 10,
        select: { stage: true, status: true, providerMessageId: true, updatedAt: true } },
    } });
    return NextResponse.json(invoice ? { success: true, invoice } : { success: false, error: 'Invoice not found' }, { status: invoice ? 200 : 404 });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return NextResponse.json({ success: false, error: 'Unable to read reminder history' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    assertSuperAdmin(auth);
    const body = await request.json();
    if (typeof body.paused !== 'boolean') return NextResponse.json({ success: false, error: 'paused must be boolean' }, { status: 400 });
    const existing = await prisma.invoice.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    await prisma.invoice.update({ where: { id: params.id }, data: { remindersPaused: body.paused } });
    await logAuditEntry({ actorId: auth.userId, actorRole: 'ADMIN', action: 'INVOICE_REMINDERS_PAUSE_CHANGED', entityType: 'Invoice', entityId: params.id,
      changes: { before: existing.remindersPaused, after: body.paused } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return NextResponse.json({ success: false, error: 'Unable to update reminder pause' }, { status: 500 });
  }
}

/** Record an already-sent Gmail/text reminder. This endpoint never sends mail. */
export async function POST(request: NextRequest, { params }: Context) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    assertSuperAdmin(auth);
    const body = await request.json();
    if (typeof body.reference !== 'string' || body.reference.trim().length < 3 || body.reference.length > 200) {
      return NextResponse.json({ success: false, error: 'A message reference is required (3–200 characters)' }, { status: 400 });
    }
    const now = new Date();
    const invoice = await prisma.invoice.findUnique({ where: { id: params.id } });
    if (!invoice?.clientEmail) return NextResponse.json({ success: false, error: 'Invoice or recipient not found' }, { status: 404 });
    // One external message can cover several invoices. Updating each invoice's
    // cooldown is safe and idempotent; the recipient/day ledger row is shared.
    await prisma.$transaction(async (tx) => {
      const recipientEmail = invoice.clientEmail!.trim().toLowerCase();
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${recipientEmail})::bigint)`;
      const day = contactDate(now);
      const existing = await tx.invoiceReminderDelivery.findUnique({ where: { recipientEmail_contactDate: { recipientEmail, contactDate: day } } });
      if (!existing) await tx.invoiceReminderDelivery.create({ data: {
        invoiceId: params.id, stage: `external:${day}`, recipientEmail, contactDate: day,
        status: 'EXTERNAL', providerMessageId: body.reference.trim(),
      } });
      await tx.invoice.update({ where: { id: params.id }, data: { reminderSentAt: now } });
    });
    await logAuditEntry({ actorId: auth.userId, actorRole: 'ADMIN', action: 'INVOICE_EXTERNAL_REMINDER_RECORDED', entityType: 'Invoice', entityId: params.id,
      changes: { reference: body.reference.trim(), recordedAt: now.toISOString() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    return NextResponse.json({ success: false, error: 'Unable to record external reminder' }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import type { InvoiceStatus } from '@prisma/client';
import {
  buildInvoiceAmounts,
  mapItemsForCreate,
  refreshInvoiceStatus,
} from '@/lib/invoices/invoiceService';
import { computeBalanceDue, decimalToNumber, type InvoiceLineInput } from '@/lib/invoices/invoiceUtils';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';
import { assertInvoiceDraftEditable, InvoiceImmutableError } from '@/lib/invoices/invoiceImmutability';

async function loadInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: { items: true, payments: true },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    await refreshInvoiceStatus(params.id);
    const invoice = await loadInvoice(params.id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, invoice: serializeInvoice(invoice) });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to fetch invoice';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

interface UpdateBody {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyAddress?: string;
  serviceType?: string;
  jobDate?: string | null;
  dueDate?: string | null;
  tax?: number;
  discount?: number;
  notes?: string | null;
  items?: InvoiceLineInput[];
  status?: InvoiceStatus;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const existing = await loadInvoice(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }
    if (existing.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cancelled invoices cannot be edited' }, { status: 400 });
    }

    const body = (await request.json()) as UpdateBody;

    // Incident #001 (P5): issuing an invoice (transition to SENT / any issued
    // state) must go through the send gate, never a direct status PATCH — that
    // would bypass reimbursement confirmation, validation, and the atomic send
    // claim. Cancellation has its own endpoint.
    const ISSUED_STATUSES: InvoiceStatus[] = ['SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'];
    if (
      body.status !== undefined &&
      body.status !== existing.status &&
      ISSUED_STATUSES.includes(body.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVOICE_STATUS_TRANSITION_BLOCKED',
          error: 'Use the Send action to issue an invoice; status cannot be set to an issued state here.',
        },
        { status: 400 }
      );
    }

    // Incident #001 (P2): a sent/issued invoice is an immutable accounting
    // artifact. Reject any PATCH that would mutate its locked fields; only
    // internal notes / phone remain editable.
    try {
      assertInvoiceDraftEditable(existing, body);
    } catch (guardError) {
      if (guardError instanceof InvoiceImmutableError) {
        return NextResponse.json(
          {
            success: false,
            code: guardError.code,
            error: guardError.message,
            fields: guardError.fields,
            hint: 'Use a revision invoice (Phase 4) to make financial changes.',
          },
          { status: 409 }
        );
      }
      throw guardError;
    }
    const tax = body.tax ?? decimalToNumber(existing.tax);
    const discount = body.discount ?? decimalToNumber(existing.discount);

    let subtotal = decimalToNumber(existing.subtotal);
    let total = decimalToNumber(existing.total);

    if (body.items?.length) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: params.id } });
      const mapped = mapItemsForCreate(body.items);
      await prisma.invoiceItem.createMany({
        data: mapped.map((item) => ({ ...item, invoiceId: params.id })),
      });
      const amounts = buildInvoiceAmounts(body.items, tax, discount);
      subtotal = amounts.subtotal;
      total = amounts.total;
    } else if (body.tax !== undefined || body.discount !== undefined) {
      total = buildInvoiceAmounts(
        existing.items.map((i) => ({
          description: i.description,
          quantity: decimalToNumber(i.quantity),
          unitPrice: decimalToNumber(i.unitPrice),
        })),
        tax,
        discount
      ).total;
      subtotal = decimalToNumber(existing.subtotal);
    }

    const amountPaid = decimalToNumber(existing.amountPaid);
    const balanceDue = computeBalanceDue(total, amountPaid);

    await prisma.invoice.update({
      where: { id: params.id },
      data: {
        clientName: body.clientName?.trim() ?? existing.clientName,
        clientEmail: body.clientEmail !== undefined ? body.clientEmail?.trim() || null : existing.clientEmail,
        clientPhone: body.clientPhone !== undefined ? body.clientPhone?.trim() || null : existing.clientPhone,
        propertyAddress: body.propertyAddress?.trim() ?? existing.propertyAddress,
        serviceType: body.serviceType?.trim() ?? existing.serviceType,
        jobDate: body.jobDate !== undefined ? (body.jobDate ? new Date(body.jobDate) : null) : existing.jobDate,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : existing.dueDate,
        subtotal,
        tax,
        discount,
        total,
        balanceDue,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        status: body.status ?? existing.status,
      },
      include: { items: true, payments: true },
    });

    await refreshInvoiceStatus(params.id);
    const refreshed = await loadInvoice(params.id);
    return NextResponse.json({ success: true, invoice: serializeInvoice(refreshed!) });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to update invoice';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

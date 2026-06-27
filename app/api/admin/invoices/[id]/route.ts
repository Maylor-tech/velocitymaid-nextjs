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

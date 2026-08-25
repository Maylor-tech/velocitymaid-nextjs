export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import type { InvoiceStatus } from '@prisma/client';
import {
  buildInvoiceAmounts,
  mapItemsForCreate,
} from '@/lib/invoices/invoiceService';
import { nextInvoiceNumber, decimalToNumber, type InvoiceLineInput } from '@/lib/invoices/invoiceUtils';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const q = (searchParams.get('q') || '').trim();

    const where: Record<string, unknown> = {};
    if (status && status !== 'all') {
      where.status = status as InvoiceStatus;
    }
    if (q) {
      where.OR = [
        { clientName: { contains: q, mode: 'insensitive' } },
        { clientEmail: { contains: q, mode: 'insensitive' } },
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { propertyAddress: { contains: q, mode: 'insensitive' } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { items: true, payments: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const allOpen = await prisma.invoice.findMany({
      where: { status: { notIn: ['PAID', 'CANCELLED', 'DRAFT'] } },
      select: { balanceDue: true },
    });
    const totalUnpaidBalance = allOpen.reduce(
      (s, i) => s + decimalToNumber(i.balanceDue),
      0
    );

    const paidThisMonth = await prisma.invoice.aggregate({
      where: {
        status: 'PAID',
        paidAt: { gte: monthStart },
      },
      _sum: { total: true },
    });

    const overdueCount = await prisma.invoice.count({
      where: { status: 'OVERDUE' },
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalUnpaidBalance,
        paidThisMonth: decimalToNumber(paidThisMonth._sum.total),
        overdueCount,
      },
      invoices: invoices.map(serializeInvoice),
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to list invoices';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

interface CreateBody {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  propertyAddress: string;
  serviceType: string;
  jobDate?: string;
  dueDate?: string;
  tax?: number;
  discount?: number;
  notes?: string;
  items: InvoiceLineInput[];
  /**
   * Deprecated for issuing. Incident #001 (P5): a manual invoice can no longer be
   * created-and-sent in one ungated step — that was the invoice-0017 origin. This
   * route always creates a DRAFT; issuing must go through POST /[id]/send, which
   * enforces the reimbursement gate, validation, audit, and idempotent claim.
   */
  markSent?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const body = (await request.json()) as CreateBody;

    if (!body.clientName?.trim()) {
      return NextResponse.json({ success: false, error: 'Client name is required' }, { status: 400 });
    }
    if (!body.propertyAddress?.trim()) {
      return NextResponse.json({ success: false, error: 'Property address is required' }, { status: 400 });
    }
    if (!body.serviceType?.trim()) {
      return NextResponse.json({ success: false, error: 'Service type is required' }, { status: 400 });
    }
    if (!body.items?.length) {
      return NextResponse.json({ success: false, error: 'At least one line item is required' }, { status: 400 });
    }

    const tax = body.tax ?? 0;
    const discount = body.discount ?? 0;
    const { subtotal, total, balanceDue } = buildInvoiceAmounts(body.items, tax, discount);
    const invoiceNumber = await nextInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName: body.clientName.trim(),
        clientEmail: body.clientEmail?.trim() || null,
        clientPhone: body.clientPhone?.trim() || null,
        propertyAddress: body.propertyAddress.trim(),
        serviceType: body.serviceType.trim(),
        jobDate: body.jobDate ? new Date(body.jobDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        subtotal,
        tax,
        discount,
        total,
        amountPaid: 0,
        balanceDue,
        // Always DRAFT. Issuing (SENT + email) is done only via the gated
        // /[id]/send endpoint so it cannot bypass validateInvoiceSendable().
        status: 'DRAFT',
        sentAt: null,
        notes: body.notes?.trim() || null,
        items: { create: mapItemsForCreate(body.items) },
      },
      include: { items: true, payments: true },
    });

    const serialized = serializeInvoice(invoice);

    return NextResponse.json({ success: true, invoice: serialized });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to create invoice';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

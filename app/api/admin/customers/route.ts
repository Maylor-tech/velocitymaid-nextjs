export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { getCustomerSummaries } from '@/lib/admin/customerOverview';
import {
  customerListWhere,
  type CustomerListFilter,
} from '@/lib/admin/customerLifecycle';

function parseFilter(raw: string | null): CustomerListFilter {
  if (raw === 'archived' || raw === 'all' || raw === 'system') return raw;
  return 'active';
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');

    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    const filter = parseFilter(request.nextUrl.searchParams.get('filter'));
    const take = Math.min(Number(request.nextUrl.searchParams.get('limit') || 100), 200);

    const customers = await prisma.customer.findMany({
      where: customerListWhere(filter, q),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        invitedAt: true,
        leadStatus: true,
        archivedAt: true,
        archivedBy: true,
        recordKind: true,
        _count: { select: { Job: true, Invoice: true, Property: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take,
    });

    // One batch of grouped queries for the whole page (not one query per customer).
    const summaries = await getCustomerSummaries(customers);
    const withPortal = customers.map((c) => {
      const s = summaries.get(c.id)!;
      return {
        ...c,
        jobCount: c._count.Job,
        invoiceCount: c._count.Invoice,
        propertyCount: c._count.Property,
        portal: s.portal,
        nextCleanDate: s.nextCleanDate,
        lastCleanDate: s.lastCleanDate,
        unpaidTotal: s.unpaidTotal,
      };
    });

    return NextResponse.json({
      success: true,
      filter,
      customers: withPortal,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to list customers';
    const status = message.includes('Unauthorized') ? 401 : 500;
    if (status === 500) console.error('[admin/customers GET]', error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

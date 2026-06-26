export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { nextInvoiceNumber } from '@/lib/invoices/invoiceUtils';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const invoiceNumber = await nextInvoiceNumber();
    return NextResponse.json({ success: true, invoiceNumber });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to generate number';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

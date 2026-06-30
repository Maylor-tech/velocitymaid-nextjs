export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import {
  getInvoiceQuickAddItems,
  saveInvoiceQuickAddItems,
} from '@/lib/admin/platformSettings';
import { parseInvoiceQuickAddItems } from '@/lib/admin/invoiceQuickAddSettings';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const items = await getInvoiceQuickAddItems();
    return NextResponse.json({ success: true, items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load settings';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(request, 'ADMIN');
    const body = await request.json();
    const items = parseInvoiceQuickAddItems(body.items);
    await saveInvoiceQuickAddItems(items);
    return NextResponse.json({ success: true, items });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

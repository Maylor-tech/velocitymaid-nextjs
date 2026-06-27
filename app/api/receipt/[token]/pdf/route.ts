export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeReceipt, renderReceiptHtml } from '@/lib/billing/serializeReceipt';

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const receipt = await prisma.receipt.findUnique({
    where: { publicToken: params.token },
  });
  if (!receipt) {
    return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });
  }

  const html = renderReceiptHtml(serializeReceipt(receipt));

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="receipt-${receipt.receiptNumber}.html"`,
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeReceipt } from '@/lib/billing/serializeReceipt';

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
  return NextResponse.json({ success: true, receipt: serializeReceipt(receipt) });
}

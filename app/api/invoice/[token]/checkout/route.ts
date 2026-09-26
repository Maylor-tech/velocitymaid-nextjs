export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createOrReuseInvoiceCheckout } from '@/lib/invoices/invoiceCheckoutSession';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const origin =
      request.headers.get('origin') ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const result = await createOrReuseInvoiceCheckout({
      publicToken: params.token,
      origin,
    });

    if (result.ok === false) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      reused: result.reused,
      invoice: result.invoice,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create checkout';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

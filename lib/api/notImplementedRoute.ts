import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Placeholder for reserved API routes not yet implemented. */
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Not implemented' },
    { status: 501 }
  );
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Not implemented' },
    { status: 501 }
  );
}

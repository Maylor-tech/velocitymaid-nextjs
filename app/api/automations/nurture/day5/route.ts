export const dynamic = 'force-dynamic'

/**
 * Day 5 Nurture Message
 * POST /api/automations/nurture/day5
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/automations/nurture/send-day`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, day: 5 }),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}



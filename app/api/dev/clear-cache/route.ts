export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (process.env.APP_ENV !== "development") {
    return NextResponse.json(
      { success: false, error: "Not allowed in production" },
      { status: 403 }
    );
  }

  // Simulated cache clear
  return NextResponse.json({ success: true, cacheCleared: true });
}



















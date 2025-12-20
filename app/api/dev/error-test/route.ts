export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  if (process.env.APP_ENV !== "development") {
    return NextResponse.json(
      { success: false, error: "Not allowed in production" },
      { status: 403 }
    );
  }

  try {
    throw new Error("Simulated developer error — test successful.");
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Simulated error" },
      { status: 500 }
    );
  }
}









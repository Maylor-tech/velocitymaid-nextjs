/**
 * GET /api/admin/demo/status
 * 
 * Returns the current DEMO_MODE status.
 * Used by client-side code to determine if demo mode is enabled.
 */

import { NextRequest, NextResponse } from "next/server";
import { isDemoModeServer } from "@/lib/demoMode";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    demoMode: isDemoModeServer(),
  });
}














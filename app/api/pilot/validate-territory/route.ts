/**
 * Phase M: Territory Validation API
 * 
 * POST /api/pilot/validate-territory
 * 
 * Validates that a job request is within Miami pilot territory.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateTerritory } from "../../../../lib/pilot/territory";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchId, zipCode, preferredTime } = body;

    if (!branchId || !zipCode) {
      return NextResponse.json(
        {
          success: false,
          error: "branchId and zipCode are required",
        },
        { status: 400 }
      );
    }

    const validation = await validateTerritory(branchId, zipCode, preferredTime);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: validation.error,
          zipCode: validation.zipCode,
          serviceHours: validation.serviceHours,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      zipCode: validation.zipCode,
    });
  } catch (error: any) {
    console.error("[PILOT_TERRITORY] Validation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to validate territory",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pilot/validate-territory
 * 
 * Get allowed ZIP codes and service hours for a branch
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    if (!branchId) {
      return NextResponse.json(
        {
          success: false,
          error: "branchId is required",
        },
        { status: 400 }
      );
    }

    const { getAllowedZipCodes, getServiceHours } = await import("../../../../lib/pilot/territory");
    
    const [zipCodes, serviceHours] = await Promise.all([
      getAllowedZipCodes(branchId),
      getServiceHours(branchId),
    ]);

    return NextResponse.json({
      success: true,
      zipCodes,
      serviceHours,
    });
  } catch (error: any) {
    console.error("[PILOT_TERRITORY] Get error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to get territory info",
      },
      { status: 500 }
    );
  }
}













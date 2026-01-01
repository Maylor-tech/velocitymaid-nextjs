/**
 * Investor Access Request API
 * 
 * POST /api/investors/request-access
 * 
 * Saves investor access requests to the database
 * Public endpoint (no auth required for submission)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Defensive guard: ensure Prisma is initialized
    if (!prisma) {
      throw new Error('Prisma client not initialized');
    }

    const body = await request.json();
    const { name, email, organization, interest } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and email are required",
        },
        { status: 400 }
      );
    }

    // Save request to database
    const accessRequest = await prisma.investorAccessRequest.create({
      data: {
        name,
        email,
        organization: organization || null,
        interest: interest || null,
      },
    });

    // TODO: Send email notification to admins (future implementation)
    // await sendAdminNotification({ ... });

    return NextResponse.json(
      {
        success: true,
        message: "Access request submitted successfully",
        id: accessRequest.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[INVESTOR_ACCESS_REQUEST] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to submit access request",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}



/**
 * Health Check API
 * 
 * GET /api/health
 * 
 * Confirms:
 * - Database reachable
 * - Prisma initialized
 * - Env vars present
 * 
 * Public endpoint for monitoring
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check Prisma initialization
    if (!prisma) {
      return NextResponse.json(
        {
          status: "error",
          message: "Prisma client not initialized",
        },
        { status: 503 }
      );
    }

    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Check critical environment variables
    const envVars = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    };

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      prisma: "initialized",
      environment: envVars,
    });
  } catch (error: any) {
    console.error("[HEALTH] Health check error:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: process.env.NODE_ENV === "development" ? error.message : "Service unavailable",
      },
      { status: 503 }
    );
  }
}


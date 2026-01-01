/**
 * Phase 3C: Stripe Connect Express Onboarding API
 * 
 * POST /api/cleaner/stripe/connect
 * 
 * Creates Stripe Connect Express account if missing, then creates Account Link for onboarding
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { createStripeConnectAccount, createAccountLink } from "@/lib/stripe/connect";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CLEANER");

    // Get cleaner info
    const cleaner = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        stripeAccountId: true,
      },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: "Cleaner not found" },
        { status: 404 }
      );
    }

    // Get base URL for return/refresh URLs
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const returnUrl = `${origin}/cleaner/dashboard?stripe_onboarding=success`;
    const refreshUrl = `${origin}/cleaner/dashboard?stripe_onboarding=refresh`;

    let accountId = cleaner.stripeAccountId;

    // Create connected account if missing
    if (!accountId) {
      accountId = await createStripeConnectAccount(cleaner.email, cleaner.name || undefined);

      // Save account ID to database
      await prisma.user.update({
        where: { id: cleaner.id },
        data: {
          stripeAccountId: accountId,
        },
      });
    }

    // Create Account Link for onboarding
    const onboardingUrl = await createAccountLink(accountId, returnUrl, refreshUrl);

    return NextResponse.json({
      success: true,
      url: onboardingUrl,
      accountId,
    });
  } catch (error: any) {
    console.error("[STRIPE_CONNECT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create Stripe Connect account",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


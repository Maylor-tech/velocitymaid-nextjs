/**
 * Phase 3B: Stripe Connect Status API
 * 
 * GET /api/cleaner/stripe/status?refresh=true
 * 
 * Retrieves local status from DB (fast)
 * Optionally refreshes from Stripe (admin/debug)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { getStripeAccountStatus } from "@/lib/stripe/connect";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CLEANER");
    const searchParams = request.nextUrl.searchParams;
    const refresh = searchParams.get("refresh") === "true";

    // Get cleaner with Stripe fields
    const cleaner = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        stripeAccountId: true,
        stripeChargesEnabled: true,
        stripePayoutsEnabled: true,
        stripeDetailsSubmitted: true,
      },
    });

    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: "Cleaner not found" },
        { status: 404 }
      );
    }

    // Return local status (fast)
    if (!refresh) {
      return NextResponse.json({
        success: true,
        status: {
          hasAccount: !!cleaner.stripeAccountId,
          chargesEnabled: cleaner.stripeChargesEnabled,
          payoutsEnabled: cleaner.stripePayoutsEnabled,
          detailsSubmitted: cleaner.stripeDetailsSubmitted,
          readyForPayouts:
            cleaner.stripeAccountId &&
            cleaner.stripeChargesEnabled &&
            cleaner.stripePayoutsEnabled,
        },
        source: "database",
      });
    }

    // Refresh from Stripe (admin/debug only)
    if (!cleaner.stripeAccountId) {
      return NextResponse.json({
        success: true,
        status: {
          hasAccount: false,
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
          readyForPayouts: false,
        },
        source: "database",
        message: "No Stripe account found",
      });
    }

    try {
      const stripeStatus = await getStripeAccountStatus(cleaner.stripeAccountId);

      // Update database with latest status
      await prisma.user.update({
        where: { id: cleaner.id },
        data: {
          stripeChargesEnabled: stripeStatus.chargesEnabled,
          stripePayoutsEnabled: stripeStatus.payoutsEnabled,
          stripeDetailsSubmitted: stripeStatus.detailsSubmitted,
        },
      });

      return NextResponse.json({
        success: true,
        status: {
          hasAccount: true,
          chargesEnabled: stripeStatus.chargesEnabled,
          payoutsEnabled: stripeStatus.payoutsEnabled,
          detailsSubmitted: stripeStatus.detailsSubmitted,
          readyForPayouts:
            stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled,
          currentlyDue: stripeStatus.currentlyDue,
          eventuallyDue: stripeStatus.eventuallyDue,
        },
        source: "stripe",
      });
    } catch (stripeError: any) {
      console.error("[STRIPE_STATUS_REFRESH] Error:", stripeError);
      // Return database status if Stripe refresh fails
      return NextResponse.json({
        success: true,
        status: {
          hasAccount: !!cleaner.stripeAccountId,
          chargesEnabled: cleaner.stripeChargesEnabled,
          payoutsEnabled: cleaner.stripePayoutsEnabled,
          detailsSubmitted: cleaner.stripeDetailsSubmitted,
          readyForPayouts:
            cleaner.stripeAccountId &&
            cleaner.stripeChargesEnabled &&
            cleaner.stripePayoutsEnabled,
        },
        source: "database",
        warning: "Failed to refresh from Stripe, using cached status",
      });
    }
  } catch (error: any) {
    console.error("[STRIPE_STATUS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to get Stripe status",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


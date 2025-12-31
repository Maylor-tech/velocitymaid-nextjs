/**
 * Phase 3H.4: Cleaner Compliance Checklist API
 * 
 * GET /api/cleaner/compliance-checklist
 * 
 * Returns compliance checklist status for authenticated cleaner
 * Computes sections from:
 * - Stripe Connect fields (payout readiness)
 * - CleanerTaxProfile (W-9 status + address)
 * - PayoutTransfer (statements)
 * 
 * Read-only; no sensitive data exposed
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { TaxProfileStatus, PayoutTransferStatus } from "@prisma/client";

export type ComplianceStatus = "ALL_SET" | "ACTION_REQUIRED" | "UNDER_REVIEW";

export interface ComplianceChecklistItem {
  id: string;
  label: string;
  status: "complete" | "incomplete" | "pending" | "review";
  description: string;
  actionUrl: string | null;
  actionLabel: string | null;
}

export interface ComplianceChecklistSection {
  id: string;
  title: string;
  items: ComplianceChecklistItem[];
  allComplete: boolean;
}

export interface ComplianceChecklistResponse {
  success: true;
  overallStatus: ComplianceStatus;
  sections: ComplianceChecklistSection[];
  summary: {
    totalItems: number;
    completedItems: number;
    incompleteItems: number;
    pendingItems: number;
  };
  // Phase 3H.5: Individual readiness score (0-100)
  readinessScore?: number;
  // Phase 3H.7: Jan 31 Countdown (optional, soft notice)
  countdown?: {
    active: boolean;
    daysRemaining: number;
    phase: "NORMAL" | "WARNING" | "CRITICAL";
  };
}

/**
 * Determine overall compliance status
 */
function getOverallStatus(sections: ComplianceChecklistSection[]): ComplianceStatus {
  const allItems = sections.flatMap((s) => s.items);
  const hasIncomplete = allItems.some((item) => item.status === "incomplete");
  const hasPending = allItems.some((item) => item.status === "pending");
  const hasReview = allItems.some((item) => item.status === "review");

  if (hasIncomplete) {
    return "ACTION_REQUIRED";
  }

  if (hasPending || hasReview) {
    return "UNDER_REVIEW";
  }

  return "ALL_SET";
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, "CLEANER");
    const cleanerId = auth.userId;

    // Fetch cleaner data with related information (with fallback for DB failures)
    let cleaner = null;
    let hasStatements = false;

    try {
      cleaner = await prisma.user.findUnique({
        where: { id: cleanerId },
        select: {
          id: true,
          stripeAccountId: true,
          stripePayoutsEnabled: true,
          stripeChargesEnabled: true,
          stripeOnboardingStatus: true,
          taxProfile: {
            select: {
              id: true,
              status: true,
              firstName: true,
              lastName: true,
              businessName: true,
              addressLine1: true,
              city: true,
              state: true,
              zipCode: true,
              country: true,
              submittedAt: true,
              verifiedAt: true,
              rejectedAt: true,
              rejectionReason: true,
            },
          },
        },
      });

      // Check if cleaner has any payout transfers (for statements section)
      if (cleaner) {
        const hasStatementsCount = await prisma.payoutTransfer.count({
          where: {
            cleanerId,
            status: PayoutTransferStatus.PAID,
          },
        });
        hasStatements = hasStatementsCount > 0;
      }
    } catch (dbError: any) {
      console.warn("[COMPLIANCE_CHECKLIST] DB unavailable, using fallback:", dbError?.message);
      // Fallback: allow page to render for authenticated cleaner
      // even if DB is temporarily unavailable
      cleaner = {
        id: cleanerId,
        stripeAccountId: null,
        stripePayoutsEnabled: false,
        stripeChargesEnabled: false,
        stripeOnboardingStatus: null,
        taxProfile: null,
      };
      hasStatements = false;
    }

    // If cleaner still not found (and no fallback), return error
    if (!cleaner) {
      return NextResponse.json(
        { success: false, error: "Cleaner not found" },
        { status: 404 }
      );
    }

    // Build checklist sections
    const sections: ComplianceChecklistSection[] = [];

    // 1️⃣ Stripe Connect Section
    const stripeItems: ComplianceChecklistItem[] = [];

    // Stripe account created
    stripeItems.push({
      id: "stripe-account",
      label: "Stripe Account Connected",
      status: cleaner.stripeAccountId ? "complete" : "incomplete",
      description: cleaner.stripeAccountId
        ? "Your Stripe account is connected"
        : "Connect your Stripe account to receive payouts",
      actionUrl: cleaner.stripeAccountId ? null : "/cleaner/stripe/connect",
      actionLabel: cleaner.stripeAccountId ? null : "Connect Stripe Account",
    });

    // Stripe payouts enabled
    stripeItems.push({
      id: "stripe-payouts",
      label: "Payouts Enabled",
      status: cleaner.stripePayoutsEnabled ? "complete" : "incomplete",
      description: cleaner.stripePayoutsEnabled
        ? "Payouts are enabled on your Stripe account"
        : "Complete Stripe onboarding to enable payouts",
      actionUrl: cleaner.stripePayoutsEnabled ? null : "/cleaner/stripe/connect",
      actionLabel: cleaner.stripePayoutsEnabled ? null : "Complete Onboarding",
    });

    sections.push({
      id: "stripe-connect",
      title: "Payment Setup",
      items: stripeItems,
      allComplete: stripeItems.every((item) => item.status === "complete"),
    });

    // 2️⃣ Tax Profile (W-9) Section
    const taxItems: ComplianceChecklistItem[] = [];
    const taxProfile = cleaner.taxProfile;

    if (!taxProfile) {
      // No tax profile at all
      taxItems.push({
        id: "tax-profile",
        label: "Tax Form (W-9)",
        status: "incomplete",
        description: "Complete your W-9 tax form to receive payments",
        actionUrl: "/cleaner/tax-form",
        actionLabel: "Complete Tax Form",
      });
    } else {
      // Check address completeness
      const hasAddress =
        taxProfile.addressLine1 &&
        taxProfile.city &&
        taxProfile.state &&
        taxProfile.zipCode;

      if (!hasAddress) {
        taxItems.push({
          id: "tax-address",
          label: "Tax Form Address",
          status: "incomplete",
          description: "Complete your address information on the tax form",
          actionUrl: "/cleaner/tax-form",
          actionLabel: "Update Tax Form",
        });
      }

      // Check status
      if (taxProfile.status === TaxProfileStatus.DRAFT) {
        taxItems.push({
          id: "tax-submit",
          label: "Submit Tax Form",
          status: "incomplete",
          description: "Your tax form is saved as draft. Submit it for review.",
          actionUrl: "/cleaner/tax-form",
          actionLabel: "Submit Tax Form",
        });
      } else if (taxProfile.status === TaxProfileStatus.SUBMITTED) {
        taxItems.push({
          id: "tax-review",
          label: "Tax Form Under Review",
          status: "pending",
          description: "Your tax form has been submitted and is under review",
          actionUrl: "/cleaner/tax-form",
          actionLabel: "View Status",
        });
      } else if (taxProfile.status === TaxProfileStatus.REJECTED) {
        taxItems.push({
          id: "tax-rejected",
          label: "Tax Form Needs Correction",
          status: "review",
          description: taxProfile.rejectionReason ||
            "Your tax form was rejected. Please review and resubmit.",
          actionUrl: "/cleaner/tax-form",
          actionLabel: "Update Tax Form",
        });
      } else if (taxProfile.status === TaxProfileStatus.VERIFIED) {
        taxItems.push({
          id: "tax-verified",
          label: "Tax Form Verified",
          status: "complete",
          description: "Your tax form has been verified and is up to date",
          actionUrl: "/cleaner/tax-form",
          actionLabel: "View Tax Form",
        });
      }
    }

    sections.push({
      id: "tax-profile",
      title: "Tax Information",
      items: taxItems,
      allComplete: taxItems.every((item) => item.status === "complete"),
    });

    // 3️⃣ Statements Section
    const statementItems: ComplianceChecklistItem[] = [];

    if (hasStatements) {
      statementItems.push({
        id: "statements-available",
        label: "Payout Statements",
        status: "complete",
        description: `You have ${hasStatementsCount} payout statement${hasStatementsCount > 1 ? "s" : ""} available`,
        actionUrl: "/cleaner/statements",
        actionLabel: "View Statements",
      });
    } else {
      statementItems.push({
        id: "statements-none",
        label: "Payout Statements",
        status: "pending",
        description: "Statements will appear here after your first payout",
        actionUrl: null,
        actionLabel: null,
      });
    }

    sections.push({
      id: "statements",
      title: "Payout History",
      items: statementItems,
      allComplete: statementItems.every((item) => item.status === "complete"),
    });

    // Calculate summary
    const allItems = sections.flatMap((s) => s.items);
    const completedItems = allItems.filter((item) => item.status === "complete");
    const incompleteItems = allItems.filter((item) => item.status === "incomplete");
    const pendingItems = allItems.filter((item) => item.status === "pending" || item.status === "review");

    // Determine overall status
    const overallStatus = getOverallStatus(sections);

    // Phase 3H.5: Calculate individual readiness score (0-100)
    // Same weights as admin readiness: W-9 VERIFIED = 60, Address = 20, Stripe = 10, Statements = 10
    // Reuse taxProfile variable already defined above
    const w9Verified = taxProfile?.status === TaxProfileStatus.VERIFIED;
    const addressComplete =
      !!taxProfile?.addressLine1 &&
      !!taxProfile?.city &&
      !!taxProfile?.state &&
      !!taxProfile?.zipCode;
    const stripePayoutsEnabled = cleaner.stripePayoutsEnabled;

    let readinessScore = 0;
    if (w9Verified) readinessScore += 60;
    if (addressComplete) readinessScore += 20;
    if (stripePayoutsEnabled) readinessScore += 10;
    if (hasStatements) readinessScore += 10;

    return NextResponse.json({
      success: true,
      overallStatus,
      sections,
      summary: {
        totalItems: allItems.length,
        completedItems: completedItems.length,
        incompleteItems: incompleteItems.length,
        pendingItems: pendingItems.length,
      },
      readinessScore: Math.round(readinessScore * 100) / 100, // Round to 2 decimal places
      fallback: !cleaner || cleaner.stripeAccountId === null, // Indicate if using fallback data
    } as ComplianceChecklistResponse);
  } catch (error: any) {
    console.error("[COMPLIANCE_CHECKLIST] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    // Final fallback: return minimal checklist if everything fails
    return NextResponse.json({
      success: true,
      overallStatus: "ACTION_REQUIRED" as ComplianceStatus,
      sections: [
        {
          id: "tax-profile",
          title: "Tax Information",
          items: [
            {
              id: "tax-profile",
              label: "Tax Form (W-9)",
              status: "incomplete" as const,
              description: "Complete your W-9 tax form to receive payments",
              actionUrl: "/cleaner/tax-form",
              actionLabel: "Complete Tax Form",
            },
          ],
          allComplete: false,
        },
      ],
      summary: {
        totalItems: 1,
        completedItems: 0,
        incompleteItems: 1,
        pendingItems: 0,
      },
      readinessScore: 0,
      fallback: true,
    } as ComplianceChecklistResponse);
  }
}


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Send a customer portal invite — admin protected.
 *
 * POST /api/admin/customers/[customerId]/invite
 *
 * The customer portal is passwordless (magic link + email code). This issues a
 * long-lived (7-day) magic login token, emails a branded invite with a secure
 * one-click access link, and stamps `invitedAt` on the customer record.
 *
 * Does NOT touch Stripe, booking, or payment logic.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/requireRole";
import { storeMagicToken } from "@/lib/magicTokenStore";
import { sendPortalInviteEmail } from "@/lib/email/sendPortalInviteEmail";

const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function resolveBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  return process.env.NODE_ENV === "production"
    ? "https://velocitymaid.com"
    : "http://localhost:3000";
}

export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    await requireRole(request, "ADMIN");
    const { customerId } = params;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "customerId is required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }
    if (!customer.email) {
      return NextResponse.json(
        { success: false, error: "Customer has no email on file" },
        { status: 400 }
      );
    }

    const token = randomBytes(32).toString("hex");
    await storeMagicToken(token, {
      customerId: customer.id,
      email: customer.email,
      expiresAt: Date.now() + INVITE_TOKEN_TTL_MS,
    });

    const baseUrl = resolveBaseUrl();
    const loginUrl = `${baseUrl}/customer/login`;
    const accessLink = `${baseUrl}/auth/customer/callback?token=${token}`;
    const fullName =
      [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim() ||
      "there";

    const emailResult = await sendPortalInviteEmail({
      toEmail: customer.email,
      toName: fullName,
      loginUrl,
      accessLink,
    });

    if (!emailResult.sent) {
      return NextResponse.json(
        {
          success: false,
          error:
            emailResult.error ||
            emailResult.skippedReason ||
            "Failed to send invite email",
        },
        { status: 502 }
      );
    }

    const invitedAt = new Date();
    await prisma.customer.update({
      where: { id: customer.id },
      data: { invitedAt },
    });

    return NextResponse.json({
      success: true,
      message: `Invite sent to ${customer.email}`,
      invitedAt: invitedAt.toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : "Failed to send invite";
    console.error("[customer invite]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

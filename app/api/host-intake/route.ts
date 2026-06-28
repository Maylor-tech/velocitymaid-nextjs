/**
 * POST /api/host-intake
 *
 * Receives Vermont host intake form submissions, emails the host and team,
 * and creates a draft Customer record when possible.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  sendHostIntakeConfirmationEmail,
  sendHostIntakeInternalNotification,
} from "@/lib/email/sendHostIntakeEmails";
import { createDraftHostCustomer } from "@/lib/hostIntake/createDraftCustomer";
import { parseHostIntakeBody } from "@/lib/hostIntake/formatSubmission";
import type { HostIntakePayload } from "@/lib/hostIntake/types";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateExistingRequiredFields(payload: HostIntakePayload): string | null {
  if (
    !payload.propertyAddress ||
    !payload.city ||
    !payload.bedrooms ||
    !payload.bathrooms ||
    !payload.fullName ||
    !payload.email
  ) {
    return "Missing required fields";
  }

  if (!isValidEmail(payload.email)) {
    return "Invalid email address";
  }

  return null;
}

function validateNewRequiredFields(payload: HostIntakePayload): string | null {
  if (!payload.accessType) {
    return "Access type is required";
  }

  if (
    payload.accessType === "Other (please describe)" &&
    !payload.accessTypeOther.trim()
  ) {
    return "Please describe your access type";
  }

  if (!payload.willSendAccessDetails) {
    return "Please confirm you will send access details before the first service";
  }

  if (!payload.linenProvider) {
    return "Please select who provides linens and towels";
  }

  if (!payload.sameDayTurnovers) {
    return "Please select same-day turnover preference";
  }

  if (payload.propertyActiveSeasons.length === 0) {
    return "Please select when your property is most active";
  }

  if (!payload.preferredPaymentMethod) {
    return "Please select a preferred payment method";
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = parseHostIntakeBody(body);

    const existingError = validateExistingRequiredFields(payload);
    if (existingError) {
      return NextResponse.json(
        { success: false, error: existingError },
        { status: 400 }
      );
    }

    const newFieldsError = validateNewRequiredFields(payload);
    if (newFieldsError) {
      return NextResponse.json(
        { success: false, error: newFieldsError },
        { status: 400 }
      );
    }

    try {
      await createDraftHostCustomer(payload);
    } catch (customerError) {
      console.error("[HOST-INTAKE] Draft customer creation failed:", customerError);
    }

    const [confirmation, internal] = await Promise.all([
      sendHostIntakeConfirmationEmail(payload),
      sendHostIntakeInternalNotification(payload),
    ]);

    if (!confirmation.sent && !internal.sent) {
      console.log("[HOST-INTAKE] RESEND_API_KEY not configured. Form data:", payload);
    }

    if (confirmation.sent) {
      console.log(`[HOST-INTAKE] Confirmation sent to ${payload.email}`);
    }

    if (internal.sent) {
      console.log(
        `[HOST-INTAKE] Internal notification sent for ${payload.propertyAddress}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("[HOST-INTAKE] Error:", err);
    const message =
      err instanceof Error ? err.message : "Unable to submit inquiry";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

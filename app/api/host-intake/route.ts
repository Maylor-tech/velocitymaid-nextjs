/**
 * POST /api/host-intake
 *
 * Receives Vermont host intake form submissions (FULL) or lightweight
 * /hosts setup requests (SETUP_REQUEST). Creates/updates Customer + PipelineLead
 * (and Property for FULL) without duplicating records across the funnel.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  sendHostIntakeConfirmationEmail,
  sendHostIntakeInternalNotification,
  sendHostSetupRequestConfirmationEmail,
  sendHostSetupRequestInternalNotification,
} from "@/lib/email/sendHostIntakeEmails";
import {
  createDraftHostCustomer,
  createSetupRequestHostCustomer,
} from "@/lib/hostIntake/createDraftCustomer";
import { parseHostIntakeBody } from "@/lib/hostIntake/formatSubmission";
import type {
  HostIntakePayload,
  HostSetupRequestPayload,
} from "@/lib/hostIntake/types";
import { buildHostIntakeDeepLink } from "@/lib/hostIntake/attribution";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateSetupRequestFields(payload: HostIntakePayload): string | null {
  if (!payload.fullName) return "Name is required";
  if (!payload.email) return "Email is required";
  if (!isValidEmail(payload.email)) return "Invalid email address";
  if (!payload.phone) return "Phone is required";
  if (!payload.city) return "Vermont property town is required";
  if (!payload.serviceInterest) return "Service interest is required";
  return null;
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

    if (payload.mode === "SETUP_REQUEST") {
      const setupError = validateSetupRequestFields(payload);
      if (setupError) {
        return NextResponse.json(
          { success: false, error: setupError },
          { status: 400 }
        );
      }

      const setupPayload: HostSetupRequestPayload = {
        mode: "SETUP_REQUEST",
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        city: payload.city,
        serviceInterest: payload.serviceInterest || "",
        attribution: payload.attribution,
      };

      try {
        await createSetupRequestHostCustomer(setupPayload);
      } catch (customerError) {
        console.error(
          "[HOST-SETUP-REQUEST] Draft customer creation failed:",
          customerError
        );
      }

      const [confirmation, internal] = await Promise.all([
        sendHostSetupRequestConfirmationEmail(setupPayload),
        sendHostSetupRequestInternalNotification(setupPayload),
      ]);

      if (!confirmation.sent && !internal.sent) {
        console.log(
          "[HOST-SETUP-REQUEST] RESEND_API_KEY not configured. Form data:",
          {
            city: setupPayload.city,
            interest: setupPayload.serviceInterest,
            attribution: setupPayload.attribution,
          }
        );
      }

      const nextUrl = buildHostIntakeDeepLink({
        email: setupPayload.email,
        fullName: setupPayload.fullName,
        phone: setupPayload.phone,
        city: setupPayload.city,
        attribution: setupPayload.attribution,
      });

      return NextResponse.json({
        success: true,
        mode: "SETUP_REQUEST",
        nextUrl,
      });
    }

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

    return NextResponse.json({ success: true, mode: "FULL" });
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

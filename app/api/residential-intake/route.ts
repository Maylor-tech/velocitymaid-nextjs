/**
 * POST /api/residential-intake
 *
 * Vermont residential-home intake. Creates/updates Customer + PipelineLead +
 * Property. Never creates a Job and never marks anything paid.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { parseAttributionFromUnknown } from "@/lib/hostIntake/attribution";
import { createDraftResidentialCustomer } from "@/lib/residentialIntake/createDraftCustomer";
import {
  parseResidentialIntakeBody,
  validateResidentialIntake,
} from "@/lib/residentialIntake/validate";
import {
  sendResidentialIntakeConfirmationEmail,
  sendResidentialIntakeInternalNotification,
} from "@/lib/email/sendResidentialIntakeEmails";
import { notifyResidentialIntakeReceived } from "@/lib/notifications/residentialIntakeNotify";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const payload = parseResidentialIntakeBody(body);
    payload.attribution = parseAttributionFromUnknown(body?.attribution);

    const error = validateResidentialIntake(payload);
    if (error) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    let customerId: string | null = null;
    let customerName = payload.fullName;
    try {
      const created = await createDraftResidentialCustomer(payload);
      customerId = created.customer.id;
      customerName =
        `${created.customer.firstName} ${created.customer.lastName}`.trim() ||
        payload.fullName;
    } catch (customerError) {
      console.error(
        "[RESIDENTIAL-INTAKE] Draft customer creation failed:",
        customerError
      );
    }

    const [confirmation, internal] = await Promise.all([
      sendResidentialIntakeConfirmationEmail(payload),
      sendResidentialIntakeInternalNotification(payload),
    ]);

    let opsAlert = {
      type: "RESIDENTIAL_INTAKE" as const,
      ok: false,
      created: false,
      id: null as string | null,
    };
    if (customerId) {
      try {
        opsAlert = await notifyResidentialIntakeReceived({
          customerId,
          customerName,
          address: payload.serviceAddress,
          city: payload.city,
        });
      } catch (notifyError) {
        console.error("[RESIDENTIAL-INTAKE] ops notify failed:", notifyError);
      }
    }

    if (!confirmation.sent && !internal.sent) {
      console.log("[RESIDENTIAL-INTAKE] RESEND_API_KEY not configured.", {
        city: payload.city,
        serviceType: payload.serviceType,
      });
    }

    return NextResponse.json({
      success: true,
      jobCreated: false,
      paymentStatus: null,
      opsAlert,
      acknowledgement: {
        sent: confirmation.sent,
        skippedReason: confirmation.skippedReason ?? null,
      },
    });
  } catch (err: unknown) {
    console.error("[RESIDENTIAL-INTAKE] Error:", err);
    const message =
      err instanceof Error ? err.message : "Unable to submit request";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

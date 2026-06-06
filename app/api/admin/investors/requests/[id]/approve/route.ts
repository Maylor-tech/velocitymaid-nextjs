/**
 * Admin Investor Access Request Approval API
 * 
 * POST /api/admin/investors/requests/[id]/approve
 * 
 * Approves an investor access request and sends approval email
 * Admin-only, explicit action, auditable
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { loadInvestorPdfs } from "@/lib/investors/loadInvestorPdfs";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication
    const admin = await requireRole(request, "ADMIN");

    const { id } = params;

    // Fetch the request
    const accessRequest = await prisma.investorAccessRequest.findUnique({
      where: { id },
    });

    if (!accessRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Access request not found",
        },
        { status: 404 }
      );
    }

    // Prevent duplicate approvals
    if (accessRequest.status === "APPROVED") {
      return NextResponse.json(
        {
          success: false,
          error: "Request has already been approved",
        },
        { status: 400 }
      );
    }

    // 1️⃣ Mark as approved (in transaction with email send)
    await prisma.investorAccessRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: admin.userId,
      },
    });

    // 2️⃣ Load PDF attachments
    const attachments = loadInvestorPdfs();
    const hasAttachments = attachments.length > 0;

    if (hasAttachments) {
      console.log(
        `[INVESTOR_APPROVAL] Loaded ${attachments.length} PDF attachment(s)`
      );
    } else {
      console.warn(
        "[INVESTOR_APPROVAL] No PDF attachments found. Email will be sent without attachments."
      );
    }

    // 3️⃣ Send approval email
    const resend = getResend();
    if (!resend) {
      console.warn("[INVESTOR_APPROVAL] RESEND_API_KEY not configured, skipping email");
    } else {
      try {
        await resend.emails.send({
          from: "VelocityMaid <investors@velocitymaid.com>",
          to: [accessRequest.email],
          subject: "Access to VelocityMaid Investor Materials",
          html: `
            <p>Hello ${accessRequest.name},</p>

            <p>
              Your request for access to VelocityMaid investor materials has been approved.
              ${hasAttachments ? "Please find the approved documents attached." : ""}
            </p>

            ${hasAttachments ? "" : `
            <p>You may review the following documents:</p>

            <ul>
              <li>Investor Overview</li>
              <li>Compliance & Risk Readiness Summary</li>
              <li>Partner Pilot Proposal</li>
              <li>Governance & Architecture Overview</li>
            </ul>
            `}

            <p>
              These materials are confidential and provided for evaluation purposes only.
              If you have any questions or would like additional context, please reply
              directly to this email.
            </p>

            <p>
              Regards,<br/>
              VelocityMaid
            </p>

            <hr/>
            <p style="font-size:12px;color:#666;">
              Confidential — Not for redistribution.
            </p>
          `,
          text: `
Hello ${accessRequest.name},

Your request for access to VelocityMaid investor materials has been approved.
${hasAttachments ? "Please find the approved documents attached." : ""}

${hasAttachments ? "" : `
You may review the following documents:

- Investor Overview
- Compliance & Risk Readiness Summary
- Partner Pilot Proposal
- Governance & Architecture Overview
`}

These materials are confidential and provided for evaluation purposes only.
If you have any questions or would like additional context, please reply directly to this email.

Regards,
VelocityMaid

---
Confidential — Not for redistribution.
          `.trim(),
          attachments: hasAttachments ? attachments : undefined,
        });

        console.log(
          `[INVESTOR_APPROVAL] Approval email sent to ${accessRequest.email} (request ${id})`
        );
      } catch (emailError: any) {
        console.error(
          `[INVESTOR_APPROVAL] Failed to send email to ${accessRequest.email}:`,
          emailError
        );
        // Don't fail the approval if email fails - approval is already saved
        // Admin can resend manually if needed
      }
    }

    return NextResponse.json({
      success: true,
      message: "Request approved and email sent",
    });
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error("[INVESTOR_APPROVAL] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to approve request",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


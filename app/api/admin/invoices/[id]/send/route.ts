export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';
import { sendInvoiceSentEmail } from '@/lib/email/invoiceEmails';
import { validateInvoiceSendable } from '@/lib/invoices/validateInvoiceSendable';
import { logAuditEntry } from '@/lib/audit';

interface SendBody {
  reimbursementsConfirmed?: boolean;
  acknowledgeWarnings?: string[];
  /** Optional operator reason per acknowledged warning code — audited, not required by the gate. */
  acknowledgeWarningReasons?: Record<string, string>;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');

    let body: SendBody = {};
    try {
      body = (await request.json()) as SendBody;
    } catch {
      // Empty/invalid body is allowed; validation will require confirmation.
    }

    // Incident #001 (P5 + honest P4): centralized send gate.
    const validation = await validateInvoiceSendable(params.id, {
      reimbursementsConfirmed: body.reimbursementsConfirmed,
      acknowledgeWarnings: body.acknowledgeWarnings,
      adminUserId: auth.userId,
    });

    if (!validation.ok) {
      if (validation.errors.length > 0) {
        return NextResponse.json(
          { success: false, code: 'INVOICE_SEND_BLOCKED', errors: validation.errors, warnings: validation.warnings },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, code: 'INVOICE_SEND_WARNINGS', warnings: validation.warnings },
        { status: 409 }
      );
    }

    // Idempotent claim: only the request that flips DRAFT → SENT proceeds to
    // dispatch the email. A concurrent second send updates zero rows and never
    // sends a duplicate email.
    const claim = await prisma.invoice.updateMany({
      where: { id: params.id, status: 'DRAFT' },
      data: { status: 'SENT', sentAt: new Date() },
    });
    if (claim.count === 0) {
      return NextResponse.json(
        { success: false, code: 'INVOICE_ALREADY_SENT', error: 'Invoice was already sent.' },
        { status: 409 }
      );
    }

    // Audit the human reimbursement confirmation + any acknowledged warnings.
    await logAuditEntry({
      actorId: auth.userId,
      actorRole: 'ADMIN',
      action: 'INVOICE_SEND_REIMBURSEMENT_CONFIRMED',
      entityType: 'Invoice',
      entityId: params.id,
      description: 'Admin confirmed reimbursement completeness before sending invoice.',
      changes: { acknowledgedWarnings: validation.warnings.map((w) => w.code), adminUserId: auth.userId },
    });
    for (const w of validation.warnings) {
      await logAuditEntry({
        actorId: auth.userId,
        actorRole: 'ADMIN',
        action: 'INVOICE_SEND_WARNING_ACK',
        entityType: 'Invoice',
        entityId: params.id,
        description: `Admin acknowledged send warning: ${w.code}`,
        changes: {
          code: w.code,
          message: w.message,
          reason: body.acknowledgeWarningReasons?.[w.code] ?? null,
          adminUserId: auth.userId,
        },
      });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: { items: true, payments: true },
    });
    const serialized = serializeInvoice(invoice!, { forOutboundEmail: true });

    // Failure recovery: the invoice is now an accounting artifact (SENT). If the
    // email fails, we do NOT roll back to DRAFT (that would reopen the mutation
    // window). Surface a retry-email path instead. Retrying email does not
    // re-run the claim, so it can never double-send.
    let emailResult: Awaited<ReturnType<typeof sendInvoiceSentEmail>>;
    try {
      emailResult = await sendInvoiceSentEmail(serialized);
    } catch (emailError) {
      await logAuditEntry({
        actorId: auth.userId,
        actorRole: 'ADMIN',
        action: 'INVOICE_SEND_EMAIL_FAILED',
        entityType: 'Invoice',
        entityId: params.id,
        description: 'Invoice marked SENT but email dispatch threw.',
        changes: { error: emailError instanceof Error ? emailError.message : String(emailError) },
      });
      return NextResponse.json(
        {
          success: false,
          code: 'INVOICE_SENT_EMAIL_FAILED',
          error: 'Invoice was marked sent but the email failed to dispatch. Retry sending the email.',
          invoice: serializeInvoice(invoice!),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice: serialized,
      email: emailResult,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to send invoice';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

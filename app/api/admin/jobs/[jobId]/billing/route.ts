export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import type { InvoicePaymentMethod } from '@prisma/client';
import {
  getJobBillingWorkflowStatus,
  generateCompletionReportForJob,
  generateInvoiceFromJob,
  sendLinkedInvoiceForJob,
  recordPaymentForJobInvoice,
  generateReceiptForLatestPayment,
  sendReviewRequestForJob,
} from '@/lib/billing/jobBillingSteps';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const status = await getJobBillingWorkflowStatus(params.jobId);
    return NextResponse.json({ success: true, workflow: status });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load billing workflow';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

const VALID_METHODS: InvoicePaymentMethod[] = [
  'CASH', 'CHECK', 'STRIPE', 'ZELLE', 'VENMO', 'BANK_TRANSFER', 'OTHER',
];

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, 'ADMIN');
    const body = await request.json();
    const action = body.action as string;

    switch (action) {
      case 'generate_report': {
        const result = await generateCompletionReportForJob(params.jobId, {
          sendEmail: body.sendEmail !== false,
          issuesFound: body.issuesFound,
          supplyRequests: body.supplyRequests,
        });
        return NextResponse.json({ success: true, ...result });
      }
      case 'generate_invoice': {
        const result = await generateInvoiceFromJob(params.jobId);
        return NextResponse.json({ success: true, ...result });
      }
      case 'send_invoice': {
        const result = await sendLinkedInvoiceForJob(params.jobId);
        return NextResponse.json({ success: true, ...result });
      }
      case 'record_payment': {
        const amount = Number(body.amount);
        const paymentMethod = body.paymentMethod as InvoicePaymentMethod;
        if (!amount || amount <= 0) {
          return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
        }
        if (!VALID_METHODS.includes(paymentMethod)) {
          return NextResponse.json({ success: false, error: 'Invalid payment method' }, { status: 400 });
        }
        const result = await recordPaymentForJobInvoice(params.jobId, {
          amount,
          paymentMethod,
          notes: body.notes,
          transactionReference: body.transactionReference,
          sendEmails: body.sendEmails !== false,
        });
        return NextResponse.json({ success: true, ...result });
      }
      case 'generate_receipt': {
        const result = await generateReceiptForLatestPayment(
          params.jobId,
          body.sendEmail !== false
        );
        return NextResponse.json({ success: true, ...result });
      }
      case 'send_review': {
        const result = await sendReviewRequestForJob(params.jobId);
        return NextResponse.json({ success: true, ...result });
      }
      default:
        return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Billing action failed';
    console.error('[job billing]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

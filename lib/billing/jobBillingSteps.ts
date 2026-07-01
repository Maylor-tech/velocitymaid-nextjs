import { prisma } from '@/lib/prisma';
import { loadJobTeamMembers } from '@/lib/cleaners/internalCleanerService';
import {
  nextInvoiceNumber,
  decimalToNumber,
  computeBalanceDue,
  formatUsd,
} from '@/lib/invoices/invoiceUtils';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';
import { sendInvoiceSentEmail } from '@/lib/email/invoiceEmails';
import { recordInvoicePayment } from '@/lib/invoices/invoiceService';
import type { InvoicePaymentMethod } from '@prisma/client';
import { nextReportNumber } from './numbering';
import { serializeCompletionReport, type ReportPhoto } from './serializeCompletionReport';
import { serializeReceipt } from './serializeReceipt';
import {
  sendCompletionReportEmail,
  sendReceiptDocumentEmail,
  sendReviewRequestAfterPayment,
} from './billingEmails';
import { onInvoicePaymentRecorded, scheduleReviewRequestForJob } from './jobCompletionWorkflow';

function splitPhotos(
  photos: Array<{ url: string; caption: string | null }>
): { before: ReportPhoto[]; after: ReportPhoto[] } {
  const before: ReportPhoto[] = [];
  const after: ReportPhoto[] = [];
  for (const p of photos) {
    const cap = (p.caption || '').toLowerCase();
    if (cap.includes('before')) before.push({ url: p.url, caption: p.caption });
    else after.push({ url: p.url, caption: p.caption });
  }
  return { before, after };
}

function teamLabel(members: Awaited<ReturnType<typeof loadJobTeamMembers>>): string {
  if (members.length === 0) return 'VelocityMaid certified team';
  return members.map((m) => m.publicDisplayName || m.name || 'Team member').join(', ');
}

async function loadJobBillingContext(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      photos: { orderBy: { uploadedAt: 'asc' } },
      Customer: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
      Invoice: { include: { items: true, payments: { include: { Receipt: true } } } },
      CompletionReport: true,
    },
  });
  if (!job) throw new Error('Job not found');
  return job;
}

export type WorkflowStepState = 'pending' | 'ready' | 'done' | 'skipped';

export interface JobBillingWorkflowStatus {
  jobId: string;
  jobStatus: string;
  completedAt: string | null;
  steps: {
    completionReport: {
      state: WorkflowStepState;
      reportNumber: string | null;
      publicToken: string | null;
      status: string | null;
      sentAt: string | null;
      viewUrl: string | null;
      pdfUrl: string | null;
    };
    invoice: {
      state: WorkflowStepState;
      invoiceId: string | null;
      invoiceNumber: string | null;
      publicToken: string | null;
      status: string | null;
      totalFormatted: string | null;
      balanceDueFormatted: string | null;
      sentAt: string | null;
      viewUrl: string | null;
    };
    payment: {
      state: WorkflowStepState;
      amountPaidFormatted: string | null;
      balanceDueFormatted: string | null;
      paymentCount: number;
    };
    receipt: {
      state: WorkflowStepState;
      count: number;
      latestReceiptNumber: string | null;
      latestPublicToken: string | null;
      viewUrl: string | null;
    };
    reviewRequest: {
      state: WorkflowStepState;
      scheduledFor: string | null;
      sentAt: string | null;
    };
  };
}

const baseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://velocitymaid.com';

export async function getJobBillingWorkflowStatus(
  jobId: string
): Promise<JobBillingWorkflowStatus> {
  const job = await loadJobBillingContext(jobId);
  const review = await prisma.reviewRequest.findFirst({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
  });

  const report = job.CompletionReport;
  const invoice = job.Invoice;
  const receipts =
    invoice?.payments
      .filter((p) => p.Receipt)
      .map((p) => p.Receipt!)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) ?? [];
  const latestReceipt = receipts[0] ?? null;

  const isCompleted =
    job.status === 'COMPLETED' || job.completedAt != null;
  const hasPhotos = job.photos.length > 0;

  const invoiceBalance = invoice ? decimalToNumber(invoice.balanceDue) : null;
  const invoicePaid =
    invoice != null &&
    (invoice.status === 'PAID' ||
      invoice.paidAt != null ||
      (invoiceBalance != null && invoiceBalance <= 0));

  return {
    jobId: job.id,
    jobStatus: job.status,
    completedAt: job.completedAt?.toISOString() ?? null,
    steps: {
      completionReport: {
        state:
          report?.status === 'SENT' || hasPhotos || isCompleted
            ? 'done'
            : report
              ? 'ready'
              : 'pending',
        reportNumber: report?.reportNumber ?? null,
        publicToken: report?.publicToken ?? null,
        status: report?.status ?? null,
        sentAt: report?.sentAt?.toISOString() ?? null,
        viewUrl: report ? `${baseUrl()}/report/${report.publicToken}` : null,
        pdfUrl: report ? `${baseUrl()}/api/report/${report.publicToken}/pdf` : null,
      },
      invoice: {
        state: invoice ? 'done' : isCompleted ? 'ready' : 'pending',
        invoiceId: invoice?.id ?? null,
        invoiceNumber: invoice?.invoiceNumber ?? null,
        publicToken: invoice?.publicToken ?? null,
        status: invoice?.status ?? null,
        totalFormatted: invoice ? formatUsd(decimalToNumber(invoice.total)) : null,
        balanceDueFormatted: invoice
          ? formatUsd(decimalToNumber(invoice.balanceDue))
          : null,
        sentAt: invoice?.sentAt?.toISOString() ?? null,
        viewUrl: invoice ? `${baseUrl()}/invoice/${invoice.publicToken}` : null,
      },
      payment: {
        state: invoice
          ? invoicePaid
            ? 'done'
            : decimalToNumber(invoice.amountPaid) > 0
              ? 'ready'
              : 'pending'
          : 'pending',
        amountPaidFormatted: invoice
          ? formatUsd(decimalToNumber(invoice.amountPaid))
          : null,
        balanceDueFormatted: invoice
          ? formatUsd(decimalToNumber(invoice.balanceDue))
          : null,
        paymentCount: invoice?.payments.length ?? 0,
      },
      receipt: {
        state:
          receipts.some((r) => r.sentAt != null)
            ? 'done'
            : receipts.length > 0
              ? 'ready'
              : invoicePaid
                ? 'ready'
                : 'pending',
        count: receipts.length,
        latestReceiptNumber: latestReceipt?.receiptNumber ?? null,
        latestPublicToken: latestReceipt?.publicToken ?? null,
        viewUrl: latestReceipt
          ? `${baseUrl()}/receipt/${latestReceipt.publicToken}`
          : null,
      },
      reviewRequest: {
        state: review
          ? review.sentAt
            ? 'done'
            : 'ready'
          : invoicePaid
            ? 'ready'
            : 'pending',
        scheduledFor: review?.scheduledFor?.toISOString() ?? null,
        sentAt: review?.sentAt?.toISOString() ?? null,
      },
    },
  };
}

export async function generateCompletionReportForJob(
  jobId: string,
  options?: { sendEmail?: boolean; issuesFound?: string; supplyRequests?: string }
) {
  const job = await loadJobBillingContext(jobId);
  const completedAt = job.completedAt ?? new Date();
  const { before, after } = splitPhotos(job.photos);
  const team = await loadJobTeamMembers(job.id);
  const clientName =
    job.customerName ||
    [job.Customer?.firstName, job.Customer?.lastName].filter(Boolean).join(' ') ||
    'Client';

  const reportNumber =
    job.CompletionReport?.reportNumber ?? (await nextReportNumber());

  const report = await prisma.completionReport.upsert({
    where: { jobId },
    create: {
      jobId,
      reportNumber,
      propertyAddress: job.address || 'Property on file',
      serviceDate: completedAt,
      serviceType: job.serviceType || 'Professional cleaning',
      teamSummary: teamLabel(team),
      notes: job.internalNotes,
      issuesFound: options?.issuesFound?.trim() || null,
      supplyRequests: options?.supplyRequests?.trim() || null,
      beforePhotos: before,
      afterPhotos: after,
      status: 'GENERATED',
    },
    update: {
      propertyAddress: job.address || 'Property on file',
      serviceDate: completedAt,
      serviceType: job.serviceType || 'Professional cleaning',
      teamSummary: teamLabel(team),
      issuesFound: options?.issuesFound?.trim() || job.CompletionReport?.issuesFound,
      supplyRequests:
        options?.supplyRequests?.trim() || job.CompletionReport?.supplyRequests,
      beforePhotos: before,
      afterPhotos: after,
      updatedAt: new Date(),
    },
  });

  const serialized = serializeCompletionReport(report);
  let email: { sent: boolean; skippedReason?: string } | null = null;

  if (options?.sendEmail !== false && job.Customer?.email) {
    email = await sendCompletionReportEmail(
      serialized,
      job.Customer.email,
      clientName
    );
    if (email.sent) {
      await prisma.completionReport.update({
        where: { id: report.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    }
  }

  return { report: serialized, email };
}

export async function generateInvoiceFromJob(jobId: string) {
  const job = await loadJobBillingContext(jobId);
  if (job.Invoice) {
    return { invoice: serializeInvoice(job.Invoice), created: false };
  }

  const clientName =
    job.customerName ||
    [job.Customer?.firstName, job.Customer?.lastName].filter(Boolean).join(' ') ||
    'Client';
  const totalPrice = decimalToNumber(job.totalPrice ?? job.quotedTotal);
  const completedAt = job.completedAt ?? new Date();
  const dueDate = new Date(completedAt);
  dueDate.setDate(dueDate.getDate() + 7);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: await nextInvoiceNumber(),
      jobId: job.id,
      customerId: job.customerId,
      clientName,
      clientEmail: job.Customer?.email ?? null,
      clientPhone: job.Customer?.phone ?? null,
      propertyAddress: job.address || 'Property on file',
      serviceType: job.serviceType || 'Professional cleaning',
      jobDate: completedAt,
      dueDate,
      subtotal: totalPrice,
      tax: 0,
      discount: 0,
      total: totalPrice,
      amountPaid: 0,
      balanceDue: totalPrice,
      status: 'DRAFT',
      notes: `Generated from job ${job.id}`,
      items: {
        create: [
          {
            description: job.serviceType || 'Professional cleaning',
            quantity: 1,
            unitPrice: totalPrice,
            lineTotal: totalPrice,
            sortOrder: 0,
          },
        ],
      },
    },
    include: { items: true, payments: true },
  });

  return { invoice: serializeInvoice(invoice), created: true };
}

export async function sendLinkedInvoiceForJob(jobId: string) {
  const job = await loadJobBillingContext(jobId);
  if (!job.Invoice) throw new Error('No invoice linked to this job. Generate one first.');
  if (!job.Invoice.clientEmail) throw new Error('No client email on invoice');

  const serialized = serializeInvoice(job.Invoice, { forOutboundEmail: true });
  const email = await sendInvoiceSentEmail(serialized);
  if (email.sent) {
    await prisma.invoice.update({
      where: { id: job.Invoice.id },
      data: { sentAt: new Date(), status: job.Invoice.status === 'DRAFT' ? 'SENT' : job.Invoice.status },
    });
  }
  return { email, invoice: serialized };
}

export async function recordPaymentForJobInvoice(
  jobId: string,
  params: {
    amount: number;
    paymentMethod: InvoicePaymentMethod;
    notes?: string;
    transactionReference?: string;
    sendEmails?: boolean;
  }
) {
  const job = await loadJobBillingContext(jobId);
  if (!job.Invoice) throw new Error('No invoice linked to this job');

  const { payment, previousStatus, becamePaid } = await recordInvoicePayment({
    invoiceId: job.Invoice.id,
    amount: params.amount,
    paymentMethod: params.paymentMethod,
    notes: params.notes,
    transactionReference: params.transactionReference,
  });

  const receiptResult = await onInvoicePaymentRecorded({
    invoiceId: job.Invoice.id,
    paymentId: payment.id,
    amount: params.amount,
    sendEmails: params.sendEmails !== false,
  });

  const updated = await prisma.invoice.findUnique({
    where: { id: job.Invoice.id },
    include: { items: true, payments: true },
  });
  const serialized = serializeInvoice(updated!);

  if (becamePaid && params.sendEmails !== false) {
    const { notifyInvoicePaymentConfirmation } = await import(
      '@/lib/invoices/notifyPaymentConfirmation'
    );
    await notifyInvoicePaymentConfirmation(job.Invoice.id, previousStatus, params.amount);
  }

  return { payment, invoice: serialized, receipt: receiptResult?.receipt ?? null };
}

export async function generateReceiptForLatestPayment(jobId: string, sendEmail = true) {
  const job = await loadJobBillingContext(jobId);
  if (!job.Invoice?.payments.length) {
    throw new Error('No payments recorded on this job invoice');
  }
  const latest = job.Invoice.payments.sort(
    (a, b) => b.paymentDate.getTime() - a.paymentDate.getTime()
  )[0];

  const result = await onInvoicePaymentRecorded({
    invoiceId: job.Invoice.id,
    paymentId: latest.id,
    amount: decimalToNumber(latest.amount),
    sendEmails: sendEmail,
  });
  return result;
}

export async function sendReviewRequestForJob(jobId: string) {
  const job = await loadJobBillingContext(jobId);
  const email = job.Customer?.email ?? job.Invoice?.clientEmail;
  if (!email) throw new Error('No client email on file');

  const clientName =
    job.customerName ||
    [job.Customer?.firstName, job.Customer?.lastName].filter(Boolean).join(' ') ||
    'Client';

  await scheduleReviewRequestForJob(jobId, email);
  const emailResult = await sendReviewRequestAfterPayment({
    toEmail: email,
    clientName,
    propertyAddress: job.address || 'your property',
    jobId,
  });

  const review = await prisma.reviewRequest.findFirst({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
  });
  if (review && emailResult.sent) {
    await prisma.reviewRequest.update({
      where: { id: review.id },
      data: { sentAt: new Date() },
    });
  }

  return { email: emailResult };
}

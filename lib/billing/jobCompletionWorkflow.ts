import { prisma } from '@/lib/prisma';
import { loadJobTeamMembers } from '@/lib/cleaners/internalCleanerService';
import { nextInvoiceNumber, decimalToNumber, computeBalanceDue } from '@/lib/invoices/invoiceUtils';
import { serializeInvoice } from '@/lib/invoices/serializeInvoice';
import { nextReportNumber, nextReceiptNumber, ensureJobReference } from './numbering';
import { createAdminNotification, adminNotificationHelpers } from '@/lib/notifications/adminNotificationCenter';
import {
  serializeCompletionReport,
  type ReportPhoto,
} from './serializeCompletionReport';
import { serializeReceipt } from './serializeReceipt';
import {
  sendCompletionReportEmail,
  sendReceiptDocumentEmail,
  sendReviewRequestAfterPayment,
} from './billingEmails';
import { invoiceServiceDateFromJob } from '@/lib/dates/serviceDate';

const REVIEW_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

export interface JobCompletionWorkflowInput {
  jobId: string;
  completedAt: Date;
  completedBy: string;
  cleanDurationMins?: number | null;
  internalNotes?: string | null;
  issuesFound?: string | null;
  supplyRequests?: string | null;
  sendEmails?: boolean;
}

function splitPhotos(
  photos: Array<{ url: string; caption: string | null }>
): { before: ReportPhoto[]; after: ReportPhoto[] } {
  const before: ReportPhoto[] = [];
  const after: ReportPhoto[] = [];
  for (const p of photos) {
    const cap = (p.caption || '').toLowerCase();
    if (cap.includes('before')) {
      before.push({ url: p.url, caption: p.caption });
    } else if (cap.includes('after')) {
      after.push({ url: p.url, caption: p.caption });
    } else {
      after.push({ url: p.url, caption: p.caption });
    }
  }
  return { before, after };
}

function teamLabel(
  members: Awaited<ReturnType<typeof loadJobTeamMembers>>
): string {
  if (members.length === 0) return 'VelocityMaid certified team';
  return members
    .map((m) => m.publicDisplayName || m.name || 'Team member')
    .join(', ');
}

export async function runJobCompletionBillingWorkflow(
  input: JobCompletionWorkflowInput
) {
  const sendEmails = input.sendEmails !== false;

  const job = await prisma.job.findUnique({
    where: { id: input.jobId },
    include: {
      photos: { orderBy: { uploadedAt: 'asc' } },
      Customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      Invoice: { include: { items: true, payments: true } },
      CompletionReport: true,
    },
  });

  if (!job) throw new Error('Job not found');

  const clientName =
    job.customerName ||
    [job.Customer?.firstName, job.Customer?.lastName].filter(Boolean).join(' ') ||
    'Client';
  const clientEmail = job.Customer?.email ?? null;
  const propertyAddress = job.address || 'Property on file';
  const serviceType = job.serviceType || 'Professional cleaning';
  const { before, after } = splitPhotos(job.photos);
  const team = await loadJobTeamMembers(job.id);

  const notes = [
    input.internalNotes?.trim(),
    input.cleanDurationMins
      ? `Duration: ${input.cleanDurationMins} minutes`
      : null,
    `Completed by: ${input.completedBy}`,
  ]
    .filter(Boolean)
    .join('\n');

  const reportNumber =
    job.CompletionReport?.reportNumber ?? (await nextReportNumber());

  const report = await prisma.completionReport.upsert({
    where: { jobId: job.id },
    create: {
      jobId: job.id,
      reportNumber,
      propertyAddress,
      serviceDate: input.completedAt,
      serviceType,
      teamSummary: teamLabel(team),
      notes: notes || null,
      issuesFound: input.issuesFound?.trim() || null,
      supplyRequests: input.supplyRequests?.trim() || null,
      beforePhotos: before,
      afterPhotos: after,
      status: 'GENERATED',
    },
    update: {
      propertyAddress,
      serviceDate: input.completedAt,
      serviceType,
      teamSummary: teamLabel(team),
      notes: notes || null,
      issuesFound: input.issuesFound?.trim() || null,
      supplyRequests: input.supplyRequests?.trim() || null,
      beforePhotos: before,
      afterPhotos: after,
      updatedAt: new Date(),
    },
  });

  const serializedReport = serializeCompletionReport(report);

  let invoice = job.Invoice;
  if (!invoice) {
    const totalPrice = decimalToNumber(job.totalPrice ?? job.quotedTotal);
    const amountPaid = decimalToNumber(job.amountPaid);
    const balanceDue = computeBalanceDue(totalPrice, amountPaid);
    const jobReference = await ensureJobReference(job.id, job.jobReference);
    const invoiceNumber = await nextInvoiceNumber(jobReference);
    const dueDate = new Date(input.completedAt);
    dueDate.setDate(dueDate.getDate() + 7);

    invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        jobId: job.id,
        customerId: job.customerId,
        clientName,
        clientEmail,
        clientPhone: job.Customer?.phone ?? null,
        propertyAddress,
        serviceType,
        jobDate: invoiceServiceDateFromJob(job.preferredDate, input.completedAt),
        dueDate,
        subtotal: totalPrice,
        tax: 0,
        discount: 0,
        total: totalPrice,
        amountPaid,
        balanceDue,
        // Incident #001 (P4/P5): job completion NEVER auto-sends an invoice.
        // Create a DRAFT for ops review; a genuinely prepaid ($0 balance)
        // invoice may be PAID immediately (no collection email needed) since its
        // accounting is already settled. It is never created as SENT here.
        status: balanceDue <= 0 ? 'PAID' : 'DRAFT',
        sentAt: null,
        notes: `Generated from job ${job.id}`,
        items: {
          create: [
            {
              description: serviceType,
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
  }

  const serializedInvoice = serializeInvoice(invoice);
  const invoiceSendDeferred = invoice.status === 'DRAFT';
  const emailResults: Record<string, { sent: boolean; skippedReason?: string }> =
    {};

  if (sendEmails && clientEmail) {
    emailResults.completionReport = await sendCompletionReportEmail(
      serializedReport,
      clientEmail,
      clientName
    );
    if (emailResults.completionReport.sent) {
      await prisma.completionReport.update({
        where: { id: report.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    }

    // Incident #001 (P4/P5): do NOT auto-send the invoice here. A DRAFT invoice
    // is sent only via the explicit admin Send action, which enforces the
    // reimbursement-completeness gate and idempotent claim. Mark it deferred so
    // ops knows to review + send.
    if (invoiceSendDeferred) {
      emailResults.invoice = {
        sent: false,
        skippedReason: 'Invoice draft created — review reimbursements and send from Invoices.',
      };
    }
  }

  createAdminNotification({
    type: 'JOB_COMPLETED',
    severity: 'INFO',
    message: invoiceSendDeferred
      ? `Job ${job.jobReference || job.id} completed for ${clientName} — invoice draft created, add reimbursements and send from Invoices`
      : `Job ${job.jobReference || job.id} completed for ${clientName}`,
    jobId: job.id,
    actionUrl: adminNotificationHelpers.adminJobLink(job.id),
  }).catch(() => {});

  return {
    report: serializedReport,
    invoice: serializedInvoice,
    invoiceSendDeferred,
    emailResults,
  };
}

export async function scheduleReviewRequestForJob(
  jobId: string,
  clientEmail: string
): Promise<void> {
  try {
    const existing = await prisma.reviewRequest.findFirst({
      where: { jobId },
      select: { id: true },
    });
    if (existing) return;
    await prisma.reviewRequest.create({
      data: {
        jobId,
        clientEmail,
        scheduledFor: new Date(Date.now() + REVIEW_DELAY_MS),
      },
    });
  } catch (err) {
    console.error('[scheduleReviewRequestForJob]', err);
  }
}

export async function onInvoicePaymentRecorded(params: {
  invoiceId: string;
  paymentId: string;
  amount: number;
  sendEmails?: boolean;
}) {
  const sendEmails = params.sendEmails !== false;

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    include: { items: true, payments: true, Job: true },
  });
  if (!invoice) return null;

  const payment = invoice.payments.find((p) => p.id === params.paymentId);
  if (!payment) return null;

  const existingReceipt = await prisma.receipt.findUnique({
    where: { invoicePaymentId: payment.id },
  });
  if (existingReceipt) {
    return { receipt: serializeReceipt(existingReceipt), duplicate: true };
  }

  const receiptNumber = await nextReceiptNumber();
  const receipt = await prisma.receipt.create({
    data: {
      receiptNumber,
      invoiceId: invoice.id,
      jobId: invoice.jobId,
      invoicePaymentId: payment.id,
      customerId: invoice.customerId,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      amount: params.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      propertyAddress: invoice.propertyAddress,
      serviceType: invoice.serviceType,
      invoiceNumber: invoice.invoiceNumber,
      status: 'GENERATED',
    },
  });

  const serializedReceipt = serializeReceipt(receipt);
  const serializedInvoice = serializeInvoice(invoice);
  let emailResult: { sent: boolean; skippedReason?: string } | null = null;

  if (sendEmails) {
    emailResult = await sendReceiptDocumentEmail(serializedReceipt, serializedInvoice);
    if (emailResult.sent) {
      await prisma.receipt.update({
        where: { id: receipt.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
    }

    const balance = decimalToNumber(invoice.balanceDue);
    if (balance <= 0 && invoice.clientEmail && invoice.jobId) {
      await scheduleReviewRequestForJob(invoice.jobId, invoice.clientEmail);
      await sendReviewRequestAfterPayment({
        toEmail: invoice.clientEmail,
        clientName: invoice.clientName,
        propertyAddress: invoice.propertyAddress,
        jobId: invoice.jobId,
      });
    }
  }

  return { receipt: serializedReceipt, invoice: serializedInvoice, emailResult };
}

export async function getBillingDashboardKpis(branchId?: string | null) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const jobWhere = branchId ? { branchId } : {};
  const invoiceWhere = branchId
    ? { Job: { branchId } }
    : {};

  const [outstandingAgg, paymentsThisMonth, reportsPending, reviewsRequested] =
    await Promise.all([
      prisma.invoice.aggregate({
        where: {
          ...invoiceWhere,
          status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
          balanceDue: { gt: 0 },
        },
        _sum: { balanceDue: true },
        _count: true,
      }),
      prisma.invoicePayment.aggregate({
        where: {
          paymentDate: { gte: monthStart },
          ...(branchId
            ? { Invoice: { Job: { branchId } } }
            : {}),
        },
        _sum: { amount: true },
      }),
      prisma.job.count({
        where: {
          ...jobWhere,
          status: 'COMPLETED',
          CompletionReport: null,
        },
      }),
      prisma.reviewRequest.count({
        where: {
          sentAt: null,
          scheduledFor: { lte: now },
          ...(branchId
            ? {
                jobId: {
                  in: (
                    await prisma.job.findMany({
                      where: { branchId },
                      select: { id: true },
                    })
                  ).map((j) => j.id),
                },
              }
            : {}),
        },
      }),
    ]);

  return {
    outstandingInvoices: {
      count: outstandingAgg._count,
      total: decimalToNumber(outstandingAgg._sum.balanceDue),
    },
    paymentsThisMonth: decimalToNumber(paymentsThisMonth._sum.amount),
    completionReportsPending: reportsPending,
    reviewsRequested: reviewsRequested,
  };
}

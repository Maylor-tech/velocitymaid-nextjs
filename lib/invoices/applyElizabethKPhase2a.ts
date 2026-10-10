import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import {
  ELIZABETH_K_PHASE2,
  PHASE2A_APPLY_TOKEN,
} from '@/lib/billing/elizabethKPhase2';
import { decimalToNumber, roundMoney } from './invoiceUtils';
import { assertPhase2aApplyAuthorized } from './prepareDraftPriceCorrection';

export type Phase2aApplyResult = {
  ok: true;
  auditId: string;
  invoiceId: string;
  jobId: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  jobAddressNormalized: boolean;
};

function money(v: unknown): number | null {
  if (v == null) return null;
  return decimalToNumber(v);
}

function precondition(ok: boolean, message: string): void {
  if (!ok) throw new Error(`Phase 2A precondition failed: ${message}`);
}

/**
 * Apply the authorized DRAFT $250 correction for Elizabeth K / VM-2026-0053.
 * Does not credit the deposit, send mail, charge, or touch the payout.
 */
export async function applyElizabethKPhase2a(params: {
  dryRun: false;
  confirmToken: string;
  actorId?: string | null;
}): Promise<Phase2aApplyResult> {
  assertPhase2aApplyAuthorized(params);

  const invoice = await prisma.invoice.findUnique({
    where: { id: ELIZABETH_K_PHASE2.invoiceId },
    include: { items: { orderBy: { sortOrder: 'asc' } }, payments: true },
  });
  const job = await prisma.job.findUnique({
    where: { id: ELIZABETH_K_PHASE2.jobId },
    select: {
      id: true,
      customerId: true,
      address: true,
      quotedTotal: true,
      totalPrice: true,
      amountPaid: true,
      balanceDue: true,
      depositAmount: true,
      depositPaymentIntentId: true,
      paymentStatus: true,
      preferredDate: true,
      estimatedLaborHours: true,
      actualLaborHours: true,
      estimatedDurationMins: true,
      cleanDurationMins: true,
      startedAt: true,
      completedAt: true,
    },
  });
  const payout = await prisma.jobPayout.findUnique({
    where: { id: ELIZABETH_K_PHASE2.payoutId },
    select: {
      id: true,
      status: true,
      grossAmount: true,
      cleanerAmount: true,
      executedAt: true,
      paidAt: true,
    },
  });

  precondition(!!invoice, 'invoice not found');
  precondition(!!job, 'job not found');
  precondition(!!payout, 'payout not found');
  precondition(invoice!.status === 'DRAFT', `invoice status is ${invoice!.status}`);
  precondition(invoice!.invoiceNumber === ELIZABETH_K_PHASE2.invoiceNumber, 'invoice number mismatch');
  precondition(invoice!.jobId === ELIZABETH_K_PHASE2.jobId, 'invoice job mismatch');
  precondition(invoice!.customerId === ELIZABETH_K_PHASE2.customerId, 'invoice customer mismatch');
  precondition(job!.customerId === ELIZABETH_K_PHASE2.customerId, 'job customer mismatch');
  precondition(money(invoice!.total) === 400, `invoice total is ${money(invoice!.total)}`);
  precondition(money(invoice!.amountPaid) === 0, `invoice amountPaid is ${money(invoice!.amountPaid)}`);
  precondition(money(invoice!.balanceDue) === 400, `invoice balanceDue is ${money(invoice!.balanceDue)}`);
  precondition(invoice!.payments.length === 0, 'invoice already has payments');
  precondition(invoice!.sentAt == null, 'invoice is not DRAFT-only (sentAt set)');
  precondition(money(job!.quotedTotal) === 425, `quotedTotal is ${money(job!.quotedTotal)}`);
  precondition(money(job!.totalPrice) === 425, `totalPrice is ${money(job!.totalPrice)}`);
  precondition(money(job!.amountPaid) === 25, `job amountPaid is ${money(job!.amountPaid)}`);
  precondition(money(job!.depositAmount) === 25, `depositAmount is ${money(job!.depositAmount)}`);
  precondition(
    job!.depositPaymentIntentId === ELIZABETH_K_PHASE2.paymentIntentId,
    'deposit PI mismatch'
  );
  precondition(payout!.status === 'READY', `payout status is ${payout!.status}`);
  precondition(money(payout!.cleanerAmount) === 276.25, `payout cleanerAmount is ${money(payout!.cleanerAmount)}`);
  precondition(payout!.executedAt == null && payout!.paidAt == null, 'payout already settled');
  precondition(invoice!.items.length === 1, 'expected a single invoice line');

  const serviceDate = invoice!.jobDate ? new Date(invoice!.jobDate) : null;
  const jobServiceDate = job!.preferredDate ? new Date(job!.preferredDate) : null;
  precondition(
    !!serviceDate && serviceDate.toISOString().startsWith('2026-10-04'),
    'invoice jobDate is not operator-attested October 4, 2026'
  );
  precondition(
    !!jobServiceDate && jobServiceDate.toISOString().startsWith('2026-10-04'),
    'job preferredDate is not operator-attested October 4, 2026'
  );

  const before = {
    invoice: {
      id: invoice!.id,
      invoiceNumber: invoice!.invoiceNumber,
      status: invoice!.status,
      propertyAddress: invoice!.propertyAddress,
      serviceType: invoice!.serviceType,
      jobDate: invoice!.jobDate,
      subtotal: money(invoice!.subtotal),
      tax: money(invoice!.tax),
      discount: money(invoice!.discount),
      total: money(invoice!.total),
      amountPaid: money(invoice!.amountPaid),
      balanceDue: money(invoice!.balanceDue),
      notes: invoice!.notes,
      items: invoice!.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: money(item.quantity),
        unitPrice: money(item.unitPrice),
        lineTotal: money(item.lineTotal),
      })),
    },
    job: {
      id: job!.id,
      address: job!.address,
      quotedTotal: money(job!.quotedTotal),
      totalPrice: money(job!.totalPrice),
      amountPaid: money(job!.amountPaid),
      balanceDue: money(job!.balanceDue),
      depositAmount: money(job!.depositAmount),
      depositPaymentIntentId: job!.depositPaymentIntentId,
      preferredDate: job!.preferredDate,
      estimatedLaborHours: money(job!.estimatedLaborHours),
      actualLaborHours: money(job!.actualLaborHours),
      estimatedDurationMins: job!.estimatedDurationMins,
      cleanDurationMins: job!.cleanDurationMins,
      startedAt: job!.startedAt,
      completedAt: job!.completedAt,
    },
    payout: {
      id: payout!.id,
      status: payout!.status,
      grossAmount: money(payout!.grossAmount),
      cleanerAmount: money(payout!.cleanerAmount),
    },
    operatorAttested: {
      serviceDate: '2026-10-04',
      laborHours: 5,
      telemetry: {
        estimatedLaborHours: null,
        actualLaborHours: null,
        estimatedDurationMins: null,
        cleanDurationMins: null,
        startedAt: null,
        note: 'Five hours are operator-attested only. No independent time telemetry exists on this job.',
      },
    },
  };

  const auditId = await logAuditEntry({
    id: randomUUID(),
    actorId: params.actorId ?? null,
    actorRole: 'ADMIN',
    action: 'INVOICE_DRAFT_PRICE_CORRECTION_PREPARED',
    entityType: 'Invoice',
    entityId: invoice!.id,
    description:
      'Phase 2A before-image for VM-2026-0053: capture addresses, line items, $425 quote, $25 deposit PI, and operator-attested Oct 4 / 5 hours (no telemetry).',
    changes: before,
  });
  if (!auditId) {
    throw new Error('Phase 2A refused: durable audit record was not written');
  }

  const authorizedTotal = roundMoney(ELIZABETH_K_PHASE2.authorizedInvoiceTotal);
  const canonicalAddress = ELIZABETH_K_PHASE2.canonicalAddress;
  const existingItem = invoice!.items[0];
  const jobAddressNormalized = job!.address !== canonicalAddress;

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${invoice!.id} FOR UPDATE`;

    await tx.invoiceItem.update({
      where: { id: existingItem.id },
      data: {
        description: ELIZABETH_K_PHASE2.lineDescription,
        quantity: 1,
        unitPrice: authorizedTotal,
        lineTotal: authorizedTotal,
      },
    });

    await tx.invoice.update({
      where: { id: invoice!.id },
      data: {
        propertyAddress: canonicalAddress,
        serviceType: ELIZABETH_K_PHASE2.serviceType,
        jobDate: new Date(`${ELIZABETH_K_PHASE2.jobDate}T00:00:00.000Z`),
        subtotal: authorizedTotal,
        tax: 0,
        discount: 0,
        total: authorizedTotal,
        amountPaid: 0,
        balanceDue: authorizedTotal,
        status: 'DRAFT',
        sentAt: null,
        updatedAt: new Date(),
      },
    });

    if (jobAddressNormalized) {
      await tx.job.update({
        where: { id: job!.id },
        data: { address: canonicalAddress },
      });
    }
  });

  const updatedInvoice = await prisma.invoice.findUnique({
    where: { id: invoice!.id },
    include: { items: true, payments: true },
  });
  const updatedJob = await prisma.job.findUnique({
    where: { id: job!.id },
    select: {
      address: true,
      quotedTotal: true,
      totalPrice: true,
      amountPaid: true,
      balanceDue: true,
      depositPaymentIntentId: true,
    },
  });

  const after = {
    invoice: {
      status: updatedInvoice?.status,
      propertyAddress: updatedInvoice?.propertyAddress,
      serviceType: updatedInvoice?.serviceType,
      jobDate: updatedInvoice?.jobDate,
      total: money(updatedInvoice?.total),
      amountPaid: money(updatedInvoice?.amountPaid),
      balanceDue: money(updatedInvoice?.balanceDue),
      payments: updatedInvoice?.payments.length ?? 0,
      items: updatedInvoice?.items.map((item) => ({
        id: item.id,
        description: item.description,
        unitPrice: money(item.unitPrice),
        lineTotal: money(item.lineTotal),
      })),
    },
    job: {
      address: updatedJob?.address,
      quotedTotal: money(updatedJob?.quotedTotal),
      totalPrice: money(updatedJob?.totalPrice),
      amountPaid: money(updatedJob?.amountPaid),
      balanceDue: money(updatedJob?.balanceDue),
      depositPaymentIntentId: updatedJob?.depositPaymentIntentId,
    },
  };

  await logAuditEntry({
    actorId: params.actorId ?? null,
    actorRole: 'ADMIN',
    action: 'INVOICE_DRAFT_PRICE_CORRECTION_APPLIED',
    entityType: 'Invoice',
    entityId: invoice!.id,
    description: `Phase 2A applied to VM-2026-0053. DRAFT now $250/$0/$250. Quote $425 and deposit PI preserved. Before-audit ${auditId}.`,
    changes: { beforeAuditId: auditId, after },
  });

  return {
    ok: true,
    auditId,
    invoiceId: invoice!.id,
    jobId: job!.id,
    before,
    after,
    jobAddressNormalized,
  };
}

export const PHASE2A_CONFIRM_TOKEN = PHASE2A_APPLY_TOKEN;

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { computeBalanceDue, decimalToNumber, roundMoney } from './invoiceUtils';
import { DepositCreditError } from './depositCreditError';
import { retrieveAndAssertCapturedDepositPaymentIntent } from './assertCapturedDepositPaymentIntent';

export { DepositCreditError };

export type CreditJobDepositResult = {
  invoiceId: string;
  jobId: string;
  paymentId: string;
  paymentIntentId: string;
  duplicate: boolean;
  invoiceStatus: 'DRAFT';
  total: number;
  amountPaid: number;
  balanceDue: number;
  quotedTotalPreserved: number | null;
  emailed: false;
  charged: false;
};

const DEPOSIT_CREDIT_NOTE = 'DEPOSIT_CREDIT_NO_CHARGE';

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function assertPositiveMoney(amount: number, label: string): number {
  const rounded = roundMoney(amount);
  if (!Number.isFinite(rounded) || rounded <= 0) {
    throw new DepositCreditError('INVALID_AMOUNT', `${label} must be greater than zero`);
  }
  return rounded;
}

/**
 * Credit an already-captured job deposit Stripe PaymentIntent onto a DRAFT invoice.
 * Does not create a Stripe charge, send a receipt, or transition DRAFT → SENT.
 * Idempotent on (invoiceId, paymentIntentId).
 */
export async function creditJobDepositToInvoice(params: {
  invoiceId: string;
  confirmJobId: string;
  paymentIntentId: string;
  amount: number;
  actorId?: string | null;
}): Promise<CreditJobDepositResult> {
  const paymentIntentId = params.paymentIntentId.trim();
  if (!paymentIntentId.startsWith('pi_')) {
    throw new DepositCreditError('INVALID_PAYMENT_INTENT', 'paymentIntentId must be a Stripe PaymentIntent id');
  }
  const amount = assertPositiveMoney(params.amount, 'Credit amount');

  const invoiceForStripe = await prisma.invoice.findUnique({
    where: { id: params.invoiceId },
    select: { jobId: true, customerId: true },
  });
  if (!invoiceForStripe?.jobId) {
    throw new DepositCreditError(
      invoiceForStripe ? 'INVOICE_NOT_LINKED' : 'INVOICE_NOT_FOUND',
      invoiceForStripe ? 'Invoice is not linked to a job' : 'Invoice not found',
      invoiceForStripe ? 400 : 404
    );
  }
  if (invoiceForStripe.jobId !== params.confirmJobId) {
    throw new DepositCreditError('JOB_MISMATCH', 'confirmJobId does not match the invoice job');
  }

  const jobForStripe = await prisma.job.findUnique({
    where: { id: invoiceForStripe.jobId },
    select: {
      customerId: true,
      currency: true,
      depositPaymentIntentId: true,
    },
  });
  if (!jobForStripe) {
    throw new DepositCreditError('JOB_NOT_FOUND', 'Linked job not found', 404);
  }
  if (jobForStripe.depositPaymentIntentId !== paymentIntentId) {
    throw new DepositCreditError(
      jobForStripe.depositPaymentIntentId ? 'PAYMENT_INTENT_MISMATCH' : 'NO_JOB_DEPOSIT_PI',
      jobForStripe.depositPaymentIntentId
        ? 'paymentIntentId does not match the job deposit PaymentIntent'
        : 'Job has no deposit PaymentIntent to credit'
    );
  }
  if (
    invoiceForStripe.customerId &&
    jobForStripe.customerId &&
    invoiceForStripe.customerId !== jobForStripe.customerId
  ) {
    throw new DepositCreditError(
      'CUSTOMER_MISMATCH',
      'Invoice customer does not match the linked job customer'
    );
  }

  await retrieveAndAssertCapturedDepositPaymentIntent({
    paymentIntentId,
    amountDollars: amount,
    currency: jobForStripe.currency ?? 'usd',
    jobId: invoiceForStripe.jobId,
    customerId: invoiceForStripe.customerId ?? jobForStripe.customerId,
  });

  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${params.invoiceId} FOR UPDATE`;

    const invoice = await tx.invoice.findUnique({
      where: { id: params.invoiceId },
      include: { payments: true },
    });
    if (!invoice) {
      throw new DepositCreditError('INVOICE_NOT_FOUND', 'Invoice not found', 404);
    }
    if (!invoice.jobId) {
      throw new DepositCreditError('INVOICE_NOT_LINKED', 'Invoice is not linked to a job');
    }
    if (invoice.jobId !== params.confirmJobId) {
      throw new DepositCreditError('JOB_MISMATCH', 'confirmJobId does not match the invoice job');
    }

    const existingForPi = await tx.invoicePayment.findFirst({
      where: {
        OR: [{ transactionReference: paymentIntentId }, { stripeSessionId: paymentIntentId }],
      },
    });
    if (existingForPi && existingForPi.invoiceId !== invoice.id) {
      throw new DepositCreditError(
        'PI_CREDITED_ELSEWHERE',
        'This PaymentIntent is already credited on another invoice'
      );
    }

    const existingOnInvoice =
      existingForPi ??
      invoice.payments.find(
        (p) => p.transactionReference === paymentIntentId || p.stripeSessionId === paymentIntentId
      );

    if (existingOnInvoice) {
      const latest = await tx.invoice.findUnique({ where: { id: invoice.id } });
      const job = await tx.job.findUnique({
        where: { id: invoice.jobId },
        select: { quotedTotal: true },
      });
      return {
        duplicate: true as const,
        paymentId: existingOnInvoice.id,
        invoice: latest ?? invoice,
        jobQuotedTotal: job?.quotedTotal != null ? decimalToNumber(job.quotedTotal) : null,
      };
    }

    if (invoice.status !== 'DRAFT') {
      throw new DepositCreditError(
        'INVOICE_NOT_DRAFT',
        'Deposit credit is only allowed on a DRAFT invoice'
      );
    }

    const job = await tx.job.findUnique({
      where: { id: invoice.jobId },
      select: {
        id: true,
        quotedTotal: true,
        amountPaid: true,
        depositAmount: true,
        depositPaymentIntentId: true,
        paymentStatus: true,
      },
    });
    if (!job) {
      throw new DepositCreditError('JOB_NOT_FOUND', 'Linked job not found', 404);
    }
    if (job.depositPaymentIntentId && job.depositPaymentIntentId !== paymentIntentId) {
      throw new DepositCreditError(
        'PAYMENT_INTENT_MISMATCH',
        'paymentIntentId does not match the job deposit PaymentIntent'
      );
    }
    if (!job.depositPaymentIntentId) {
      throw new DepositCreditError(
        'NO_JOB_DEPOSIT_PI',
        'Job has no deposit PaymentIntent to credit'
      );
    }

    const jobDeposit = job.depositAmount != null ? decimalToNumber(job.depositAmount) : null;
    if (jobDeposit != null && !Number.isNaN(jobDeposit) && jobDeposit > 0 && jobDeposit !== amount) {
      throw new DepositCreditError(
        'AMOUNT_MISMATCH',
        `Credit amount must equal the job deposit ($${jobDeposit.toFixed(2)})`
      );
    }

    const jobPaid = decimalToNumber(job.amountPaid);
    if (jobPaid + 0.001 < amount) {
      throw new DepositCreditError(
        'DEPOSIT_NOT_ON_JOB',
        'Job amountPaid does not cover this deposit credit'
      );
    }

    const total = decimalToNumber(invoice.total);
    const alreadyPaid = decimalToNumber(invoice.amountPaid);
    const remaining = computeBalanceDue(total, alreadyPaid);
    if (amount > remaining) {
      throw new DepositCreditError(
        'CREDIT_EXCEEDS_BALANCE',
        'Deposit credit exceeds the invoice unpaid balance'
      );
    }

    let payment;
    try {
      payment = await tx.invoicePayment.create({
        data: {
          invoiceId: invoice.id,
          amount,
          paymentMethod: 'STRIPE',
          paymentDate: new Date(),
          transactionReference: paymentIntentId,
          notes: `${DEPOSIT_CREDIT_NOTE} ${paymentIntentId}`,
        },
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const raced = await tx.invoicePayment.findFirst({
        where: {
          invoiceId: invoice.id,
          transactionReference: paymentIntentId,
        },
      });
      if (!raced) throw error;
      const latest = await tx.invoice.findUnique({ where: { id: invoice.id } });
      return {
        duplicate: true as const,
        paymentId: raced.id,
        invoice: latest ?? invoice,
        jobQuotedTotal: job.quotedTotal != null ? decimalToNumber(job.quotedTotal) : null,
      };
    }

    const newPaid = roundMoney(alreadyPaid + amount);
    const balanceDue = computeBalanceDue(total, newPaid);

    const updated = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        amountPaid: newPaid,
        balanceDue,
        status: 'DRAFT',
        updatedAt: new Date(),
      },
    });

    // Money fields only. Never quotedTotal, deposit PI, or payout rows.
    await tx.job.update({
      where: { id: job.id },
      data: {
        amountPaid: newPaid,
        balanceDue,
        paymentStatus: balanceDue <= 0 ? 'PAID' : 'BALANCE_DUE',
      },
    });

    return {
      duplicate: false as const,
      paymentId: payment.id,
      invoice: updated,
      jobQuotedTotal: job.quotedTotal != null ? decimalToNumber(job.quotedTotal) : null,
    };
  });

  const total = decimalToNumber(result.invoice.total);
  const amountPaid = decimalToNumber(result.invoice.amountPaid);
  const balanceDue = decimalToNumber(result.invoice.balanceDue);

  await logAuditEntry({
    actorId: params.actorId ?? null,
    actorRole: 'ADMIN',
    action: result.duplicate ? 'INVOICE_DEPOSIT_CREDIT_IDEMPOTENT' : 'INVOICE_DEPOSIT_CREDIT',
    entityType: 'Invoice',
    entityId: params.invoiceId,
    description: result.duplicate
      ? `Deposit PI ${paymentIntentId} already credited on invoice ${params.invoiceId}`
      : `Credited existing deposit PI ${paymentIntentId} ($${amount.toFixed(2)}) onto DRAFT invoice without a new charge`,
    changes: {
      jobId: params.confirmJobId,
      paymentIntentId,
      amount,
      duplicate: result.duplicate,
      invoiceStatus: 'DRAFT',
      total,
      amountPaid,
      balanceDue,
      quotedTotalPreserved: result.jobQuotedTotal,
      emailed: false,
      charged: false,
    },
  });

  return {
    invoiceId: params.invoiceId,
    jobId: params.confirmJobId,
    paymentId: result.paymentId,
    paymentIntentId,
    duplicate: result.duplicate,
    invoiceStatus: 'DRAFT',
    total,
    amountPaid,
    balanceDue,
    quotedTotalPreserved: result.jobQuotedTotal,
    emailed: false,
    charged: false,
  };
}

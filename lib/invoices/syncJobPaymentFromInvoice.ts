import { PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { decimalToNumber } from './invoiceUtils';

export type SyncJobPaymentResult = {
  jobId: string;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: PaymentStatus;
  changed: boolean;
};

/**
 * Mirror a linked Invoice's payment totals onto Job money fields.
 * Does not touch Job.status / service lifecycle.
 * Idempotent: repeated calls with the same invoice totals are no-ops.
 */
export async function syncJobPaymentFromInvoice(
  invoiceId: string
): Promise<SyncJobPaymentResult | null> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: {
      id: true,
      jobId: true,
      amountPaid: true,
      balanceDue: true,
      status: true,
    },
  });
  if (!invoice?.jobId) return null;

  const amountPaid = decimalToNumber(invoice.amountPaid);
  const balanceDue = decimalToNumber(invoice.balanceDue);

  const job = await prisma.job.findUnique({
    where: { id: invoice.jobId },
    select: {
      id: true,
      paymentStatus: true,
      amountPaid: true,
      balanceDue: true,
      paidAt: true,
      paymentMethod: true,
    },
  });
  if (!job) return null;
  if (job.paymentStatus === PaymentStatus.REFUNDED) {
    return {
      jobId: job.id,
      amountPaid: decimalToNumber(job.amountPaid),
      balanceDue: decimalToNumber(job.balanceDue),
      paymentStatus: job.paymentStatus,
      changed: false,
    };
  }

  let nextPaymentStatus = job.paymentStatus;
  if (balanceDue <= 0) {
    nextPaymentStatus = PaymentStatus.PAID;
  } else if (amountPaid > 0) {
    if (
      job.paymentStatus === PaymentStatus.PENDING ||
      job.paymentStatus === PaymentStatus.BALANCE_DUE
    ) {
      nextPaymentStatus = PaymentStatus.BALANCE_DUE;
    }
  }

  const currentPaid = decimalToNumber(job.amountPaid);
  const currentDue = decimalToNumber(job.balanceDue);
  const alreadySynced =
    currentPaid === amountPaid &&
    currentDue === balanceDue &&
    job.paymentStatus === nextPaymentStatus;

  if (alreadySynced) {
    return {
      jobId: job.id,
      amountPaid,
      balanceDue,
      paymentStatus: nextPaymentStatus,
      changed: false,
    };
  }

  const becamePaid =
    nextPaymentStatus === PaymentStatus.PAID &&
    job.paymentStatus !== PaymentStatus.PAID;

  await prisma.job.update({
    where: { id: job.id },
    data: {
      amountPaid,
      balanceDue,
      paymentStatus: nextPaymentStatus,
      ...(becamePaid
        ? {
            paidAt: job.paidAt ?? new Date(),
            paymentMethod: job.paymentMethod ?? 'Stripe',
          }
        : {}),
    },
  });

  return {
    jobId: job.id,
    amountPaid,
    balanceDue,
    paymentStatus: nextPaymentStatus,
    changed: true,
  };
}

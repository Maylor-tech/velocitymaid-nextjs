import { prisma } from '@/lib/prisma';

/**
 * Shared VM-YYYY-#### sequence for both Job.jobReference and
 * Invoice.invoiceNumber — a job's reference and its eventual invoice number
 * are meant to be the SAME value (minted once, at job creation), so both
 * tables must be checked together to avoid ever generating a duplicate.
 * Only called when a job has no reference yet (new job) or an invoice has
 * no linked job (standalone invoice).
 */
export async function nextVmReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VM-${year}-`;

  const [latestJob, latestInvoice] = await Promise.all([
    prisma.job.findFirst({
      where: { jobReference: { startsWith: prefix } },
      orderBy: { jobReference: 'desc' },
      select: { jobReference: true },
    }),
    prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    }),
  ]);

  const seqOf = (value: string | null | undefined): number => {
    if (!value) return 0;
    const parsed = parseInt(value.slice(prefix.length), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const seq = Math.max(seqOf(latestJob?.jobReference), seqOf(latestInvoice?.invoiceNumber)) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

/**
 * Returns a job's jobReference, minting and persisting one if it doesn't
 * have one yet (jobs created before this field existed). Idempotent — safe
 * to call repeatedly for the same job.
 */
export async function ensureJobReference(jobId: string, currentReference: string | null): Promise<string> {
  if (currentReference) return currentReference;

  const reference = await nextVmReference();
  const updated = await prisma.job.update({
    where: { id: jobId },
    data: { jobReference: reference },
    select: { jobReference: true },
  });
  return updated.jobReference!;
}

export async function nextReportNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CR-${year}-`;
  const latest = await prisma.completionReport.findFirst({
    where: { reportNumber: { startsWith: prefix } },
    orderBy: { reportNumber: 'desc' },
    select: { reportNumber: true },
  });
  let seq = 1;
  if (latest?.reportNumber) {
    const parsed = parseInt(latest.reportNumber.slice(prefix.length), 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export async function nextReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RC-${year}-`;
  const latest = await prisma.receipt.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  });
  let seq = 1;
  if (latest?.receiptNumber) {
    const parsed = parseInt(latest.receiptNumber.slice(prefix.length), 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

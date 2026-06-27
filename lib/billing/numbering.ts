import { prisma } from '@/lib/prisma';

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

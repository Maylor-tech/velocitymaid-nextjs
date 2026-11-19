import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { resolvePropertyPhotoSlots } from '@/lib/photos/propertyPhotoSlots';
import {
  buildHostPhotoReport,
  type HostPhotoReport,
} from '@/lib/reports/hostPhotoReport';
import { readHostPaymentConfig } from '@/lib/reports/hostPaymentOptions';

const TOKEN_RE = /^[A-Za-z0-9_-]{20,128}$/;

export function isReportToken(token: string): boolean {
  return TOKEN_RE.test(token);
}

function money(value: { toNumber: () => number } | number | null | undefined): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

export const loadHostPhotoReport = cache(async function loadHostPhotoReport(
  token: string
): Promise<HostPhotoReport | null> {
  if (!isReportToken(token)) return null;

  const report = await prisma.completionReport.findUnique({
    where: { publicToken: token },
    select: {
      serviceDate: true,
      Job: {
        select: {
          preferredDate: true,
          submittedForQcAt: true,
          completedAt: true,
          User: { select: { name: true } },
          Property: {
            select: {
              name: true,
              bedrooms: true,
              bathrooms: true,
              PhotoSlots: {
                select: {
                  key: true,
                  label: true,
                  room: true,
                  sortOrder: true,
                  required: true,
                },
              },
            },
          },
          photos: {
            select: {
              id: true,
              url: true,
              category: true,
              slotKey: true,
              customerVisible: true,
              caption: true,
            },
          },
          JobFlag: {
            select: {
              id: true,
              kind: true,
              note: true,
              photoId: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          Invoice: {
            select: {
              invoiceNumber: true,
              total: true,
              balanceDue: true,
              publicToken: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!report) return null;
  const job = report.Job;
  const property = job.Property;
  const slots = resolvePropertyPhotoSlots(
    property?.PhotoSlots ?? [],
    property?.bedrooms,
    property?.bathrooms
  );

  return buildHostPhotoReport({
    propertyName: property?.name,
    serviceDate: job.preferredDate ?? report.serviceDate,
    finishedAt: job.submittedForQcAt ?? job.completedAt,
    cleanerName: job.User?.name,
    slots,
    photos: job.photos,
    flags: job.JobFlag,
    invoice: job.Invoice
      ? {
          invoiceNumber: job.Invoice.invoiceNumber,
          total: money(job.Invoice.total),
          balanceDue: money(job.Invoice.balanceDue),
          publicToken: job.Invoice.publicToken,
          status: job.Invoice.status,
        }
      : null,
    paymentConfig: readHostPaymentConfig(),
  });
});

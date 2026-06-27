import type { CompletionReport } from '@prisma/client';
import { formatInvoiceDate } from '@/lib/invoices/invoiceUtils';
import { brandedDocumentShell, documentHeader, escapeHtml } from './documentHtml';

export type ReportPhoto = { url: string; caption?: string | null };

export function serializeCompletionReport(report: CompletionReport) {
  const beforePhotos = (report.beforePhotos as ReportPhoto[] | null) ?? [];
  const afterPhotos = (report.afterPhotos as ReportPhoto[] | null) ?? [];

  return {
    id: report.id,
    jobId: report.jobId,
    reportNumber: report.reportNumber,
    publicToken: report.publicToken,
    propertyAddress: report.propertyAddress,
    serviceDate: report.serviceDate.toISOString(),
    serviceDateFormatted: formatInvoiceDate(report.serviceDate),
    serviceType: report.serviceType,
    teamSummary: report.teamSummary,
    notes: report.notes,
    issuesFound: report.issuesFound,
    supplyRequests: report.supplyRequests,
    beforePhotos,
    afterPhotos,
    status: report.status,
    sentAt: report.sentAt?.toISOString() ?? null,
    createdAt: report.createdAt.toISOString(),
  };
}

export type SerializedCompletionReport = ReturnType<typeof serializeCompletionReport>;

export function renderCompletionReportHtml(report: SerializedCompletionReport): string {
  const photoGrid = (photos: ReportPhoto[], label: string) => {
    if (photos.length === 0) return '';
    const items = photos
      .map(
        (p) =>
          `<div class="photo"><img src="${escapeHtml(p.url)}" alt=""/><p>${escapeHtml(p.caption || label)}</p></div>`
      )
      .join('');
    return `<div class="section"><h3>${escapeHtml(label)}</h3><div class="photos">${items}</div></div>`;
  };

  const optionalSection = (title: string, text: string | null | undefined) =>
    text?.trim()
      ? `<div class="section"><h3>${escapeHtml(title)}</h3><p class="value">${escapeHtml(text.trim())}</p></div>`
      : '';

  const body = `${documentHeader('Completion Report', report.reportNumber)}
<div class="content">
  <div class="grid">
    <div>
      <p class="label">Property</p>
      <p class="value">${escapeHtml(report.propertyAddress)}</p>
    </div>
    <div>
      <p class="label">Service date</p>
      <p class="value">${escapeHtml(report.serviceDateFormatted)}</p>
    </div>
    <div>
      <p class="label">Service type</p>
      <p class="value">${escapeHtml(report.serviceType || 'Professional cleaning')}</p>
    </div>
    <div>
      <p class="label">Assigned team</p>
      <p class="value">${escapeHtml(report.teamSummary || 'VelocityMaid certified team')}</p>
    </div>
  </div>
  ${optionalSection('Service notes', report.notes)}
  ${optionalSection('Issues found', report.issuesFound)}
  ${optionalSection('Supply requests', report.supplyRequests)}
  ${photoGrid(report.beforePhotos, 'Before')}
  ${photoGrid(report.afterPhotos, 'After')}
</div>
<div class="footer">VelocityMaid · Professional hospitality-grade cleaning · velocitymaid.com</div>`;

  return brandedDocumentShell(`Completion Report ${report.reportNumber}`, body);
}

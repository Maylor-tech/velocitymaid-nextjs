import { describe, expect, it } from 'vitest';
import {
  describeReportInvoice,
  formatDeskSentAt,
  isReportInvoiceListed,
  monthlyReportInvoiceFields,
  orderCompletedReportInvoiceJobs,
  type ReportInvoiceJob,
} from '../jobsMonthlyWorkspace';

const reportAt = '2026-11-18T15:00:00.000Z';
const invoiceAt = '2026-11-18T16:30:00.000Z';
const invoiceEarlier = '2026-11-18T14:00:00.000Z';

function job(
  partial: Partial<ReportInvoiceJob> & Pick<ReportInvoiceJob, 'id'>
): ReportInvoiceJob {
  return {
    status: 'COMPLETED',
    preferredDate: '2026-11-18T00:00:00.000Z',
    completionReport: null,
    invoice: null,
    ...partial,
  };
}

describe('report and invoice send times', () => {
  it('formats an Eastern clock time and leaves null blank', () => {
    expect(formatDeskSentAt(reportAt)).toBe('Nov 18, 10:00 AM');
    expect(formatDeskSentAt(null)).toBeNull();
    expect(formatDeskSentAt('not-a-time')).toBeNull();
  });

  it('keeps null send times as not sent and does not invent a clock time', () => {
    const described = describeReportInvoice(
      job({
        id: 'none',
        completionReport: { status: 'SENT', sentAt: null },
        invoice: { status: 'SENT', sentAt: null },
      })
    );
    expect(described.reportLabel).toBe('Report not sent');
    expect(described.invoiceLabel).toBe('Invoice not sent');
    expect(described.reportLabel).not.toMatch(/\d:\d{2}/);
    expect(described.invoiceLabel).not.toMatch(/\d:\d{2}/);
    expect(described.warn).toBe(false);
  });

  it('shows both times when the report went out before the invoice', () => {
    const described = describeReportInvoice(
      job({
        id: 'ok',
        completionReport: { status: 'SENT', sentAt: reportAt },
        invoice: { status: 'SENT', sentAt: invoiceAt },
      })
    );
    expect(described.reportLabel).toBe('Report sent Nov 18, 10:00 AM');
    expect(described.invoiceLabel).toBe('Invoice sent Nov 18, 11:30 AM');
    expect(described.warn).toBe(false);
  });

  it('warns when the invoice has a time and the report does not', () => {
    const described = describeReportInvoice(
      job({
        id: 'invoice-only',
        completionReport: null,
        invoice: { status: 'SENT', sentAt: invoiceAt },
      })
    );
    expect(described.reportLabel).toBe('Report not sent');
    expect(described.invoiceLabel).toBe('Invoice sent Nov 18, 11:30 AM');
    expect(described.warn).toBe(true);
  });

  it('warns when the report time is later than the invoice time', () => {
    const described = describeReportInvoice(
      job({
        id: 'late-report',
        completionReport: { status: 'SENT', sentAt: reportAt },
        invoice: { status: 'SENT', sentAt: invoiceEarlier },
      })
    );
    expect(described.warn).toBe(true);
  });

  it('does not warn when the two times are equal', () => {
    const described = describeReportInvoice(
      job({
        id: 'same',
        completionReport: { status: 'SENT', sentAt: reportAt },
        invoice: { status: 'SENT', sentAt: reportAt },
      })
    );
    expect(described.warn).toBe(false);
  });

  it('orders warnings, then unsent reports, then report-before-invoice', () => {
    const asOf = new Date('2026-11-18T16:00:00.000Z');
    const ordered = orderCompletedReportInvoiceJobs(
      [
        job({
          id: 'healthy',
          preferredDate: '2026-11-01T00:00:00.000Z',
          completionReport: { status: 'SENT', sentAt: reportAt },
          invoice: { status: 'SENT', sentAt: invoiceAt },
        }),
        job({
          id: 'future-unsent',
          preferredDate: '2026-11-21T00:00:00.000Z',
          completionReport: null,
          invoice: null,
        }),
        job({
          id: 'unsent-today',
          preferredDate: '2026-11-18T00:00:00.000Z',
          completionReport: null,
          invoice: null,
        }),
        job({
          id: 'unsent-earlier',
          preferredDate: '2026-11-02T00:00:00.000Z',
          completionReport: { status: 'GENERATED', sentAt: null },
          invoice: null,
        }),
        job({ id: 'open', status: 'CONFIRMED', preferredDate: '2026-11-10T00:00:00.000Z' }),
        job({ id: 'unscheduled', preferredDate: null }),
        job({
          id: 'warn-b',
          preferredDate: '2026-11-09T00:00:00.000Z',
          completionReport: { status: 'SENT', sentAt: reportAt },
          invoice: { status: 'SENT', sentAt: invoiceEarlier },
        }),
        job({
          id: 'warn-a',
          preferredDate: '2026-11-03T00:00:00.000Z',
          completionReport: null,
          invoice: { status: 'SENT', sentAt: invoiceAt },
        }),
      ],
      asOf
    );

    expect(ordered.map((row) => row.id)).toEqual([
      'warn-a',
      'warn-b',
      'unsent-earlier',
      'unsent-today',
      'healthy',
    ]);
    expect(isReportInvoiceListed(job({ id: 'future-unsent', preferredDate: '2026-11-21T00:00:00.000Z' }), asOf)).toBe(
      false
    );
    expect(isReportInvoiceListed(job({ id: 'today', preferredDate: '2026-11-18T00:00:00.000Z' }), asOf)).toBe(
      true
    );
  });

  it('serializes report and invoice timestamps without filling a missing one', () => {
    expect(
      monthlyReportInvoiceFields({
        CompletionReport: {
          status: 'SENT',
          sentAt: new Date(reportAt),
        },
        Invoice: { status: 'DRAFT', sentAt: null },
      })
    ).toEqual({
      completionReport: { status: 'SENT', sentAt: reportAt },
      invoice: { status: 'DRAFT', sentAt: null },
    });

    expect(
      monthlyReportInvoiceFields({
        CompletionReport: null,
        Invoice: null,
      })
    ).toEqual({ completionReport: null, invoice: null });
  });
});

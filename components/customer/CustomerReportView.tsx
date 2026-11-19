'use client';

import Link from 'next/link';
import { brandAssets } from '@/lib/brand/assets';
import type { SerializedCompletionReport } from '@/lib/billing/serializeCompletionReport';

const NAV = [
  { href: '/customer/jobs', label: 'Overview' },
  { href: '/customer/jobs?action=request', label: 'Request' },
  { href: '/customer/properties', label: 'Properties' },
  { href: '/customer/reports', label: 'Reports' },
] as const;

export function isQcApproved(
  reviewStatus: SerializedCompletionReport['reviewStatus']
): boolean {
  return reviewStatus === 'APPROVED';
}

export function CustomerReportView({
  report,
  title,
  activeNav = 'Reports',
  sampleNote = false,
  pdfHref,
}: {
  report: SerializedCompletionReport;
  /** Prefer property name · date when available. */
  title: string;
  activeNav?: (typeof NAV)[number]['label'];
  /** Dev fixtures only — never set on real /report routes. */
  sampleNote?: boolean;
  pdfHref?: string | null;
}) {
  const qcApproved = isQcApproved(report.reviewStatus);
  const photos = [...report.beforePhotos, ...report.afterPhotos].filter(
    (p) => Boolean(p.url)
  );
  const beforeCount = report.beforePhotos.filter((p) => p.url).length;
  const afterCount = report.afterPhotos.filter((p) => p.url).length;
  const hasInvoice = Boolean(report.invoicePublicToken);

  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col bg-vm-canvas font-body text-sm text-vm-text sm:max-w-lg">
      <header className="flex items-center justify-between border-b border-vm-line bg-white px-4 py-[18px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brandAssets.compactLight}
          alt="VelocityMaid"
          width={150}
          height={38}
          className="h-auto w-[150px] object-contain object-left"
        />
        <span className="font-body text-[13px] text-vm-muted">My account</span>
      </header>

      <main className="flex flex-1 flex-col gap-3.5 px-4 py-5">
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-wide text-vm-cyan-dark">
            Completion report
          </p>
          <h1 className="mt-0.5 font-heading text-[26px] font-bold leading-[1.2] tracking-tight text-vm-navy">
            {title}
          </h1>
        </div>

        {!qcApproved ? (
          <p className="font-body text-sm leading-relaxed text-vm-text">
            Your report is being checked. We&apos;ll send it as soon as it&apos;s
            ready.
          </p>
        ) : (
          <>
            <section className="flex flex-col gap-2.5 rounded-[14px] border border-vm-line bg-white p-[18px]">
              <div className="flex items-center justify-between gap-2">
                <strong className="font-body text-sm text-vm-navy">
                  Quality check
                </strong>
                <span className="rounded-full border border-vm-line bg-white px-2.5 py-1 font-body text-[11px] font-bold text-vm-success">
                  QC approved
                </span>
              </div>
              {photos.length > 0 ? (
                <div className="flex justify-between gap-2">
                  <span className="text-vm-muted">Photos</span>
                  <span>
                    {beforeCount} before · {afterCount} after
                  </span>
                </div>
              ) : null}
              {report.serviceType ? (
                <div className="flex justify-between gap-2">
                  <span className="text-vm-muted">Service</span>
                  <span>{report.serviceType}</span>
                </div>
              ) : null}
              {report.teamSummary ? (
                <div className="flex justify-between gap-2">
                  <span className="text-vm-muted">Team</span>
                  <span>{report.teamSummary}</span>
                </div>
              ) : null}
            </section>

            {photos.length > 0 ? (
              <div
                className="grid grid-cols-3 gap-1.5"
                aria-label="Photo evidence"
              >
                {photos.slice(0, 9).map((p, i) => (
                  <div
                    key={`${p.url}-${i}`}
                    className="aspect-square overflow-hidden rounded-lg bg-vm-line"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={p.slotLabel || p.caption || 'Job photo'}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <section className="flex items-center justify-between gap-3 rounded-[14px] border border-vm-line bg-white p-[18px]">
              <div className="min-w-0">
                <strong className="font-body text-sm text-vm-navy">Invoice</strong>
                <p className="font-body text-xs text-vm-muted">
                  {hasInvoice
                    ? 'Ready to view'
                    : "Your invoice will appear here once it's issued"}
                </p>
              </div>
              {hasInvoice ? (
                <Link
                  href={`/invoice/${report.invoicePublicToken}`}
                  className="inline-flex min-h-11 shrink-0 items-center rounded-[10px] bg-vm-navy px-4 font-body text-sm font-bold text-white no-underline outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan"
                >
                  View
                </Link>
              ) : null}
            </section>

            {pdfHref ? (
              <a
                href={pdfHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center font-body text-sm font-semibold text-vm-cyan-dark outline-none hover:underline focus-visible:ring-2 focus-visible:ring-vm-cyan"
              >
                Download PDF
              </a>
            ) : null}
          </>
        )}

        {sampleNote ? (
          <p className="m-0 font-body text-xs text-vm-muted">
            Sample report. Not a live customer report.
          </p>
        ) : null}
      </main>

      <nav
        className="flex justify-around border-t border-vm-line bg-white px-1 pb-3.5 pt-2"
        aria-label="Customer"
      >
        {NAV.map((item) => {
          const active = item.label === activeNav;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex min-h-11 min-w-[60px] items-center justify-center px-1 font-body text-[11px] no-underline ${
                active
                  ? 'font-extrabold text-vm-cyan-dark'
                  : 'font-medium text-vm-muted'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default CustomerReportView;

'use client';

import { useEffect, useState } from 'react';
import { brandAssets } from '@/lib/brand/assets';
import type { HostPhotoReport, HostReportPhoto } from '@/lib/reports/hostPhotoReport';

const FOCUS =
  'outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan';

function PhotoFrame({
  photo,
  onOpen,
}: {
  photo: HostReportPhoto;
  onOpen: (photo: HostReportPhoto) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(photo)}
      className={`block w-full overflow-hidden rounded-[10px] bg-vm-line ${FOCUS}`}
      aria-label={`Enlarge ${photo.alt}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt={photo.alt} className="aspect-[4/3] w-full object-cover" />
    </button>
  );
}

function CardPay({ invoiceToken }: { invoiceToken: string }) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function start() {
    setPending(true);
    setError('');
    try {
      const res = await fetch(`/api/invoice/${invoiceToken}/checkout`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
        return;
      }
      setError('Card checkout is unavailable right now.');
    } catch {
      setError('Card checkout is unavailable right now.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void start()}
        disabled={pending}
        className={`inline-flex min-h-11 w-full items-center justify-center rounded-[10px] bg-vm-navy px-4 font-body text-sm font-semibold text-white disabled:opacity-60 ${FOCUS}`}
      >
        {pending ? 'Opening secure link…' : 'Card (by secure link)'}
      </button>
      {error ? (
        <p className="mt-2 font-body text-sm text-vm-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function HostPhotoReport({ report }: { report: HostPhotoReport }) {
  const [open, setOpen] = useState<HostReportPhoto | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="min-h-screen bg-vm-canvas font-body text-sm text-vm-text">
      <article className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
        <header className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brandAssets.compactLight}
            alt="VelocityMaid"
            width={168}
            height={42}
            className="h-auto w-[168px] max-w-full object-contain object-left"
          />
          <h1 className="mt-4 font-heading text-[26px] font-bold leading-[1.2] tracking-tight text-vm-navy">
            {report.propertyName}
          </h1>
          <p className="mt-1 font-body text-base text-vm-text">{report.serviceDateLabel}</p>
          <p className="mt-1 font-body text-base font-semibold text-vm-navy">
            {report.finishedLabel}
          </p>
          {report.cleanerFirstName ? (
            <p className="mt-1 font-body text-sm text-vm-text">
              Cleaned by {report.cleanerFirstName}
            </p>
          ) : null}
        </header>

        <section className="mb-6" aria-labelledby="rooms-heading">
          <h2
            id="rooms-heading"
            className="mb-3 font-heading text-xl font-bold tracking-tight text-vm-navy"
          >
            Room by room
          </h2>
          <div className="flex flex-col gap-3">
            {report.before.length > 0 ? (
              <div className="rounded-[14px] border border-vm-line bg-white p-4">
                <h3 className="font-heading text-lg font-bold tracking-tight text-vm-navy">
                  Before
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {report.before.map((photo) => (
                    <PhotoFrame key={photo.url} photo={photo} onOpen={setOpen} />
                  ))}
                </div>
              </div>
            ) : null}
            {report.rooms.map((room) => (
              <div
                key={room.key}
                className="rounded-[14px] border border-vm-line bg-white p-4"
              >
                <h3 className="font-heading text-lg font-bold tracking-tight text-vm-navy">
                  {room.label}
                </h3>
                {room.after.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {room.after.map((photo) => (
                      <PhotoFrame key={photo.url} photo={photo} onOpen={setOpen} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 font-body text-sm text-vm-text">
                    After photo not in this report.
                  </p>
                )}
                {room.before.length > 0 ? (
                  <div className="mt-3">
                    <p className="mb-2 font-body text-sm font-semibold text-vm-navy">Before</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {room.before.map((photo) => (
                        <PhotoFrame key={photo.url} photo={photo} onOpen={setOpen} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6" aria-labelledby="noticed-heading">
          <h2
            id="noticed-heading"
            className="mb-3 font-heading text-xl font-bold tracking-tight text-vm-navy"
          >
            Noticed during the clean
          </h2>
          {report.notices.length === 0 ? (
            <p className="rounded-[14px] border border-vm-line bg-white p-4 font-body text-sm text-vm-text">
              Nothing to report.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {report.notices.map((notice) => (
                <li
                  key={notice.id}
                  className="rounded-[14px] border border-vm-line bg-white p-4"
                >
                  <p className="font-body text-base text-vm-text">{notice.note}</p>
                  {notice.photo ? (
                    <div className="mt-3 max-w-sm">
                      <PhotoFrame photo={notice.photo} onOpen={setOpen} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-6" aria-labelledby="supplies-heading">
          <h2
            id="supplies-heading"
            className="mb-3 font-heading text-xl font-bold tracking-tight text-vm-navy"
          >
            Supplies running low
          </h2>
          {report.supplies.length === 0 ? (
            <p className="rounded-[14px] border border-vm-line bg-white p-4 font-body text-sm text-vm-text">
              No supplies running low.
            </p>
          ) : (
            <ul className="rounded-[14px] border border-vm-line bg-white p-4">
              {report.supplies.map((item) => (
                <li key={item} className="font-body text-base text-vm-text">
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>

        {report.payment ? (
          <section className="mb-6" aria-labelledby="payment-heading">
            <h2
              id="payment-heading"
              className="mb-3 font-heading text-xl font-bold tracking-tight text-vm-navy"
            >
              Payment
            </h2>
            <div className="flex flex-col gap-3 rounded-[14px] border border-vm-line bg-white p-4">
              <p className="font-heading text-[26px] font-bold tracking-tight text-vm-navy">
                {report.payment.amount}
              </p>
              {report.payment.paid ? (
                <p className="font-body text-sm text-vm-text">Paid.</p>
              ) : (
                <>
                  {report.payment.zelleHandle ? (
                    <div>
                      <p className="font-body text-base text-vm-text">
                        Zelle is our preferred way to pay.
                      </p>
                      <p className="mt-1 font-body text-base font-semibold text-vm-navy">
                        {report.payment.zelleHandle}
                      </p>
                    </div>
                  ) : null}
                  {report.payment.cardToken ? (
                    <CardPay invoiceToken={report.payment.cardToken} />
                  ) : null}
                  {report.payment.paypalUrl ? (
                    <a
                      href={report.payment.paypalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex min-h-11 w-full items-center justify-center rounded-[10px] border border-vm-line bg-white font-body text-sm font-semibold text-vm-navy no-underline ${FOCUS}`}
                    >
                      PayPal
                    </a>
                  ) : null}
                </>
              )}
            </div>
          </section>
        ) : null}

        <footer className="border-t border-vm-line pt-4">
          <p className="font-body text-sm text-vm-text">
            Questions? Call or text{' '}
            <a href="tel:+18027335348" className={`font-semibold text-vm-cyan-dark ${FOCUS}`}>
              (802) 733-5348
            </a>{' '}
            ·{' '}
            <a
              href="mailto:hello@velocitymaid.com"
              className={`font-semibold text-vm-cyan-dark ${FOCUS}`}
            >
              hello@velocitymaid.com
            </a>
          </p>
        </footer>
      </article>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-vm-navy/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={open.alt}
        >
          <div className="flex w-full max-w-3xl flex-col gap-3">
            <button
              type="button"
              onClick={() => setOpen(null)}
              className={`inline-flex min-h-11 items-center justify-center self-end rounded-[10px] bg-white px-4 font-body text-sm font-semibold text-vm-navy ${FOCUS}`}
            >
              Close
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={open.url}
              alt={open.alt}
              className="max-h-[80vh] w-full rounded-[14px] object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

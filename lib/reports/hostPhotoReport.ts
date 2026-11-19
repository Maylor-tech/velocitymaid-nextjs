import { formatServiceDate } from '@/lib/dates/serviceDate';
import type { HostPaymentConfig } from '@/lib/reports/hostPaymentOptions';

export type HostReportPhoto = {
  url: string;
  alt: string;
};

export type HostReportRoom = {
  key: string;
  label: string;
  after: HostReportPhoto[];
  before: HostReportPhoto[];
};

export type HostReportNotice = {
  id: string;
  note: string;
  photo: HostReportPhoto | null;
};

export const ZELLE_RECIPIENT_NAME = 'VelocityMaid LLC';

export type HostReportPayment = {
  amount: string;
  invoiceNumber: string;
  dueLabel: string | null;
  paid: boolean;
  zelleHandle: string | null;
  zelleRecipient: string | null;
  paypalUrl: string | null;
  cardToken: string | null;
};

export type HostPhotoReport = {
  propertyName: string;
  serviceDateLabel: string;
  finishedLabel: string;
  cleanerFirstName: string | null;
  /** Customer-visible before photos that were not tied to a room. */
  before: HostReportPhoto[];
  rooms: HostReportRoom[];
  notices: HostReportNotice[];
  supplies: string[];
  payment: HostReportPayment | null;
};

export type HostReportPhotoInput = {
  id: string;
  url: string;
  category: string;
  slotKey: string | null;
  customerVisible: boolean;
  caption: string | null;
};

export type HostReportFlagInput = {
  id: string;
  kind: string;
  note: string;
  photoId: string | null;
};

export type HostReportInvoiceInput = {
  invoiceNumber: string;
  total: number;
  balanceDue: number;
  publicToken: string;
  status: string;
};

const NOTICE_KINDS = new Set(['DAMAGE', 'ISSUE', 'ARRIVAL']);

export function cleanerFirstName(name: string | null | undefined): string | null {
  const first = name?.trim().split(/\s+/)[0] ?? '';
  if (!first || first.includes('@') || /\d/.test(first)) return null;
  return first;
}

export function formatFinishedTime(value: Date | string | null | undefined): string | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

/** PayPal.me amount path. Returns null when the base link is missing or not https. */
export function paypalAmountUrl(base: string | null | undefined, amount: number): string | null {
  const trimmed = base?.trim() ?? '';
  if (!trimmed || !Number.isFinite(amount) || amount <= 0) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:') return null;
    const path = url.pathname.replace(/\/+$/, '');
    url.pathname = `${path}/${amount.toFixed(2)}`;
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function displayNote(note: string): string {
  return note.trim().replace(/\s+/g, ' ');
}

/** Same job, same note ignoring case and extra spaces. Keeps the first wording and any photo. */
export function mergeMatchingNotices(
  notices: HostReportNotice[]
): HostReportNotice[] {
  const merged: HostReportNotice[] = [];
  const indexByNote = new Map<string, number>();
  for (const notice of notices) {
    const note = displayNote(notice.note);
    if (!note) continue;
    const key = note.toLowerCase();
    const existingIndex = indexByNote.get(key);
    if (existingIndex == null) {
      indexByNote.set(key, merged.length);
      merged.push({ id: notice.id, note, photo: notice.photo });
      continue;
    }
    const existing = merged[existingIndex]!;
    if (!existing.photo && notice.photo) {
      existing.photo = { url: notice.photo.url, alt: existing.note };
    }
  }
  return merged;
}

function visiblePhotos(photos: HostReportPhotoInput[]): HostReportPhotoInput[] {
  return photos.filter((photo) => photo.customerVisible && photo.url.trim());
}

export function buildHostPhotoReport(input: {
  propertyName: string | null | undefined;
  serviceDate: Date | string | null | undefined;
  finishedAt: Date | string | null | undefined;
  cleanerName: string | null | undefined;
  slots: Array<{ key: string; label: string; sortOrder: number }>;
  photos: HostReportPhotoInput[];
  flags: HostReportFlagInput[];
  invoice: HostReportInvoiceInput | null;
  paymentConfig: HostPaymentConfig;
}): HostPhotoReport {
  const visible = visiblePhotos(input.photos);
  const byId = new Map(visible.map((photo) => [photo.id, photo]));

  const before = visible
    .filter((photo) => photo.category === 'BEFORE' && !photo.slotKey)
    .map((photo) => ({ url: photo.url, alt: 'On arrival' }));

  const rooms = [...input.slots]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
    .map((slot) => {
      const inSlot = visible.filter((photo) => photo.slotKey === slot.key);
      return {
        key: slot.key,
        label: slot.label,
        after: inSlot
          .filter((photo) => photo.category === 'AFTER')
          .map((photo) => ({ url: photo.url, alt: `${slot.label} after` })),
        before: inSlot
          .filter((photo) => photo.category === 'BEFORE')
          .map((photo) => ({ url: photo.url, alt: `${slot.label} before` })),
      };
    });

  const notices = mergeMatchingNotices(
    input.flags
      .filter((flag) => NOTICE_KINDS.has(flag.kind))
      .map((flag) => {
        const photo = flag.photoId ? byId.get(flag.photoId) : undefined;
        const note = displayNote(flag.note);
        return {
          id: flag.id,
          note,
          photo: photo ? { url: photo.url, alt: note || 'Noticed during the clean' } : null,
        };
      })
  );

  const supplies = input.flags
    .filter((flag) => flag.kind === 'SUPPLY')
    .map((flag) => flag.note.trim())
    .filter(Boolean);

  const invoice = input.invoice;
  const payable =
    invoice != null &&
    invoice.status !== 'CANCELLED' &&
    invoice.status !== 'DRAFT';
  const paid =
    payable && (invoice!.status === 'PAID' || invoice!.balanceDue <= 0);
  const amountSource = payable
    ? invoice!.balanceDue > 0
      ? invoice!.balanceDue
      : invoice!.total
    : null;
  const finishedAt = formatFinishedTime(input.finishedAt);

  return {
    propertyName: input.propertyName?.trim() || 'Property',
    serviceDateLabel:
      formatServiceDate(input.serviceDate, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }) || 'Service date on file',
    finishedLabel: finishedAt ? `Turnover complete · ${finishedAt}` : 'Turnover complete',
    cleanerFirstName: cleanerFirstName(input.cleanerName),
    before,
    rooms,
    notices,
    supplies,
    payment:
      payable && amountSource != null
        ? {
            amount: formatAmount(amountSource),
            invoiceNumber: invoice!.invoiceNumber,
            dueLabel: paid ? null : 'Due on receipt',
            paid: Boolean(paid),
            zelleHandle: paid ? null : input.paymentConfig.zelleHandle,
            zelleRecipient: paid || !input.paymentConfig.zelleHandle ? null : ZELLE_RECIPIENT_NAME,
            paypalUrl: paid
              ? null
              : paypalAmountUrl(input.paymentConfig.paypalUrl, amountSource),
            cardToken:
              paid || !input.paymentConfig.cardEnabled
                ? null
                : invoice!.publicToken,
          }
        : null,
  };
}

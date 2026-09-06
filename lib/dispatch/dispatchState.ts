import { effectiveOfferStatus } from '@/lib/dispatch/offerExpiry';

export type DispatchUiState =
  | 'CLEANER_NEEDED'
  | 'OFFER_SENT'
  | 'ACCEPTED'
  | 'ASSIGNED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED';

export type OfferSummary = {
  id: string;
  status: string;
  cleanerName: string | null;
  expiresAt: string | null;
  compensationAmount: number | null;
};

export function deriveDispatchUiState(
  input: {
    assignedCleanerId: string | null;
    assignedCleanerName?: string | null;
    openOffer?: OfferSummary | null;
    latestTerminalOffer?: OfferSummary | null;
  },
  now: Date = new Date()
): {
  state: DispatchUiState;
  label: string;
  offer: OfferSummary | null;
} {
  if (input.assignedCleanerId) {
    return {
      state: 'ASSIGNED',
      label: input.assignedCleanerName
        ? `Assigned: ${input.assignedCleanerName}`
        : 'Assigned cleaner',
      offer: input.openOffer ?? input.latestTerminalOffer ?? null,
    };
  }

  const open = input.openOffer;
  const openEffective =
    open?.expiresAt != null
      ? effectiveOfferStatus({ status: open.status, expiresAt: open.expiresAt }, now)
      : open?.status ?? null;

  if (open && openEffective === 'OFFERED') {
    return {
      state: 'OFFER_SENT',
      label: open.cleanerName
        ? `Offer sent to ${open.cleanerName}`
        : 'Awaiting response',
      offer: open,
    };
  }

  const expiredOpen =
    open && openEffective === 'EXPIRED'
      ? { ...open, status: 'EXPIRED' }
      : null;
  const terminal = expiredOpen ?? input.latestTerminalOffer;

  if (terminal?.status === 'DECLINED') {
    return { state: 'DECLINED', label: 'Declined — cleaner needed', offer: terminal };
  }
  if (terminal?.status === 'EXPIRED' || openEffective === 'EXPIRED') {
    return {
      state: 'EXPIRED',
      label: 'Expired — cleaner needed',
      offer: terminal,
    };
  }
  if (terminal?.status === 'CANCELLED') {
    return { state: 'CANCELLED', label: 'Cancelled — cleaner needed', offer: terminal };
  }
  return { state: 'CLEANER_NEEDED', label: 'Cleaner needed', offer: null };
}

export function isCleanerNeeded(input: {
  assignedCleanerId: string | null;
  hasOpenOffer: boolean;
}): boolean {
  return !input.assignedCleanerId && !input.hasOpenOffer;
}

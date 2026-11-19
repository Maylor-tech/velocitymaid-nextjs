/**
 * Exact five-stage offer lifecycle labels for admin UI.
 * Never infer email/WhatsApp "delivered" — provider SUCCESS means sent only.
 */

import type { OfferNotificationStatus } from '@/lib/dispatch/offerNotification';
import { effectiveOfferStatus } from '@/lib/dispatch/offerExpiry';

export type OfferLifecycleOffer = {
  status: string;
  expiresAt: Date | string | null | undefined;
};

export type OfferLifecycleInput = {
  /** JobOffer row (or null when no offer exists). */
  offer: OfferLifecycleOffer | null | undefined;
  /** Latest SEND_CLEANER_OFFER_EMAIL view, if loaded. */
  notification?: {
    status: OfferNotificationStatus;
    attemptCount?: number;
  } | null;
  /** True when the job has an assigned cleaner after accept. */
  jobAssigned?: boolean;
  now?: Date;
};

/**
 * Human-readable stages joined with " · ".
 * Example: "Offer created · email sent · not yet accepted"
 */
export function formatOfferLifecycleLabel(input: OfferLifecycleInput): string {
  const parts: string[] = [];
  const offer = input.offer;

  if (!offer) {
    parts.push('No offer created');
    return parts.join(' · ');
  }

  parts.push('Offer created');

  const notif = input.notification;
  const attempts = notif?.attemptCount ?? 0;
  if (!notif || notif.status === 'NOT_RECORDED') {
    if (attempts > 0) {
      parts.push('notification attempted');
      parts.push('unknown');
    } else {
      parts.push('notification unknown');
    }
  } else {
    parts.push('notification attempted');
    if (notif.status === 'SENT') {
      // Sent to provider — never label as delivered.
      parts.push('email sent');
    } else if (notif.status === 'FAILED') {
      parts.push('email failed');
    } else {
      parts.push('unknown');
    }
  }

  const effective = effectiveOfferStatus(offer, input.now ?? new Date());
  if (effective === 'ACCEPTED') {
    parts.push('accepted');
  } else if (effective === 'DECLINED') {
    parts.push('declined');
  } else if (effective === 'EXPIRED') {
    parts.push('expired');
  } else if (effective === 'CANCELLED') {
    parts.push('cancelled');
  } else {
    parts.push('not yet accepted');
  }

  if (input.jobAssigned || effective === 'ACCEPTED') {
    if (input.jobAssigned) {
      parts.push('assigned');
    }
  }

  return parts.join(' · ');
}

/** Short pill label for Needs attention rows. */
export function offerLifecyclePill(
  input: OfferLifecycleInput
): string {
  const offer = input.offer;
  if (!offer) return 'No offer';
  if (input.jobAssigned) return 'Assigned';
  const effective = effectiveOfferStatus(offer, input.now ?? new Date());
  if (effective === 'ACCEPTED') return 'Accepted';
  if (effective === 'DECLINED') return 'Declined';
  if (effective === 'EXPIRED') return 'Expired';
  if (effective === 'CANCELLED') return 'Cancelled';
  const notif = input.notification?.status;
  if (notif === 'FAILED') return 'Notify failed';
  if (notif === 'SENT') return 'Awaiting acceptance';
  return 'Offer open';
}

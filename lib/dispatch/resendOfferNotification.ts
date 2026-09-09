import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import { DispatchError } from '@/lib/dispatch/errors';
import { effectiveOfferStatus } from '@/lib/dispatch/offerExpiry';
import { deliverOfferEmailAndLog } from '@/lib/dispatch/notifyOffer';

export type ResendOfferSnapshot = {
  id: string;
  cleanerId: string;
  compensationAmount: number;
  compensationBasis: 'FLAT' | 'HOURLY' | 'OTHER';
  offeredAt: Date;
  expiresAt: Date;
};

export type ResendOfferNotificationResult = {
  offer: ResendOfferSnapshot;
  notification: { sent: boolean; error?: string };
};

function snapshotOffer(offer: {
  id: string;
  cleanerId: string;
  compensationAmount: { toString(): string } | number;
  compensationBasis: 'FLAT' | 'HOURLY' | 'OTHER';
  offeredAt: Date;
  expiresAt: Date;
}): ResendOfferSnapshot {
  return {
    id: offer.id,
    cleanerId: offer.cleanerId,
    compensationAmount: Number(offer.compensationAmount),
    compensationBasis: offer.compensationBasis,
    offeredAt: offer.offeredAt,
    expiresAt: offer.expiresAt,
  };
}

/**
 * Resend the cleaner-offer email for an existing live OFFERED row.
 * Never creates another JobOffer, extends TTL, changes pay, or assigns.
 */
export async function resendOfferNotification(input: {
  jobId: string;
  offerId: string;
  adminId?: string | null;
}): Promise<ResendOfferNotificationResult> {
  const offer = await prisma.jobOffer.findUnique({
    where: { id: input.offerId },
    include: {
      Cleaner: {
        select: { id: true, name: true, email: true, role: true },
      },
      Job: {
        select: {
          id: true,
          assignedCleanerId: true,
          jobReference: true,
          serviceType: true,
          preferredDate: true,
          preferredTime: true,
          serviceLocation: true,
          Property: { select: { city: true, state: true } },
        },
      },
    },
  });

  if (!offer || offer.jobId !== input.jobId) {
    throw new DispatchError('Offer not found', 'OFFER_NOT_FOUND', 404);
  }

  if (offer.Job.assignedCleanerId) {
    throw new DispatchError(
      'Job already has an assigned cleaner. Notification cannot be resent.',
      'ALREADY_ASSIGNED',
      409
    );
  }

  const effective = effectiveOfferStatus(offer);
  if (effective === 'EXPIRED') {
    throw new DispatchError('This offer has expired', 'OFFER_EXPIRED', 409);
  }
  if (effective === 'ACCEPTED') {
    throw new DispatchError('This offer was already accepted', 'OFFER_ACCEPTED', 409);
  }
  if (effective === 'DECLINED') {
    throw new DispatchError('This offer was declined', 'OFFER_DECLINED', 409);
  }
  if (effective === 'CANCELLED') {
    throw new DispatchError('This offer was cancelled', 'OFFER_CANCELLED', 409);
  }
  if (effective !== 'OFFERED') {
    throw new DispatchError(
      `Offer cannot be resent from ${effective}`,
      'INVALID_OFFER_STATUS',
      409
    );
  }

  if (!offer.Cleaner || offer.Cleaner.id !== offer.cleanerId) {
    throw new DispatchError(
      'Offer recipient is no longer valid',
      'OFFER_RECIPIENT_MISMATCH',
      409
    );
  }

  const offerSnapshot = snapshotOffer(offer);
  const notification = await deliverOfferEmailAndLog(offer);

  const adminId =
    input.adminId && input.adminId !== 'local-admin' ? input.adminId : null;
  await logAuditEntry({
    actorId: adminId,
    actorRole: 'ADMIN',
    action: 'JOB_OFFER_NOTIFICATION_RESENT',
    entityType: 'JobOffer',
    entityId: offer.id,
    description: `Offer notification resent for job ${input.jobId}`,
    changes: {
      offerId: offer.id,
      cleanerId: offer.cleanerId,
      sent: notification.sent,
      termsUnchanged: true,
    },
  });

  return { offer: offerSnapshot, notification };
}

/**
 * Dual-path tip authorization:
 * - CUSTOMER session + owned jobId, or
 * - valid GuestTipAuthorization (opaque grant)
 *
 * Never accepts guest-supplied jobId without a grant.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireCustomerTipJobAccess } from '@/lib/tips/requireCustomerTipJobAccess';
import {
  GuestTipGrantError,
  recordGuestTipGrantUse,
  verifyGuestTipGrant,
} from '@/lib/tips/guestTipAuthorization';

export type TipJobAuth =
  | {
      mode: 'CUSTOMER';
      jobId: string;
      customerId: string;
    }
  | {
      mode: 'GUEST_GRANT';
      jobId: string;
      grantId: string;
      propertyId: string;
    };

export type TipAuthInput = {
  jobId?: string | null;
  grantToken?: string | null;
};

/**
 * Exactly one trusted path. Mutually exclusive jobId vs grantToken for guests.
 */
export async function authorizeTipJobAccess(
  request: NextRequest,
  input: TipAuthInput
): Promise<TipJobAuth> {
  const jobId = typeof input.jobId === 'string' ? input.jobId.trim() : '';
  const grantToken =
    typeof input.grantToken === 'string' ? input.grantToken.trim() : '';

  if (jobId && grantToken) {
    throw NextResponse.json(
      {
        success: false,
        error: 'Provide either jobId or grant, not both.',
        code: 'AMBIGUOUS_AUTH',
      },
      { status: 400 }
    );
  }

  if (grantToken) {
    try {
      const grant = await verifyGuestTipGrant(grantToken);
      return {
        mode: 'GUEST_GRANT',
        jobId: grant.jobId,
        grantId: grant.grantId,
        propertyId: grant.propertyId,
      };
    } catch (e) {
      if (e instanceof GuestTipGrantError) {
        const status =
          e.code === 'JOB_NOT_ELIGIBLE'
            ? 409
            : e.code === 'GRANT_EXPIRED'
              ? 410
              : 404;
        throw NextResponse.json(
          { success: false, error: e.message, code: e.code },
          { status }
        );
      }
      throw e;
    }
  }

  if (jobId) {
    const access = await requireCustomerTipJobAccess(request, jobId);
    return {
      mode: 'CUSTOMER',
      jobId: access.jobId,
      customerId: access.customerId,
    };
  }

  throw NextResponse.json(
    {
      success: false,
      error: 'jobId or grant is required.',
      code: 'AUTH_REQUIRED',
    },
    { status: 400 }
  );
}

export async function touchGrantAfterTipCreate(auth: TipJobAuth): Promise<void> {
  if (auth.mode === 'GUEST_GRANT') {
    await recordGuestTipGrantUse(auth.grantId);
  }
}

/**
 * Phase 1D-B — property stay QR generation from opaque stayUrl only.
 * Never encode Job/customer/property IDs, addresses, Google Review, or referral URLs.
 */

import QRCode from 'qrcode';
import {
  getPropertyGuestAccessState,
  type PropertyGuestAccessPublicState,
} from '@/lib/stay/propertyGuestAccess';

export type StayQrFormat = 'png' | 'svg';

export class StayQrError extends Error {
  readonly code: 'NOT_READY' | 'NOT_FOUND' | 'INVALID_FORMAT';
  constructor(code: StayQrError['code'], message: string) {
    super(message);
    this.name = 'StayQrError';
    this.code = code;
  }
}

export function parseStayQrFormat(raw: string | null): StayQrFormat {
  const format = (raw || 'png').toLowerCase();
  if (format !== 'png' && format !== 'svg') {
    throw new StayQrError(
      'INVALID_FORMAT',
      'format must be png or svg'
    );
  }
  return format;
}

/**
 * Load QR-ready guest-access state or fail closed.
 * Encoded payload is exclusively state.stayUrl.
 */
export async function loadQrReadyStayUrl(
  propertyId: string
): Promise<{ stayUrl: string; state: PropertyGuestAccessPublicState }> {
  let state: PropertyGuestAccessPublicState;
  try {
    state = await getPropertyGuestAccessState(propertyId);
  } catch {
    throw new StayQrError('NOT_FOUND', 'Property not found');
  }

  if (!state.active || !state.qrReady || !state.stayUrl) {
    throw new StayQrError(
      'NOT_READY',
      'Guest stay QR is not ready. Set a guest display name and enable an active stay link first.'
    );
  }

  return { stayUrl: state.stayUrl, state };
}

export async function renderStayQr(
  stayUrl: string,
  format: StayQrFormat
): Promise<{ body: Buffer | string; contentType: string; filename: string }> {
  const options = {
    margin: 2,
    color: {
      dark: '#0B1F33', // vm-navy-adjacent; print-safe dark
      light: '#FFFFFF',
    },
    width: 512,
  } as const;

  if (format === 'svg') {
    const svg = await QRCode.toString(stayUrl, {
      type: 'svg',
      ...options,
    });
    return {
      body: svg,
      contentType: 'image/svg+xml; charset=utf-8',
      filename: 'velocitymaid-stay-qr.svg',
    };
  }

  const dataUrl = await QRCode.toDataURL(stayUrl, options);
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return {
    body: Buffer.from(base64, 'base64'),
    contentType: 'image/png',
    filename: 'velocitymaid-stay-qr.png',
  };
}

/**
 * Response headers for downloadable stay QR (capability-bearing artifact).
 * no-store: never serve a stale QR after rotate/revoke.
 * X-Robots-Tag: keep opaque stay URLs out of search indexes/archives.
 */
export const STAY_QR_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
} as const;

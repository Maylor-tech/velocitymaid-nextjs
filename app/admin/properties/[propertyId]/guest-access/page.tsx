'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';

type GuestAccessState = {
  active: boolean;
  qrReady: boolean;
  stayUrl: string | null;
  guestDisplayName: string | null;
  tokenCreatedAt: string | null;
  revokedAt: string | null;
  printedCardWarning: string;
};

type PropertyInfo = {
  id: string;
  name: string | null;
  guestDisplayName: string | null;
  customerId: string;
  customerEmail: string;
  customerName: string;
  customerArchivedAt: string | null;
};

/**
 * Admin break-glass: inspect / revoke / rotate property guest access
 * without needing the host customer session. Never shows raw token.
 */
export default function AdminPropertyGuestAccessPage() {
  const params = useParams<{ propertyId: string }>();
  const propertyId = params.propertyId;

  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [guestAccess, setGuestAccess] = useState<GuestAccessState | null>(null);
  const [policy, setPolicy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(
      `/api/admin/properties/${propertyId}/guest-access`,
      { credentials: 'include' }
    );
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to load guest access');
    }
    setProperty(data.property);
    setGuestAccess(data.guestAccess);
    setPolicy(data.feedbackAfterRevokePolicy ?? null);
  }, [propertyId]);

  useEffect(() => {
    load()
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Load failed')
      )
      .finally(() => setLoading(false));
  }, [load]);

  const runAction = async (action: 'revoke' | 'rotate') => {
    const warning =
      guestAccess?.printedCardWarning ||
      'Rotating or revoking this guest-access token will make existing printed QR cards stop working and require replacement.';
    if (
      !window.confirm(
        `${warning}\n\nConfirm ADMIN ${action.toUpperCase()} for property ${propertyId}?`
      )
    ) {
      setMessage(`${action} cancelled`);
      return;
    }

    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/properties/${propertyId}/guest-access`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            confirm: true,
            guestDisplayName: property?.guestDisplayName,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `${action} failed`);
      }
      setMessage(
        action === 'revoke'
          ? 'Guest access revoked. Printed QR cards no longer work.'
          : 'Guest access rotated. Printed QR cards must be replaced.'
      );
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-surface">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vm-surface p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/admin/customers/${property?.customerId || ''}`}
          className="mb-4 inline-flex items-center gap-1 font-body text-sm text-vm-muted hover:text-vm-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to customer
        </Link>

        <h1 className="font-heading text-2xl font-bold text-vm-navy">
          Property guest access (break-glass)
        </h1>
        <p className="mt-1 font-body text-sm text-vm-muted">
          Emergency inspect / revoke without host login. Raw guest-access token is
          never shown.
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-vm-danger/20 bg-vm-danger-bg px-3 py-2 text-sm text-vm-danger">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-lg border border-vm-navy/10 bg-white px-3 py-2 text-sm text-vm-navy">
            {message}
          </p>
        )}

        {property && guestAccess && (
          <div className="mt-6 space-y-4 rounded-xl border border-vm-border bg-white p-6 shadow-sm">
            <dl className="grid gap-3 font-body text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-vm-muted">
                  Property
                </dt>
                <dd className="font-semibold text-vm-navy">
                  {property.name || property.id}
                </dd>
                <dd className="font-mono text-xs text-vm-muted">{property.id}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vm-muted">
                  Host
                </dt>
                <dd className="text-vm-navy">
                  {property.customerName || '—'} ({property.customerEmail})
                </dd>
                {property.customerArchivedAt && (
                  <dd className="text-vm-danger text-xs">
                    Customer archived {property.customerArchivedAt}
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vm-muted">
                  Guest display name
                </dt>
                <dd className="text-vm-navy">
                  {guestAccess.guestDisplayName || '— (not QR-ready)'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vm-muted">
                  Operational status
                </dt>
                <dd className="text-vm-navy">
                  {guestAccess.active ? 'Active' : 'Inactive / revoked'}
                  {guestAccess.qrReady ? ' · QR-ready' : ' · not QR-ready'}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-vm-muted">
                  Timestamps
                </dt>
                <dd className="text-vm-muted text-xs">
                  Created: {guestAccess.tokenCreatedAt || '—'}
                  <br />
                  Revoked: {guestAccess.revokedAt || '—'}
                </dd>
              </div>
              {guestAccess.stayUrl && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-vm-muted">
                    Public stay URL (opaque)
                  </dt>
                  <dd className="break-all font-mono text-xs text-vm-navy">
                    {guestAccess.stayUrl}
                  </dd>
                </div>
              )}
            </dl>

            <p className="rounded-lg border border-amber-500/30 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {guestAccess.printedCardWarning}
            </p>

            {policy && (
              <p className="rounded-lg border border-vm-navy/10 bg-vm-surface px-3 py-2 text-xs text-vm-muted">
                Feedback-after-revoke: {policy}
              </p>
            )}

            {guestAccess.qrReady ? (
              <p className="text-xs text-vm-muted">
                Download QR for printing. Rotate/revoke invalidates previously
                printed cards — reprint required.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              {guestAccess.qrReady ? (
                <>
                  <a
                    href={`/api/admin/properties/${propertyId}/guest-access/qr?format=png`}
                    className="rounded-lg border border-vm-navy/15 px-3 py-2 font-heading text-xs font-semibold text-vm-navy"
                    download
                  >
                    Download QR (PNG)
                  </a>
                  <a
                    href={`/api/admin/properties/${propertyId}/guest-access/qr?format=svg`}
                    className="rounded-lg border border-vm-navy/15 px-3 py-2 font-heading text-xs font-semibold text-vm-navy"
                    download
                  >
                    Download QR (SVG)
                  </a>
                </>
              ) : null}
              <button
                type="button"
                disabled={busy || !guestAccess.active}
                onClick={() => void runAction('revoke')}
                className="rounded-lg border border-vm-danger/30 px-3 py-2 font-heading text-xs font-semibold text-vm-danger disabled:opacity-50"
              >
                Emergency revoke
              </button>
              <button
                type="button"
                disabled={busy || !guestAccess.guestDisplayName}
                onClick={() => void runAction('rotate')}
                className="rounded-lg border border-vm-navy/15 px-3 py-2 font-heading text-xs font-semibold text-vm-navy disabled:opacity-50"
              >
                Rotate token
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

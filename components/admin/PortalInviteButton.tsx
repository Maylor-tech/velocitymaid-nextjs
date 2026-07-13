'use client';

import { useState } from 'react';
import { CheckCircle, Loader2, Mail } from 'lucide-react';

type InviteResult = {
  portalInviteSent: boolean;
  invitedAt: string | null;
};

interface PortalInviteButtonProps {
  customerId: string;
  /** Already invited (show Resend) */
  alreadyInvited?: boolean;
  /** Portal already active — hide invite by default */
  inviteAccepted?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  onInvited?: (result: InviteResult) => void;
}

export function PortalInviteButton({
  customerId,
  alreadyInvited = false,
  inviteAccepted = false,
  size = 'sm',
  className = '',
  onInvited,
}: PortalInviteButtonProps) {
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (inviteAccepted) {
    return null;
  }

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send invite');
      }
      setJustSent(true);
      onInvited?.({
        portalInviteSent: true,
        invitedAt: data.invitedAt ?? new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  const sizeClass =
    size === 'md'
      ? 'gap-2 rounded-lg px-4 py-2 text-sm'
      : 'gap-1.5 rounded-md px-2.5 py-1 text-xs';

  const label = justSent
    ? 'Invite sent'
    : alreadyInvited
      ? 'Resend invite'
      : 'Send invite';

  return (
    <div className={className}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void send();
        }}
        disabled={sending || justSent}
        className={`inline-flex items-center font-heading font-semibold text-vm-navy border border-vm-navy/20 bg-vm-navy/5 transition-colors hover:bg-vm-navy/10 disabled:opacity-60 ${sizeClass}`}
      >
        {sending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Sending…
          </>
        ) : justSent ? (
          <>
            <CheckCircle className="h-3.5 w-3.5 text-vm-success" />
            Invite sent
          </>
        ) : (
          <>
            <Mail className="h-3.5 w-3.5" />
            {label}
          </>
        )}
      </button>
      {error && (
        <p className="mt-1 font-body text-xs text-vm-danger">{error}</p>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { ActionItem } from '@/lib/admin/opsCommandCenter';

/** Client-local copy — do not import runtime helpers from opsCommandCenter (pulls Prisma/Resend). */
function visibleExceptionItems(
  items: ActionItem[],
  branchScoped: boolean
): ActionItem[] {
  const urgencyRank = { danger: 0, warning: 1, normal: 2 } as const;
  return items
    .filter((item) => item.count > 0)
    .filter((item) => !branchScoped || item.branchScopedVisible)
    .sort((a, b) => {
      const u = urgencyRank[a.urgency] - urgencyRank[b.urgency];
      if (u !== 0) return u;
      return b.count - a.count;
    });
}

const urgencyBorder: Record<ActionItem['urgency'], string> = {
  normal: 'border-vm-border',
  warning: 'border-vm-warning/40',
  danger: 'border-vm-danger/40',
};

const urgencyBadge: Record<ActionItem['urgency'], string> = {
  normal: 'bg-vm-cyan-tint text-vm-navy',
  warning: 'bg-vm-warning text-vm-white',
  danger: 'bg-vm-danger text-vm-white',
};

export function NeedsAttention({
  items,
  branchScoped = false,
  onInviteSent,
}: {
  items: ActionItem[];
  branchScoped?: boolean;
  onInviteSent?: () => void;
}) {
  const display = visibleExceptionItems(items, branchScoped);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function resendInvite(customerId: string, name: string) {
    setResendingId(customerId);
    setToast(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/invite`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Invite failed');
      }
      setToast(`Invite sent to ${name}`);
      onInviteSent?.();
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Invite failed');
    } finally {
      setResendingId(null);
    }
  }

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-vm-navy">
            Needs attention
          </h2>
          <p className="mt-0.5 font-body text-xs text-vm-muted">
            Only decisions for the next 24 hours. Everything else is automated or
            lives in reports.
          </p>
        </div>
        {toast && (
          <p className="max-w-xs text-right font-body text-xs text-vm-navy">
            {toast}
          </p>
        )}
      </div>

      {display.length === 0 ? (
        <div className="rounded-xl border border-vm-border bg-vm-white px-5 py-10 text-center">
          <p className="font-heading text-sm font-semibold text-vm-navy">
            Clear desk
          </p>
          <p className="mt-1 font-body text-sm text-vm-muted">
            No exceptions right now. Today&apos;s schedule is below.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {display.map((item) => (
            <li
              key={item.id}
              className={`rounded-xl border bg-vm-white px-4 py-3.5 shadow-sm ${urgencyBorder[item.urgency]}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-heading text-xs font-bold ${urgencyBadge[item.urgency]}`}
                    >
                      {item.count}
                    </span>
                    <p className="font-body text-sm font-semibold text-vm-navy">
                      {item.label}
                    </p>
                  </div>
                  <p className="mt-1 font-body text-xs text-vm-muted">
                    {item.reason}
                  </p>
                </div>
                <Link
                  href={item.href}
                  className="shrink-0 self-start rounded-md bg-vm-navy px-3 py-1.5 font-heading text-[11px] font-bold uppercase tracking-wide text-vm-white hover:bg-vm-navy/90"
                >
                  {item.cta}
                </Link>
              </div>

              {item.entities && item.entities.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-vm-border pt-3">
                  {item.entities.map((entity) => (
                    <li
                      key={entity.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <Link
                        href={entity.href}
                        className="truncate font-body text-sm text-vm-navy hover:underline"
                      >
                        {entity.name}
                      </Link>
                      {entity.action === 'resend_invite' && !branchScoped ? (
                        <button
                          type="button"
                          disabled={resendingId === entity.id}
                          onClick={() => resendInvite(entity.id, entity.name)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-vm-border px-2.5 py-1 font-heading text-[11px] font-bold uppercase tracking-wide text-vm-navy hover:bg-vm-cyan-tint disabled:opacity-50"
                        >
                          {resendingId === entity.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : null}
                          Resend
                        </button>
                      ) : entity.action === 'open' ? (
                        <Link
                          href={entity.href}
                          className="shrink-0 rounded-md border border-vm-border px-2.5 py-1 font-heading text-[11px] font-bold uppercase tracking-wide text-vm-navy hover:bg-vm-cyan-tint"
                        >
                          Open
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

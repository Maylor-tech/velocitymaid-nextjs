'use client';

import { useEffect, useState } from 'react';
import {
  describeHostNotice,
  flagKindLabel,
  flagMainLine,
  orderOpenFlags,
  type DeskJobFlag,
} from '@/lib/flags/jobFlagDisplay';
import type { HostNotifyChannelValue } from '@/lib/flags/jobFlagRules';

const CHANNEL_OPTIONS: { value: HostNotifyChannelValue; label: string }[] = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'TEXT', label: 'Text' },
  { value: 'CALL', label: 'Call' },
  { value: 'IN_REPORT', label: 'In the report' },
];

export function FlaggedReportsPanel({
  flags,
  preview = false,
  onChanged,
}: {
  flags: DeskJobFlag[];
  /** Visual fixture. Actions stay visible and do not call the API. */
  preview?: boolean;
  onChanged?: () => void;
}) {
  const [rows, setRows] = useState(() => orderOpenFlags(flags));
  const [channels, setChannels] = useState<Record<string, HostNotifyChannelValue>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(orderOpenFlags(flags));
  }, [flags]);

  async function post(flagId: string, path: 'notify' | 'resolve', body?: unknown) {
    if (preview) return;
    setBusyId(flagId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/job-flags/${flagId}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false) {
        setError(typeof data.error === 'string' ? data.error : 'Could not update the flag');
        return;
      }
      if (path === 'resolve') {
        setRows((current) => current.filter((row) => row.id !== flagId));
      } else if (path === 'notify' && body && typeof body === 'object' && 'channel' in body) {
        const channel = (body as { channel: HostNotifyChannelValue }).channel;
        setRows((current) =>
          current.map((row) =>
            row.id === flagId
              ? {
                  ...row,
                  hostNotifiedAt: new Date().toISOString(),
                  hostNotifiedChannel: channel,
                }
              : row
          )
        );
      }
      onChanged?.();
    } catch {
      setError('Could not update the flag');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section
      id="desk-flags"
      className="rounded-[14px] border border-vm-line bg-vm-surface p-[23px]"
      aria-labelledby="desk-flags-heading"
    >
      <h2
        id="desk-flags-heading"
        className="mb-1.5 font-heading text-lg font-bold leading-[1.2] tracking-tight text-vm-navy"
      >
        Flagged in reports
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 font-body text-sm text-vm-text">Nothing flagged yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-vm-line">
          {rows.map((flag) => {
            const notice = describeHostNotice(flag);
            const told = Boolean(flag.hostNotifiedAt);
            const channel = channels[flag.id] ?? 'EMAIL';
            const channelId = `flag-channel-${flag.id}`;
            return (
              <li key={flag.id} className="flex flex-col items-start gap-2 py-3.5">
                <div className="flex w-full items-start gap-3">
                  {flag.photoUrl ? (
                    // Cleaner photos are arbitrary storage URLs, so they stay a plain image.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={flag.photoUrl}
                      alt={`${flagKindLabel(flag.kind)} noticed during the clean`}
                      className="h-16 w-16 shrink-0 rounded-[10px] object-cover"
                    />
                  ) : null}
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold text-vm-navy">
                      {flagMainLine(flag.note)}
                    </p>
                    <p className="font-body text-sm text-vm-text">
                      {flag.propertyName} · {flagKindLabel(flag.kind)}
                    </p>
                    <p
                      className={`font-body text-sm ${
                        told ? 'text-vm-text' : 'font-semibold text-vm-warning'
                      }`}
                    >
                      {notice}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  {told ? null : (
                    <>
                      <label htmlFor={channelId} className="font-body text-sm text-vm-navy">
                        Channel
                      </label>
                      <select
                        id={channelId}
                        value={channel}
                        onChange={(event) =>
                          setChannels((current) => ({
                            ...current,
                            [flag.id]: event.target.value as HostNotifyChannelValue,
                          }))
                        }
                        className="min-h-[44px] w-full rounded-[10px] border border-vm-line bg-vm-surface px-3 font-body text-sm text-vm-navy outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan sm:w-auto"
                      >
                        {CHANNEL_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={busyId === flag.id}
                        onClick={() =>
                          void post(flag.id, 'notify', { channel })
                        }
                        className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-vm-navy px-3.5 font-heading text-sm font-semibold text-vm-white outline-none hover:opacity-90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-60"
                      >
                        Mark host notified
                      </button>
                    </>
                  )}
                  {confirmId === flag.id ? (
                    <div className="flex w-full flex-col items-start gap-2">
                      <p className="font-body text-sm text-vm-navy">
                        Resolve without telling the host?
                      </p>
                      <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row">
                        <button
                          type="button"
                          disabled={busyId === flag.id}
                          onClick={() => {
                            setConfirmId(null);
                            void post(flag.id, 'resolve');
                          }}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] bg-vm-navy px-3.5 font-heading text-sm font-semibold text-vm-white outline-none hover:opacity-90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-60"
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          disabled={busyId === flag.id}
                          onClick={() => setConfirmId(null)}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-vm-line bg-vm-surface px-3.5 font-heading text-sm font-semibold text-vm-navy outline-none hover:bg-vm-canvas focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === flag.id}
                      onClick={() => {
                        if (!told) {
                          setConfirmId(flag.id);
                          return;
                        }
                        void post(flag.id, 'resolve');
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-[10px] border border-vm-line bg-vm-surface px-3.5 font-heading text-sm font-semibold text-vm-navy outline-none hover:bg-vm-canvas focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-60"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error ? <p className="mt-2 font-body text-sm text-vm-warning">{error}</p> : null}
    </section>
  );
}

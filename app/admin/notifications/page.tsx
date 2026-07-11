'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, Bell, CheckCircle2 } from 'lucide-react';

interface AdminNotification {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'OPEN' | 'ACKNOWLEDGED';
  jobId: string | null;
  message: string;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  INFO: 'bg-vm-surface text-vm-muted border-vm-border',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  const load = useCallback(() => {
    setLoading(true);
    const params = filter === 'unread' ? '?status=OPEN' : '';
    fetch(`/api/admin/notifications${params}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setNotifications(d.notifications);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(load, [load]);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'ACKNOWLEDGED', readAt: new Date().toISOString() } : n)));
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (filter === 'unread') load();
  };

  const markAllRead = async () => {
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    });
    load();
  };

  return (
    <div className="min-h-full bg-vm-surface p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-vm-navy">
              <Bell className="h-6 w-6" />
              Notifications
            </h1>
            <p className="mt-1 font-body text-sm text-vm-muted">
              New quotes, deposits, cleaner responses, completed jobs, and sync failures.
            </p>
          </div>
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-2 rounded-lg border border-vm-border px-3 py-1.5 font-body text-xs font-semibold text-vm-navy hover:bg-vm-white"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`rounded-lg px-4 py-1.5 font-body text-sm font-semibold ${
              filter === 'unread' ? 'bg-vm-navy text-white' : 'bg-vm-white text-vm-muted border border-vm-border'
            }`}
          >
            Unread
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-lg px-4 py-1.5 font-body text-sm font-semibold ${
              filter === 'all' ? 'bg-vm-navy text-white' : 'bg-vm-white text-vm-muted border border-vm-border'
            }`}
          >
            All
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-vm-cyan" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="mt-8 rounded-xl border border-vm-border bg-vm-white p-10 text-center font-body text-sm text-vm-muted">
            {filter === 'unread' ? "You're all caught up." : 'No notifications yet.'}
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start justify-between gap-4 rounded-xl border bg-vm-white p-4 ${
                  n.status === 'OPEN' ? 'border-vm-cyan/40' : 'border-vm-border'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 font-body text-[11px] font-semibold ${SEVERITY_STYLES[n.severity]}`}>
                      {n.severity}
                    </span>
                    <span className="font-body text-[11px] uppercase tracking-wide text-vm-muted">{n.type.replace(/_/g, ' ')}</span>
                    <span className="font-body text-[11px] text-vm-muted">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="mt-1.5 font-body text-sm text-vm-navy">{n.message}</p>
                  {n.actionUrl && (
                    <Link href={n.actionUrl} className="mt-1 inline-block font-body text-xs font-semibold text-vm-cyan-dark hover:underline">
                      View →
                    </Link>
                  )}
                </div>
                {n.status === 'OPEN' && (
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className="shrink-0 rounded-lg border border-vm-border px-2.5 py-1 font-body text-xs font-semibold text-vm-muted hover:bg-vm-surface"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

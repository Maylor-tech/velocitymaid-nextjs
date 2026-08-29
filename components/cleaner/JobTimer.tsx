"use client";

import { useEffect, useState } from 'react';

export function JobTimer({
  startedAt,
  completedAt,
}: {
  startedAt: string | null;
  completedAt: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || completedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt, completedAt]);

  if (!startedAt) {
    return <p className="text-sm text-vm-muted">Timer starts when you tap Start Job.</p>;
  }

  const end = completedAt ? new Date(completedAt).getTime() : now;
  const ms = Math.max(0, end - new Date(startedAt).getTime());
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const label = `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-vm-muted">On-site time</p>
      <p className="text-2xl font-semibold text-vm-navy mt-1 font-mono">{label}</p>
      <p className="text-xs text-vm-muted mt-1">
        From server start {new Date(startedAt).toLocaleTimeString()}
        {completedAt ? ` to ${new Date(completedAt).toLocaleTimeString()}` : ' (live from server timestamp)'}
      </p>
    </div>
  );
}

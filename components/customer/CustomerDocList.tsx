'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ExternalLink, Download } from 'lucide-react';

interface DocumentRow {
  id: string;
  label: string;
  sublabel?: string;
  date?: string;
  href?: string;
  pdfHref?: string;
  amount?: string;
  status?: string;
}

interface CustomerDocListProps {
  title: string;
  empty: string;
  fetchUrl: string;
  mapRows: (data: unknown) => DocumentRow[];
}

export function CustomerDocList({ title, empty, fetchUrl, mapRows }: CustomerDocListProps) {
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(fetchUrl, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRows(mapRows(d));
        else setError(d.error || 'Failed to load');
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setLoading(false));
  }, [fetchUrl, mapRows]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-vm-navy mb-6">{title}</h1>
      {error && (
        <p className="mb-4 rounded-lg bg-vm-danger-bg px-3 py-2 font-body text-sm text-vm-danger">{error}</p>
      )}
      {rows.length === 0 ? (
        <p className="font-body text-vm-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-vm-border rounded-xl border border-vm-border bg-vm-white">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-heading font-semibold text-vm-navy">{row.label}</p>
                {row.sublabel && <p className="font-body text-sm text-vm-muted">{row.sublabel}</p>}
                {row.date && <p className="font-body text-xs text-vm-muted mt-1">{row.date}</p>}
              </div>
              <div className="flex items-center gap-2">
                {row.amount && (
                  <span className="font-body text-sm font-semibold text-vm-navy">{row.amount}</span>
                )}
                {row.status && (
                  <span className="rounded-full bg-vm-surface px-2 py-0.5 font-body text-xs text-vm-muted">{row.status}</span>
                )}
                {row.href && (
                  <Link href={row.href} className="inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline">
                    View <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
                {row.pdfHref && (
                  <a href={row.pdfHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline">
                    PDF <Download className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

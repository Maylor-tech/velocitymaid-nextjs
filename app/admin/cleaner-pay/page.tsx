'use client';

import { useEffect, useState } from 'react';
import {
  CleanerPayScreen,
  type CleanerPayEntry,
  type CleanerPayLine,
} from '@/components/admin/cleanerPay/CleanerPayScreen';

export default function CleanerPayPage() {
  const [lines, setLines] = useState<CleanerPayLine[]>([]);
  const [payments, setPayments] = useState<CleanerPayEntry[]>([]);
  const [cleanerName, setCleanerName] = useState('Cleaner pay');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch('/api/admin/cleaner-pay');
      const json = await res.json();
      if (cancelled) return;
      if (!res.ok || !json.success) {
        setError(json.error || 'Could not load cleaner pay');
        return;
      }
      setCleanerName(json.cleanerName || 'Cleaner pay');
      setLines(json.lines || []);
      setPayments(json.payments || []);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="p-6 font-body text-sm text-vm-danger">{error}</p>;
  }

  return <CleanerPayScreen cleanerName={cleanerName} lines={lines} payments={payments} />;
}

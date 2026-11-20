'use client';

import { useEffect, useState } from 'react';
import {
  CleanerPayScreen,
  type CleanerPayAdvance,
  type CleanerPayEntry,
  type CleanerPayLine,
  type CleanerPayReimbursement,
  type CleanerPayUnmatched,
  type CleanerPayYtd,
} from '@/components/admin/cleanerPay/CleanerPayScreen';

type TermsPayload = {
  soloRate?: number;
  assistedRate?: number;
  effectiveFrom?: string;
} | null;

export default function CleanerPayPage() {
  const [lines, setLines] = useState<CleanerPayLine[]>([]);
  const [payments, setPayments] = useState<CleanerPayEntry[]>([]);
  const [advances, setAdvances] = useState<CleanerPayAdvance[]>([]);
  const [reimbursements, setReimbursements] = useState<CleanerPayReimbursement[]>([]);
  const [unmatched, setUnmatched] = useState<CleanerPayUnmatched[]>([]);
  const [ytd, setYtd] = useState<CleanerPayYtd | null>(null);
  const [termsLabel, setTermsLabel] = useState<string | undefined>(undefined);
  const [w9Label, setW9Label] = useState<string | undefined>(undefined);
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
      setAdvances(json.advances || []);
      setReimbursements(json.reimbursements || []);
      setUnmatched(json.unmatched || []);
      setYtd(json.ytd || null);
      const terms = json.terms as TermsPayload;
      setTermsLabel(
        terms
          ? `Terms from ${terms.effectiveFrom}: solo ${terms.soloRate}% · assisted $${terms.assistedRate} per hour.`
          : undefined
      );
      setW9Label(
        json.w9Status === 'ON_FILE'
          ? `W-9 on file${json.w9StatusOn ? ` · ${json.w9StatusOn}` : ''}.`
          : json.w9Status === 'MISSING'
            ? 'W-9 missing. Solo percentage offers stay blocked. Assisted hourly is allowed.'
            : undefined
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="p-6 font-body text-sm text-vm-danger">{error}</p>;
  }

  return (
    <CleanerPayScreen
      cleanerName={cleanerName}
      lines={lines}
      payments={payments}
      advances={advances}
      reimbursements={reimbursements}
      unmatched={unmatched}
      ytd={ytd}
      termsLabel={termsLabel}
      w9Label={w9Label}
    />
  );
}

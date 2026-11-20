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
import {
  HomeSizeExceptionForm,
  type HomeSizeExceptionValue,
} from '@/components/admin/cleanerPay/HomeSizeExceptionForm';
import { taxPaperworkLabel } from '@/lib/cleanerComp/pay';

type TermsPayload = {
  soloRate?: number;
  assistedRate?: number;
  effectiveFrom?: string;
  homeSizeException?: HomeSizeExceptionValue | null;
} | null;

export default function CleanerPayPage() {
  const [lines, setLines] = useState<CleanerPayLine[]>([]);
  const [payments, setPayments] = useState<CleanerPayEntry[]>([]);
  const [advances, setAdvances] = useState<CleanerPayAdvance[]>([]);
  const [reimbursements, setReimbursements] = useState<CleanerPayReimbursement[]>([]);
  const [unmatched, setUnmatched] = useState<CleanerPayUnmatched[]>([]);
  const [ytd, setYtd] = useState<CleanerPayYtd | null>(null);
  const [termsLabel, setTermsLabel] = useState<string | undefined>(undefined);
  const [exception, setException] = useState<HomeSizeExceptionValue | null>(null);
  const [cleanerId, setCleanerId] = useState<string | undefined>(undefined);
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
      setCleanerId(json.cleanerId || undefined);
      setLines(json.lines || []);
      setPayments(json.payments || []);
      setAdvances(json.advances || []);
      setReimbursements(json.reimbursements || []);
      setUnmatched(json.unmatched || []);
      setYtd(json.ytd || null);
      const terms = json.terms as TermsPayload;
      setException(terms?.homeSizeException ?? null);
      setTermsLabel(
        terms
          ? `Terms from ${terms.effectiveFrom}: solo ${terms.soloRate}% · assisted $${terms.assistedRate} per hour. ${
              terms.homeSizeException
                ? terms.homeSizeException.label
                : 'No home-size exception. No add-on pay rule.'
            }`
          : undefined
      );
      setW9Label(json.paperwork ? taxPaperworkLabel(json.paperwork) : undefined);
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
      exceptionForm={
        <HomeSizeExceptionForm
          key={exception?.label ?? 'none'}
          cleanerId={cleanerId}
          exception={exception}
          onSaved={() => window.location.reload()}
        />
      }
    />
  );
}

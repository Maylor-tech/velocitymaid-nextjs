'use client';

import { useCallback, useEffect, useState } from 'react';

type PayTermsPayload = {
  success: boolean;
  error?: string;
  assigned?: boolean;
  cleanerName?: string;
  serviceDate?: string;
  w9Status?: 'ON_FILE' | 'MISSING';
  terms?: {
    soloRate: number;
    soloMethod?: 'PERCENTAGE' | 'HOURLY' | 'FLAT';
    soloLabel?: string;
    assistedRate: number;
    assistedLabel?: string;
    homeSizeException?: { minBedrooms: number; method: string; rate: number } | null;
  } | null;
  agreement?: { label: string; assisted: boolean; hasOffer: boolean } | null;
};

export function JobPayTerms({ jobId, assigned }: { jobId: string; assigned: boolean }) {
  const [data, setData] = useState<PayTermsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/jobs/${jobId}/pay-terms`);
    const json = (await res.json()) as PayTermsPayload;
    if (!res.ok || !json.success) {
      setError(json.error || 'Could not load pay terms');
      return;
    }
    setData(json);
    setError(null);
  }, [jobId]);

  useEffect(() => {
    if (assigned) void load();
  }, [assigned, load]);

  const save = async (choice: 'solo' | 'assisted') => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/pay-terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not save pay terms');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save pay terms');
    } finally {
      setSaving(false);
    }
  };

  if (!assigned) return null;

  const soloBlocked = data?.w9Status === 'MISSING' && (data.terms?.soloMethod ?? 'PERCENTAGE') === 'PERCENTAGE';

  return (
    <section className="rounded-[14px] border border-vm-line bg-white p-4">
      <h2 className="font-heading text-lg font-bold text-vm-navy">Pay terms</h2>
      <p className="mt-1 font-body text-sm text-vm-muted">
        For a cleaner assigned on this job. No offer is required.
      </p>
      {data?.agreement ? (
        <p className="mt-3 font-body text-sm text-vm-text">
          {data.agreement.label}
          {data.agreement.assisted ? ' · assisted' : ''}
          {data.agreement.hasOffer ? '' : ' · saved on this job'}
        </p>
      ) : data?.terms ? (
        <div className="mt-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={saving || soloBlocked}
              onClick={() => void save('solo')}
              className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-vm-navy px-4 font-body text-sm font-semibold text-vm-navy outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-50"
            >
              Solo ({data.terms.soloLabel || `${data.terms.soloRate}%`})
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save('assisted')}
              className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-vm-navy px-4 font-body text-sm font-semibold text-white outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-50"
            >
              Assisted ({data.terms.assistedLabel || `$${data.terms.assistedRate}/hr`})
            </button>
          </div>
          <p className="mt-2 font-body text-sm text-vm-muted">
            {data.terms.homeSizeException
              ? `${data.terms.homeSizeException.minBedrooms}+ bedroom solo uses the saved exception. Smaller homes stay on the standard solo terms.`
              : 'No home-size exception is set. A 4+ bedroom solo clean stays on the standard solo terms.'}{' '}
            No add-on pay rule is set. Add-on amounts stay out of the percentage base unless this agreement marks them included.
          </p>
        </div>
      ) : (
        <p className="mt-3 font-body text-sm text-vm-text">
          No terms are in effect for this service date. Set them on the cleaner before saving pay.
        </p>
      )}
      {soloBlocked && !data?.agreement ? (
        <p className="mt-2 font-body text-sm text-vm-text">
          W-9 is missing. Solo percentage stays blocked. Assisted hourly is allowed.
        </p>
      ) : null}
      {error ? <p className="mt-2 font-body text-sm text-vm-danger">{error}</p> : null}
    </section>
  );
}

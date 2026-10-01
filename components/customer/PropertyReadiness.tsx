'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  evaluateHostPropertyReadiness,
  type HostReadinessInput,
} from '@/lib/properties/propertyReadiness';

/**
 * Compact readiness chip for the properties board.
 * Green when the required brief is complete, amber with a count when not.
 */
export function PropertyReadinessPill({
  property,
}: {
  property: HostReadinessInput;
}) {
  const readiness = evaluateHostPropertyReadiness(property);
  if (readiness.ready) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-vm-success-bg px-2 py-0.5 font-body text-xs font-medium text-vm-success">
        <CheckCircle2 className="h-3 w-3" /> Brief complete
      </span>
    );
  }
  const count = readiness.missingRequired.length;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-vm-warning-bg px-2 py-0.5 font-body text-xs font-medium text-vm-warning">
      <AlertTriangle className="h-3 w-3" />
      {count} to complete
    </span>
  );
}

/**
 * Guided pre-flight banner for Add Cleaning. Non-blocking — the host can still
 * submit — but it steers them to complete the property brief first so the
 * cleaner isn't handed an incomplete job.
 */
export function PropertyReadinessBanner({
  property,
  propertyId,
}: {
  property: HostReadinessInput;
  propertyId: string;
}) {
  const readiness = evaluateHostPropertyReadiness(property);
  const editHref = `/customer/properties/${propertyId}`;

  if (!readiness.ready) {
    return (
      <div className="rounded-xl border border-vm-warning/30 bg-vm-warning-bg px-4 py-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-vm-warning" />
          <div className="font-body text-sm text-vm-navy">
            <p className="font-semibold">Finish your property brief first</p>
            <p className="mt-1 text-vm-muted">
              Your cleaner needs this to arrive ready. Still missing:
            </p>
            <ul className="mt-1.5 space-y-1">
              {readiness.missingRequired.map((item) => (
                <li key={item.key}>
                  <span className="font-medium text-vm-navy">{item.label}</span>
                  <span className="text-vm-muted"> — {item.hint}</span>
                </li>
              ))}
            </ul>
            <Link
              href={editHref}
              className="mt-2 inline-flex font-heading text-sm font-semibold text-vm-cyan-dark hover:underline"
            >
              Complete property profile →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (readiness.missingRecommended.length > 0) {
    return (
      <div className="rounded-xl border border-vm-cyan/30 bg-vm-cyan/5 px-4 py-3 font-body text-sm text-vm-navy">
        <p className="font-semibold">Property brief ready</p>
        <p className="mt-1 text-vm-muted">
          Optional extras can still help:{' '}
          {readiness.missingRecommended.map((item) => item.label).join(', ')}.{' '}
          <Link href={editHref} className="font-semibold text-vm-cyan-dark hover:underline">
            Add details
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-vm-success/30 bg-vm-success-bg px-4 py-3 font-body text-sm text-vm-success">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      Property brief complete — your cleaner has everything they need.
    </div>
  );
}

'use client';

import Link from 'next/link';
import {
  Archive,
  Camera,
  CheckCircle2,
  Circle,
  Loader2,
  MessageSquare,
  User,
} from 'lucide-react';
import {
  buildCommunicationStatus,
  buildWorkflowSteps,
  formatJobDate,
  formatUsdDetailed,
  getJobPriority,
  getPaymentBadge,
  getPhotoStatus,
  getPrimaryAction,
  getStatusBadge,
  priorityClasses,
  priorityLabel,
  type JobOperationsInput,
} from '@/lib/admin/jobsOperations';
import { effectiveOfferStatus, isEffectivelyOpen } from '@/lib/dispatch/offerExpiry';

export interface AdminJobListItem extends JobOperationsInput {
  id: string;
  customerName: string | null;
  address: string | null;
  preferredTime: string | null;
  serviceType: string | null;
  totalPrice: number | null;
  currency: string | null;
  archivedAt?: string | null;
  assignedCleaner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  branch: {
    id: string;
    name: string;
    slug: string;
  } | null;
  assignedTeam?: Array<{
    id: string;
    name: string | null;
    publicDisplayName?: string | null;
    isCertified?: boolean;
  }>;
  assignedTeamLabel?: string | null;
  assignedTeamSubtitle?: string | null;
  cleanerCertified?: boolean;
}

const navyButton =
  'inline-flex items-center justify-center rounded-lg bg-vm-navy px-4 py-2 font-heading text-sm text-white transition-opacity hover:opacity-90';

interface JobOperationsCardProps {
  job: AdminJobListItem;
  confirming: boolean;
  busy: boolean;
  onRequestArchive: () => void;
  onCancelArchive: () => void;
  onConfirmArchive: () => void;
  onUnarchive: () => void;
}

export function JobOperationsCard({
  job,
  confirming,
  busy,
  onRequestArchive,
  onCancelArchive,
  onConfirmArchive,
  onUnarchive,
}: JobOperationsCardProps) {
  const action = getPrimaryAction(job);
  const statusBadge = getStatusBadge(job.status);
  const paymentBadge = getPaymentBadge(job.paymentStatus);
  const priority = getJobPriority(job);
  const photo = getPhotoStatus(job.photoCount ?? 0, job.serviceType, job.status);
  const workflow = buildWorkflowSteps(job);
  const comms = buildCommunicationStatus(job);
  const archived = !!job.archivedAt;
  const isVermont = job.branch?.slug === 'vermont';
  const doneSteps = workflow.filter((s) => s.done).length;

  return (
    <li
      className={`border-b border-vm-border px-4 py-5 last:border-b-0 transition-colors hover:bg-vm-surface/40 sm:px-5 ${
        archived ? 'opacity-60' : ''
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        {/* Main info */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start gap-2">
            {priority !== 'normal' && (
              <span
                className={`rounded-full border px-2 py-0.5 font-body text-xs font-semibold ${priorityClasses(priority)}`}
              >
                {priorityLabel(priority)}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${paymentBadge.cls}`}>
              {paymentBadge.label}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                isVermont ? 'bg-vm-navy/10 text-vm-navy' : 'bg-vm-cyan-tint text-vm-navy'
              }`}
            >
              {job.branch?.name || '—'}
            </span>
            {job.dispatchUrgency && job.dispatchUrgency !== 'STANDARD' && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {job.dispatchUrgency.replace('_', ' ')}
              </span>
            )}
            {!job.assignedCleanerId && isEffectivelyOpen(job.openOffer) && (
              <span className="rounded-full bg-vm-cyan-tint px-2 py-0.5 text-xs font-medium text-vm-navy">
                {job.openOffer?.cleanerName
                  ? `Awaiting ${job.openOffer.cleanerName}`
                  : 'Offer sent'}
              </span>
            )}
            {!job.assignedCleanerId &&
              job.openOffer &&
              effectiveOfferStatus(job.openOffer) === 'EXPIRED' && (
              <span className="rounded-full bg-vm-warning-bg px-2 py-0.5 text-xs font-medium text-vm-warning">
                Expired
              </span>
            )}
            {!job.assignedCleanerId && !job.openOffer && (
              <span className="rounded-full bg-vm-warning-bg px-2 py-0.5 text-xs font-medium text-vm-warning">
                Cleaner needed
              </span>
            )}
            {!job.assignedCleanerId &&
              job.openOffer &&
              !isEffectivelyOpen(job.openOffer) &&
              effectiveOfferStatus(job.openOffer) !== 'EXPIRED' && (
              <span className="rounded-full bg-vm-warning-bg px-2 py-0.5 text-xs font-medium text-vm-warning">
                Cleaner needed
              </span>
            )}
          </div>

          <div>
            <Link
              href={`/admin/jobs/${job.id}`}
              className="font-heading text-lg font-semibold text-vm-navy hover:underline"
            >
              {job.customerName || 'Guest'}
            </Link>
            {job.address && (
              <p className="mt-0.5 font-body text-sm text-vm-muted">{job.address}</p>
            )}
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <InfoCell label="Service" value={job.serviceType || '—'} />
            <InfoCell label="Date" value={formatJobDate(job.preferredDate)} sub={job.preferredTime || undefined} />
            <InfoCell
              label="Price"
              value={formatUsdDetailed(job.totalPrice ?? 0, job.currency || 'USD')}
              sub={
                job.amountPaid != null
                  ? `Paid ${formatUsdDetailed(job.amountPaid, job.currency || 'USD')}`
                  : undefined
              }
            />
            <InfoCell
              label="Balance due"
              value={
                (job.balanceDue ?? 0) > 0
                  ? formatUsdDetailed(job.balanceDue!, job.currency || 'USD')
                  : '$0'
              }
            />
          </div>

          {/* Cleaner / team */}
          <div className="flex flex-wrap items-center gap-2">
            <User className="h-4 w-4 text-vm-muted" />
            {job.assignedTeamLabel ? (
              <div>
                <p className="font-body text-sm font-medium text-vm-navy">
                  Assigned Team: {job.assignedTeamLabel}
                </p>
                {job.assignedTeamSubtitle && (
                  <p className="font-body text-xs text-vm-muted">{job.assignedTeamSubtitle}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {(job.assignedTeam ?? []).map((m) => (
                    <span key={m.id} className="inline-flex items-center gap-1 rounded-full bg-vm-surface px-2 py-0.5 font-body text-xs text-vm-navy">
                      {m.publicDisplayName || m.name}
                      {m.isCertified && (
                        <CheckCircle2 className="h-3 w-3 text-vm-success" aria-label="Certified" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ) : job.assignedCleaner ? (
              <>
                <span className="font-body text-sm font-medium text-vm-navy">
                  {job.assignedCleaner.name || job.assignedCleaner.email}
                </span>
                {job.cleanerCertified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-vm-success-bg px-2 py-0.5 font-body text-xs font-medium text-vm-success">
                    <CheckCircle2 className="h-3 w-3" /> Certified
                  </span>
                )}
              </>
            ) : (
              <span className="font-body text-sm font-semibold text-vm-danger">Unassigned</span>
            )}
          </div>

          {/* Photo status */}
          <div className="flex flex-wrap items-center gap-2">
            <Camera className="h-4 w-4 shrink-0 text-vm-muted" />
            <span
              className={`font-body text-sm ${
                photo.kind === 'complete'
                  ? 'text-vm-success'
                  : photo.kind === 'missing'
                    ? 'text-vm-danger font-medium'
                    : 'text-vm-muted'
              }`}
            >
              {photo.label}
            </span>
            {(photo.kind === 'missing' || photo.kind === 'partial') && (
              <Link
                href={`/admin/jobs/${job.id}/complete`}
                className="font-body text-xs font-semibold text-vm-cyan-dark hover:underline"
              >
                Upload photos →
              </Link>
            )}
          </div>

          {/* Workflow */}
          <div>
            <p className="mb-1.5 font-body text-xs font-semibold uppercase tracking-wide text-vm-muted">
              Workflow · {doneSteps}/{workflow.length}
            </p>
            <div className="flex flex-wrap gap-1">
              {workflow.map((step) => (
                <span
                  key={step.id}
                  title={step.label}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-body text-[11px] ${
                    step.done
                      ? 'bg-vm-success-bg text-vm-success'
                      : 'bg-vm-surface text-vm-muted'
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                  ) : (
                    <Circle className="h-3 w-3 shrink-0" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Host communication */}
          <div>
            <p className="mb-1.5 flex items-center gap-1 font-body text-xs font-semibold uppercase tracking-wide text-vm-muted">
              <MessageSquare className="h-3.5 w-3.5" /> Host communication
            </p>
            <div className="flex flex-wrap gap-2">
              <CommPill label="Booking" done={comms.bookingConfirmation} />
              <CommPill label="Reminder" done={comms.preArrivalReminder} />
              <CommPill label="Completion" done={comms.completionMessage} />
              <CommPill label="Invoice" done={comms.invoiceSent} todo />
              <CommPill label="Receipt" done={comms.receiptSent} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-row items-center gap-2 lg:flex-col lg:items-end">
          {archived ? (
            <button
              type="button"
              onClick={onUnarchive}
              disabled={busy}
              className="rounded-lg border border-vm-border px-4 py-2 font-heading text-sm text-vm-navy hover:bg-vm-surface disabled:opacity-60"
            >
              {busy ? 'Working…' : 'Unarchive'}
            </button>
          ) : (
            <>
              <Link href={action.href} className={navyButton}>
                {action.label}
              </Link>
              <button
                type="button"
                onClick={onRequestArchive}
                title="Archive job"
                aria-label="Archive job"
                className="rounded-lg p-2 text-vm-muted transition-colors hover:bg-vm-danger-bg hover:text-vm-danger"
              >
                <Archive className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {confirming && !archived && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-3 rounded-lg bg-vm-surface px-4 py-2">
          <span className="font-body text-sm text-vm-navy">
            Archive this job? It won&apos;t be deleted, just hidden.
          </span>
          <button
            type="button"
            onClick={onConfirmArchive}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg bg-vm-danger px-3 py-1.5 font-heading text-sm text-white disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Yes, archive
          </button>
          <button
            type="button"
            onClick={onCancelArchive}
            disabled={busy}
            className="rounded-lg bg-vm-border px-3 py-1.5 font-heading text-sm text-vm-navy"
          >
            Cancel
          </button>
        </div>
      )}
    </li>
  );
}

function InfoCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="font-body text-xs text-vm-muted">{label}</p>
      <p className="font-body text-sm font-medium text-vm-navy">{value}</p>
      {sub && <p className="font-body text-xs text-vm-muted">{sub}</p>}
    </div>
  );
}

function CommPill({
  label,
  done,
  todo,
}: {
  label: string;
  done: boolean;
  todo?: boolean;
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-body text-[11px] font-medium ${
        done ? 'bg-vm-success-bg text-vm-success' : 'bg-vm-surface text-vm-muted'
      }`}
      title={todo && !done ? 'TODO: wire to invoice/job link' : undefined}
    >
      {label} {done ? '✓' : '—'}
    </span>
  );
}

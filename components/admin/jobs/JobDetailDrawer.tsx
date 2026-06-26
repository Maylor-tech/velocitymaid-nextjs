"use client";

import { useEffect, useState } from 'react';
import Drawer from '../ui/Drawer';
import JobInfoRow from './JobInfoRow';
import AssignCleanerModal from './AssignCleanerModal';
import CleanerProfileDrawer from '../cleaners/CleanerProfileDrawer';
import { Loader2, RefreshCw, UserCheck, XCircle, UserPlus } from 'lucide-react';

interface JobDetailDrawerProps {
  jobId: string | null;
  open: boolean;
  onClose: () => void;
  onJobUpdated?: () => void;
}

interface Job {
  id: string;
  status: string;
  Customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  User: {
    id: string;
    name: string | null;
    email: string;
    isActive: boolean;
  } | null;
  branchId: string;
  Branch: {
    id: string;
    name: string;
    slug: string;
  } | null;
  preferredDate: string | null;
  preferredTime: string | null;
  serviceType: string | null;
  serviceLocation: string | null;
  address: string | null;
  paymentMethod: string | null;
  currency: string | null;
  totalPrice: number | null;
  promoApplied: string | null;
  appliedReferralCode: string | null;
  createdAt: string;
  assignedAt: string | null;
  completedAt: string | null;
}

export default function JobDetailDrawer({
  jobId,
  open,
  onClose,
  onJobUpdated,
}: JobDetailDrawerProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignmentLogs, setAssignmentLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [cleanerProfileId, setCleanerProfileId] = useState<string | null>(null);

  const loadJob = async () => {
    if (!jobId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}`);
      const data = await res.json();

      if (data.success) {
        setJob(data.job);
      } else {
        console.error('Failed to load job:', data.error);
      }
    } catch (err) {
      console.error('Failed to load job details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && jobId) {
      loadJob();
      loadAssignmentLogs();
    }
  }, [open, jobId]);

  const loadAssignmentLogs = async () => {
    if (!jobId) return;

    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/assignment-log`);
      const data = await res.json();

      if (data.success) {
        setAssignmentLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load assignment logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!jobId) return;

    setAutoAssigning(true);
    try {
      const res = await fetch('/api/admin/jobs/auto-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      const data = await res.json();

      if (data.success) {
        // Reload job details
        await loadJob();
        // Notify parent to refresh list
        if (onJobUpdated) {
          onJobUpdated();
        }
        alert(`Job assigned to ${data.cleanerName || 'cleaner'}!`);
      } else {
        alert(data.error || data.reason || 'Failed to assign job');
      }
    } catch (err: any) {
      console.error('Error auto-assigning:', err);
      alert(err.message || 'Failed to assign job');
    } finally {
      setAutoAssigning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-vm-warning-bg text-yellow-800', label: 'Pending' },
      assigned: { color: 'bg-vm-cyan-tint text-blue-800', label: 'Assigned' },
      in_progress: { color: 'bg-purple-100 text-purple-800', label: 'In Progress' },
      completed: { color: 'bg-vm-success-bg text-vm-success', label: 'Completed' },
      cancelled: { color: 'bg-vm-danger-bg text-red-800', label: 'Cancelled' },
    };

    const config = statusConfig[status] || { color: 'bg-vm-surface text-vm-text', label: status };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <Drawer open={open} onClose={onClose} title="Job Details">
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin h-8 w-8 text-vm-muted" />
        </div>
      )}

      {!loading && job && (
        <div className="space-y-6 p-6 pb-12">
          {/* HEADER */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-vm-text">
                Job #{job.id.slice(0, 8).toUpperCase()}
              </h2>
              {getStatusBadge(job.status)}
            </div>
            <p className="text-sm text-vm-muted mt-1">
              Created: {new Date(job.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* CUSTOMER */}
          <section>
            <h3 className="text-sm font-semibold text-vm-text mb-3 uppercase tracking-wide">
              Customer Details
            </h3>
            <div className="rounded-lg border border-vm-border p-4 space-y-2 bg-vm-surface">
              <JobInfoRow
                label="Name"
                value={job.Customer ? `${job.Customer.firstName} ${job.Customer.lastName}` : job.id}
              />
              <JobInfoRow label="Email" value={job.Customer?.email} />
              <JobInfoRow label="Phone" value={job.Customer?.phone} />
            </div>
          </section>

          {/* CLEANER ASSIGNMENT */}
          <section>
            <h3 className="text-sm font-semibold text-vm-text mb-3 uppercase tracking-wide">
              Cleaner Assignment
            </h3>
            <div className="rounded-lg border border-vm-border p-4 space-y-3 bg-vm-surface">
                  {job.User ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <UserCheck className="w-4 h-4 text-vm-success" />
                    <span className="text-sm font-medium text-vm-text">Assigned</span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-vm-muted">Name:</span>
                      <button
                        onClick={() => setCleanerProfileId(job.User!.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                      >
                        {job.User.name || 'Unknown'}
                      </button>
                    </div>
                  </div>
                  <JobInfoRow label="Email" value={job.User.email} />
                  <JobInfoRow
                    label="Status"
                    value={job.User.isActive ? 'Active' : 'Inactive'}
                  />
                  {job.assignedAt && (
                    <JobInfoRow
                      label="Assigned At"
                      value={new Date(job.assignedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    />
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">No cleaner assigned</span>
                </div>
              )}

              <div className="pt-2 border-t border-vm-border space-y-2">
                <button
                  onClick={handleAutoAssign}
                  disabled={autoAssigning}
                  className="w-full px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2"
                >
                  {autoAssigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Re-run Auto Assignment
                    </>
                  )}
                </button>
                <button
                  onClick={() => setAssignModalOpen(true)}
                  className="w-full px-4 py-2 bg-vm-surface text-vm-text rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Assign Manually
                </button>
              </div>
            </div>
          </section>

          {/* JOB DETAILS */}
          <section>
            <h3 className="text-sm font-semibold text-vm-text mb-3 uppercase tracking-wide">
              Job Details
            </h3>
            <div className="rounded-lg border border-vm-border p-4 space-y-2 bg-vm-surface">
              <JobInfoRow
                label="Date"
                value={
                  job.preferredDate
                    ? new Date(job.preferredDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'
                }
              />
              <JobInfoRow label="Time" value={job.preferredTime ?? '—'} />
              <JobInfoRow label="Service Type" value={job.serviceType ?? '—'} />
              <JobInfoRow label="Location" value={job.serviceLocation ?? '—'} />
              <JobInfoRow label="Address" value={job.address ?? '—'} />
              <JobInfoRow label="Branch" value={job.Branch?.name ?? '—'} />
            </div>
          </section>

          {/* PAYMENT & PRICING */}
          <section>
            <h3 className="text-sm font-semibold text-vm-text mb-3 uppercase tracking-wide">
              Payment & Pricing
            </h3>
            <div className="rounded-lg border border-vm-border p-4 space-y-2 bg-vm-surface">
              <JobInfoRow label="Payment Method" value={job.paymentMethod ?? '—'} />
              <JobInfoRow label="Currency" value={job.currency ?? '—'} />
              <JobInfoRow
                label="Total Price"
                value={
                  job.totalPrice
                    ? `${job.currency === 'JMD' ? 'J$' : '$'}${job.totalPrice.toFixed(2)}`
                    : '—'
                }
              />
              {job.promoApplied && (
                <JobInfoRow label="Promo Applied" value={job.promoApplied} />
              )}
              {job.appliedReferralCode && (
                <JobInfoRow label="Referral Code" value={job.appliedReferralCode} />
              )}
            </div>
          </section>

          {/* ASSIGNMENT REASONING */}
          <section>
            <h3 className="text-sm font-semibold text-vm-text mb-3 uppercase tracking-wide">
              Assignment Reasoning
            </h3>
            <div className="rounded-lg border border-vm-border p-4 bg-vm-surface">
              {loadingLogs ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-vm-muted" />
                </div>
              ) : assignmentLogs.length === 0 ? (
                <p className="text-xs text-vm-muted">No assignment history yet.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {assignmentLogs.map((log) => (
                    <li key={log.id} className="border rounded p-2 bg-white">
                      <div className="font-semibold text-vm-text capitalize">{log.outcome}</div>
                      <div className="text-vm-muted mt-1">{log.reason}</div>
                      <div className="mt-1 text-vm-muted">
                        {new Date(log.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* JOB TIMELINE */}
          <section>
            <h3 className="text-sm font-semibold text-vm-text mb-3 uppercase tracking-wide">
              Job Timeline
            </h3>
            <div className="rounded-lg border border-vm-border p-4 bg-vm-surface">
              <ol className="relative border-l-2 border-gray-300 text-xs space-y-4">
                {[
                  { label: 'Created', at: job.createdAt },
                  { label: 'Assigned', at: job.assignedAt },
                  { label: 'On the way', at: job.onTheWayAt },
                  { label: 'Completed', at: job.completedAt },
                ].map((step, index) => (
                  <li key={step.label} className="ml-4 relative">
                    <div
                      className={`absolute w-3 h-3 rounded-full -left-[17px] top-0.5 ${
                        step.at ? 'bg-vm-navy' : 'bg-gray-300'
                      }`}
                    />
                    <p className="font-semibold text-vm-text">{step.label}</p>
                    <p className="text-vm-muted mt-0.5">
                      {step.at
                        ? new Date(step.at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : '—'}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>
      )}

      {!loading && !job && (
        <div className="flex items-center justify-center py-20">
          <p className="text-vm-muted">Job not found</p>
        </div>
      )}

      {/* Manual Assignment Modal */}
      {job && (
        <AssignCleanerModal
          open={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          job={{
            id: job.id,
            branchId: job.branchId,
            preferredDate: job.preferredDate,
            preferredTime: job.preferredTime,
            address: job.address,
          }}
          onAssigned={() => {
            loadJob();
            if (onJobUpdated) {
              onJobUpdated();
            }
          }}
          onViewCleanerProfile={(cleanerId) => {
            setAssignModalOpen(false);
            setCleanerProfileId(cleanerId);
          }}
        />
      )}

      {/* Cleaner Profile Drawer */}
      <CleanerProfileDrawer
        cleanerId={cleanerProfileId}
        open={!!cleanerProfileId}
        onClose={() => setCleanerProfileId(null)}
      />
    </Drawer>
  );
}


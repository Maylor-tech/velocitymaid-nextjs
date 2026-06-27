"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, User, Calendar, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { JobChecklistSection } from '@/components/brand/JobChecklistSection';
import { JobBillingWorkflowPanel } from '@/components/admin/jobs/JobBillingWorkflowPanel';
import { CARE_CHECKLIST_TOTAL } from '@/lib/brand/careChecklist';
import { getJobLoopProgress } from '@/lib/booking/jobLoopProgress';

interface Job {
  id: string;
  customerName: string | null;
  address: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  serviceType: string | null;
  serviceLocation: string | null;
  status: string;
  completedAt?: string | null;
  totalPrice: number | null;
  currency: string | null;
  paymentStatus: string;
  reviewStatus?: string;
  quotedTotal?: number | null;
  depositAmount?: number | null;
  amountPaid?: number | null;
  balanceDue?: number | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paidAt?: string | null;
  assignedCleanerId: string | null;
  assignedCleaner: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  branch: {
    id: string;
    name: string;
    slug: string;
  };
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
  } | null;
  JobPayout?: {
    id: string;
    cleanerId?: string;
    grossAmount: number | null;
    cleanerAmount: number | null;
    platformFee: number | null;
    currency: string;
    status: string;
    rulesVersion: string | null;
    paidAt: string | null;
    executionMethod?: string | null;
    externalReferenceId?: string | null;
    policyEvalDetails?: {
      paymentSettlement?: {
        methodType?: string;
        label?: string | null;
        reference?: string | null;
        timestamp?: string;
      };
    } | null;
  } | null;
  payoutEligibility?: {
    eligible: boolean;
    reason: string;
    payoutRecord: { id: string; status: string } | null;
  };
}

interface Cleaner {
  id: string;
  name: string | null;
  email: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  eventType: string;
  adminEmail: string;
  cleanerId: string | null;
  cleanerName: string | null;
  branchId: string | null;
  notes: string | null;
}

export default function AdminJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [testCompleting, setTestCompleting] = useState(false);
  const [markingPayoutPaid, setMarkingPayoutPaid] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutReference, setPayoutReference] = useState('');
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [markPaidAmount, setMarkPaidAmount] = useState('');
  const [markPaidMethod, setMarkPaidMethod] = useState('PayPal');
  const [markPaidReference, setMarkPaidReference] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  useEffect(() => {
    if (job?.branch?.id) {
      fetchCleaners();
    }
  }, [job?.branch?.id]);

  useEffect(() => {
    if (jobId) {
      fetchAuditLogs();
    }
  }, [jobId]);

  // Phase 2B: Refresh audit logs when cleaners are loaded to enrich cleaner names
  useEffect(() => {
    if (cleaners.length > 0 && auditLogs.length > 0) {
      const enrichedLogs = auditLogs.map(log => {
        if (log.cleanerId && !log.cleanerName) {
          const cleaner = cleaners.find(c => c.id === log.cleanerId);
          if (cleaner) {
            return { ...log, cleanerName: cleaner.name };
          }
        }
        return log;
      });
      // Only update if there are changes (check if any cleaner names were added)
      const hasChanges = enrichedLogs.some((log, i) => {
        const original = auditLogs[i];
        return log.cleanerName && !original?.cleanerName;
      });
      if (hasChanges) {
        setAuditLogs(enrichedLogs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleaners]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/jobs/${jobId}`);
      const data = await response.json();

      if (data.success) {
        setJob(data.job);
        if (data.job.assignedCleanerId) {
          setSelectedCleanerId(data.job.assignedCleanerId);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch job');
      }
    } catch (err: any) {
      console.error('Error fetching job:', err);
      setError(err.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const fetchCleaners = async () => {
    if (!job?.branch?.id) return;
    
    try {
      const response = await fetch(`/api/admin/cleaners/by-branch?branchId=${job.branch.id}`);
      const data = await response.json();
      
      if (data.success) {
        setCleaners(data.cleaners || []);
      }
    } catch (err) {
      console.error('Error fetching cleaners:', err);
    }
  };

  // Phase 2B: Fetch audit logs for this job
  // Why audit logs exist: Track admin actions for compliance and debugging
  // Scope: Read-only - we only fetch, never modify or delete
  // Why audit failures don't block ops: Audit logs are for observability, not critical path
  const fetchAuditLogs = async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}/audit`);
      const data = await response.json();
      
      if (data.success) {
        // Phase 2B: Enrich cleaner names if cleanerId is present and cleaners are loaded
        const enrichedLogs = data.logs.map((log: AuditLog) => {
          if (log.cleanerId && cleaners.length > 0) {
            const cleaner = cleaners.find(c => c.id === log.cleanerId);
            if (cleaner) {
              return { ...log, cleanerName: cleaner.name };
            }
          }
          return log;
        });
        setAuditLogs(enrichedLogs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      // Phase 2B: Fail silently - audit log fetch failure shouldn't block UI
    }
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    try {
      setReviewLoading(true);
      const response = await fetch(`/api/admin/jobs/${jobId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'reject' ? JSON.stringify({ reason: 'Rejected by admin' }) : undefined,
      });
      const data = await response.json();
      if (data.success) {
        let toast = action === 'approve' ? 'Booking approved' : 'Booking rejected';
        if (action === 'reject') {
          const refund = data.refund as { status?: string; amount?: number; error?: string } | undefined;
          if (refund?.status === 'refunded') {
            toast = `Booking rejected. Deposit refunded ($${refund.amount?.toFixed(2) ?? '25.00'}).`;
          } else if (refund?.status === 'already_refunded') {
            toast = 'Booking rejected. Deposit was already refunded.';
          } else if (data.warning) {
            toast = data.warning;
            setToastType('error');
          }
        }
        setToastMessage(toast);
        if (action !== 'reject' || !data.warning) {
          setToastType('success');
        }
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
        fetchJob();
        fetchAuditLogs();
      } else {
        throw new Error(data.error || 'Review action failed');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Review action failed';
      setToastMessage(message);
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleTestComplete = async () => {
    if (
      !confirm(
        'Dev only: mark this job COMPLETED and set BALANCE_DUE? This skips the cleaner portal workflow.'
      )
    ) {
      return;
    }
    try {
      setTestCompleting(true);
      const response = await fetch(`/api/admin/jobs/${jobId}/test-complete`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Test complete failed');
      setToastMessage(data.message || 'Job marked complete for testing');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      fetchJob();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Test complete failed';
      setToastMessage(message);
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setTestCompleting(false);
    }
  };

  const handleMarkPayoutPaid = async () => {
    if (
      !confirm(
        'Mark this cleaner payout as PAID? Use this after you have paid the cleaner manually (Zelle, CashApp, bank, cash, or check).'
      )
    ) {
      return;
    }

    try {
      setMarkingPayoutPaid(true);
      const response = await fetch(`/api/admin/jobs/${jobId}/payout/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paidMethodType: payoutMethod || undefined,
          paidMethodLabel: payoutNote || undefined,
          reference: payoutReference || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to mark payout as paid');
      }
      setToastMessage(data.message || 'Cleaner payout marked as PAID');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      setPayoutMethod('');
      setPayoutNote('');
      setPayoutReference('');
      fetchJob();
      fetchAuditLogs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to mark payout as paid';
      setToastMessage(message);
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setMarkingPayoutPaid(false);
    }
  };

  const openMarkPaid = () => {
    const suggested =
      (job?.balanceDue && job.balanceDue > 0
        ? job.balanceDue
        : job?.quotedTotal ?? job?.totalPrice) ?? null;
    setMarkPaidAmount(suggested != null ? String(suggested) : '');
    setMarkPaidMethod('PayPal');
    setMarkPaidReference('');
    setShowMarkPaid(true);
  };

  const handleMarkPaid = async () => {
    const amount = Number(markPaidAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setToastMessage('Enter a valid amount greater than 0');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      setMarkingPaid(true);
      const response = await fetch(`/api/admin/jobs/${jobId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: markPaidMethod,
          reference: markPaidReference || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to record payment');
      }
      setToastMessage(data.message || 'Payment recorded');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      setShowMarkPaid(false);
      setMarkPaidReference('');
      fetchJob();
      fetchAuditLogs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to record payment';
      setToastMessage(message);
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleSendInvite = async () => {
    const customerId = job?.customer?.id;
    if (!customerId) {
      setToastMessage('No customer record linked to this job');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      setSendingInvite(true);
      const response = await fetch(`/api/admin/customers/${customerId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send invite');
      }
      setInviteSent(true);
      setToastMessage('Invite sent');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send invite';
      setToastMessage(message);
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleAssign = async (confirmReassign: boolean = false) => {
    if (!selectedCleanerId) {
      setToastMessage('Please select a cleaner');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    // Phase 1: Safety check - require confirmation for reassignment
    if (!confirmReassign && job?.assignedCleanerId && job.assignedCleanerId !== selectedCleanerId) {
      const confirmed = window.confirm(
        `This job is already assigned to ${job.assignedCleaner?.name || 'another cleaner'}. ` +
        `Do you want to reassign it to the selected cleaner?`
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setAssigning(true);
      const response = await fetch('/api/admin/jobs/manual-assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          cleanerId: selectedCleanerId,
          sendWhatsApp: true,
          confirmReassign: Boolean(
            confirmReassign ||
              (job?.assignedCleanerId && job.assignedCleanerId !== selectedCleanerId)
          ),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToastMessage('Cleaner assigned successfully');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        fetchJob(); // Refresh job data - UI updates immediately
        fetchAuditLogs(); // Phase 2B: Refresh audit logs to show new assignment entry
      } else {
        // Phase 1: Handle reassignment confirmation error
        if (data.code === 'REASSIGNMENT_REQUIRED') {
          const confirmed = window.confirm(
            `${data.error}\n\nDo you want to proceed with reassignment?`
          );
          if (confirmed) {
            // Retry with confirmation
            await handleAssign(true);
            return;
          }
        } else {
          throw new Error(data.error || 'Failed to assign cleaner');
        }
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to assign cleaner');
      setToastType('error');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setAssigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed')) return 'bg-vm-success-bg text-vm-success';
    if (statusLower.includes('cancelled')) return 'bg-vm-danger-bg text-red-800';
    if (statusLower.includes('assigned')) return 'bg-vm-cyan-tint text-blue-800';
    if (statusLower.includes('in_progress') || statusLower.includes('on_the_way')) return 'bg-purple-100 text-purple-800';
    if (statusLower.includes('confirmed')) return 'bg-vm-warning-bg text-yellow-800';
    return 'bg-gray-100 text-vm-text';
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'bg-vm-success-bg text-vm-success';
      case 'READY':
        return 'bg-vm-cyan-tint text-blue-800';
      case 'FAILED':
        return 'bg-vm-danger-bg text-red-800';
      default:
        return 'bg-gray-100 text-vm-text';
    }
  };

  /** JobPayout is one-to-one in Prisma; tolerate legacy array API responses. */
  const jobPayout = job
    ? Array.isArray(job.JobPayout)
      ? job.JobPayout[0] ?? null
      : job.JobPayout ?? null
    : null;

  const payoutSettlement = jobPayout?.policyEvalDetails?.paymentSettlement;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-vm-success-bg text-vm-success';
      case 'DEPOSIT_PAID':
        return 'bg-vm-cyan-tint text-blue-800';
      case 'BALANCE_DUE':
        return 'bg-orange-100 text-orange-800';
      case 'PENDING':
        return 'bg-vm-warning-bg text-yellow-800';
      case 'FAILED':
        return 'bg-vm-danger-bg text-red-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-vm-text';
      default:
        return 'bg-gray-100 text-vm-text';
    }
  };

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-vm-success-bg text-vm-success';
      case 'REJECTED':
        return 'bg-vm-danger-bg text-red-800';
      case 'PENDING':
        return 'bg-vm-warning-bg text-yellow-800';
      default:
        return 'bg-gray-100 text-vm-text';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not scheduled';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (!amount) return 'N/A';
    const curr = currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Phase 2A: Payment Gating - Only allow assignment if payment is PAID
  // Phase 1: Also check job status allows assignment
  const isJobAssignable =
    job &&
    (job.paymentStatus === 'PAID' ||
      (job.paymentStatus === 'DEPOSIT_PAID' && job.reviewStatus === 'APPROVED'));
  const canAssign =
    job &&
    isJobAssignable &&
    (job.status === 'CONFIRMED' || job.status === 'RECEIVED' || !job.assignedCleanerId);
  const isPaymentBlocked = job && !isJobAssignable;
  const needsReview =
    job?.paymentStatus === 'DEPOSIT_PAID' && job?.reviewStatus === 'PENDING';

  const loopProgress = job
    ? getJobLoopProgress(job.id, {
        status: job.status,
        paymentStatus: job.paymentStatus,
        reviewStatus: job.reviewStatus,
        assignedCleanerId: job.assignedCleanerId,
        balanceDue: job.balanceDue,
      })
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-vm-muted">Loading job...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/admin/jobs"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">{error || 'Job not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Toast Notification */}
        {showToast && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
              toastType === 'success' ? 'bg-vm-success text-white' : 'bg-vm-danger text-white'
            }`}
          >
            {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/jobs"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-vm-text mb-2">Job Details</h1>
              <p className="text-vm-muted">Job ID: {job.id}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(job.paymentStatus)}`}>
                Payment: {job.paymentStatus}
              </span>
              {job.reviewStatus && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getReviewStatusColor(job.reviewStatus)}`}>
                  Review: {job.reviewStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {loopProgress && (
          <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-vm-text mb-1">Operational Progress</h2>
            <p className="text-sm text-indigo-800 font-medium mb-4">{loopProgress.label}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {loopProgress.steps.map((step) => (
                <span
                  key={step.id}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    step.done
                      ? 'bg-vm-success-bg text-vm-success'
                      : step.current
                        ? 'bg-indigo-100 text-indigo-900 ring-2 ring-indigo-300'
                        : 'bg-gray-100 text-vm-muted'
                  }`}
                >
                  {step.done ? '✓ ' : step.current ? '→ ' : ''}
                  {step.label}
                </span>
              ))}
            </div>
            <p className="text-sm text-vm-text mb-4">{loopProgress.nextAction}</p>
            <div className="flex flex-wrap gap-3">
              {loopProgress.cleanerJobUrl && (
                <Link
                  href={loopProgress.cleanerJobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Open Cleaner Job →
                </Link>
              )}
              <Link
                href="/cleaners/login"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-purple-300 px-4 py-2 text-sm font-medium text-purple-800 hover:bg-purple-50"
              >
                Cleaner Login
              </Link>
              {loopProgress.customerJobUrl && (
                <Link
                  href={loopProgress.customerJobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-vm-success px-4 py-2 text-sm font-medium text-white hover:bg-vm-success/90"
                >
                  Open Customer Job →
                </Link>
              )}
              {process.env.NODE_ENV === 'development' &&
                job.assignedCleanerId &&
                job.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={handleTestComplete}
                    disabled={testCompleting}
                    className="inline-flex items-center rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                  >
                    {testCompleting ? 'Completing…' : 'Dev only — skip cleaner workflow'}
                  </button>
                )}
            </div>
            {job.assignedCleaner && loopProgress.step === 'ASSIGNED' && (
              <p className="mt-3 text-xs text-vm-muted">
                Log in as <strong>{job.assignedCleaner.email}</strong> at /cleaners/login, then
                open the cleaner job link above → Accept → Start → Complete.
              </p>
            )}
          </div>
        )}

        <div className="mb-6">
          <JobBillingWorkflowPanel
            jobId={jobId}
            jobCompleted={job.status === 'COMPLETED' || Boolean(job.completedAt)}
          />
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-vm-text mb-4">Payment Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-vm-muted">Quoted Total</p>
              <p className="mt-1 text-lg font-semibold text-vm-text">
                {formatCurrency(job.quotedTotal ?? job.totalPrice, job.currency)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-vm-muted">Deposit Paid</p>
              <p className="mt-1 text-lg font-semibold text-vm-text">
                {formatCurrency(job.depositAmount ?? job.amountPaid, job.currency)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-vm-muted">Paid to Date</p>
              <p className="mt-1 text-lg font-semibold text-vm-success">
                {formatCurrency(job.amountPaid, job.currency)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-vm-muted">Balance Due</p>
              <p className={`mt-1 text-lg font-semibold ${(job.balanceDue ?? 0) > 0 ? 'text-orange-700' : 'text-vm-text'}`}>
                {formatCurrency(job.balanceDue ?? 0, job.currency)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 col-span-2 md:col-span-1">
              <p className="text-xs font-medium uppercase tracking-wide text-vm-muted">Status</p>
              <div className="mt-2 flex flex-col gap-2">
                <span className={`inline-flex w-fit px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(job.paymentStatus)}`}>
                  {job.paymentStatus}
                </span>
                {job.reviewStatus && (
                  <span className={`inline-flex w-fit px-2 py-1 rounded-full text-xs font-medium ${getReviewStatusColor(job.reviewStatus)}`}>
                    Review: {job.reviewStatus}
                  </span>
                )}
              </div>
            </div>
          </div>

          {(job.paymentStatus === 'PENDING' || job.paymentStatus === 'DEPOSIT_PAID') && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              {!showMarkPaid ? (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm text-vm-muted">
                    Collected payment outside Stripe (PayPal, cash, etc.)? Record it here.
                  </p>
                  <button
                    type="button"
                    onClick={openMarkPaid}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-vm-success px-4 py-2 text-sm font-semibold text-white hover:bg-vm-success"
                  >
                    <DollarSign className="w-4 h-4" />
                    Mark as Paid
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-vm-success/30 bg-vm-success-bg p-4">
                  <h3 className="mb-3 text-sm font-semibold text-vm-text">Record a payment</h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-vm-text">
                        Amount received ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={markPaidAmount}
                        onChange={(e) => setMarkPaidAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-vm-cyan focus:ring-2 focus:ring-vm-cyan/30"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-vm-text">
                        Payment method
                      </label>
                      <select
                        value={markPaidMethod}
                        onChange={(e) => setMarkPaidMethod(e.target.value)}
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-vm-cyan focus:ring-2 focus:ring-vm-cyan/30"
                      >
                        <option value="PayPal">PayPal</option>
                        <option value="Cash">Cash</option>
                        <option value="Stripe">Stripe</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-vm-text">
                        Reference / note (optional)
                      </label>
                      <input
                        type="text"
                        value={markPaidReference}
                        onChange={(e) => setMarkPaidReference(e.target.value)}
                        placeholder="e.g. PayPal txn ID"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-vm-cyan focus:ring-2 focus:ring-vm-cyan/30"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={handleMarkPaid}
                      disabled={markingPaid}
                      className="inline-flex items-center gap-2 rounded-lg bg-vm-success px-4 py-2 text-sm font-semibold text-white hover:bg-vm-success disabled:opacity-60"
                    >
                      {markingPaid ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Recording…
                        </>
                      ) : (
                        'Confirm Payment'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMarkPaid(false)}
                      disabled={markingPaid}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-vm-text hover:bg-gray-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {job.paymentStatus === 'PAID' && (job.paymentMethod || job.paidAt) && (
            <div className="mt-6 border-t border-gray-100 pt-6">
              <div className="flex items-center gap-2 rounded-lg border border-vm-success/30 bg-vm-success-bg p-4">
                <CheckCircle className="h-5 w-5 shrink-0 text-vm-success" />
                <p className="text-sm text-vm-success">
                  {formatCurrency(job.amountPaid, job.currency)} received
                  {job.paymentMethod ? ` via ${job.paymentMethod}` : ''}
                  {job.paidAt ? ` on ${formatDate(job.paidAt)}` : ''}
                  {job.paymentReference ? ` · Ref: ${job.paymentReference}` : ''}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-6">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-vm-muted mb-2">
                Refund Status
              </p>
              {job.paymentStatus === 'REFUNDED' ? (
                <p className="text-sm font-medium text-vm-text">
                  Deposit refunded to customer
                </p>
              ) : job.reviewStatus === 'REJECTED' ? (
                <p className="text-sm text-orange-800">
                  Booking rejected — check audit log if deposit refund is pending
                </p>
              ) : (
                <p className="text-sm text-vm-muted">No deposit refund issued</p>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-vm-muted mb-2">
                Cleaner Payout
              </p>
              {jobPayout ? (
                <div className="text-sm text-vm-text space-y-2">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPayoutStatusColor(jobPayout.status)}`}
                  >
                    {jobPayout.status}
                  </span>
                  <p>
                    {formatCurrency(jobPayout.cleanerAmount, job.currency)} to cleaner
                  </p>
                  <p className="text-xs text-vm-muted">
                    Gross {formatCurrency(jobPayout.grossAmount, job.currency)}
                    {jobPayout.platformFee != null
                      ? ` · platform ${formatCurrency(jobPayout.platformFee, job.currency)}`
                      : ''}
                    {jobPayout.rulesVersion ? ` · rules ${jobPayout.rulesVersion}` : ''}
                  </p>
                  {jobPayout.paidAt && (
                    <p className="text-xs text-vm-muted">
                      Paid at {new Date(jobPayout.paidAt).toLocaleString()}
                    </p>
                  )}
                  {(jobPayout.executionMethod || payoutSettlement?.methodType) && (
                    <p className="text-xs text-vm-muted">
                      Method: {jobPayout.executionMethod || payoutSettlement?.methodType}
                    </p>
                  )}
                  {(payoutSettlement?.label || payoutSettlement?.reference || jobPayout.externalReferenceId) && (
                    <p className="text-xs text-vm-muted">
                      {payoutSettlement?.label ? `Note: ${payoutSettlement.label}` : null}
                      {payoutSettlement?.label && (payoutSettlement?.reference || jobPayout.externalReferenceId) ? ' · ' : null}
                      {(payoutSettlement?.reference || jobPayout.externalReferenceId)
                        ? `Ref: ${payoutSettlement?.reference || jobPayout.externalReferenceId}`
                        : null}
                    </p>
                  )}
                  {jobPayout.status === 'READY' && (
                    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                      <p className="text-xs font-medium text-vm-text">
                        Pay cleaner manually, then mark paid here
                      </p>
                      <select
                        value={payoutMethod}
                        onChange={(e) => setPayoutMethod(e.target.value)}
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                      >
                        <option value="">Payment method (optional)</option>
                        <option value="ZELLE">Zelle</option>
                        <option value="CASHAPP">Cash App</option>
                        <option value="VENMO">Venmo</option>
                        <option value="BANK">Bank transfer</option>
                        <option value="CASH">Cash</option>
                        <option value="CHECK">Check</option>
                      </select>
                      <input
                        type="text"
                        value={payoutNote}
                        onChange={(e) => setPayoutNote(e.target.value)}
                        placeholder="Payment note (optional)"
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                      />
                      <input
                        type="text"
                        value={payoutReference}
                        onChange={(e) => setPayoutReference(e.target.value)}
                        placeholder="Reference / transaction ID (optional)"
                        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleMarkPayoutPaid}
                        disabled={markingPayoutPaid}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-vm-success px-4 py-2 text-sm font-semibold text-white hover:bg-vm-success/90 disabled:opacity-60"
                      >
                        {markingPayoutPaid ? 'Marking paid…' : 'Mark Cleaner Paid'}
                      </button>
                    </div>
                  )}
                  {jobPayout.status === 'FAILED' && (
                    <p className="text-xs text-red-600">
                      Payout failed — review and retry or mark paid manually after resolving.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-vm-text">No payout created yet</p>
              )}
              {!jobPayout && job.payoutEligibility?.reason && (
                <p className="mt-1 text-xs text-vm-muted">{job.payoutEligibility.reason}</p>
              )}
              {job.payoutEligibility && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    job.payoutEligibility.eligible ? 'text-vm-success' : 'text-vm-muted'
                  }`}
                >
                  Eligibility:{' '}
                  {job.payoutEligibility.eligible ? 'Ready' : 'Not eligible'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Job Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-vm-text mb-4">Job Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-vm-muted">Customer</p>
              <p className="text-vm-text font-medium">
                {job.customerName || (job.customer ? `${job.customer.firstName} ${job.customer.lastName}` : 'N/A')}
              </p>
              {job.customer?.email && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm text-vm-muted">{job.customer.email}</p>
                  <button
                    type="button"
                    onClick={handleSendInvite}
                    disabled={sendingInvite}
                    className="inline-flex items-center gap-1.5 rounded-md border border-vm-navy/20 bg-vm-navy/5 px-2.5 py-1 text-xs font-semibold text-vm-navy transition-colors hover:bg-vm-navy/10 disabled:opacity-60"
                  >
                    {sendingInvite ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Sending…
                      </>
                    ) : inviteSent ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-vm-success" />
                        Invite sent
                      </>
                    ) : (
                      'Send Portal Invite'
                    )}
                  </button>
                </div>
              )}
              {job.customer?.phone && (
                <p className="text-sm text-vm-muted">{job.customer.phone}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-vm-muted">Service Type</p>
              <p className="text-vm-text">{job.serviceType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-vm-muted">Date & Time</p>
              <p className="text-vm-text">{formatDate(job.preferredDate)}</p>
              {job.preferredTime && (
                <p className="text-sm text-vm-muted">{job.preferredTime}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-vm-muted">Branch</p>
              <p className="text-vm-text">{job.branch.name}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-vm-muted">Address</p>
              <p className="text-vm-text">{job.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-vm-muted">Quoted Total</p>
              <p className="text-vm-text font-semibold">
                {formatCurrency(job.quotedTotal ?? job.totalPrice, job.currency)}
              </p>
            </div>
            {(job.depositAmount != null || job.amountPaid != null) && (
              <>
                <div>
                  <p className="text-sm text-vm-muted">Deposit / Paid</p>
                  <p className="text-vm-text">
                    {formatCurrency(job.amountPaid ?? job.depositAmount, job.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-vm-muted">Balance Due</p>
                  <p className="text-vm-text">
                    {formatCurrency(job.balanceDue ?? 0, job.currency)}
                  </p>
                </div>
              </>
            )}
            {job.reviewStatus && (
              <div>
                <p className="text-sm text-vm-muted">Review Status</p>
                <p className="text-vm-text">{job.reviewStatus}</p>
              </div>
            )}
            {job.assignedCleaner && (
              <div>
                <p className="text-sm text-vm-muted">Assigned Cleaner</p>
                <p className="text-vm-text font-medium">{job.assignedCleaner.name || 'N/A'}</p>
                <p className="text-sm text-vm-muted">{job.assignedCleaner.email}</p>
              </div>
            )}
          </div>
        </div>

        {needsReview && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-vm-text mb-2">Booking Review</h2>
            <p className="text-sm text-vm-muted mb-4">
              $25 deposit received. Approve this booking to allow cleaner assignment.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={reviewLoading}
                onClick={() => handleReview('approve')}
                className="px-4 py-2 bg-vm-success text-white rounded-lg hover:bg-vm-success disabled:opacity-60"
              >
                Approve Booking
              </button>
              <button
                type="button"
                disabled={reviewLoading}
                onClick={() => handleReview('reject')}
                className="px-4 py-2 bg-vm-danger text-white rounded-lg hover:bg-vm-danger disabled:opacity-60"
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {/* Assignment Section */}
        {/* Phase 2A: Payment Gating - Show assignment UI only if payment is PAID */}
        {isPaymentBlocked ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-vm-text mb-4">Assign Cleaner</h2>
            
            {/* Phase 2A: Payment Gating - Warning message for unpaid jobs */}
            {/* Why unpaid jobs are blocked: Ensures cleaners are only assigned to jobs with guaranteed payment */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    {needsReview ? 'Admin review required before assignment' : 'Payment required before assignment'}
                  </p>
                  <p className="text-sm text-yellow-800 mt-1">
                    {needsReview
                      ? 'Approve the deposit booking before assigning a cleaner.'
                      : `Payment must be confirmed before assignment. Current status: ${job.paymentStatus}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 2A: Disable assignment controls for unpaid jobs */}
            <div className="space-y-4 opacity-50 pointer-events-none">
              <div>
                <label className="block text-sm font-medium text-vm-text mb-2">
                  Select Cleaner
                </label>
                <select
                  value={selectedCleanerId}
                  onChange={(e) => setSelectedCleanerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-100"
                  disabled={true}
                >
                  <option value="">-- Payment required --</option>
                </select>
              </div>
              <button
                disabled={true}
                className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Assignment Disabled
              </button>
            </div>
          </div>
        ) : canAssign ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-vm-text mb-4">Assign Cleaner</h2>

            {cleaners.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-vm-muted">No approved cleaners available for this branch</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-vm-text mb-2">
                    Select Cleaner
                  </label>
                  <select
                    value={selectedCleanerId}
                    onChange={(e) => setSelectedCleanerId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={assigning}
                  >
                    <option value="">-- Select a cleaner --</option>
                    {cleaners.map((cleaner) => (
                      <option key={cleaner.id} value={cleaner.id}>
                        {cleaner.name || cleaner.email}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleAssign()}
                  disabled={assigning || !selectedCleanerId}
                  className="w-full px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Assign Cleaner
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <p className="text-vm-muted">
              {job.assignedCleaner 
                ? 'This job is already assigned to a cleaner'
                : 'This job cannot be assigned in its current status'}
            </p>
          </div>
        )}

        <div className="mt-6">
          <JobChecklistSection
            jobId={jobId}
            mode="audit"
            apiBase="admin"
            title="50-Point Hospitality Audit"
          />
          <p className="mt-2 text-[10px] font-sans text-vm-muted">
            {CARE_CHECKLIST_TOTAL} certified standards · timestamps from specialist
            checklist submissions
          </p>
        </div>

        {/* Phase 2B: Admin Audit Log Timeline */}
        {/* Why audit logs exist: Track admin actions for compliance and debugging */}
        {/* Scope: Phase 2B is read-only - no editing or deletion */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-vm-muted" />
            <h2 className="text-xl font-semibold text-vm-text">Audit Log</h2>
          </div>
          
          {auditLogs.length === 0 ? (
            <div className="text-center py-8 text-vm-muted">
              <p>No audit log entries found for this job</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Phase 2B: Display audit logs in chronological order (most recent first) */}
              {auditLogs.map((log, index) => (
                <div
                  key={log.id}
                  className="flex gap-4 pb-4 border-b border-gray-100 last:border-0"
                >
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-vm-navy mt-2"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div className="flex-1">
                        <p className="font-medium text-vm-text">{log.eventType}</p>
                        <p className="text-sm text-vm-muted">
                          Admin: {log.adminEmail}
                        </p>
                        {log.cleanerId && (
                          <p className="text-sm text-vm-muted">
                            Cleaner: {log.cleanerName || log.cleanerId}
                          </p>
                        )}
                        {log.notes && (
                          <p className="text-sm text-vm-muted mt-1 italic">{log.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-vm-muted flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(log.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


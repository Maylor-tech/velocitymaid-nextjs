'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import JobStatusBadge from '@/components/customer/jobs/JobStatusBadge';
import JobDetailSection from '@/components/customer/jobs/JobDetailSection';
import CleanerCard from '@/components/customer/jobs/CleanerCard';
import PriceBreakdown from '@/components/customer/jobs/PriceBreakdown';
import ActionButtons from '@/components/customer/jobs/ActionButtons';
import PayBalanceSection from '@/components/customer/jobs/PayBalanceSection';
import RequestChangeModal from '@/components/customer/actions/RequestChangeModal';
import CancelJobModal from '@/components/customer/actions/CancelJobModal';
import {
  Calendar,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { JobChecklistSection } from '@/components/brand/JobChecklistSection';
import { canShowPayBalance } from '@/lib/booking/payBalanceVisibility';

interface JobDetails {
  id: string;
  date: string | null;
  startTime: string | null;
  duration: number | null;
  address: string;
  status: string;
  subtotal: number | null;
  fees: number;
  total: number | null;
  notes: string | null;
  cleaner: {
    id: string;
    name: string;
    averageRating: number | null;
  } | null;
  number?: string;
  serviceType?: string;
  scheduledDate?: string;
  timeWindow?: string;
  price?: number | null;
  currency?: string;
  branchName?: string;
  paymentStatus?: string;
  reviewStatus?: string;
  amountPaid?: number | null;
  balanceDue?: number | null;
  depositAmount?: number | null;
  completedAt?: string;
}

function JobDetailsContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = params?.jobId as string;

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [balancePaymentSuccess, setBalancePaymentSuccess] = useState(false);
  const [balancePaymentPending, setBalancePaymentPending] = useState(false);
  const [showRequestChangeModal, setShowRequestChangeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const balanceReturn = searchParams.get('balance');
  const stripeSessionId = searchParams.get('session_id');

  const fetchJobDetails = useCallback(async (options?: { silent?: boolean }) => {
    try {
      if (!options?.silent) {
        setLoading(true);
        setError(null);
      }

      const response = await fetch(`/api/customer/jobs/${jobId}`);
      const data = await response.json();

      if (data.success) {
        setJob(data.job);
        return data.job as JobDetails;
      }

      if (response.status === 404) {
        setError('Job not found or you do not have access to this job.');
      } else {
        throw new Error(data.error || 'Failed to fetch job');
      }
      return null;
    } catch (err: unknown) {
      console.error('Error fetching job details:', err);
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      }
      return null;
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, fetchJobDetails]);

  // Handle return from Stripe balance checkout
  useEffect(() => {
    if (!jobId || balanceReturn !== 'success') return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 8;

    const pollForPaid = async () => {
      setBalancePaymentPending(true);
      while (!cancelled && attempts < maxAttempts) {
        attempts += 1;
        const latest = await fetchJobDetails({ silent: true });
        if (latest?.paymentStatus === 'PAID') {
          setBalancePaymentSuccess(true);
          setBalancePaymentPending(false);
          router.replace(`/customer/jobs/${jobId}`, { scroll: false });
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) {
        setBalancePaymentPending(false);
        setSuccess(
          'Payment received — your balance may take a moment to update. Refresh if needed.'
        );
        router.replace(`/customer/jobs/${jobId}`, { scroll: false });
      }
    };

    pollForPaid();
    return () => {
      cancelled = true;
    };
  }, [jobId, balanceReturn, stripeSessionId, fetchJobDetails, router]);

  useEffect(() => {
    if (balanceReturn === 'cancelled') {
      setError(null);
      router.replace(`/customer/jobs/${jobId}`, { scroll: false });
    }
  }, [balanceReturn, jobId, router]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return 'TBD';
    return timeStr;
  };

  const handleRequestChangeSuccess = () => {
    setSuccess('Your change request has been submitted. Our team will review it shortly.');
    fetchJobDetails();
  };

  const handleCancelSuccess = () => {
    setSuccess('Your appointment has been cancelled.');
    setTimeout(() => {
      router.push('/customer/jobs');
    }, 2000);
  };

  const showPayBalance =
    job &&
    canShowPayBalance({
      status: job.status,
      paymentStatus: job.paymentStatus,
      balanceDue: job.balanceDue,
      reviewStatus: job.reviewStatus,
    });

  const isFullyPaid =
    job?.paymentStatus === 'PAID' &&
    job.status.toUpperCase() === 'COMPLETED';

  if (loading && !job) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading job details...</span>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-600 font-medium mb-2">Error</p>
        <p className="text-red-500 text-sm mb-4">{error || 'Job not found'}</p>
        <button
          onClick={() => router.push('/customer/jobs')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {balancePaymentPending && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 shrink-0" />
          <p className="text-sm text-blue-900">Confirming your secure payment…</p>
        </div>
      )}

      {balancePaymentSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-green-800">
            Thank you — your remaining balance is paid in full. We appreciate your trust in
            VelocityMaid.
          </p>
        </div>
      )}

      {success && !balancePaymentSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {isFullyPaid && !balancePaymentSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800">This job is fully paid. Thank you.</p>
        </div>
      )}

      <div>
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to Jobs
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {job.serviceType || 'Cleaning Service'}
            </h1>
            {job.number && <p className="text-gray-500">Job #{job.number}</p>}
          </div>
          <JobStatusBadge status={job.status} />
        </div>
      </div>

      {showPayBalance && job.balanceDue != null && job.balanceDue > 0 && (
        <PayBalanceSection
          jobId={jobId}
          balanceDue={job.balanceDue}
          currency={job.currency}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <JobDetailSection
            icon={<Calendar className="w-5 h-5" />}
            label="Date"
            value={formatDate(job.date || job.scheduledDate)}
          />
          <JobDetailSection
            icon={<Clock className="w-5 h-5" />}
            label="Time"
            value={formatTime(job.startTime || job.timeWindow)}
          />
          {job.duration && (
            <JobDetailSection
              icon={<Clock className="w-5 h-5" />}
              label="Duration"
              value={`${job.duration} minutes`}
            />
          )}
          <JobDetailSection
            icon={<MapPin className="w-5 h-5" />}
            label="Address"
            value={job.address}
          />
        </div>

        {job.cleaner && <CleanerCard cleaner={job.cleaner} />}

        {(job.subtotal !== null || job.total !== null) && (
          <PriceBreakdown
            subtotal={job.subtotal}
            fees={job.fees}
            total={job.total}
            currency={job.currency}
            depositAmount={job.depositAmount}
            amountPaid={job.amountPaid}
            balanceDue={job.balanceDue}
            paymentStatus={job.paymentStatus}
          />
        )}

        {job.notes && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{job.notes}</p>
          </div>
        )}
      </div>

      <JobChecklistSection
        jobId={jobId}
        mode="readonly"
        apiBase="customer"
        title="Hospitality Standards Progress"
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
        <ActionButtons
          status={job.status}
          jobDate={job.date || job.scheduledDate || undefined}
          onRequestChange={() => setShowRequestChangeModal(true)}
          onCancel={() => setShowCancelModal(true)}
        />
      </div>

      {showRequestChangeModal && (
        <RequestChangeModal
          jobId={jobId}
          currentDate={job.date || job.scheduledDate || undefined}
          currentTime={job.startTime || job.timeWindow || undefined}
          currentAddress={job.address}
          onClose={() => setShowRequestChangeModal(false)}
          onSuccess={handleRequestChangeSuccess}
        />
      )}

      {showCancelModal && (
        <CancelJobModal
          jobId={jobId}
          onClose={() => setShowCancelModal(false)}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}

export default function JobDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading job details...</span>
        </div>
      }
    >
      <JobDetailsContent />
    </Suspense>
  );
}

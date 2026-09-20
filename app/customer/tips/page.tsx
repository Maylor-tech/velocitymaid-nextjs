'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CustomerLayout from '../components/CustomerLayout';
import { Heart, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { tipUrlForJob } from '@/lib/tips/tipLinks';

interface EligibleJob {
  jobId: string;
  date: string;
  serviceType: string;
  cleanerName: string;
  cleanerId: string | null;
  address: string;
  alreadyTipped: boolean;
  tipAmount: number | null;
}

/**
 * Host tip picker — lists recent jobs and deep-links into the canonical
 * /tip?jobId= flow (Stripe + Zelle). Does not use the legacy Checkout path.
 */
export default function TipsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams?.get('status');

  const [jobs, setJobs] = useState<EligibleJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEligibleJobs();
  }, []);

  const fetchEligibleJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/tips/eligible-jobs');
      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error('Error fetching eligible jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatServiceType = (type: string) => {
    const types: Record<string, string> = {
      basic: 'Basic Clean',
      deep: 'Deep Clean',
      moveInOut: 'Move In/Out Clean',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-vm-muted">Loading...</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-vm-text mb-2">Tips</h1>
        <p className="text-vm-muted">
          Thank your cleaner for a completed cleaning. You will not need a job ID.
        </p>
      </div>

      {status === 'success' && (
        <div className="mb-6 bg-vm-success-bg border border-vm-success/30 rounded-lg p-4">
          <p className="text-vm-success font-medium">
            Tip payment successful! Thank you for your generosity.
          </p>
        </div>
      )}

      {status === 'cancel' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800">Tip payment was cancelled.</p>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="text-center py-12 bg-vm-surface rounded-lg">
          <Heart className="w-16 h-16 text-vm-muted mx-auto mb-4" />
          <p className="text-vm-muted mb-4">No tippable jobs yet.</p>
          <p className="text-sm text-vm-muted mb-4">
            Once you have completed cleanings, you can tip from here or from the job
            detail page.
          </p>
          <Link
            href="/customer/jobs"
            className="inline-block px-4 py-2 bg-vm-navy text-white rounded-lg font-medium"
          >
            Go to My Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.jobId}
              className={`bg-white rounded-lg shadow p-6 ${
                job.alreadyTipped ? 'opacity-75' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-vm-text">
                      {formatServiceType(job.serviceType)}
                    </h3>
                    {job.alreadyTipped && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-vm-success-bg text-vm-success text-xs rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Tipped ${job.tipAmount?.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-vm-muted">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(job.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{job.address}</span>
                    </div>
                    {job.cleanerName && (
                      <p className="text-vm-muted">Cleaner: {job.cleanerName}</p>
                    )}
                  </div>
                </div>
                <div>
                  {job.alreadyTipped ? (
                    <span className="text-sm text-vm-muted">Already tipped</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push(tipUrlForJob(job.jobId))}
                      className="px-4 py-2 bg-vm-cyan text-vm-navy rounded-lg hover:bg-vm-cyan/90 transition-colors font-medium"
                    >
                      Tip Cleaner
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}

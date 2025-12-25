"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight } from 'lucide-react';
import CleanerHeader from '../components/CleanerHeader';
import Tabs, { TabType } from '../components/Tabs';
import JobList from '../components/JobList';
import type { CleanerJob } from '../components/JobCard';
import CertificationBadge from '../training/components/CertificationBadge';
import PaymentMethodBanner from '../../../components/cleaner/PaymentMethodBanner';

interface CleanerInfo {
  id: string;
  name: string;
  email: string;
  branchId: string | null;
  branchName: string | null;
  branchSlug: string | null;
  primaryBranchId: string | null;
  assignedBranches: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface TrainingProgress {
  showTraining: boolean;
  progress?: {
    completed: number;
    total: number;
    percentage: number;
  };
  overallStatus?: string;
  trainingUrl?: string;
  isCertified?: boolean;
  certificateId?: string | null;
}

export default function CleanerDashboardPage() {
  const router = useRouter();
  const [cleaner, setCleaner] = useState<CleanerInfo | null>(null);
  const [jobs, setJobs] = useState<CleanerJob[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [paymentMethodVerified, setPaymentMethodVerified] = useState<boolean | null>(null);

  // Fetch cleaner info
  useEffect(() => {
    fetchCleanerInfo();
    fetchTrainingProgress();
    fetchPaymentMethodStatus();
  }, []);

  // Fetch jobs when tab changes
  useEffect(() => {
    if (cleaner) {
      fetchJobs();
    }
  }, [cleaner, activeTab]);

  const fetchCleanerInfo = async () => {
    try {
      const response = await fetch('/api/cleaners/me');
      const data = await response.json();

      if (data.success) {
        setCleaner(data.cleaner);
      } else {
        // Not authenticated, redirect to login
        router.push('/cleaners/login');
      }
    } catch (err: any) {
      console.error('Error fetching cleaner info:', err);
      router.push('/cleaners/login');
    }
  };

  const fetchTrainingProgress = async () => {
    try {
      const response = await fetch('/api/training/progress');
      const result = await response.json();
      if (result.success) {
        setTrainingProgress(result);
      }
    } catch (err) {
      // Silently fail - training is optional
      console.error('Error fetching training progress:', err);
    }
  };

  const fetchPaymentMethodStatus = async () => {
    try {
      const response = await fetch('/api/cleaners/payment-method/status');
      const data = await response.json();
      if (data.success) {
        setPaymentMethodVerified(data.verified);
      }
    } catch (err) {
      // Silently fail - payment method check is optional
      console.error('Error fetching payment method status:', err);
    }
  };

  const fetchJobs = async () => {
    if (!cleaner) return;

    setLoading(true);
    setError(null);

    try {
      let url = '/api/cleaners/jobs';
      const params = new URLSearchParams();

      if (activeTab === 'today') {
        params.append('todayOnly', 'true');
      } else if (activeTab === 'upcoming') {
        params.append('upcomingOnly', 'true');
      } else if (activeTab === 'completed') {
        // Fetch all and filter client-side
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        let filteredJobs = data.jobs;

        // Filter completed jobs if on completed tab
        if (activeTab === 'completed') {
          filteredJobs = filteredJobs.filter(
            (job: CleanerJob) => job.status === 'completed' || job.status === 'cancelled'
          );
        } else if (activeTab === 'today' || activeTab === 'upcoming') {
          // Exclude completed/cancelled from today/upcoming
          filteredJobs = filteredJobs.filter(
            (job: CleanerJob) => job.status !== 'completed' && job.status !== 'cancelled'
          );
        }

        setJobs(filteredJobs);
      } else {
        setError(data.error || 'Failed to fetch jobs');
      }
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (jobId: string, newStatus: string) => {
    // Optimistic update
    const updatedJobs = jobs.map((job) =>
      job.id === jobId ? { ...job, status: newStatus as CleanerJob['status'] } : job
    );
    setJobs(updatedJobs);

    try {
      const response = await fetch('/api/cleaners/jobs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId, status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Update with server response
        const finalJobs = jobs.map((job) =>
          job.id === jobId ? data.job : job
        );
        setJobs(finalJobs);
      } else {
        // Revert on error
        setJobs(jobs);
        alert(data.error || 'Failed to update job status');
      }
    } catch (err: any) {
      // Revert on error
      setJobs(jobs);
      console.error('Error updating job status:', err);
      alert('Failed to update job status');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/cleaners/login', {
        method: 'DELETE',
      });
      router.push('/cleaners/login');
    } catch (err) {
      console.error('Logout error:', err);
      router.push('/cleaners/login');
    }
  };

  if (!cleaner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'today':
        return "You don't have any jobs scheduled for today";
      case 'upcoming':
        return "You don't have any upcoming jobs";
      case 'completed':
        return "You haven't completed any jobs yet";
      default:
        return 'No jobs found';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <CleanerHeader
          name={cleaner.name}
          branchName={cleaner.branchName || undefined}
          branchSlug={cleaner.branchSlug || undefined}
          onLogout={handleLogout}
        />

        {/* Payment Method Banner (Week 2 Requirement) */}
        <PaymentMethodBanner 
          hasVerifiedPaymentMethod={paymentMethodVerified === true}
        />

        {/* Certification Badge */}
        {trainingProgress?.isCertified && (
          <div className="mb-6 flex flex-col items-center gap-3">
            <CertificationBadge size="lg" />
            {trainingProgress.certificateId && (
              <button
                onClick={() => router.push(`/cleaners/certificate/${trainingProgress.certificateId}`)}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                View Certificate
              </button>
            )}
          </div>
        )}

        {/* Training Required Banner */}
        {trainingProgress?.showTraining && trainingProgress.overallStatus !== 'PASSED' && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                  Training Required
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  You must complete all training modules before you can receive job assignments.
                </p>
                <button
                  onClick={() => router.push('/cleaners/training')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                >
                  Complete Training
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Training Progress Card (Jamaica only) */}
        {trainingProgress?.showTraining && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Training Progress</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Complete your Jamaica training modules to start receiving jobs.
                </p>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${trainingProgress.progress?.percentage || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {trainingProgress.progress?.completed || 0} / {trainingProgress.progress?.total || 0}
                  </span>
                </div>
                <button
                  onClick={() => router.push(trainingProgress.trainingUrl || '/cleaners/training')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Go to Training →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scorecard, Incentives & Earnings Links */}
        <div className="mb-6 flex justify-end gap-3 flex-wrap">
          {trainingProgress?.isCertified && (
            <button
              onClick={() => router.push('/cleaners/sop')}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-colors font-semibold shadow-md flex items-center gap-2"
            >
              <span>📚</span>
              SOP Library
            </button>
          )}
          <button
            onClick={() => router.push('/cleaners/scorecard')}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors font-semibold shadow-md flex items-center gap-2"
          >
            <span>📊</span>
            View Scorecard
          </button>
          <button
            onClick={() => router.push('/cleaners/incentives')}
            className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-colors font-semibold shadow-md flex items-center gap-2"
          >
            <span>💰</span>
            My Incentives
          </button>
          <button
            onClick={() => router.push('/cleaner/earnings')}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-colors font-semibold shadow-md flex items-center gap-2"
          >
            <span>💵</span>
            My Earnings
          </button>
        </div>

        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading jobs...</p>
          </div>
        ) : (
          <JobList
            jobs={jobs}
            onStatusUpdate={handleStatusUpdate}
            emptyMessage={getEmptyMessage()}
          />
        )}
      </div>
    </div>
  );
}


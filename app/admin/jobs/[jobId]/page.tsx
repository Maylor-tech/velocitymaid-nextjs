"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, User, Calendar, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Job {
  id: string;
  customerName: string | null;
  address: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  serviceType: string | null;
  serviceLocation: string | null;
  status: string;
  totalPrice: number | null;
  currency: string | null;
  paymentStatus: string;
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
}

interface Cleaner {
  id: string;
  name: string | null;
  email: string;
}

export default function AdminJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

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
          confirmReassign: confirmReassign || (job?.assignedCleanerId && job.assignedCleanerId !== selectedCleanerId),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToastMessage('Cleaner assigned successfully');
        setToastType('success');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        fetchJob(); // Refresh job data - UI updates immediately
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
    if (statusLower.includes('completed')) return 'bg-green-100 text-green-800';
    if (statusLower.includes('cancelled')) return 'bg-red-100 text-red-800';
    if (statusLower.includes('assigned')) return 'bg-blue-100 text-blue-800';
    if (statusLower.includes('in_progress') || statusLower.includes('on_the_way')) return 'bg-purple-100 text-purple-800';
    if (statusLower.includes('confirmed')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const canAssign = job && job.paymentStatus === 'PAID' && (job.status === 'CONFIRMED' || job.status === 'RECEIVED' || !job.assignedCleanerId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading job...</p>
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
              toastType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Details</h1>
              <p className="text-gray-600">Job ID: {job.id}</p>
            </div>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(job.paymentStatus)}`}>
                {job.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Job Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="text-gray-900 font-medium">
                {job.customerName || (job.customer ? `${job.customer.firstName} ${job.customer.lastName}` : 'N/A')}
              </p>
              {job.customer?.email && (
                <p className="text-sm text-gray-500">{job.customer.email}</p>
              )}
              {job.customer?.phone && (
                <p className="text-sm text-gray-500">{job.customer.phone}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Service Type</p>
              <p className="text-gray-900">{job.serviceType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="text-gray-900">{formatDate(job.preferredDate)}</p>
              {job.preferredTime && (
                <p className="text-sm text-gray-500">{job.preferredTime}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Branch</p>
              <p className="text-gray-900">{job.branch.name}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-gray-900">{job.address || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Price</p>
              <p className="text-gray-900 font-semibold">{formatCurrency(job.totalPrice, job.currency)}</p>
            </div>
            {job.assignedCleaner && (
              <div>
                <p className="text-sm text-gray-500">Assigned Cleaner</p>
                <p className="text-gray-900 font-medium">{job.assignedCleaner.name || 'N/A'}</p>
                <p className="text-sm text-gray-500">{job.assignedCleaner.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Section */}
        {canAssign ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Assign Cleaner</h2>
            
            {job.paymentStatus !== 'PAID' && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Payment Required</p>
                    <p className="text-sm text-yellow-800 mt-1">
                      Only PAID jobs can be assigned to cleaners. Current payment status: {job.paymentStatus}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {cleaners.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-gray-600">No approved cleaners available for this branch</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  onClick={handleAssign}
                  disabled={assigning || !selectedCleanerId}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            <p className="text-gray-600">
              {job.assignedCleaner 
                ? 'This job is already assigned to a cleaner'
                : job.paymentStatus !== 'PAID'
                ? 'This job must be PAID before it can be assigned'
                : 'This job cannot be assigned in its current status'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


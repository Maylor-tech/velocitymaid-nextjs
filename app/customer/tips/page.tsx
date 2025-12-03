'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import { Heart, DollarSign, Calendar, MapPin, CheckCircle } from 'lucide-react';

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

export default function TipsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams?.get('status');

  const [jobs, setJobs] = useState<EligibleJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<EligibleJob | null>(null);
  const [tipAmount, setTipAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);

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

  const handleTipClick = (job: EligibleJob) => {
    if (job.alreadyTipped) {
      return; // Don't allow re-tipping
    }
    setSelectedJob(job);
    setTipAmount(null);
    setCustomAmount('');
    setShowTipModal(true);
  };

  const handleTipAmountSelect = (amount: number) => {
    setTipAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmount = (value: string) => {
    setCustomAmount(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setTipAmount(numValue);
    } else {
      setTipAmount(null);
    }
  };

  const handleSubmitTip = async () => {
    if (!selectedJob || !tipAmount || tipAmount <= 0) {
      alert('Please select a tip amount');
      return;
    }

    if (!selectedJob.cleanerId) {
      alert('Cleaner information not available for this job');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/customer/tips/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId: selectedJob.jobId,
          cleanerId: selectedJob.cleanerId,
          tipAmount,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create tip payment');
      }
    } catch (error) {
      console.error('Error creating tip:', error);
      alert('Failed to create tip payment');
    } finally {
      setCreating(false);
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
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tips</h1>
        <p className="text-gray-600">Thank you for supporting your cleaners!</p>
      </div>

      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-600 font-medium">Tip payment successful! Thank you for your generosity.</p>
          </div>
        </div>
      )}

      {status === 'cancel' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-600">Tip payment was cancelled.</p>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-2">No completed jobs yet</p>
          <p className="text-sm text-gray-500">
            Once you have completed cleanings, you'll be able to tip your cleaners here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.jobId}
              className={`bg-white rounded-xl shadow-md p-6 ${
                job.alreadyTipped ? 'opacity-75' : 'hover:shadow-lg transition-shadow'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {formatServiceType(job.serviceType)}
                    </h3>
                    {job.alreadyTipped && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Tipped ${job.tipAmount?.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(job.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{job.address}</span>
                    </div>
                    <p className="text-gray-700 font-medium">Cleaner: {job.cleanerName}</p>
                  </div>
                </div>
                <div>
                  {job.alreadyTipped ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                    >
                      Already Tipped
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTipClick(job)}
                      className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-semibold flex items-center gap-2"
                    >
                      <Heart className="w-4 h-4" />
                      Tip Cleaner
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tip Modal */}
      {showTipModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tip Your Cleaner</h2>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Service: {formatServiceType(selectedJob.serviceType)}</p>
              <p className="text-sm text-gray-600 mb-2">Cleaner: {selectedJob.cleanerName}</p>
              <p className="text-sm text-gray-600">Date: {formatDate(selectedJob.date)}</p>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">Select Tip Amount</p>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[5, 10, 20].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleTipAmountSelect(amount)}
                    className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                      tipAmount === amount
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="1000"
                    value={customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {tipAmount && (
              <div className="mb-6 p-4 bg-pink-50 border border-pink-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Tip Amount</p>
                <p className="text-2xl font-bold text-pink-600">${tipAmount.toFixed(2)}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmitTip}
                disabled={!tipAmount || tipAmount <= 0 || creating}
                className="flex-1 bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors disabled:bg-gray-400"
              >
                {creating ? 'Processing...' : 'Pay Tip Securely'}
              </button>
              <button
                onClick={() => {
                  setShowTipModal(false);
                  setSelectedJob(null);
                  setTipAmount(null);
                  setCustomAmount('');
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}




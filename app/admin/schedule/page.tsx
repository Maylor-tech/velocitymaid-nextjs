export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, MessageCircle, Send, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Job {
  id: string;
  customerName: string;
  customerPhone: string | null;
  preferredDate: string;
  preferredTime: string | null;
  serviceType: string | null;
  address: string | null;
  status: string;
  totalPrice: any;
  currency: string | null;
  assignedCleaner: {
    id: string;
    name: string;
    trainingStatus: string;
  } | null;
  branch: {
    id: string;
    name: string;
    slug: string;
    country: string;
  };
  customer: {
    id: string;
    preferSameCleaner: boolean;
  } | null;
  availableCleaners: Array<{
    id: string;
    name: string;
    email: string;
    trainingStatus: string;
    hasAvailability: boolean;
  }>;
}

export default function AdminSchedulePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [branches, setBranches] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
    fetchJobs();
  }, [selectedBranch]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/admin/branches');
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const url = selectedBranch !== 'all'
        ? `/api/admin/schedule/jobs?branchId=${selectedBranch}&days=14`
        : '/api/admin/schedule/jobs?days=14';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs || []);
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

  const handleAssign = async (jobId: string, cleanerId: string) => {
    setAssigning(jobId);
    try {
      const response = await fetch('/api/admin/schedule/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          cleanerId,
          sendWhatsApp: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchJobs(); // Refresh list
        alert('Job assigned successfully!');
      } else {
        alert(data.error || 'Failed to assign job');
      }
    } catch (err: any) {
      console.error('Error assigning job:', err);
      alert(err.message || 'Failed to assign job');
    } finally {
      setAssigning(null);
    }
  };

  const handleReassign = async (jobId: string, newCleanerId: string) => {
    setAssigning(jobId);
    try {
      const response = await fetch('/api/admin/schedule/reassign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          newCleanerId,
          sendWhatsApp: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchJobs(); // Refresh list
        alert('Job reassigned successfully!');
      } else {
        alert(data.error || 'Failed to reassign job');
      }
    } catch (err: any) {
      console.error('Error reassigning job:', err);
      alert(err.message || 'Failed to reassign job');
    } finally {
      setAssigning(null);
    }
  };

  const handleSendWhatsApp = async (jobId: string, cleanerId: string) => {
    try {
      const response = await fetch('/api/admin/schedule/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          cleanerId,
          sendWhatsApp: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('WhatsApp message sent!');
      } else {
        alert(data.error || 'Failed to send WhatsApp message');
      }
    } catch (err: any) {
      console.error('Error sending WhatsApp:', err);
      alert(err.message || 'Failed to send WhatsApp message');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'TBD';
    const timeMap: Record<string, string> = {
      morning: '9 AM - 12 PM',
      afternoon: '12 PM - 3 PM',
      evening: '3 PM - 6 PM',
    };
    return timeMap[time] || time;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      ACCEPTED: { label: 'Accepted', color: 'bg-green-100 text-green-800' },
      DECLINED: { label: 'Declined', color: 'bg-red-100 text-red-800' },
      assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Completed', color: 'bg-gray-100 text-gray-800' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Scheduling Dashboard</h1>
              <p className="text-gray-600">Manage job assignments and cleaner availability</p>
            </div>
            <div className="flex gap-4">
              <Link
                href="/admin/schedule/calendar"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                Calendar View
              </Link>
              <button
                onClick={fetchJobs}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Branch:</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-600">No upcoming jobs found</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{job.customerName}</h3>
                      {getStatusBadge(job.status)}
                      {job.customer?.preferSameCleaner && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                          Prefers Same Cleaner
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(job.preferredDate)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {formatTime(job.preferredTime)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {job.address || 'TBD'}
                      </div>
                      <div>
                        <strong>Pay:</strong>{' '}
                        {job.currency === 'JMD' ? 'J$' : '$'}
                        {Number(job.totalPrice || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Cleaner */}
                {job.assignedCleaner && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            Assigned: {job.assignedCleaner.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            Training: {job.assignedCleaner.trainingStatus}
                          </p>
                        </div>
                      </div>
                      {job.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendWhatsApp(job.id, job.assignedCleaner!.id)}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                          >
                            <Send className="w-4 h-4" />
                            Resend WhatsApp
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Available Cleaners */}
                {job.availableCleaners.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Available Cleaners ({job.availableCleaners.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {job.availableCleaners.map((cleaner) => (
                        <div
                          key={cleaner.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-gray-900">{cleaner.name}</p>
                            {cleaner.trainingStatus === 'PASSED' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{cleaner.email}</p>
                          <div className="flex gap-2">
                            {!job.assignedCleaner ? (
                              <button
                                onClick={() => handleAssign(job.id, cleaner.id)}
                                disabled={assigning === job.id}
                                className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                              >
                                {assigning === job.id ? 'Assigning...' : 'Assign'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReassign(job.id, cleaner.id)}
                                disabled={assigning === job.id}
                                className="flex-1 px-3 py-1.5 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors disabled:bg-gray-400"
                              >
                                {assigning === job.id ? 'Reassigning...' : 'Reassign'}
                              </button>
                            )}
                            <button
                              onClick={() => handleSendWhatsApp(job.id, cleaner.id)}
                              className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {job.availableCleaners.length === 0 && !job.assignedCleaner && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      No available cleaners found for this job. Check cleaner availability settings.
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


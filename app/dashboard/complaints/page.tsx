'use client';

// TODO: Protect this route with admin authentication
// import { useAuth } from '@/hooks/useAuth';
// if (!isAdmin) {
//   redirect('/');
// }

import { useState, useEffect } from 'react';
import ComplaintFilters from './components/ComplaintFilters';
import ComplaintStats from './components/ComplaintStats';
import ComplaintsTable from './components/ComplaintsTable';
import ComplaintDetailModal from './components/ComplaintDetailModal';
import type { Complaint, ComplaintStatus, ResolutionType, ComplaintStats as ComplaintStatsType } from '@/utils/complaintData';

type ServiceRegion = 'new_jersey' | 'vermont' | null;

export default function ComplaintsDashboardPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStatsType | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all');
  const [regionFilter, setRegionFilter] = useState<ServiceRegion>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, regionFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (regionFilter) {
        params.append('location', regionFilter);
      }

      const response = await fetch(`/api/complaints/list?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setComplaints(data.complaints);
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch complaints');
      }
    } catch (err: any) {
      console.error('Error fetching complaints:', err);
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplaint = async (
    complaintId: string,
    updates: {
      status?: ComplaintStatus;
      resolutionType?: ResolutionType | null;
      adminNotes?: string;
    }
  ) => {
    try {
      const response = await fetch('/api/complaints/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complaintId,
          ...updates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh complaints list
        await fetchComplaints();
        setSelectedComplaint(null);
      } else {
        throw new Error(data.error || 'Failed to update complaint');
      }
    } catch (err: any) {
      console.error('Error updating complaint:', err);
      alert(err.message || 'Failed to update complaint');
      throw err;
    }
  };

  if (loading && !complaints.length) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-vm-muted">Loading complaints...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-6 px-6 rounded-xl shadow-lg mb-6">
          <h1 className="text-3xl font-bold mb-2">Customer Complaints & Service Recovery — VelocityMaid</h1>
          <p className="text-red-100 text-sm">Manage and resolve customer complaints</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats */}
        {stats && <ComplaintStats stats={stats} />}

        {/* Filters */}
        <ComplaintFilters
          status={statusFilter}
          region={regionFilter}
          onStatusChange={setStatusFilter}
          onRegionChange={setRegionFilter}
        />

        {/* Complaints Table */}
        <ComplaintsTable
          complaints={complaints}
          onViewComplaint={setSelectedComplaint}
        />

        {/* Complaint Detail Modal */}
        {selectedComplaint && (
          <ComplaintDetailModal
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
            onUpdate={handleUpdateComplaint}
          />
        )}
      </div>
    </div>
  );
}





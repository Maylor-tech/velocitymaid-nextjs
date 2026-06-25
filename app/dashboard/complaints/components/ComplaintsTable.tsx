'use client';

import type { Complaint } from '@/utils/complaintData';
import LocationBadge from '../../../cleaners/components/LocationBadge';

interface ComplaintsTableProps {
  complaints: Complaint[];
  onViewComplaint: (complaint: Complaint) => void;
}

export default function ComplaintsTable({ complaints, onViewComplaint }: ComplaintsTableProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getStatusColor = (status: Complaint['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-vm-warning-bg text-yellow-800';
      case 'in_progress':
        return 'bg-vm-cyan-tint text-blue-800';
      case 'resolved':
        return 'bg-vm-success-bg text-green-800';
      case 'closed':
        return 'bg-gray-100 text-vm-text';
      default:
        return 'bg-gray-100 text-vm-text';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < rating ? 'text-yellow-400' : 'text-vm-muted'}>
            ★
          </span>
        ))}
        <span className="ml-1 text-sm text-vm-muted">{rating}/5</span>
      </div>
    );
  };

  if (complaints.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-vm-text mb-4">Active Complaints</h2>
        <p className="text-vm-muted text-center py-8">No complaints found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-vm-text mb-4">Active Complaints</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Job ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Cleaner
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Rating
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Location
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Resolution
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Last Updated
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {complaints.map((complaint) => (
            <tr
              key={complaint.id}
              className={`hover:bg-gray-50 ${
                complaint.status === 'pending' ? 'bg-yellow-50' : ''
              }`}
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-muted">
                {formatDate(complaint.createdAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-text font-mono">
                {complaint.jobId.substring(0, 12)}...
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-vm-text">
                {complaint.customerName}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-muted">
                {complaint.cleanerId ? complaint.cleanerId.substring(0, 12) + '...' : 'N/A'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {renderStars(complaint.rating)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <LocationBadge location={complaint.serviceLocation} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                  {complaint.status.replace('_', ' ')}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-muted">
                {complaint.resolutionType ? (
                  <span className="capitalize">{complaint.resolutionType.replace('_', ' ')}</span>
                ) : (
                  <span className="text-vm-muted">—</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-muted">
                {formatDateTime(complaint.updatedAt)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <button
                  onClick={() => onViewComplaint(complaint)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View / Update
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}





'use client';

import LocationBadge from '../../components/LocationBadge';
import StatusBadge from '../../components/StatusBadge';
import type { CleanerJobWithTimestamps } from '@/utils/cleanerScorecardQueries';

interface JobsTableProps {
  jobs: CleanerJobWithTimestamps[];
}

export default function JobsTable({ jobs }: JobsTableProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-vm-text mb-4">Recent Jobs</h2>
        <p className="text-vm-muted text-center py-8">No jobs found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-vm-text mb-4">Recent Jobs</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Job ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Region
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
              On-Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-text">
                {job.sessionId.substring(0, 12)}...
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-vm-text">
                {job.customerName}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-vm-muted">
                {formatDate(job.preferredDate)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <LocationBadge location={job.serviceLocation} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <StatusBadge status={job.status} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                {job.onTime === undefined ? (
                  <span className="text-vm-muted">N/A</span>
                ) : job.onTime ? (
                  <span className="text-green-600 font-medium">✓ Yes</span>
                ) : (
                  <span className="text-red-600 font-medium">✗ No</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}





'use client';

import type { CleanerPayout } from '../../../../utils/payoutData';
import LocationBadge from '../../../cleaners/components/LocationBadge';
import { getAllCleaners } from '../../../../utils/cleanerData';

interface PayoutsTableProps {
  payouts: CleanerPayout[];
  onViewPayout: (payout: CleanerPayout) => void;
  onApprove: (payoutId: string) => void;
  onMarkPaid: (payoutId: string) => void;
}

export default function PayoutsTable({
  payouts,
  onViewPayout,
  onApprove,
  onMarkPaid,
}: PayoutsTableProps) {
  const cleaners = getAllCleaners();
  const cleanerMap = new Map(cleaners.map(c => [c.id, c.name]));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: CleanerPayout['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (payouts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payouts</h2>
        <p className="text-gray-500 text-center py-8">No payouts found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Payouts</h2>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cleaner
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Branch
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Period
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Jobs
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Base
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Bonus
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Deductions
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Net Payout
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {payouts.map((payout) => (
            <tr
              key={payout.id}
              className={`hover:bg-gray-50 ${
                payout.status === 'pending' ? 'bg-yellow-50' : ''
              }`}
            >
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                {cleanerMap.get(payout.cleanerId) || payout.cleanerId.substring(0, 12) + '...'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <LocationBadge location={payout.branch} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                {payout.totalJobs}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                ${payout.baseEarnings.toFixed(2)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                ${payout.bonusEarnings.toFixed(2)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600">
                ${payout.deductions.toFixed(2)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                ${payout.netPayout.toFixed(2)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                  {payout.status}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <div className="flex gap-2">
                  <button
                    onClick={() => onViewPayout(payout)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View
                  </button>
                  {payout.status === 'pending' && (
                    <button
                      onClick={() => onApprove(payout.id)}
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      Approve
                    </button>
                  )}
                  {payout.status === 'approved' && (
                    <button
                      onClick={() => onMarkPaid(payout.id)}
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}





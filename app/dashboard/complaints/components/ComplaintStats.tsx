'use client';

import type { ComplaintStats as ComplaintStatsType } from '@/utils/complaintData';

interface ComplaintStatsProps {
  stats: ComplaintStatsType;
}

export default function ComplaintStats({ stats }: ComplaintStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
        <p className="text-sm font-medium text-gray-600 mb-1">Open Complaints</p>
        <p className="text-3xl font-bold text-gray-900">{stats.openComplaints}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
        <p className="text-sm font-medium text-gray-600 mb-1">Open (NJ)</p>
        <p className="text-3xl font-bold text-gray-900">{stats.openByRegion.new_jersey}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
        <p className="text-sm font-medium text-gray-600 mb-1">Open (VT)</p>
        <p className="text-3xl font-bold text-gray-900">{stats.openByRegion.vermont}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
        <p className="text-sm font-medium text-gray-600 mb-1">Avg Rating</p>
        <p className="text-3xl font-bold text-gray-900">{stats.avgRatingOnComplaints.toFixed(1)}</p>
        <p className="text-xs text-gray-500 mt-1">On complaints</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
        <p className="text-sm font-medium text-gray-600 mb-1">Re-clean Rate</p>
        <p className="text-3xl font-bold text-gray-900">{stats.recleanRequestRate.toFixed(1)}%</p>
      </div>
    </div>
  );
}




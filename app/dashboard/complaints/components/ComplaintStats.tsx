'use client';

import type { ComplaintStats as ComplaintStatsType } from '@/utils/complaintData';

interface ComplaintStatsProps {
  stats: ComplaintStatsType;
}

export default function ComplaintStats({ stats }: ComplaintStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
        <p className="text-sm font-medium text-vm-muted mb-1">Open Complaints</p>
        <p className="text-3xl font-bold text-vm-text">{stats.openComplaints}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
        <p className="text-sm font-medium text-vm-muted mb-1">Open (NJ)</p>
        <p className="text-3xl font-bold text-vm-text">{stats.openByRegion.new_jersey}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-vm-success">
        <p className="text-sm font-medium text-vm-muted mb-1">Open (VT)</p>
        <p className="text-3xl font-bold text-vm-text">{stats.openByRegion.vermont}</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
        <p className="text-sm font-medium text-vm-muted mb-1">Avg Rating</p>
        <p className="text-3xl font-bold text-vm-text">{stats.avgRatingOnComplaints.toFixed(1)}</p>
        <p className="text-xs text-vm-muted mt-1">On complaints</p>
      </div>
      <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
        <p className="text-sm font-medium text-vm-muted mb-1">Re-clean Rate</p>
        <p className="text-3xl font-bold text-vm-text">{stats.recleanRequestRate.toFixed(1)}%</p>
      </div>
    </div>
  );
}





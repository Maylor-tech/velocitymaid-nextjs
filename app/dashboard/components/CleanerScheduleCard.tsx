'use client';

import { CleanerSchedule } from '@/utils/dashboardQueries';
import LocationBadge from './LocationBadge';

interface CleanerScheduleCardProps {
  schedule: CleanerSchedule;
  region: string;
}

export default function CleanerScheduleCard({ schedule, region }: CleanerScheduleCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {schedule.cleanerName || 'Unknown Cleaner'}
          </h3>
          <p className="text-sm text-gray-600">{schedule.cleanerPhone}</p>
        </div>
        <LocationBadge location={region} />
      </div>

      <div className="mb-2">
        <span className="text-sm font-medium text-gray-700">
          {schedule.jobs.length} job{schedule.jobs.length !== 1 ? 's' : ''} assigned
        </span>
      </div>

      {schedule.jobs.length > 0 && (
        <div className="space-y-2">
          {schedule.jobs.map((job) => (
            <div
              key={job.sessionId}
              className="text-sm bg-gray-50 p-2 rounded border border-gray-200"
            >
              <div className="flex justify-between">
                <span className="font-medium">{job.customerName}</span>
                <span className="text-gray-600">{formatDate(job.preferredDate)}</span>
              </div>
              <div className="text-gray-600 text-xs mt-1">
                {job.preferredTime} • {job.serviceType}
              </div>
            </div>
          ))}
        </div>
      )}

      {schedule.overlaps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <p className="text-xs text-red-600 font-medium">
            ⚠️ {schedule.overlaps.length} overlap{schedule.overlaps.length !== 1 ? 's' : ''} detected
          </p>
        </div>
      )}
    </div>
  );
}





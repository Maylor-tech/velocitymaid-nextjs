'use client';

import { useState } from 'react';
import StatusBadge from './StatusBadge';
import LocationBadge from './LocationBadge';
import { JobChecklistPanel } from '@/components/cleaner/JobChecklistPanel';

export interface CleanerJob {
  id: string;
  sessionId: string;
  customerName: string;
  address: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  serviceLocation: 'new_jersey' | 'vermont';
  status: 'pending' | 'assigned' | 'confirmed' | 'on_the_way' | 'completed' | 'cancelled';
  specialInstructions?: string;
  phone?: string;
  totalPrice?: number;
}

interface JobCardProps {
  job: CleanerJob;
  onStatusUpdate?: (jobId: string, newStatus: string) => void;
}

export default function JobCard({ job, onStatusUpdate }: JobCardProps) {
  const [showChecklist, setShowChecklist] = useState(false);
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    // If already formatted, return as is
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr;
    }
    return timeStr;
  };

  const canMarkOnTheWay = job.status === 'confirmed' || job.status === 'assigned';
  const canMarkCompleted = job.status === 'on_the_way' || job.status === 'confirmed';
  const checklistActive =
    job.status === 'on_the_way' ||
    job.status === 'confirmed' ||
    job.status === 'assigned';

  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-vm-text">{job.customerName}</h3>
            <LocationBadge location={job.serviceLocation} />
            <StatusBadge status={job.status} />
          </div>
          <p className="text-sm text-vm-muted mb-1">{job.address}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-vm-muted block mb-1">Date & Time</span>
          <span className="font-medium text-vm-text">{formatDate(job.preferredDate)}</span>
          <span className="text-vm-muted ml-2">{formatTime(job.preferredTime)}</span>
        </div>
        <div>
          <span className="text-vm-muted block mb-1">Service</span>
          <span className="font-medium text-vm-text">{job.serviceType}</span>
        </div>
      </div>

      {job.specialInstructions && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs font-medium text-yellow-800 mb-1">Special Instructions:</p>
          <p className="text-sm text-yellow-900">{job.specialInstructions}</p>
        </div>
      )}

      {job.phone && (
        <div className="mb-4 text-sm text-vm-muted">
          <span className="font-medium">Customer Phone:</span> {job.phone}
        </div>
      )}

      {job.totalPrice && (
        <div className="mb-4 text-sm">
          <span className="text-vm-muted">Total:</span>
          <span className="ml-2 font-semibold text-vm-text">${job.totalPrice.toFixed(2)}</span>
        </div>
      )}

      {checklistActive && (
        <div className="mb-4 pt-4 border-t border-vm-navy/10">
          <button
            type="button"
            onClick={() => setShowChecklist(!showChecklist)}
            className="text-xs font-sans font-bold uppercase tracking-wider text-vm-navy hover:text-vm-cyan transition-colors"
          >
            {showChecklist ? "Hide" : "Open"} 50-Point Checklist
          </button>
          {showChecklist && (
            <JobChecklistPanel jobId={job.id} active={checklistActive} />
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        {canMarkOnTheWay && (
          <button
            onClick={() => onStatusUpdate?.(job.id, 'on_the_way')}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
          >
            Mark as On The Way
          </button>
        )}
        {canMarkCompleted && (
          <button
            onClick={() => onStatusUpdate?.(job.id, 'completed')}
            className="flex-1 px-4 py-2 bg-vm-success text-white rounded-lg hover:bg-vm-success transition-colors font-medium text-sm"
          >
            Mark as Completed
          </button>
        )}
        {job.status === 'completed' && (
          <div className="flex-1 px-4 py-2 bg-gray-100 text-vm-muted rounded-lg text-center font-medium text-sm">
            ✓ Completed
          </div>
        )}
        {job.status === 'cancelled' && (
          <div className="flex-1 px-4 py-2 bg-vm-danger-bg text-red-600 rounded-lg text-center font-medium text-sm">
            Cancelled
          </div>
        )}
      </div>
    </div>
  );
}





import { Calendar, XCircle } from 'lucide-react';

interface ActionButtonsProps {
  status: string;
  jobDate?: string | null;
  onRequestChange: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function ActionButtons({ status, jobDate, onRequestChange, onCancel, disabled }: ActionButtonsProps) {
  const isCompleted = status.toLowerCase() === 'completed';
  const isCancelled = status.toLowerCase() === 'cancelled' 
    || status.toLowerCase() === 'cancel_requested'
    || status.toLowerCase() === 'cancelled_by_customer';
  
  // Check if job date is in the past
  const isPast = jobDate ? new Date(jobDate) < new Date() : false;
  
  // Check time windows
  let canRequestChange = false;
  let canCancel = false;
  
  if (jobDate && !isPast && !isCompleted && !isCancelled) {
    const now = new Date();
    const jobDateTime = new Date(jobDate);
    const hoursUntilJob = (jobDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Change window: 4 hours
    canRequestChange = hoursUntilJob > 4;
    // Cancel window: 2 hours
    canCancel = hoursUntilJob > 2;
  }
  
  const allowedStatuses = ['SCHEDULED', 'scheduled', 'pending', 'assigned'];
  const isScheduled = allowedStatuses.includes(status.toLowerCase());
  
  const canModify = isScheduled && !isPast && !isCompleted && !isCancelled;

  if (!canModify) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onRequestChange}
        disabled={disabled || !canRequestChange}
        className="inline-flex items-center gap-2 px-6 py-3 bg-vm-surface text-vm-navy border border-vm-navy/20 rounded-lg hover:bg-vm-navy/5 transition-colors font-body font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        title={!canRequestChange ? 'Changes must be requested at least 4 hours before your appointment' : ''}
      >
        <Calendar className="w-4 h-4" />
        Request Change
      </button>

      <button
        onClick={onCancel}
        disabled={disabled || !canCancel}
        className="inline-flex items-center gap-2 px-6 py-3 bg-vm-danger-bg text-red-700 rounded-lg hover:bg-vm-danger-bg transition-colors font-body font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        title={!canCancel ? 'Cancellations must be made at least 2 hours before your appointment' : ''}
      >
        <XCircle className="w-4 h-4" />
        Cancel Appointment
      </button>
    </div>
  );
}


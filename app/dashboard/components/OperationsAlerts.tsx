'use client';

import { Job } from './JobCard';

interface OperationsAlertsProps {
  jobsNeedingReminders: Job[];
  jobsMissingConfirmation: Job[];
  jobsWithInvalidPhone: Job[];
  unassignedJobs: Job[];
}

export default function OperationsAlerts({
  jobsNeedingReminders,
  jobsMissingConfirmation,
  jobsWithInvalidPhone,
  unassignedJobs,
}: OperationsAlertsProps) {
  const alerts = [
    {
      title: 'Jobs Needing 24h Reminders',
      count: jobsNeedingReminders.length,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Jobs Missing WhatsApp Confirmation',
      count: jobsMissingConfirmation.length,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      title: 'Jobs with Invalid Phone Numbers',
      count: jobsWithInvalidPhone.length,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      title: 'Unassigned Jobs',
      count: unassignedJobs.length,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  ].filter(alert => alert.count > 0);

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-vm-text mb-4">Operations Alerts</h2>
        <div className="text-center py-4">
          <p className="text-vm-success font-medium">✓ All systems operational</p>
          <p className="text-vm-muted text-sm mt-1">No alerts at this time</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-vm-text mb-4">Operations Alerts</h2>
      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 ${alert.bgColor} ${alert.borderColor}`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${alert.color}`}>{alert.title}</h3>
              <span className={`text-2xl font-bold ${alert.color}`}>{alert.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}





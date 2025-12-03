'use client';

import JobCard, { CleanerJob } from './JobCard';

interface JobListProps {
  jobs: CleanerJob[];
  onStatusUpdate?: (jobId: string, newStatus: string) => void;
  emptyMessage?: string;
}

export default function JobList({ jobs, onStatusUpdate, emptyMessage = 'No jobs found' }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onStatusUpdate={onStatusUpdate} />
      ))}
    </div>
  );
}




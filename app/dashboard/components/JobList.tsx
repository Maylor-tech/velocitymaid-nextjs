'use client';

import JobCard, { Job } from './JobCard';

interface JobListProps {
  jobs: Job[];
  title: string;
  emptyMessage?: string;
}

export default function JobList({ jobs, title, emptyMessage = 'No jobs found' }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">
        {jobs.map((job) => (
          <JobCard key={job.sessionId} job={job} />
        ))}
      </div>
    </div>
  );
}





/** Canonical tip URL for a known Prisma Job.id (client-safe). */
export function tipUrlForJob(jobId: string): string {
  return `/tip?jobId=${encodeURIComponent(jobId)}`;
}

export function isCompletedCustomerJob(job: {
  rawStatus?: string;
  serviceStatus?: string;
  status?: string;
}): boolean {
  const candidates = [job.rawStatus, job.serviceStatus, job.status]
    .filter(Boolean)
    .map((s) => String(s).toUpperCase());
  return candidates.includes('COMPLETED');
}

import type { JobStatus } from '@/lib/brand/status';

/** Map Prisma job status + assignment to DS StatusBadge keys. */
export function toDisplayJobStatus(
  status: string,
  assignedCleanerId: string | null | undefined
): JobStatus {
  const s = status.toUpperCase();
  if (s === 'COMPLETED') return 'completed';
  if (s.includes('CANCEL')) return 'cancelled';
  if (s === 'IN_PROGRESS' || s === 'ON_THE_WAY' || s === 'AWAITING_QC') return 'in_progress';
  if (s === 'ASSIGNED') return 'scheduled';
  if (!assignedCleanerId && (s === 'RECEIVED' || s === 'CONFIRMED' || s === 'PENDING')) {
    return 'pending';
  }
  if (assignedCleanerId) return 'assigned';
  return 'pending';
}

export function formatJobRef(id: string): string {
  const compact = id.replace(/-/g, '').slice(0, 4).toUpperCase();
  return `VM-${compact}`;
}

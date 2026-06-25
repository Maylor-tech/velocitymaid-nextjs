// Job lifecycle status → token classes. Single source of truth (DS StatusBadge).
export type JobStatus =
  | 'pending' | 'scheduled' | 'assigned' | 'in_progress'
  | 'completed' | 'cancelled' | 'reschedule_requested' | 'cancel_requested';

export const JOB_STATUS_STYLE: Record<JobStatus, { label: string; bg: string; fg: string }> = {
  pending:              { label: 'Pending',              bg: 'bg-vm-warning-bg',  fg: 'text-vm-warning'  },
  scheduled:            { label: 'Scheduled',            bg: 'bg-vm-cyan-tint',   fg: 'text-vm-navy'     },
  assigned:             { label: 'Assigned',             bg: 'bg-vm-cyan-tint',   fg: 'text-vm-navy'     },
  in_progress:          { label: 'In Progress',          bg: 'bg-vm-progress-bg', fg: 'text-vm-progress' },
  completed:            { label: 'Completed',            bg: 'bg-vm-success-bg',  fg: 'text-vm-success'  },
  cancelled:            { label: 'Cancelled',            bg: 'bg-vm-danger-bg',   fg: 'text-vm-danger'   },
  reschedule_requested: { label: 'Reschedule Requested', bg: 'bg-vm-warning-bg',  fg: 'text-vm-warning'  },
  cancel_requested:     { label: 'Cancel Requested',     bg: 'bg-vm-danger-bg',   fg: 'text-vm-danger'   },
};

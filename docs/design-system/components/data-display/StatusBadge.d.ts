import * as React from "react";

export type JobStatus =
  | "pending" | "scheduled" | "assigned" | "in_progress"
  | "completed" | "cancelled" | "reschedule_requested" | "cancel_requested";

/** Job lifecycle status pill, shared across customer / cleaner / admin surfaces. */
export interface StatusBadgeProps {
  status: JobStatus | string;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export function StatusBadge(props: StatusBadgeProps): JSX.Element;

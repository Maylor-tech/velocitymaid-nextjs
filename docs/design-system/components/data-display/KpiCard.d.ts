import * as React from "react";

/** Metric tile for admin / operations dashboards. */
export interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  /** Optional trend indicator. */
  delta?: { value: string; direction: "up" | "down" };
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export function KpiCard(props: KpiCardProps): JSX.Element;

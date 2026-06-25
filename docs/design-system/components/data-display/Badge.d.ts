import * as React from "react";

/** Small pill label for status, category, or count. */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "navy" | "cyan" | "cyanSolid" | "success" | "warning" | "danger";
  size?: "sm" | "md";
  icon?: React.ReactNode;
}
export function Badge(props: BadgeProps): JSX.Element;

import * as React from "react";

/**
 * Hospitality-style inline alert — calm tints, optional title and icon.
 *
 * @startingPoint section="Feedback" subtitle="Calm inline alerts" viewport="700x140"
 */
export interface AlertProps {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "danger" | "neutral";
  title?: string;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export function Alert(props: AlertProps): JSX.Element;

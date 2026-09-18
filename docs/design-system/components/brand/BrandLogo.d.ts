import * as React from "react";

/**
 * Approved VelocityMaid logo lockup (Final Approval Pack PNG masters).
 * Use `theme="dark"` on navy backgrounds, `theme="light"` on light ones.
 * Do not recolor, restretch, or approximate the mark with HTML/CSS/SVG.
 *
 * @startingPoint section="Brand" subtitle="Approved logo lockup" viewport="700x160"
 */
export interface BrandLogoProps {
  theme?: "light" | "dark";
  /** Render only the VM service mark, no wordmark. */
  iconOnly?: boolean;
  showTagline?: boolean;
  /** Visual size hint in px (maps to image height). */
  iconSize?: number;
  style?: React.CSSProperties;
}
export function BrandLogo(props: BrandLogoProps): JSX.Element;

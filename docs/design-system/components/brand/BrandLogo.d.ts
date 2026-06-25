import * as React from "react";

/**
 * Approved VelocityMaid logo lockup (house + sparkle mark + wordmark).
 * Use `theme="dark"` on navy backgrounds, `theme="light"` on light ones.
 * Do not recolor, restretch, or substitute the mark.
 *
 * @startingPoint section="Brand" subtitle="Approved logo lockup" viewport="700x160"
 */
export interface BrandLogoProps {
  theme?: "light" | "dark";
  /** Render only the house+sparkle mark, no wordmark. */
  iconOnly?: boolean;
  showTagline?: boolean;
  /** Icon size in px; sparkle drops at <=32px per brand §2.3. */
  iconSize?: number;
  style?: React.CSSProperties;
}
export function BrandLogo(props: BrandLogoProps): JSX.Element;

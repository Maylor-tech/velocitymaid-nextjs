import * as React from "react";
import { brandAssets, BRAND_NAME } from "@/lib/brand/assets";
import { cn } from "@/lib/utils";

export type LogoTone = "light" | "dark";

export interface LogoProps {
  /** light = compact light on white; dark = compact reversed on navy */
  tone?: LogoTone;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Logo — picks vm-compact-light.svg or vm-compact-reversed.svg by tone.
 * Never re-type the wordmark.
 */
export function Logo({
  tone = "light",
  height = 40,
  className,
  priority = false,
}: LogoProps) {
  const src =
    tone === "dark" ? brandAssets.compactReversed : brandAssets.compactLight;
  const width = Math.round(height * 4);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={BRAND_NAME}
      height={height}
      width={width}
      className={cn("w-auto object-contain object-left", className)}
      // Prefer CSS height classes (responsive) when provided; else fixed height.
      style={className ? undefined : { height }}
      decoding="async"
      {...(priority ? { fetchPriority: "high" as const } : {})}
    />
  );
}

export default Logo;

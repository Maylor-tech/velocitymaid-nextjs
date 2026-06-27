import * as React from "react";

/** Square icon-only button. Always pass an accessible `aria-label`. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "navy" | "cyan" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
}

export function IconButton(props: IconButtonProps): JSX.Element;

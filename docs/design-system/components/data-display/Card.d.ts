import * as React from "react";

/**
 * Surface container for grouped content. Compose with CardTitle / CardDescription.
 *
 * @startingPoint section="Data Display" subtitle="Card surfaces & elevation" viewport="700x260"
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** flat = hairline border, raised = soft shadow, feature = marketing card. */
  elevation?: "flat" | "raised" | "feature";
  /** Lift on hover. */
  interactive?: boolean;
  /** Cyan ring — "Most Popular" / selected emphasis. */
  highlight?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}
export function Card(props: CardProps): JSX.Element;

export interface CardTextProps extends React.HTMLAttributes<HTMLElement> {}
export function CardTitle(props: CardTextProps): JSX.Element;
export function CardDescription(props: CardTextProps): JSX.Element;

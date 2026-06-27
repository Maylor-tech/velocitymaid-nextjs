import * as React from "react";

/** Native select styled to match Input, with a custom chevron. */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}
export function Select(props: SelectProps): JSX.Element;

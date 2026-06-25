import * as React from "react";

/** Label + control wrapper with required marker, help text, and error message. */
export interface FormRowProps {
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
  helpText?: string;
  htmlFor?: string;
  style?: React.CSSProperties;
}
export function FormRow(props: FormRowProps): JSX.Element;

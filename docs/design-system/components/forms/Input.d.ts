import * as React from "react";

/** Single-line text input with cyan focus ring. Set `invalid` for error state. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}
export function Input(props: InputProps): JSX.Element;

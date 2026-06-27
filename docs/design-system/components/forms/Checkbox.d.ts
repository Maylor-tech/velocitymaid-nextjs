/** Checkbox with optional label. Controlled (`checked`) or uncontrolled (`defaultChecked`). */
export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  style?: import("react").CSSProperties;
}
export function Checkbox(props: CheckboxProps): JSX.Element;

/** On/off toggle switch. Controlled (`checked`) or uncontrolled (`defaultChecked`). */
export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  style?: import("react").CSSProperties;
}
export function Switch(props: SwitchProps): JSX.Element;

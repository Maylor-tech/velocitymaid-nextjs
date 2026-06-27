/** Transient notification on a navy surface with a semantic accent bar. */
export interface ToastProps {
  message: string;
  title?: string;
  type?: "info" | "success" | "error" | "warning";
  icon?: import("react").ReactNode;
  onClose?: () => void;
  style?: import("react").CSSProperties;
}
export function Toast(props: ToastProps): JSX.Element;

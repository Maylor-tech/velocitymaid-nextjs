/** Round identity avatar with initials fallback on navy. */
export interface AvatarProps {
  name?: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: import("react").CSSProperties;
}
export function Avatar(props: AvatarProps): JSX.Element;

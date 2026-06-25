import * as React from "react";

export interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

/** Underline-style tab navigation; active tab carries the cyan underline. */
export interface TabsProps {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  style?: React.CSSProperties;
}
export function Tabs(props: TabsProps): JSX.Element;

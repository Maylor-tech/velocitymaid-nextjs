import * as React from "react";

export interface TableColumn<Row = any> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  width?: string | number;
  render?: (value: any, row: Row) => React.ReactNode;
}

/** Data table for admin / operations views. Provide columns + rows. */
export interface TableProps<Row = any> {
  columns: TableColumn<Row>[];
  rows: Row[];
  zebra?: boolean;
  onRowClick?: (row: Row) => void;
  getRowKey?: (row: Row, index: number) => string | number;
  style?: React.CSSProperties;
}
export function Table<Row = any>(props: TableProps<Row>): JSX.Element;

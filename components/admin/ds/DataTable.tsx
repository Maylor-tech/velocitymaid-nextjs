import { ReactNode } from 'react';

export interface DataTableColumn<Row extends Record<string, unknown>> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  width?: string;
  render?: (value: unknown, row: Row) => ReactNode;
}

interface DataTableProps<Row extends Record<string, unknown>> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  onRowClick?: (row: Row) => void;
  getRowKey: (row: Row, index: number) => string;
  emptyMessage?: string;
}

export function DataTable<Row extends Record<string, unknown>>({
  columns,
  rows,
  onRowClick,
  getRowKey,
  emptyMessage = 'No rows to display.',
}: DataTableProps<Row>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-vm-border bg-vm-white px-6 py-12 text-center font-body text-sm text-vm-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-vm-border bg-vm-white">
      <table className="w-full border-collapse font-body">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={`whitespace-nowrap border-b border-vm-border px-4 py-3 font-heading text-xs font-bold uppercase tracking-wide text-vm-muted ${
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={getRowKey(row, i)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={
                onRowClick
                  ? 'cursor-pointer transition-colors hover:bg-vm-cyan-tint/60'
                  : undefined
              }
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`border-b border-vm-border px-4 py-3.5 text-sm text-vm-text last:border-b-0 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  }`}
                >
                  {col.render
                    ? col.render(row[col.key], row)
                    : (row[col.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

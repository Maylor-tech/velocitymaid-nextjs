'use client';

import { DataTable, type DataTableColumn } from '@/components/admin/ds/DataTable';
import type { PipelineLeadRecord } from '@/lib/leadCenter/types';
import { PipelineStageBadge } from './PipelineStageBadge';

interface LeadTableViewProps {
  leads: PipelineLeadRecord[];
  onSelect: (lead: PipelineLeadRecord) => void;
}

type LeadRow = PipelineLeadRecord & Record<string, unknown>;

function formatMoney(n: number | null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const columns: DataTableColumn<LeadRow>[] = [
  {
    key: 'name',
    header: 'Name',
    render: (_, row) => (
      <span className="font-medium text-vm-navy">{row.name}</span>
    ),
  },
  { key: 'phone', header: 'Phone' },
  { key: 'email', header: 'Email', render: (v) => (v as string) || '—' },
  {
    key: 'propertyAddress',
    header: 'Address',
    render: (v) => (
      <span className="max-w-[180px] truncate block">{(v as string) || '—'}</span>
    ),
  },
  {
    key: 'stage',
    header: 'Status',
    render: (_, row) => <PipelineStageBadge stage={row.stage} />,
  },
  {
    key: 'estimatedRevenue',
    header: 'Est. Revenue',
    align: 'right',
    render: (v) => formatMoney(v as number | null),
  },
  {
    key: 'nextActionDate',
    header: 'Next Action',
    render: (v) => formatDate(v as string | null),
  },
  { key: 'leadSource', header: 'Source', render: (v) => (v as string) || '—' },
];

export function LeadTableView({ leads, onSelect }: LeadTableViewProps) {
  return (
    <DataTable<LeadRow>
      columns={columns}
      rows={leads as LeadRow[]}
      getRowKey={(row) => row.id}
      onRowClick={onSelect}
      emptyMessage="No leads yet. Add your first lead to start the pipeline."
    />
  );
}

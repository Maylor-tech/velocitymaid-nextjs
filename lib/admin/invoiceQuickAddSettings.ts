export interface InvoiceQuickAddItem {
  key: string;
  label: string;
  description: string;
  amount: number;
}

export const DEFAULT_INVOICE_QUICK_ADD_ITEMS: InvoiceQuickAddItem[] = [
  { key: 'office_prep', label: 'Office Prep $75', description: 'Office Prep', amount: 75 },
  { key: 'garage_cleanup', label: 'Garage Cleanup $75', description: 'Garage Cleanup', amount: 75 },
  { key: 'grill_deep_clean', label: 'Grill Deep Clean $75', description: 'Grill Deep Clean', amount: 75 },
  { key: 'zone_b_travel', label: 'Zone B Travel $20', description: 'Zone B Travel Fee', amount: 20 },
  { key: 'zone_c_travel', label: 'Zone C Travel $40', description: 'Zone C Travel Fee', amount: 40 },
  { key: 'checkout_presence', label: 'Checkout Presence $25', description: 'Checkout Presence', amount: 25 },
];

export function parseInvoiceQuickAddItems(raw: unknown): InvoiceQuickAddItem[] {
  if (!Array.isArray(raw)) return DEFAULT_INVOICE_QUICK_ADD_ITEMS;
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      if (typeof o.key !== 'string' || typeof o.description !== 'string') return null;
      const amount = Number(o.amount);
      if (!Number.isFinite(amount)) return null;
      return {
        key: o.key,
        label: typeof o.label === 'string' ? o.label : o.description,
        description: o.description,
        amount,
      } satisfies InvoiceQuickAddItem;
    })
    .filter(Boolean) as InvoiceQuickAddItem[];
}

/**
 * Needs-attention row title: service · property · date so duplicates are distinguishable.
 * Example: "Turnover · Lakeside cabin · Nov 20"
 */
export function attentionRowTitle(args: {
  serviceType?: string | null;
  propertyName?: string | null;
  guestDisplayName?: string | null;
  customerName?: string | null;
  dateLabel: string;
}): string {
  const service = (args.serviceType || '').trim() || 'Job';
  const property =
    (args.propertyName || '').trim() ||
    (args.guestDisplayName || '').trim() ||
    (args.customerName || '').trim() ||
    '';

  if (property && property.toLowerCase() !== service.toLowerCase()) {
    return `${service} · ${property} · ${args.dateLabel}`;
  }
  return `${property || service} · ${args.dateLabel}`;
}

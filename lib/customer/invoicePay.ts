/** Host-facing invoice pay path. DRAFT invoices are payable; CANCELLED/PAID are not. */

export function customerInvoicePayPath(
  publicToken: string | null | undefined
): string | null {
  if (!publicToken) return null;
  return `/invoice/${publicToken}`;
}

export function isInvoiceOpenForPayment(invoice: {
  status: string;
  balanceDue: number;
} | null | undefined): boolean {
  if (!invoice) return false;
  if (invoice.status === 'CANCELLED' || invoice.status === 'PAID') return false;
  return invoice.balanceDue > 0;
}

const REMINDER_SEND_STATUSES = ['SENT', 'OVERDUE', 'PARTIALLY_PAID'] as const;

export function canSendInvoiceReminder(invoice: { status: string; balanceDue: number }): boolean {
  return REMINDER_SEND_STATUSES.some((status) => status === invoice.status)
    && invoice.balanceDue > 0;
}

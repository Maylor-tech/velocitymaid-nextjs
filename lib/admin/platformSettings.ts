import { prisma } from '@/lib/prisma';
import {
  DEFAULT_INVOICE_QUICK_ADD_ITEMS,
  parseInvoiceQuickAddItems,
  type InvoiceQuickAddItem,
} from '@/lib/admin/invoiceQuickAddSettings';

export async function getInvoiceQuickAddItems(): Promise<InvoiceQuickAddItem[]> {
  const row = await prisma.adminPlatformSettings.findUnique({
    where: { id: 'default' },
  });
  if (!row?.invoiceQuickAddItems) return DEFAULT_INVOICE_QUICK_ADD_ITEMS;
  return parseInvoiceQuickAddItems(row.invoiceQuickAddItems);
}

export async function saveInvoiceQuickAddItems(items: InvoiceQuickAddItem[]) {
  await prisma.adminPlatformSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      invoiceQuickAddItems: items,
    },
    update: {
      invoiceQuickAddItems: items,
    },
  });
}

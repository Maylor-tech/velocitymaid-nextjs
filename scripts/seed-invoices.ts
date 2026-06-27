/**
 * Seed example VelocityMaid billing invoices (Middlebury accounts).
 *
 * Usage: npx tsx scripts/seed-invoices.ts
 */

import { prisma } from '../lib/prisma';
import {
  computeBalanceDue,
  computeSubtotal,
  computeTotal,
  lineTotal,
  nextInvoiceNumber,
} from '../lib/invoices/invoiceUtils';

async function seedInvoices() {
  console.log('Seeding example invoices…');

  const existing = await prisma.invoice.count({
    where: { invoiceNumber: { startsWith: 'VM-' } },
  });
  if (existing >= 2) {
    console.log(`Found ${existing} invoice(s) already — skipping seed.`);
    return;
  }

  const year = new Date().getFullYear();
  const num1 = existing === 0 ? await nextInvoiceNumber() : `VM-${year}-0001`;
  const num2 = existing <= 1 ? (existing === 0 ? `VM-${year}-0002` : await nextInvoiceNumber()) : `VM-${year}-0002`;

  const deepCleanItems = [
    {
      description: 'Deep clean + photo reporting + initial visit',
      quantity: 1,
      unitPrice: 475,
    },
  ];
  const deepSubtotal = computeSubtotal(deepCleanItems);
  const deepTotal = computeTotal(deepSubtotal, 0, 0);

  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: num1,
      clientName: 'Middlebury Client',
      clientEmail: 'middlebury.client@example.com',
      clientPhone: '802-555-0100',
      propertyAddress: 'Middlebury, VT',
      serviceType: 'Deep Clean + Photo Reporting + Initial Visit',
      jobDate: new Date('2026-06-15'),
      dueDate: new Date('2026-06-30'),
      subtotal: deepSubtotal,
      tax: 0,
      discount: 0,
      total: deepTotal,
      amountPaid: deepTotal,
      balanceDue: 0,
      status: 'PAID',
      notes: 'Initial deep clean with photo reporting for vacation rental onboarding.',
      sentAt: new Date('2026-06-10'),
      items: {
        create: deepCleanItems.map((item, sortOrder) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: lineTotal(item.quantity, item.unitPrice),
          sortOrder,
        })),
      },
      payments: {
        create: {
          amount: deepTotal,
          paymentMethod: 'CHECK',
          paymentDate: new Date('2026-06-16'),
          transactionReference: 'CHK-475-MB',
          notes: 'Paid in full at initial visit',
        },
      },
    },
  });

  const turnoverItems = [
    {
      description: 'Vacation rental turnover clean',
      quantity: 1,
      unitPrice: 300,
    },
  ];
  const turnSubtotal = computeSubtotal(turnoverItems);
  const turnTotal = computeTotal(turnSubtotal, 0, 0);

  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: num2,
      clientName: 'Middlebury Recurring Turnover',
      clientEmail: 'turnover.middlebury@example.com',
      clientPhone: '802-555-0200',
      propertyAddress: 'Middlebury, VT — Recurring account',
      serviceType: 'Vacation Rental Turnover',
      jobDate: new Date('2026-07-01'),
      dueDate: new Date('2026-07-15'),
      subtotal: turnSubtotal,
      tax: 0,
      discount: 0,
      total: turnTotal,
      amountPaid: 0,
      balanceDue: computeBalanceDue(turnTotal, 0),
      status: 'SENT',
      notes: 'Recurring turnover — $300 per visit. July booking.',
      sentAt: new Date('2026-06-20'),
      items: {
        create: turnoverItems.map((item, sortOrder) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: lineTotal(item.quantity, item.unitPrice),
          sortOrder,
        })),
      },
    },
  });

  console.log(`Created ${inv1.invoiceNumber} (PAID $475)`);
  console.log(`Created ${inv2.invoiceNumber} (SENT $300)`);
  console.log(`Public links:`);
  console.log(`  /invoice/${inv1.publicToken}`);
  console.log(`  /invoice/${inv2.publicToken}`);
}

seedInvoices()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

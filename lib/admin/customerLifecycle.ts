import type { CustomerRecordKind, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import {
  DELETE_BLOCKED_MESSAGE,
  type CustomerListFilter,
} from '@/lib/admin/customerListTypes';

export type { CustomerListFilter };
export { DELETE_BLOCKED_MESSAGE };

export type CustomerDeletionBlockers = {
  jobs: number;
  invoices: number;
  payments: number;
  receipts: number;
  portalTokens: number;
  changeRequests: number;
  ratings: number;
  referrals: number;
  nurture: number;
  pipelineLead: number;
};

export function sumBlockers(b: CustomerDeletionBlockers): number {
  return Object.values(b).reduce((a, n) => a + n, 0);
}

export async function getCustomerDeletionBlockers(
  customerId: string
): Promise<CustomerDeletionBlockers> {
  const [
    jobs,
    invoices,
    payments,
    receipts,
    portalTokens,
    changeRequests,
    ratings,
    referralCredits,
    referralLinks,
    referredEvents,
    referrerEvents,
    nurtureHistory,
    nurtureSequence,
    pipelineLead,
  ] = await Promise.all([
    prisma.job.count({ where: { customerId } }),
    prisma.invoice.count({ where: { customerId } }),
    prisma.invoicePayment.count({
      where: { Invoice: { customerId } },
    }),
    prisma.receipt.count({ where: { customerId } }),
    prisma.customerLoginToken.count({ where: { customerId } }),
    prisma.customerJobChangeRequest.count({ where: { customerId } }),
    prisma.cleanerRating.count({ where: { customerId } }),
    prisma.referralCredit.count({ where: { customerId } }),
    prisma.referralLink.count({ where: { customerId } }),
    prisma.referralEvent.count({ where: { referredCustomerId: customerId } }),
    prisma.referralEvent.count({ where: { referrerId: customerId } }),
    prisma.nurtureHistory.count({ where: { customerId } }),
    prisma.nurtureSequence.count({ where: { customerId } }),
    prisma.pipelineLead.count({ where: { customerId } }),
  ]);

  return {
    jobs,
    invoices,
    payments,
    receipts,
    portalTokens,
    changeRequests,
    ratings,
    referrals: referralCredits + referralLinks + referredEvents + referrerEvents,
    nurture: nurtureHistory + nurtureSequence,
    pipelineLead,
  };
}

export function canPermanentlyDelete(blockers: CustomerDeletionBlockers): boolean {
  return sumBlockers(blockers) === 0;
}

/** List filter for admin customer records — never hardcodes emails. */
export function customerListWhere(
  filter: CustomerListFilter,
  search?: string
): Prisma.CustomerWhereInput {
  const searchClause: Prisma.CustomerWhereInput | undefined = search?.trim()
    ? {
        OR: [
          { email: { contains: search.trim(), mode: 'insensitive' } },
          { firstName: { contains: search.trim(), mode: 'insensitive' } },
          { lastName: { contains: search.trim(), mode: 'insensitive' } },
        ],
      }
    : undefined;

  let kindAndArchive: Prisma.CustomerWhereInput;
  switch (filter) {
    case 'archived':
      kindAndArchive = {
        archivedAt: { not: null },
        recordKind: { in: ['STANDARD', 'TEST'] },
      };
      break;
    case 'system':
      kindAndArchive = { recordKind: 'SYSTEM' };
      break;
    case 'all':
      // Active + archived client records; SYSTEM stays on its own filter
      kindAndArchive = { recordKind: { in: ['STANDARD', 'TEST'] } };
      break;
    case 'active':
    default:
      kindAndArchive = {
        archivedAt: null,
        recordKind: { in: ['STANDARD', 'TEST'] },
      };
      break;
  }

  if (!searchClause) return kindAndArchive;
  return { AND: [kindAndArchive, searchClause] };
}

export async function archiveCustomer(params: {
  customerId: string;
  actorId?: string | null;
  actorEmail?: string | null;
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.customerId },
    select: { id: true, email: true, archivedAt: true },
  });
  if (!customer) throw new Error('Customer not found');
  if (customer.archivedAt) {
    return customer;
  }

  const archivedAt = new Date();
  const updated = await prisma.customer.update({
    where: { id: params.customerId },
    data: {
      archivedAt,
      archivedBy: params.actorId || params.actorEmail || 'ADMIN',
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      archivedAt: true,
      archivedBy: true,
      recordKind: true,
    },
  });

  await logAuditEntry({
    actorId: params.actorId,
    actorRole: 'ADMIN',
    action: 'CUSTOMER_ARCHIVED',
    entityType: 'Customer',
    entityId: params.customerId,
    description: `Archived customer ${customer.email}`,
    changes: {
      archivedAt: archivedAt.toISOString(),
      archivedBy: updated.archivedBy,
      adminEmail: params.actorEmail ?? null,
    },
  });

  return updated;
}

export async function restoreCustomer(params: {
  customerId: string;
  actorId?: string | null;
  actorEmail?: string | null;
}) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.customerId },
    select: { id: true, email: true, archivedAt: true },
  });
  if (!customer) throw new Error('Customer not found');
  if (!customer.archivedAt) {
    return customer;
  }

  const updated = await prisma.customer.update({
    where: { id: params.customerId },
    data: {
      archivedAt: null,
      archivedBy: null,
      updatedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      archivedAt: true,
      archivedBy: true,
      recordKind: true,
    },
  });

  await logAuditEntry({
    actorId: params.actorId,
    actorRole: 'ADMIN',
    action: 'CUSTOMER_RESTORED',
    entityType: 'Customer',
    entityId: params.customerId,
    description: `Restored customer ${customer.email}`,
    changes: { adminEmail: params.actorEmail ?? null },
  });

  return updated;
}

export async function permanentlyDeleteCustomer(params: {
  customerId: string;
  actorId?: string | null;
  actorEmail?: string | null;
}): Promise<{ deleted: true } | { deleted: false; blockers: CustomerDeletionBlockers }> {
  const customer = await prisma.customer.findUnique({
    where: { id: params.customerId },
    select: { id: true, email: true, recordKind: true },
  });
  if (!customer) throw new Error('Customer not found');

  if (customer.recordKind === 'SYSTEM') {
    throw new Error(
      'System customer records cannot be permanently deleted. Archive them or leave them hidden from Active lists.'
    );
  }

  const blockers = await getCustomerDeletionBlockers(params.customerId);
  if (!canPermanentlyDelete(blockers)) {
    return { deleted: false, blockers };
  }

  await prisma.customer.delete({ where: { id: params.customerId } });

  await logAuditEntry({
    actorId: params.actorId,
    actorRole: 'ADMIN',
    action: 'CUSTOMER_DELETED',
    entityType: 'Customer',
    entityId: params.customerId,
    description: `Permanently deleted customer ${customer.email}`,
    changes: { email: customer.email, adminEmail: params.actorEmail ?? null },
  });

  return { deleted: true };
}

export function recordKindLabel(kind: CustomerRecordKind): string {
  switch (kind) {
    case 'SYSTEM':
      return 'System';
    case 'TEST':
      return 'Test';
    default:
      return 'Customer';
  }
}

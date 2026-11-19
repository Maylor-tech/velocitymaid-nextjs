import { prisma } from "@/lib/prisma";

/** Local stand-in. TaxProfileStatus is not exported by the current Prisma client. */
export const TaxProfileStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;

export type TaxProfileStatus =
  (typeof TaxProfileStatus)[keyof typeof TaxProfileStatus];

/** Fields the admin tax routes actually read. Not a Prisma model. */
export interface CleanerTaxProfileRecord {
  id: string;
  cleanerId: string;
  status: TaxProfileStatus;
  tinType: string | null;
  tinLast4: string | null;
  businessName: string | null;
  classification: string | null;
  firstName: string | null;
  lastName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  lastReminderSentAt: Date | null;
  reminderCount: number | null;
  submittedAt: Date | null;
  verifiedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  cleaner: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export interface TaxProfileAuditRecord {
  id: string;
  action: string;
  taxProfileId: string;
  performedBy: string | null;
  details: string | null;
  createdAt: Date;
  taxProfile: {
    cleanerId: string;
    status: string;
  };
}

type CleanerTaxProfileDelegate = {
  findMany: (args?: LooseAny) => Promise<CleanerTaxProfileRecord[]>;
  findUnique: (args: LooseAny) => Promise<CleanerTaxProfileRecord | null>;
  update: (args: LooseAny) => Promise<CleanerTaxProfileRecord>;
  count: (args?: LooseAny) => Promise<number>;
};

type TaxProfileAuditDelegate = {
  findMany: (args?: LooseAny) => Promise<TaxProfileAuditRecord[]>;
  create: (args: LooseAny) => Promise<TaxProfileAuditRecord>;
};

function missingDelegates(): {
  cleanerTaxProfile: CleanerTaxProfileDelegate;
  taxProfileAuditLog: TaxProfileAuditDelegate;
} {
  return prisma as unknown as {
    cleanerTaxProfile: CleanerTaxProfileDelegate;
    taxProfileAuditLog: TaxProfileAuditDelegate;
  };
}

/** Runtime cleanerTaxProfile access. The delegate is absent from the current client. */
export function cleanerTaxProfile(): CleanerTaxProfileDelegate {
  return missingDelegates().cleanerTaxProfile;
}

/** Runtime taxProfileAuditLog access. The delegate is absent from the current client. */
export function taxProfileAuditLog(): TaxProfileAuditDelegate {
  return missingDelegates().taxProfileAuditLog;
}

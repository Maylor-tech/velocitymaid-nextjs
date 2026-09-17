import { prisma } from '@/lib/prisma';
import { ensureCleanerProfile } from '@/lib/workers/ensureCleanerProfile';
import {
  DEFAULT_CLASSIFICATION_STATUS,
  normalizeClassificationStatus,
} from '@/lib/workers/classification';
import { normalizePaymentPreference } from '@/lib/workers/paymentPreference';
import { getWorkerCompensationSummary } from '@/lib/workers/compensationSummary';

export type WorkerRecordView = {
  cleanerId: string;
  email: string;
  phone: string | null;
  displayName: string | null;
  identity: {
    legalFirstName: string | null;
    legalLastName: string | null;
    preferredDisplayName: string | null;
    firstName: string | null;
    lastName: string | null;
    mailingAddressLine1: string | null;
    mailingAddressLine2: string | null;
    mailingCity: string | null;
    mailingState: string | null;
    mailingPostalCode: string | null;
    mailingCountry: string | null;
  };
  workStatus: {
    classificationStatus: string;
    memberStatus: string;
    isActive: boolean;
    startDate: string | null;
    inactiveDate: string | null;
    primaryBranch: { id: string; name: string; country: string | null } | null;
  };
  documentation: {
    agreements: Array<{
      id: string;
      agreementType: string;
      agreementVersion: string;
      status: string;
      issuedAt: string | null;
      signedAt: string | null;
      documentReference: string | null;
    }>;
    documents: Array<{
      id: string;
      documentType: string;
      status: string;
      receivedAt: string | null;
      expiresAt: string | null;
      documentReference: string | null;
      notes: string | null;
    }>;
    w9MetaStatus: string;
  };
  paymentPreference: string | null;
  compensationSummary: Awaited<ReturnType<typeof getWorkerCompensationSummary>>;
};

export async function getWorkerRecord(cleanerId: string): Promise<WorkerRecordView | null> {
  const user = await prisma.user.findUnique({
    where: { id: cleanerId, role: 'CLEANER' },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      isActive: true,
      Branch_User_primaryBranchIdToBranch: {
        select: { id: true, name: true, country: true },
      },
    },
  });
  if (!user) return null;

  const profile = await ensureCleanerProfile(cleanerId);

  const [agreements, documents, compensationSummary] = await Promise.all([
    prisma.workerAgreement.findMany({
      where: { cleanerId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.workerDocument.findMany({
      where: { cleanerId },
      orderBy: { createdAt: 'desc' },
    }),
    getWorkerCompensationSummary(cleanerId),
  ]);

  const w9 = documents.find((d) => d.documentType === 'W9_META');
  const classificationStatus = normalizeClassificationStatus(profile.classificationStatus);

  return {
    cleanerId: user.id,
    email: user.email,
    phone: user.phone,
    displayName: profile.publicDisplayName || user.name,
    identity: {
      legalFirstName: profile.legalFirstName,
      legalLastName: profile.legalLastName,
      preferredDisplayName: profile.publicDisplayName,
      firstName: profile.firstName,
      lastName: profile.lastName,
      mailingAddressLine1: profile.mailingAddressLine1,
      mailingAddressLine2: profile.mailingAddressLine2,
      mailingCity: profile.mailingCity,
      mailingState: profile.mailingState,
      mailingPostalCode: profile.mailingPostalCode,
      mailingCountry: profile.mailingCountry,
    },
    workStatus: {
      classificationStatus:
        classificationStatus === DEFAULT_CLASSIFICATION_STATUS
          ? 'UNRESOLVED'
          : classificationStatus,
      memberStatus: profile.memberStatus,
      isActive: user.isActive,
      startDate: profile.startDate?.toISOString() ?? null,
      inactiveDate: profile.inactiveDate?.toISOString() ?? null,
      primaryBranch: user.Branch_User_primaryBranchIdToBranch
        ? {
            id: user.Branch_User_primaryBranchIdToBranch.id,
            name: user.Branch_User_primaryBranchIdToBranch.name,
            country: user.Branch_User_primaryBranchIdToBranch.country,
          }
        : null,
    },
    documentation: {
      agreements: agreements.map((a) => ({
        id: a.id,
        agreementType: a.agreementType,
        agreementVersion: a.agreementVersion,
        status: a.status,
        issuedAt: a.issuedAt?.toISOString() ?? null,
        signedAt: a.signedAt?.toISOString() ?? null,
        documentReference: a.documentReference,
      })),
      documents: documents.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        status: d.status,
        receivedAt: d.receivedAt?.toISOString() ?? null,
        expiresAt: d.expiresAt?.toISOString() ?? null,
        documentReference: d.documentReference,
        notes: d.notes,
      })),
      w9MetaStatus: w9?.status ?? 'NOT_REQUESTED',
    },
    paymentPreference: normalizePaymentPreference(profile.paymentPreference),
    compensationSummary,
  };
}

/**
 * Certificate Generator Utility
 * 
 * Generates certificate IDs and handles certificate creation
 */

import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

/**
 * Generate a unique certificate ID
 */
export function generateCertificateId(): string {
  // Generate a random 12-character alphanumeric ID
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
  let result = '';
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return `VM-JM-${result}`;
}

/**
 * Create certificate for a cleaner when training is passed
 */
export async function createCertificate(cleanerId: string): Promise<{
  id: string;
  certificateId: string;
  issuedAt: Date;
}> {
  // Check if certificate already exists
  const existing = await prisma.trainingCertificate.findUnique({
    where: { cleanerId },
  });

  if (existing) {
    return {
      id: existing.id,
      certificateId: existing.certificateId,
      issuedAt: existing.issuedAt,
    };
  }

  // Generate unique certificate ID
  let certificateId: string;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    certificateId = generateCertificateId();
    const exists = await prisma.trainingCertificate.findUnique({
      where: { certificateId },
    });
    if (!exists) {
      isUnique = true;
    } else {
      attempts++;
    }
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique certificate ID');
  }

  // Create certificate
  const certificate = await prisma.trainingCertificate.create({
    data: {
      certificateId: certificateId!,
      cleanerId,
      status: 'ACTIVE',
      issuedAt: new Date(),
    },
  });

  return {
    id: certificate.id,
    certificateId: certificate.certificateId,
    issuedAt: certificate.issuedAt,
  };
}

/**
 * Get certificate details for verification
 */
export async function getCertificateDetails(certificateId: string) {
  const certificate = await prisma.trainingCertificate.findUnique({
    where: { certificateId },
    include: {
      cleaner: {
        include: {
          primaryBranch: {
            select: {
              name: true,
              country: true,
            },
          },
        },
      },
      trainingStatus: true,
    },
  });

  if (!certificate) {
    return null;
  }

  // Get completed modules count
  const allLessons = await prisma.trainingLesson.findMany({
    where: { module: { isActive: true } },
  });

  const completedProgress = await prisma.lessonProgress.findMany({
    where: {
      cleanerId: certificate.cleanerId,
      status: 'COMPLETED',
    },
  });

  return {
    certificateId: certificate.certificateId,
    cleanerName: certificate.cleaner.name || 'Unknown',
    branchName: certificate.cleaner.primaryBranch?.name || 'Unknown',
    branchCountry: certificate.cleaner.primaryBranch?.country || 'Unknown',
    issuedAt: certificate.issuedAt,
    status: certificate.status,
    modulesCompleted: completedProgress.length,
    totalModules: allLessons.length,
    trainingStatus: certificate.trainingStatus?.overallStatus || 'UNKNOWN',
  };
}



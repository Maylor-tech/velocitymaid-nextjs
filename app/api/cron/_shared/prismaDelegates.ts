import { prisma } from '@/lib/prisma';

/**
 * Delegates for tables that application code still calls but that are not in
 * prisma/schema.prisma. Access is typed so cron routes compile; runtime remains
 * a no-op until those models exist.
 */

export type CleanerTaxProfileRow = {
  id: string;
  cleanerId: string;
  status: string;
  lastReminderSentAt: Date | null;
  reminderCount: number;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
};

export const TAX_PROFILE_STATUS = {
  VERIFIED: 'VERIFIED',
} as const;

type CleanerTaxProfileDelegate = {
  findMany: (args: Record<string, unknown>) => Promise<CleanerTaxProfileRow[]>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
};

type WeeklyEmailLogDelegate = {
  create: (args: Record<string, unknown>) => Promise<{ id: string }>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
};

export function getCleanerTaxProfileDelegate(): CleanerTaxProfileDelegate | null {
  const client = prisma as unknown as { cleanerTaxProfile?: CleanerTaxProfileDelegate };
  return client.cleanerTaxProfile ?? null;
}

export function getWeeklyEmailLogDelegate(): WeeklyEmailLogDelegate | null {
  const client = prisma as unknown as { weeklyEmailLog?: WeeklyEmailLogDelegate };
  return client.weeklyEmailLog ?? null;
}

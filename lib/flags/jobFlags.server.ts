import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';
import {
  ensureArrivalFlag,
  ensurePhotoFlag,
  flagsAwaitingReportNotice,
  markHostNotified,
  resolveFlag,
  type FlagRow,
  type FlagWriter,
  type HostNotifyChannelValue,
} from '@/lib/flags/jobFlagRules';

type StoredFlag = {
  id: string;
  jobId: string;
  kind: FlagRow['kind'];
  note: string;
  photoId: string | null;
  createdAt: Date;
  hostNotifiedAt: Date | null;
  hostNotifiedChannel: FlagRow['hostNotifiedChannel'];
  resolvedAt: Date | null;
};

function toFlagRow(row: StoredFlag): FlagRow {
  return {
    id: row.id,
    jobId: row.jobId,
    kind: row.kind,
    note: row.note,
    photoId: row.photoId,
    createdAt: row.createdAt,
    hostNotifiedAt: row.hostNotifiedAt,
    hostNotifiedChannel: row.hostNotifiedChannel,
    resolvedAt: row.resolvedAt,
  };
}

function writer(): FlagWriter {
  return {
    jobFlag: {
      findUnique: async ({ where }) => {
        const row = await prisma.jobFlag.findUnique({ where: { photoId: where.photoId } });
        return row ? toFlagRow(row) : null;
      },
      findFirst: async ({ where }) => {
        const row = await prisma.jobFlag.findFirst({
          where: { jobId: where.jobId, kind: where.kind },
        });
        return row ? toFlagRow(row) : null;
      },
      create: async ({ data }) => {
        const row = await prisma.jobFlag.create({ data: data as never });
        return toFlagRow(row);
      },
      update: async ({ where, data }) => {
        const row = await prisma.jobFlag.update({
          where: { id: where.id },
          data: data as never,
        });
        return toFlagRow(row);
      },
    },
  };
}

function isForeignKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2003'
  );
}

export async function recordPhotoFlag(input: {
  jobId: string;
  photoId: string;
  category: string | null | undefined;
  caption?: string | null;
  createdById?: string | null;
}): Promise<{ id: string; created: boolean } | null> {
  try {
    return await ensurePhotoFlag(writer(), input);
  } catch (error) {
    if (!isForeignKeyError(error) || !input.createdById) throw error;
    return ensurePhotoFlag(writer(), { ...input, createdById: null });
  }
}

export async function recordArrivalFlag(input: {
  jobId: string;
  createdById?: string | null;
  note?: string | null;
}): Promise<{ id: string; created: boolean }> {
  try {
    return await ensureArrivalFlag(writer(), input);
  } catch (error) {
    if (!isForeignKeyError(error) || !input.createdById) throw error;
    return ensureArrivalFlag(writer(), { ...input, createdById: null });
  }
}

/** After the report email is sent. Earlier notices and resolved flags are left alone. */
export async function markOpenFlagsIncludedInReport(input: {
  jobId: string;
  actorId: string;
}): Promise<{ marked: number }> {
  const rows = await prisma.jobFlag.findMany({ where: { jobId: input.jobId } });
  const waiting = flagsAwaitingReportNotice(rows.map(toFlagRow));
  let marked = 0;
  for (const flag of waiting) {
    const result = await markHostNotified(writer(), {
      flag,
      channel: 'IN_REPORT',
      actorId: input.actorId,
    });
    if (!result.changed) continue;
    marked += 1;
    await logAuditEntry({
      actorId: input.actorId,
      actorRole: 'ADMIN',
      action: 'JOB_FLAG_HOST_NOTIFIED',
      entityType: 'JobFlag',
      entityId: flag.id,
      description: 'Host notified by IN_REPORT',
      changes: { channel: 'IN_REPORT', jobId: input.jobId },
    });
  }
  return { marked };
}

export async function notifyHostOfFlag(input: {
  flagId: string;
  channel: HostNotifyChannelValue;
  actorId: string;
}): Promise<{ ok: true; changed: boolean; jobId: string } | { ok: false; status: 404 }> {
  const existing = await prisma.jobFlag.findUnique({ where: { id: input.flagId } });
  if (!existing) return { ok: false, status: 404 };
  const result = await markHostNotified(writer(), {
    flag: toFlagRow(existing),
    channel: input.channel,
    actorId: input.actorId,
  });
  if (result.changed) {
    await logAuditEntry({
      actorId: input.actorId,
      actorRole: 'ADMIN',
      action: 'JOB_FLAG_HOST_NOTIFIED',
      entityType: 'JobFlag',
      entityId: existing.id,
      description: `Host notified by ${input.channel}`,
      changes: { channel: input.channel, jobId: existing.jobId },
    });
  }
  return { ok: true, changed: result.changed, jobId: existing.jobId };
}

export async function resolveOpenFlag(input: {
  flagId: string;
  actorId: string;
}): Promise<{ ok: true; changed: boolean; jobId: string } | { ok: false; status: 404 }> {
  const existing = await prisma.jobFlag.findUnique({ where: { id: input.flagId } });
  if (!existing) return { ok: false, status: 404 };
  const result = await resolveFlag(writer(), {
    flag: toFlagRow(existing),
    actorId: input.actorId,
  });
  if (result.changed) {
    await logAuditEntry({
      actorId: input.actorId,
      actorRole: 'ADMIN',
      action: 'JOB_FLAG_RESOLVED',
      entityType: 'JobFlag',
      entityId: existing.id,
      description: 'Flag resolved',
      changes: { jobId: existing.jobId },
    });
  }
  return { ok: true, changed: result.changed, jobId: existing.jobId };
}

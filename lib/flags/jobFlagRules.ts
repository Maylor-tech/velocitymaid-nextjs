/**
 * Job flag rules. No Prisma client — safe for tests and the admin desk.
 * Customer-facing note when a cleaner leaves no caption.
 */

export const CUSTOMER_FLAG_NOTICE = 'Noticed during the clean';
export const FLAG_NOTE_MAX = 140;
export const FLAG_NOTE_PLACEHOLDER =
  'What did you notice? e.g. cracked lamp shade, living room';

export const PHOTO_FLAG_KINDS = ['DAMAGE', 'SUPPLY', 'ISSUE'] as const;
export const HOST_NOTIFY_CHANNELS = ['EMAIL', 'TEXT', 'CALL', 'IN_REPORT'] as const;

export type PhotoFlagKind = (typeof PHOTO_FLAG_KINDS)[number];
export type JobFlagKindValue = PhotoFlagKind | 'ARRIVAL';
export type HostNotifyChannelValue = (typeof HOST_NOTIFY_CHANNELS)[number];

export type FlagRow = {
  id: string;
  jobId: string;
  kind: JobFlagKindValue;
  note: string;
  photoId: string | null;
  createdAt: Date;
  hostNotifiedAt: Date | null;
  hostNotifiedChannel: HostNotifyChannelValue | null;
  resolvedAt: Date | null;
};

export type FlagWriter = {
  jobFlag: {
    findUnique: (args: { where: { photoId: string } }) => Promise<FlagRow | null>;
    findFirst: (args: {
      where: { jobId: string; kind: 'ARRIVAL' };
    }) => Promise<FlagRow | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<FlagRow>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<FlagRow>;
  };
};

export function flagKindForPhoto(category: string | null | undefined): PhotoFlagKind | null {
  const value = category?.trim().toUpperCase();
  if (value === 'DAMAGE' || value === 'SUPPLY' || value === 'ISSUE') return value;
  return null;
}

/** Caption when present. Otherwise the approved host wording. Never invents an inspection. */
export function flagNote(caption: string | null | undefined): string {
  const trimmed = caption?.trim();
  return trimmed ? trimmed : CUSTOMER_FLAG_NOTICE;
}

/** Damage, supply, and issue photos need the cleaner's own note. Blank stays an error. */
export function photoFlagNoteError(
  category: string | null | undefined,
  caption: string | null | undefined
): string | null {
  if (!flagKindForPhoto(category)) return null;
  const note = caption?.trim() ?? '';
  if (!note) return 'Add a short note about what you noticed.';
  if (note.length > FLAG_NOTE_MAX) return 'Keep the note to 140 characters.';
  return null;
}

/** Arrival Issues uses the same short note as a photo flag. */
export function arrivalNoteError(note: string | null | undefined): string | null {
  const trimmed = note?.trim() ?? '';
  if (!trimmed) return 'Add a short note about what you noticed.';
  if (trimmed.length > FLAG_NOTE_MAX) return 'Keep the note to 140 characters.';
  return null;
}

export function requirePhotoFlagNote(
  category: string | null | undefined,
  caption: string | null | undefined
): string | null {
  const error = photoFlagNoteError(category, caption);
  if (error) throw new Error(error);
  if (!flagKindForPhoto(category)) return null;
  return caption!.trim();
}

export function isHostNotifyChannel(value: unknown): value is HostNotifyChannelValue {
  return (
    typeof value === 'string' &&
    (HOST_NOTIFY_CHANNELS as readonly string[]).includes(value)
  );
}

const CHANNEL_LABEL: Record<HostNotifyChannelValue, string> = {
  EMAIL: 'email',
  TEXT: 'text',
  CALL: 'call',
  IN_REPORT: 'the report',
};

export function hostChannelLabel(channel: string | null | undefined): string | null {
  if (!channel) return null;
  if (isHostNotifyChannel(channel)) return CHANNEL_LABEL[channel];
  return null;
}

export const FLAG_KIND_LABEL: Record<JobFlagKindValue, string> = {
  DAMAGE: 'Damage',
  SUPPLY: 'Supply',
  ISSUE: 'Issue',
  ARRIVAL: 'Arrival',
};

function isUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

export async function ensurePhotoFlag(
  db: FlagWriter,
  input: {
    jobId: string;
    photoId: string;
    category: string | null | undefined;
    caption?: string | null;
    createdById?: string | null;
  }
): Promise<{ id: string; created: boolean } | null> {
  const kind = flagKindForPhoto(input.category);
  if (!kind) return null;

  const existing = await db.jobFlag.findUnique({ where: { photoId: input.photoId } });
  if (existing) return { id: existing.id, created: false };

  try {
    const created = await db.jobFlag.create({
      data: {
        jobId: input.jobId,
        kind,
        note: requirePhotoFlagNote(input.category, input.caption) ?? flagNote(input.caption),
        photoId: input.photoId,
        createdById: input.createdById ?? null,
      },
    });
    return { id: created.id, created: true };
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const again = await db.jobFlag.findUnique({ where: { photoId: input.photoId } });
    if (!again) throw error;
    return { id: again.id, created: false };
  }
}

export async function ensureArrivalFlag(
  db: FlagWriter,
  input: { jobId: string; createdById?: string | null; note?: string | null }
): Promise<{ id: string; created: boolean }> {
  const existing = await db.jobFlag.findFirst({
    where: { jobId: input.jobId, kind: 'ARRIVAL' },
  });
  const trimmed = input.note?.trim() ?? '';
  if (existing) {
    if (trimmed && existing.note === CUSTOMER_FLAG_NOTICE && existing.note !== trimmed) {
      const updated = await db.jobFlag.update({
        where: { id: existing.id },
        data: { note: trimmed },
      });
      return { id: updated.id, created: false };
    }
    return { id: existing.id, created: false };
  }

  try {
    const created = await db.jobFlag.create({
      data: {
        jobId: input.jobId,
        kind: 'ARRIVAL',
        note: trimmed || CUSTOMER_FLAG_NOTICE,
        createdById: input.createdById ?? null,
      },
    });
    return { id: created.id, created: true };
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const again = await db.jobFlag.findFirst({
      where: { jobId: input.jobId, kind: 'ARRIVAL' },
    });
    if (!again) throw error;
    return { id: again.id, created: false };
  }
}

/** Open flags with no earlier notice. Already told, and resolved flags, stay as they are. */
export function flagsAwaitingReportNotice(flags: FlagRow[]): FlagRow[] {
  return flags.filter((flag) => flag.resolvedAt == null && flag.hostNotifiedAt == null);
}

export async function markHostNotified(
  db: FlagWriter,
  input: {
    flag: FlagRow;
    channel: HostNotifyChannelValue;
    actorId: string;
    at?: Date;
  }
): Promise<{ flag: FlagRow; changed: boolean }> {
  if (input.flag.hostNotifiedAt) return { flag: input.flag, changed: false };
  const at = input.at ?? new Date();
  const flag = await db.jobFlag.update({
    where: { id: input.flag.id },
    data: {
      hostNotifiedAt: at,
      hostNotifiedById: input.actorId,
      hostNotifiedChannel: input.channel,
    },
  });
  return { flag, changed: true };
}

export async function resolveFlag(
  db: FlagWriter,
  input: { flag: FlagRow; actorId: string; at?: Date }
): Promise<{ flag: FlagRow; changed: boolean }> {
  if (input.flag.resolvedAt) return { flag: input.flag, changed: false };
  const at = input.at ?? new Date();
  const flag = await db.jobFlag.update({
    where: { id: input.flag.id },
    data: {
      resolvedAt: at,
      resolvedById: input.actorId,
    },
  });
  return { flag, changed: true };
}

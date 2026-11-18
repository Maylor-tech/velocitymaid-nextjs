import { describe, expect, it } from 'vitest';
import { describeHostNotice, flagMainLine, orderOpenFlags } from '../jobFlagDisplay';
import {
  CUSTOMER_FLAG_NOTICE,
  ensureArrivalFlag,
  ensurePhotoFlag,
  flagKindForPhoto,
  flagNote,
  photoFlagNoteError,
  markHostNotified,
  resolveFlag,
  type FlagRow,
  type FlagWriter,
} from '../jobFlagRules';

function row(partial: Partial<FlagRow> & Pick<FlagRow, 'id'>): FlagRow {
  return {
    jobId: 'job-1',
    kind: 'DAMAGE',
    note: CUSTOMER_FLAG_NOTICE,
    photoId: null,
    createdAt: new Date('2026-11-18T15:00:00.000Z'),
    hostNotifiedAt: null,
    hostNotifiedChannel: null,
    resolvedAt: null,
    ...partial,
  };
}

function memoryDb(seed: FlagRow[] = []): FlagWriter & { rows: FlagRow[] } {
  const rows = [...seed];
  return {
    rows,
    jobFlag: {
      findUnique: async ({ where }) => rows.find((item) => item.photoId === where.photoId) ?? null,
      findFirst: async ({ where }) =>
        rows.find((item) => item.jobId === where.jobId && item.kind === where.kind) ?? null,
      create: async ({ data }) => {
        const created = row({
          id: `flag-${rows.length + 1}`,
          jobId: String(data.jobId),
          kind: data.kind as FlagRow['kind'],
          note: String(data.note),
          photoId: (data.photoId as string | null | undefined) ?? null,
          createdAt: new Date('2026-11-18T18:00:00.000Z'),
        });
        if (created.photoId && rows.some((item) => item.photoId === created.photoId)) {
          const error = new Error('unique') as Error & { code: string };
          error.code = 'P2002';
          throw error;
        }
        if (created.kind === 'ARRIVAL' && rows.some((item) => item.jobId === created.jobId && item.kind === 'ARRIVAL')) {
          const error = new Error('unique') as Error & { code: string };
          error.code = 'P2002';
          throw error;
        }
        rows.push(created);
        return created;
      },
      update: async ({ where, data }) => {
        const current = rows.find((item) => item.id === where.id);
        if (!current) throw new Error('missing');
        Object.assign(current, data);
        return current;
      },
    },
  };
}

describe('job flags', () => {
  it('uses the host wording and does not say inspection', () => {
    expect(flagNote(null)).toBe('Noticed during the clean');
    expect(flagNote('  ')).toBe(CUSTOMER_FLAG_NOTICE);
    expect(flagNote('Broken lamp')).toBe('Broken lamp');
    expect(flagMainLine('')).toBe('Noticed during the clean');
    expect(flagMainLine('Cracked lamp shade, living room')).toBe(
      'Cracked lamp shade, living room'
    );
    expect(CUSTOMER_FLAG_NOTICE.toLowerCase()).not.toMatch(/inspect/);
  });

  it('requires a short note for damage, supply, and issue photos', () => {
    expect(photoFlagNoteError('DAMAGE', '  ')).toBe(
      'Add a short note about what you noticed.'
    );
    expect(photoFlagNoteError('SUPPLY', 'a'.repeat(141))).toBe(
      'Keep the note to 140 characters.'
    );
    expect(photoFlagNoteError('ISSUE', 'Cracked lamp shade, living room')).toBeNull();
    expect(photoFlagNoteError('BEFORE', '')).toBeNull();
  });

  it('flags damage, supply, and issue photos only', () => {
    expect(flagKindForPhoto('damage')).toBe('DAMAGE');
    expect(flagKindForPhoto('SUPPLY')).toBe('SUPPLY');
    expect(flagKindForPhoto('ISSUE')).toBe('ISSUE');
    expect(flagKindForPhoto('BEFORE')).toBeNull();
    expect(flagKindForPhoto('AFTER')).toBeNull();
  });

  it('creates one flag per photo and ignores a second create', async () => {
    const db = memoryDb();
    await expect(
      ensurePhotoFlag(db, {
        jobId: 'job-1',
        photoId: 'photo-missing',
        category: 'DAMAGE',
        caption: '  ',
      })
    ).rejects.toThrow('Add a short note about what you noticed.');
    const first = await ensurePhotoFlag(db, {
      jobId: 'job-1',
      photoId: 'photo-1',
      category: 'DAMAGE',
      caption: 'Cracked lamp shade, living room',
    });
    const second = await ensurePhotoFlag(db, {
      jobId: 'job-1',
      photoId: 'photo-1',
      category: 'DAMAGE',
      caption: 'again',
    });
    const other = await ensurePhotoFlag(db, {
      jobId: 'job-1',
      photoId: 'photo-2',
      category: 'BEFORE',
    });
    expect(first).toEqual({ id: 'flag-1', created: true });
    expect(second).toEqual({ id: 'flag-1', created: false });
    expect(other).toBeNull();
    expect(db.rows).toHaveLength(1);
    expect(db.rows[0]?.note).toBe('Cracked lamp shade, living room');
  });

  it('creates one arrival flag per job', async () => {
    const db = memoryDb();
    const first = await ensureArrivalFlag(db, { jobId: 'job-1' });
    const second = await ensureArrivalFlag(db, { jobId: 'job-1', note: 'again' });
    expect(first.created).toBe(true);
    expect(second).toEqual({ id: first.id, created: false });
    expect(db.rows).toHaveLength(1);
  });

  it('records the channel once and does not invent a time when none exists', async () => {
    const db = memoryDb([row({ id: 'open' })]);
    const flag = db.rows[0]!;
    expect(describeHostNotice({ hostNotifiedAt: null, hostNotifiedChannel: null })).toBe(
      'Host not told yet'
    );
    const marked = await markHostNotified(db, {
      flag,
      channel: 'EMAIL',
      actorId: 'admin-1',
      at: new Date('2026-11-18T15:00:00.000Z'),
    });
    expect(marked.changed).toBe(true);
    expect(marked.flag.hostNotifiedChannel).toBe('EMAIL');
    const again = await markHostNotified(db, {
      flag: marked.flag,
      channel: 'CALL',
      actorId: 'admin-2',
      at: new Date('2026-11-18T18:00:00.000Z'),
    });
    expect(again.changed).toBe(false);
    expect(again.flag.hostNotifiedChannel).toBe('EMAIL');
    expect(describeHostNotice({
      hostNotifiedAt: '2026-11-18T15:00:00.000Z',
      hostNotifiedChannel: 'EMAIL',
    })).toBe('Host told Nov 18, 10:00 AM by email');
    expect(describeHostNotice({ hostNotifiedAt: 'not-a-time', hostNotifiedChannel: 'CALL' })).toBe(
      'Host not told yet'
    );
  });

  it('resolves once and lists open flags newest first', async () => {
    const db = memoryDb([
      row({ id: 'older', createdAt: new Date('2026-11-01T00:00:00.000Z') }),
      row({ id: 'newer', createdAt: new Date('2026-11-18T00:00:00.000Z') }),
    ]);
    const resolved = await resolveFlag(db, {
      flag: db.rows[0]!,
      actorId: 'admin-1',
      at: new Date('2026-11-18T16:00:00.000Z'),
    });
    expect(resolved.changed).toBe(true);
    const second = await resolveFlag(db, { flag: resolved.flag, actorId: 'admin-2' });
    expect(second.changed).toBe(false);
    expect((second.flag as FlagRow & { resolvedById?: string }).resolvedById).toBe('admin-1');
    const ordered = orderOpenFlags([
      {
        id: 'older',
        createdAt: '2026-11-01T00:00:00.000Z',
        resolvedAt: '2026-11-18T16:00:00.000Z',
      },
      { id: 'newer', createdAt: '2026-11-18T00:00:00.000Z', resolvedAt: null },
      { id: 'mid', createdAt: '2026-11-10T00:00:00.000Z', resolvedAt: null },
    ]);
    expect(ordered.map((item) => item.id)).toEqual(['newer', 'mid']);
  });
});

import { round2 } from '@/lib/payoutRules';
import {
  assertAllocationMemo,
  reimbursementLines,
  type AllocationType,
  type JobPayInput,
  type ManualPaymentMethod,
  type PaidFromKind,
} from '@/lib/cleanerComp/pay';

export type KnownJob = {
  jobId: string;
  serviceDate: string;
  cleanerId: string;
};

export type CleanerIdentity = {
  id: string;
  name: string;
  email?: string | null;
};

export type PlannedAllocation = {
  jobId: string | null;
  amount: number;
  type: AllocationType;
  memo: string | null;
  jobReference: string | null;
  payBasisNote: string | null;
  unmatched: boolean;
};

export type PlannedPayment = {
  id: string;
  paymentKey: string;
  cleanerId: string;
  date: string;
  amount: number;
  method: ManualPaymentMethod;
  paidFromKind: PaidFromKind;
  paidFromLabel: string | null;
  memo: string | null;
  allocations: PlannedAllocation[];
};

export type ImportPlan = {
  payments: PlannedPayment[];
  skippedKeys: string[];
  advances: { paymentKey: string; amount: number; memo: string }[];
  reimbursements: { paymentId: string; person: string; amount: number }[];
  unmatched: {
    paymentKey: string;
    cleanerId: string;
    amount: number;
    jobReference: string;
    payBasisNote: string;
  }[];
  jobs: JobPayInput[];
};

type CsvRow = Record<string, string>;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
      continue;
    }
    if (ch === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    if (ch !== '\r') cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.trim()));
}

function rowsFromCsv(text: string): CsvRow[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];
  const header = table[0].map((cell) => cell.trim());
  return table.slice(1).map((cells) => {
    const row: CsvRow = {};
    header.forEach((key, index) => {
      row[key] = (cells[index] ?? '').trim();
    });
    return row;
  });
}

export function cleanerRows(csv: string): { name: string; email: string }[] {
  const seen = new Set<string>();
  const people: { name: string; email: string }[] = [];
  for (const row of rowsFromCsv(csv)) {
    const name = (row.cleaner ?? '').trim();
    const email = (row.cleanerEmail ?? '').trim();
    const key = (email || name).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    people.push({ name, email });
  }
  return people;
}

export function parsePaidFrom(raw: string): { kind: PaidFromKind; label: string | null } {
  const text = raw.trim();
  const personal = text.match(/^PERSONAL_FUNDS:(.+)$/i);
  if (personal) return { kind: 'PERSONAL_FUNDS', label: personal[1].trim() };
  const business = text.match(/^BUSINESS(?:_ACCOUNT)?:(.+)$/i);
  if (business) return { kind: 'BUSINESS_ACCOUNT', label: business[1].trim() };
  if (/^UNKNOWN$/i.test(text) || text === '') return { kind: 'UNKNOWN', label: null };
  return { kind: 'UNKNOWN', label: text };
}

export function parseHourlyBasis(note: string): { hours: number; rate: number; assisted: boolean } | null {
  const match = note.match(/HOURLY\s+(\d+(?:\.\d+)?)h\s+x\s+\$(\d+(?:\.\d+)?)/i);
  if (!match) return null;
  return {
    hours: round2(Number(match[1])),
    rate: round2(Number(match[2])),
    assisted: /assisted/i.test(note),
  };
}

function paymentMethod(raw: string): ManualPaymentMethod {
  const method = raw.trim().toUpperCase();
  if (method === 'ZELLE' || method === 'CASH' || method === 'CHECK' || method === 'OTHER') return method;
  throw new Error(`Payment method ${raw} is not Zelle, cash, check, or other.`);
}

function allocationType(raw: string): AllocationType {
  const type = raw.trim().toUpperCase();
  if (type === 'JOB' || type === 'ADVANCE' || type === 'OTHER') return type;
  throw new Error('Allocation type must be JOB, ADVANCE, or OTHER.');
}

function findCleaner(cleaners: CleanerIdentity[], email: string, name: string): CleanerIdentity {
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail) {
    const byEmail = cleaners.find((cleaner) => (cleaner.email ?? '').trim().toLowerCase() === normalizedEmail);
    if (byEmail) return byEmail;
  }
  const normalizedName = name.trim().toLowerCase();
  const byName = cleaners.find((cleaner) => {
    const cleanerName = cleaner.name.trim().toLowerCase();
    return cleanerName.length > 0 && (normalizedName.includes(cleanerName) || cleanerName.includes(normalizedName));
  });
  if (byName) return byName;
  throw new Error(`No cleaner record for ${name || 'this row'}. The import does not create a guessed match.`);
}

function historicalJob(input: {
  job: KnownJob;
  amount: number;
  effectiveFrom: string | null;
}): JobPayInput {
  return {
    jobId: input.job.jobId,
    cleanerId: input.job.cleanerId,
    serviceDate: input.job.serviceDate,
    completed: true,
    agreedCleaningPrice: null,
    termsEffectiveFrom: input.effectiveFrom,
    agreement: {
      method: 'FLAT',
      rate: input.amount,
      eligibleBase: input.amount,
      payBasis: 'HISTORICAL_AS_PAID',
      includedAddOns: [],
      assisted: false,
      verifiedHours: null,
      hoursVerifiedBy: null,
      hoursVerifiedAt: null,
      frozenAt: input.job.serviceDate,
    },
  };
}

function hourlyJob(input: {
  job: KnownJob;
  hours: number;
  rate: number;
  assisted: boolean;
  effectiveFrom: string | null;
}): JobPayInput {
  return {
    jobId: input.job.jobId,
    cleanerId: input.job.cleanerId,
    serviceDate: input.job.serviceDate,
    completed: true,
    agreedCleaningPrice: null,
    termsEffectiveFrom: input.effectiveFrom,
    agreement: {
      method: 'HOURLY',
      rate: input.rate,
      eligibleBase: null,
      payBasis: 'TERMS',
      includedAddOns: [],
      assisted: input.assisted,
      verifiedHours: input.hours,
      hoursVerifiedBy: 'history-import',
      hoursVerifiedAt: input.job.serviceDate,
      frozenAt: input.job.serviceDate,
    },
  };
}

export function planCleanerPaymentImport(input: {
  csv: string;
  jobsByReference: Record<string, KnownJob>;
  cleaners: CleanerIdentity[];
  termsEffectiveFrom?: Record<string, string>;
  existingPaymentKeys?: string[];
}): ImportPlan {
  const existing = new Set(input.existingPaymentKeys ?? []);
  const grouped = new Map<string, CsvRow[]>();
  for (const row of rowsFromCsv(input.csv)) {
    const key = row.paymentKey;
    if (!key) throw new Error('Each row needs a paymentKey.');
    const bucket = grouped.get(key) ?? [];
    bucket.push(row);
    grouped.set(key, bucket);
  }

  const payments: PlannedPayment[] = [];
  const skippedKeys: string[] = [];
  const advances: ImportPlan['advances'] = [];
  const unmatched: ImportPlan['unmatched'] = [];
  const jobs: JobPayInput[] = [];
  const seenJobs = new Set<string>();

  for (const [paymentKey, rows] of grouped) {
    if (existing.has(paymentKey)) {
      skippedKeys.push(paymentKey);
      continue;
    }
    const first = rows[0];
    const cleaner = findCleaner(input.cleaners, first.cleanerEmail ?? '', first.cleaner ?? '');
    const paidFrom = parsePaidFrom(first.paidFrom ?? '');
    const amount = round2(Number(first.paymentAmount));
    if (!Number.isFinite(amount) || amount <= 0) throw new Error(`Payment ${paymentKey} needs an amount.`);
    const allocations: PlannedAllocation[] = rows.map((row) => {
      const type = allocationType(row.allocationType ?? '');
      const memo = (row.memo ?? '').trim();
      assertAllocationMemo(type, memo);
      const allocationAmount = round2(Number(row.allocationAmount));
      if (!Number.isFinite(allocationAmount) || allocationAmount <= 0) {
        throw new Error(`Payment ${paymentKey} has an allocation without an amount.`);
      }
      const reference = (row.jobReference ?? '').trim();
      const basisNote = (row.payBasis ?? '').trim();
      if (type === 'ADVANCE') {
        advances.push({ paymentKey, amount: allocationAmount, memo });
        return {
          jobId: null,
          amount: allocationAmount,
          type,
          memo,
          jobReference: null,
          payBasisNote: basisNote || null,
          unmatched: false,
        };
      }
      if (type === 'OTHER') {
        return {
          jobId: null,
          amount: allocationAmount,
          type,
          memo,
          jobReference: reference || null,
          payBasisNote: basisNote || null,
          unmatched: false,
        };
      }
      if (reference.startsWith('MATCH:')) {
        unmatched.push({
          paymentKey,
          cleanerId: cleaner.id,
          amount: allocationAmount,
          jobReference: reference,
          payBasisNote: basisNote,
        });
        return {
          jobId: null,
          amount: allocationAmount,
          type,
          memo: memo || null,
          jobReference: reference,
          payBasisNote: basisNote || null,
          unmatched: true,
        };
      }
      const known = reference ? input.jobsByReference[reference] : undefined;
      if (!known) {
        unmatched.push({
          paymentKey,
          cleanerId: cleaner.id,
          amount: allocationAmount,
          jobReference: reference || 'Missing job reference',
          payBasisNote: basisNote,
        });
        return {
          jobId: null,
          amount: allocationAmount,
          type,
          memo: memo || null,
          jobReference: reference || null,
          payBasisNote: basisNote || null,
          unmatched: true,
        };
      }
      const effectiveFrom = input.termsEffectiveFrom?.[cleaner.id] ?? null;
      if (!seenJobs.has(known.jobId)) {
        seenJobs.add(known.jobId);
        const hourly = parseHourlyBasis(basisNote);
        jobs.push(
          hourly
            ? hourlyJob({ job: known, hours: hourly.hours, rate: hourly.rate, assisted: hourly.assisted, effectiveFrom })
            : historicalJob({ job: known, amount: allocationAmount, effectiveFrom })
        );
      }
      return {
        jobId: known.jobId,
        amount: allocationAmount,
        type,
        memo: memo || null,
        jobReference: reference,
        payBasisNote: basisNote || null,
        unmatched: false,
      };
    });

    payments.push({
      id: `import-${paymentKey}`,
      paymentKey,
      cleanerId: cleaner.id,
      date: first.paidOn,
      amount,
      method: paymentMethod(first.method ?? ''),
      paidFromKind: paidFrom.kind,
      paidFromLabel: paidFrom.label,
      memo: (first.memo ?? '').trim() || null,
      allocations,
    });
  }

  return {
    payments,
    skippedKeys,
    advances,
    reimbursements: reimbursementLines(payments),
    unmatched,
    jobs,
  };
}

export function linkUnmatchedAllocation(input: {
  payment: PlannedPayment;
  jobReference: string;
  job: KnownJob;
  termsEffectiveFrom?: string | null;
}): { payment: PlannedPayment; job: JobPayInput } {
  const allocation = input.payment.allocations.find(
    (row) => row.unmatched && row.jobReference === input.jobReference
  );
  if (!allocation) throw new Error('That unmatched row is not on this payment.');
  const basis = parseHourlyBasis(allocation.payBasisNote ?? '');
  const payment: PlannedPayment = {
    ...input.payment,
    allocations: input.payment.allocations.map((row) =>
      row === allocation ? { ...row, jobId: input.job.jobId, unmatched: false } : row
    ),
  };
  const job = basis
    ? hourlyJob({
        job: input.job,
        hours: basis.hours,
        rate: basis.rate,
        assisted: basis.assisted,
        effectiveFrom: input.termsEffectiveFrom ?? null,
      })
    : historicalJob({
        job: input.job,
        amount: allocation.amount,
        effectiveFrom: input.termsEffectiveFrom ?? null,
      });
  return { payment, job };
}

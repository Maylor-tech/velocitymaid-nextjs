import { round2 } from '@/lib/payoutRules';

export const COMPENSATION_METHODS = ['PERCENTAGE', 'HOURLY', 'FLAT'] as const;
export type CompensationMethod = (typeof COMPENSATION_METHODS)[number];

export const PAYABLE_STATUSES = [
  'NEEDS_HOURS',
  'NEEDS_RECONCILIATION',
  'PAID_MANUALLY',
  'OWED',
  'OVERPAID',
] as const;
export type PayableStatus = (typeof PAYABLE_STATUSES)[number];

export const MANUAL_PAYMENT_METHODS = ['ZELLE', 'CASH', 'CHECK', 'OTHER'] as const;
export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

export const ALLOCATION_TYPES = ['JOB', 'ADVANCE', 'OTHER'] as const;
export type AllocationType = (typeof ALLOCATION_TYPES)[number];

export const PAID_FROM_KINDS = ['BUSINESS_ACCOUNT', 'PERSONAL_FUNDS', 'UNKNOWN'] as const;
export type PaidFromKind = (typeof PAID_FROM_KINDS)[number];

export const TAX_PAPERWORK_TYPES = ['W9', 'W4_I9', 'NONE'] as const;
export type TaxPaperworkType = (typeof TAX_PAPERWORK_TYPES)[number];

export const TAX_PAPERWORK_STATUSES = ['ON_FILE', 'MISSING'] as const;
export type TaxPaperworkStatus = (typeof TAX_PAPERWORK_STATUSES)[number];

export type TaxPaperwork = {
  type: TaxPaperworkType;
  status: TaxPaperworkStatus;
  on?: string | null;
};

/** Solo percentage needs W-9 or W-4/I-9 on file. NONE does not qualify. */
export function soloPercentageAllowed(paperwork?: TaxPaperwork | null): boolean {
  if (!paperwork || paperwork.status !== 'ON_FILE') return false;
  return paperwork.type === 'W9' || paperwork.type === 'W4_I9';
}

export function paperworkFromProfile(profile: {
  taxPaperworkType?: string | null;
  taxPaperworkStatus?: string | null;
  taxPaperworkOn?: Date | string | null;
} | null | undefined): TaxPaperwork {
  const type = TAX_PAPERWORK_TYPES.includes(profile?.taxPaperworkType as TaxPaperworkType)
    ? (profile?.taxPaperworkType as TaxPaperworkType)
    : 'W9';
  const status = profile?.taxPaperworkStatus === 'ON_FILE' ? 'ON_FILE' : 'MISSING';
  const on = profile?.taxPaperworkOn instanceof Date
    ? profile.taxPaperworkOn.toISOString().slice(0, 10)
    : profile?.taxPaperworkOn?.slice(0, 10) ?? null;
  return { type, status, on };
}

export function taxPaperworkLabel(paperwork?: TaxPaperwork | null): string {
  if (!soloPercentageAllowed(paperwork)) {
    return 'Tax paperwork is missing. Solo percentage offers stay blocked. Assisted hourly is allowed.';
  }
  const type = paperwork?.type === 'W4_I9' ? 'W-4 and I-9' : 'W-9';
  const on = paperwork?.on ? ` · ${paperwork.on}` : '';
  return `${type} on file${on}.`;
}

export const REIMBURSEMENT_STATUSES = ['OWED', 'REPAID'] as const;
export type ReimbursementStatus = (typeof REIMBURSEMENT_STATUSES)[number];

export type ReimbursementRecord = {
  status: ReimbursementStatus;
  repaidOn: string | null;
  repaidMethod: ManualPaymentMethod | null;
  repaidMemo: string | null;
  repaidBy: string | null;
};

export function openReimbursement(): ReimbursementRecord {
  return { status: 'OWED', repaidOn: null, repaidMethod: null, repaidMemo: null, repaidBy: null };
}

export function markReimbursementRepaid(
  row: ReimbursementRecord,
  input: { repaidOn: string; repaidMethod: ManualPaymentMethod; repaidMemo?: string | null; repaidBy: string }
): ReimbursementRecord {
  if (row.status === 'REPAID') throw new Error('This reimbursement is already repaid.');
  const repaidOn = input.repaidOn.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(repaidOn)) throw new Error('Mark repaid needs a date.');
  if (!MANUAL_PAYMENT_METHODS.includes(input.repaidMethod)) {
    throw new Error('Mark repaid needs a method.');
  }
  if (!input.repaidBy.trim()) throw new Error('Mark repaid needs the person who recorded it.');
  return {
    status: 'REPAID',
    repaidOn,
    repaidMethod: input.repaidMethod,
    repaidMemo: input.repaidMemo?.trim() || null,
    repaidBy: input.repaidBy,
  };
}

export const PAY_BASIS = ['TERMS', 'HISTORICAL_AS_PAID'] as const;
export type PayBasis = (typeof PAY_BASIS)[number];

/** Warning starts at 80% of this amount. Admins can store a different threshold. */
export const DEFAULT_1099_THRESHOLD = 2000;

export type AgreementSnapshot = {
  method: CompensationMethod;
  /** 65 means 65 percent. 30 means $30 per verified hour, or a flat dollar amount. */
  rate: number;
  eligibleBase: number | null;
  /** Typed for this job. Replaces the job’s cleaning price. */
  manualEligibleBase?: boolean;
  payBasis?: PayBasis;
  includedAddOns: string[];
  assisted: boolean;
  verifiedHours: number | null;
  hoursVerifiedBy: string | null;
  hoursVerifiedAt: string | null;
  frozenAt: string | null;
};

export type AddOnAmount = { key: string; amount: number };

export type JobPayInput = {
  jobId: string;
  cleanerId: string;
  serviceDate: string;
  completed: boolean;
  agreedCleaningPrice: number | null;
  processingAllowance?: number;
  reimbursements?: number;
  travelFees?: number;
  otherAddOns?: AddOnAmount[];
  /** Never part of expected pay. Kept so callers can prove it was ignored. */
  tip?: number;
  /** When the service date is before this day, pay is historical as paid unless the job has verified hourly terms. */
  termsEffectiveFrom?: string | null;
  agreement: AgreementSnapshot;
};

export type AllocationInput = {
  jobId?: string | null;
  amount: number;
  type?: AllocationType;
  memo?: string | null;
  appliedJobId?: string | null;
};

export type ManualPaymentInput = {
  id: string;
  cleanerId: string;
  date: string;
  amount: number;
  paidFromKind?: PaidFromKind;
  paidFromLabel?: string | null;
  allocations: AllocationInput[];
};

export type Obligation = {
  jobId: string;
  cleanerId: string;
  expected: number;
  paid: number;
  balance: number;
  status: Extract<PayableStatus, 'PAID_MANUALLY' | 'OWED' | 'OVERPAID'>;
};

export type ReviewRow = {
  jobId: string;
  cleanerId: string;
  status: PayableStatus;
  expected: number | null;
  paid: number;
  balance: number | null;
  method: CompensationMethod;
  rate: number;
  verifiedHours: number | null;
  payBasis: PayBasis;
  persisted: boolean;
};

export function assertAllocationMemo(type: AllocationType, memo: string | null | undefined): void {
  if (type !== 'JOB' && !(memo ?? '').trim()) {
    throw new Error('A memo is required for an advance or other allocation.');
  }
}

export function applyAdvance<T extends AllocationInput>(allocation: T, jobId: string): T {
  if ((allocation.type ?? 'JOB') !== 'ADVANCE') {
    throw new Error('Only an advance can be applied to a later job.');
  }
  if (!jobId) throw new Error('Choose the job this advance applies to.');
  return { ...allocation, appliedJobId: jobId };
}

export function suggestedHours(
  startedAt: Date | null | undefined,
  finishedAt: Date | null | undefined
): number | null {
  if (!startedAt || !finishedAt) return null;
  const ms = finishedAt.getTime() - startedAt.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return round2(ms / 3_600_000);
}

export function toMoney(raw: unknown): number | null {
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  return round2(n);
}

/**
 * Agreed cleaning price, minus add-ons the assignment did not mark included.
 * Terms do not carry an add-on pay rule. An add-on stays out of this base
 * unless this agreement lists it in includedAddOns.
 * A frozen snapshot wins, so a later price edit cannot rewrite a finished job.
 * Tips are not a parameter of this amount.
 */
export function eligibleCleaningAmount(input: JobPayInput): number | null {
  const agreement = input.agreement;
  if (agreement.manualEligibleBase && agreement.eligibleBase != null) {
    return round2(agreement.eligibleBase);
  }
  if (agreement.frozenAt && agreement.eligibleBase != null) {
    return round2(agreement.eligibleBase);
  }
  if (input.agreedCleaningPrice == null) {
    return agreement.eligibleBase == null ? null : round2(agreement.eligibleBase);
  }
  const included = new Set(agreement.includedAddOns);
  let base = input.agreedCleaningPrice;
  if (!included.has('processingAllowance')) base -= input.processingAllowance ?? 0;
  if (!included.has('reimbursements')) base -= input.reimbursements ?? 0;
  if (!included.has('travel')) base -= input.travelFees ?? 0;
  for (const addOn of input.otherAddOns ?? []) {
    if (!included.has(addOn.key)) base -= addOn.amount;
  }
  return round2(Math.max(0, base));
}

export function expectedPay(input: JobPayInput): number | null {
  const agreement = input.agreement;
  if (agreement.method === 'HOURLY') {
    if (agreement.verifiedHours == null) return null;
    return round2(agreement.verifiedHours * agreement.rate);
  }
  if (agreement.method === 'FLAT') return round2(agreement.rate);
  const base = eligibleCleaningAmount(input);
  if (base == null) return null;
  return round2(base * (agreement.rate / 100));
}

export function withRateChange(
  agreement: AgreementSnapshot,
  nextRate: number,
  completed: boolean
): AgreementSnapshot {
  if (completed || agreement.frozenAt) return agreement;
  return { ...agreement, rate: nextRate };
}

export function confirmVerifiedHours(
  agreement: AgreementSnapshot,
  hours: number,
  verifiedBy: string,
  verifiedAt: string
): AgreementSnapshot {
  if (agreement.hoursVerifiedAt) return agreement;
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error('Verified hours must be greater than zero.');
  }
  return {
    ...agreement,
    verifiedHours: round2(hours),
    hoursVerifiedBy: verifiedBy,
    hoursVerifiedAt: verifiedAt,
  };
}

function allocationType(allocation: AllocationInput): AllocationType {
  return allocation.type ?? 'JOB';
}

function allocatedToJob(payments: ManualPaymentInput[], jobId: string, cleanerId: string): number {
  let total = 0;
  for (const payment of payments) {
    if (payment.cleanerId !== cleanerId) continue;
    for (const allocation of payment.allocations) {
      const type = allocationType(allocation);
      if (type === 'JOB' && allocation.jobId === jobId) total += allocation.amount;
      if (type === 'ADVANCE' && allocation.appliedJobId === jobId) total += allocation.amount;
    }
  }
  return round2(total);
}

function dayOnly(value: string | null | undefined): string {
  return (value ?? '').slice(0, 10);
}

/** Jobs before terms are paid as allocated. A verified hourly basis on that job still uses hours × rate. */
export function isHistoricalAsPaid(job: JobPayInput): boolean {
  if (job.agreement.payBasis === 'HISTORICAL_AS_PAID') return true;
  const effective = dayOnly(job.termsEffectiveFrom);
  if (!effective || dayOnly(job.serviceDate) >= effective) return false;
  if (job.agreement.method === 'HOURLY' && job.agreement.verifiedHours != null) return false;
  if (job.agreement.method === 'FLAT') return false;
  return true;
}

function hasUnallocatedPaymentOnDate(
  payments: ManualPaymentInput[],
  cleanerId: string,
  serviceDate: string
): boolean {
  return payments.some((payment) => {
    if (payment.cleanerId !== cleanerId || payment.date !== serviceDate) return false;
    const allocated = payment.allocations.reduce((sum, row) => sum + row.amount, 0);
    return round2(payment.amount - allocated) > 0;
  });
}

export function reviewPayables(input: {
  jobs: JobPayInput[];
  payments: ManualPaymentInput[];
  existing?: Obligation[];
}): { rows: ReviewRow[]; obligations: Obligation[]; created: number } {
  const obligations = [...(input.existing ?? [])];
  const rows: ReviewRow[] = [];
  let created = 0;

  for (const job of input.jobs) {
    const prior = obligations.find(
      (row) => row.jobId === job.jobId && row.cleanerId === job.cleanerId
    );
    if (prior) {
      rows.push({
        jobId: job.jobId,
        cleanerId: job.cleanerId,
        status: prior.status,
        expected: prior.expected,
        paid: prior.paid,
        balance: prior.balance,
        method: job.agreement.method,
        rate: job.agreement.rate,
        verifiedHours: job.agreement.verifiedHours,
        payBasis: job.agreement.payBasis === 'HISTORICAL_AS_PAID' ? 'HISTORICAL_AS_PAID' : 'TERMS',
        persisted: true,
      });
      continue;
    }

    const paid = allocatedToJob(input.payments, job.jobId, job.cleanerId);
    if (isHistoricalAsPaid(job)) {
      const obligation: Obligation = {
        jobId: job.jobId,
        cleanerId: job.cleanerId,
        expected: paid,
        paid,
        balance: 0,
        status: 'PAID_MANUALLY',
      };
      obligations.push(obligation);
      created += 1;
      rows.push({
        jobId: job.jobId,
        cleanerId: job.cleanerId,
        status: 'PAID_MANUALLY',
        expected: paid,
        paid,
        balance: 0,
        method: job.agreement.method,
        rate: job.agreement.rate,
        verifiedHours: job.agreement.verifiedHours,
        payBasis: 'HISTORICAL_AS_PAID',
        persisted: true,
      });
      continue;
    }

    const hourlyUnverified =
      job.agreement.method === 'HOURLY' && job.agreement.verifiedHours == null;
    if (hourlyUnverified) {
      rows.push({
        jobId: job.jobId,
        cleanerId: job.cleanerId,
        status: 'NEEDS_HOURS',
        expected: null,
        paid,
        balance: null,
        method: job.agreement.method,
        rate: job.agreement.rate,
        verifiedHours: null,
        payBasis: 'TERMS',
        persisted: false,
      });
      continue;
    }

    if (hasUnallocatedPaymentOnDate(input.payments, job.cleanerId, job.serviceDate)) {
      rows.push({
        jobId: job.jobId,
        cleanerId: job.cleanerId,
        status: 'NEEDS_RECONCILIATION',
        expected: expectedPay(job),
        paid,
        balance: null,
        method: job.agreement.method,
        rate: job.agreement.rate,
        verifiedHours: job.agreement.verifiedHours,
        payBasis: 'TERMS',
        persisted: false,
      });
      continue;
    }

    const expected = expectedPay(job);
    if (expected == null) {
      rows.push({
        jobId: job.jobId,
        cleanerId: job.cleanerId,
        status: 'NEEDS_RECONCILIATION',
        expected: null,
        paid,
        balance: null,
        method: job.agreement.method,
        rate: job.agreement.rate,
        verifiedHours: job.agreement.verifiedHours,
        payBasis: 'TERMS',
        persisted: false,
      });
      continue;
    }

    const balance = round2(expected - paid);
    const status: Obligation['status'] =
      balance < 0 ? 'OVERPAID' : balance === 0 ? 'PAID_MANUALLY' : 'OWED';
    const obligation: Obligation = {
      jobId: job.jobId,
      cleanerId: job.cleanerId,
      expected,
      paid,
      balance,
      status,
    };
    obligations.push(obligation);
    created += 1;
    rows.push({
      jobId: job.jobId,
      cleanerId: job.cleanerId,
      status,
      expected,
      paid,
      balance,
      method: job.agreement.method,
      rate: job.agreement.rate,
      verifiedHours: job.agreement.verifiedHours,
      payBasis: 'TERMS',
      persisted: true,
    });
  }

  return { rows, obligations, created };
}

export function cleanerPayLabel(method: CompensationMethod, rate: number): string {
  const rateText = Number.isInteger(rate) ? String(rate) : String(round2(rate));
  if (method === 'PERCENTAGE') return `${rateText}%`;
  if (method === 'HOURLY') return `$${rateText} per hour`;
  return `$${rateText} flat`;
}

export function compensationMethodLabel(method: CompensationMethod): string {
  if (method === 'PERCENTAGE') return 'Percentage';
  if (method === 'HOURLY') return 'Hourly';
  return 'Flat';
}

/** Optional solo override for a home at or above a bedroom count. Absent means no exception. */
export type HomeSizeException = {
  minBedrooms: number;
  method: CompensationMethod;
  rate: number;
};

export type CleanerTerms = {
  soloMethod: CompensationMethod;
  soloRate: number;
  assistedMethod: CompensationMethod;
  assistedRate: number;
  effectiveFrom?: string | null;
  /** Null or omitted: every home size uses the standard solo terms. */
  homeSizeException?: HomeSizeException | null;
};

export function homeSizeExceptionLabel(exception: HomeSizeException): string {
  return `${exception.minBedrooms}+ bedroom solo = ${cleanerPayLabel(exception.method, exception.rate)}`;
}

/**
 * Solo terms for this home. A 4+ bedroom clean stays on the standard solo terms
 * until an exception is stored. Assisted work never uses the exception.
 */
export function appliedSoloTerms(
  terms: CleanerTerms | null,
  bedrooms?: number | null
): { method: CompensationMethod; rate: number; exception: boolean } | null {
  if (!terms) return null;
  const exception = terms.homeSizeException ?? null;
  if (
    exception &&
    bedrooms != null &&
    Number.isFinite(bedrooms) &&
    bedrooms >= exception.minBedrooms
  ) {
    return { method: exception.method, rate: exception.rate, exception: true };
  }
  return { method: terms.soloMethod, rate: terms.soloRate, exception: false };
}

/** Blank input clears the exception. A partial row is rejected. */
export function parseHomeSizeException(raw: unknown): HomeSizeException | null {
  if (raw == null || raw === '') return null;
  if (typeof raw !== 'object') {
    throw new Error('Home-size exception needs a bedroom minimum, a method, and an amount.');
  }
  const body = raw as { minBedrooms?: unknown; method?: unknown; rate?: unknown };
  const minBlank = body.minBedrooms == null || body.minBedrooms === '';
  const methodBlank = body.method == null || body.method === '';
  const rateBlank = body.rate == null || body.rate === '';
  if (minBlank && methodBlank && rateBlank) return null;
  if (minBlank || methodBlank || rateBlank) {
    throw new Error('Home-size exception needs a bedroom minimum, a method, and an amount.');
  }
  const minBedrooms = Number(body.minBedrooms);
  const rate = Number(body.rate);
  if (!Number.isInteger(minBedrooms) || minBedrooms < 1) {
    throw new Error('Home-size exception needs a whole number of bedrooms, such as 4.');
  }
  if (!COMPENSATION_METHODS.includes(body.method as CompensationMethod)) {
    throw new Error('Home-size exception method is percentage, hourly, or flat.');
  }
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Home-size exception needs an amount greater than zero.');
  }
  return {
    minBedrooms,
    method: body.method as CompensationMethod,
    rate: round2(rate),
  };
}

export function homeSizeColumns(exception: HomeSizeException | null): {
  homeSizeMinBedrooms: number | null;
  homeSizeSoloMethod: CompensationMethod | null;
  homeSizeSoloRate: number | null;
} {
  if (!exception) {
    return { homeSizeMinBedrooms: null, homeSizeSoloMethod: null, homeSizeSoloRate: null };
  }
  return {
    homeSizeMinBedrooms: exception.minBedrooms,
    homeSizeSoloMethod: exception.method,
    homeSizeSoloRate: exception.rate,
  };
}

export function cleanerTermsFromRow(row: {
  soloMethod: CompensationMethod;
  soloRate: unknown;
  assistedMethod: CompensationMethod;
  assistedRate: unknown;
  effectiveFrom?: Date | string | null;
  homeSizeMinBedrooms?: number | null;
  homeSizeSoloMethod?: CompensationMethod | null;
  homeSizeSoloRate?: unknown;
}): CleanerTerms {
  const min = row.homeSizeMinBedrooms ?? null;
  const method = row.homeSizeSoloMethod ?? null;
  const rate = toMoney(row.homeSizeSoloRate);
  const effective = row.effectiveFrom instanceof Date
    ? row.effectiveFrom.toISOString().slice(0, 10)
    : row.effectiveFrom ?? null;
  return {
    soloMethod: row.soloMethod,
    soloRate: toMoney(row.soloRate) ?? 0,
    assistedMethod: row.assistedMethod,
    assistedRate: toMoney(row.assistedRate) ?? 0,
    effectiveFrom: effective,
    homeSizeException:
      min != null && method && rate != null ? { minBedrooms: min, method, rate } : null,
  };
}

function dayKey(value: string | null | undefined): string {
  return (value ?? '').slice(0, 10);
}

/** Latest terms whose effectiveFrom is on or before the service date. */
export function termsInEffect<T extends { effectiveFrom?: string | null }>(
  rows: T[],
  serviceDate: string
): T | null {
  const day = dayKey(serviceDate);
  const eligible = rows
    .filter((row) => {
      const from = dayKey(row.effectiveFrom);
      return from !== '' && from <= day;
    })
    .sort((a, b) => dayKey(b.effectiveFrom).localeCompare(dayKey(a.effectiveFrom)));
  return eligible[0] ?? null;
}

/**
 * Date used to decide historical pay. A service date with terms in effect uses that row.
 * A service date before every row uses the earliest future date, so later terms do not apply.
 */
export function termsBoundary<T extends { effectiveFrom?: string | null }>(
  rows: T[],
  serviceDate: string
): string | null {
  const current = termsInEffect(rows, serviceDate);
  if (current?.effectiveFrom) return dayKey(current.effectiveFrom);
  const day = dayKey(serviceDate);
  const upcoming = rows
    .map((row) => dayKey(row.effectiveFrom))
    .filter((from) => from !== '' && from > day)
    .sort();
  return upcoming[0] ?? null;
}

export function assertAllocationsWithinPayment(amount: number, allocated: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }
  if (!Number.isFinite(allocated) || allocated < 0) {
    throw new Error('Allocation amounts must be greater than zero.');
  }
  if (Math.round(allocated * 100) > Math.round(amount * 100)) {
    throw new Error('Allocations cannot exceed the payment.');
  }
}

export function jobDeleteBlockReason(counts: {
  agreements: number;
  payables: number;
  allocations: number;
}): string | null {
  if (counts.agreements + counts.payables + counts.allocations <= 0) return null;
  return 'This job has cleaner pay records, so it cannot be deleted.';
}

export type OfferChoice = 'solo' | 'assisted' | 'custom';

export function offerChoicesForCleaner(
  terms: CleanerTerms | null,
  paperwork?: TaxPaperwork | null,
  bedrooms?: number | null
): { id: 'solo' | 'assisted'; label: string; method: CompensationMethod; rate: number; assisted: boolean }[] {
  if (!terms) return [];
  const solo = appliedSoloTerms(terms, bedrooms);
  const choices: { id: 'solo' | 'assisted'; label: string; method: CompensationMethod; rate: number; assisted: boolean }[] = [
    {
      id: 'solo',
      label: `Solo (${cleanerPayLabel(solo?.method ?? terms.soloMethod, solo?.rate ?? terms.soloRate)})`,
      method: solo?.method ?? terms.soloMethod,
      rate: solo?.rate ?? terms.soloRate,
      assisted: false,
    },
    {
      id: 'assisted',
      label: `Assisted (${cleanerPayLabel(terms.assistedMethod, terms.assistedRate)})`,
      method: terms.assistedMethod,
      rate: terms.assistedRate,
      assisted: true,
    },
  ];
  if (soloPercentageAllowed(paperwork)) return choices;
  return choices.filter((choice) => !(choice.id === 'solo' && choice.method === 'PERCENTAGE'));
}

export function resolveAssignmentAgreement(input: {
  cleanerName?: string | null;
  choice: OfferChoice;
  storedTerms: CleanerTerms | null;
  paperwork?: TaxPaperwork | null;
  custom?: {
    method: CompensationMethod;
    rate: number;
    assisted?: boolean;
    includedAddOns?: string[];
  };
  eligibleBase: number | null;
  /** Typed percentage base for this job, such as a weekly office share. */
  manualBase?: number | null;
  /** Used only to apply a stored home-size exception. Unknown size stays on standard solo terms. */
  bedrooms?: number | null;
  note?: string | null;
}): {
  method: CompensationMethod;
  rate: number;
  assisted: boolean;
  includedAddOns: string[];
  eligibleBase: number | null;
  manualEligibleBase: boolean;
  compensationAmount: number;
  compensationBasis: 'FLAT' | 'HOURLY' | 'OTHER';
  note: string | null;
} {
  const soloForHome =
    input.choice === 'solo' ? appliedSoloTerms(input.storedTerms, input.bedrooms) : null;
  if (soloForHome?.method === 'PERCENTAGE' && !soloPercentageAllowed(input.paperwork)) {
    throw new Error('Solo percentage offers need tax paperwork on file. Assisted hourly is still allowed.');
  }

  const choices = offerChoicesForCleaner(input.storedTerms, input.paperwork, input.bedrooms);
  let method: CompensationMethod;
  let rate: number;
  let assisted = false;
  let includedAddOns: string[] = [];

  if (input.choice === 'custom') {
    if (!input.custom || !Number.isFinite(input.custom.rate) || input.custom.rate <= 0) {
      throw new Error('Set terms for this cleaner before sending an offer. No default is assumed.');
    }
    method = input.custom.method;
    rate = input.custom.rate;
    assisted = input.custom.assisted === true;
    includedAddOns = input.custom.includedAddOns ?? [];
  } else {
    const choice = choices.find((row) => row.id === input.choice);
    if (!choice) {
      throw new Error('Set terms for this cleaner before sending an offer. No default is assumed.');
    }
    method = soloForHome?.method ?? choice.method;
    rate = soloForHome?.rate ?? choice.rate;
    assisted = choice.assisted;
  }

  if (method === 'PERCENTAGE' && !soloPercentageAllowed(input.paperwork)) {
    throw new Error('Solo percentage offers need tax paperwork on file. Assisted hourly is still allowed.');
  }

  const manualEligibleBase = input.manualBase != null && Number.isFinite(input.manualBase);
  const base = manualEligibleBase ? round2(input.manualBase as number) : input.eligibleBase;
  if (method === 'PERCENTAGE' && base == null) {
    throw new Error('This job has no agreed cleaning price to apply the percentage to.');
  }

  const compensationAmount =
    method === 'PERCENTAGE' ? round2((base ?? 0) * (rate / 100)) : round2(rate);
  const compensationBasis = method === 'HOURLY' ? 'HOURLY' : method === 'FLAT' ? 'FLAT' : 'OTHER';

  return {
    method,
    rate: round2(rate),
    assisted,
    includedAddOns,
    eligibleBase: base,
    manualEligibleBase,
    compensationAmount,
    compensationBasis,
    note: input.note?.trim() || null,
  };
}

export function agreedCleaningPrice(input: {
  agreedOperationalPrice?: unknown;
  agreedCustomerPrice?: unknown;
  processingAllowance?: unknown;
  includedAddOns?: string[];
}): number | null {
  const operational = toMoney(input.agreedOperationalPrice);
  if (operational != null && operational > 0) return operational;
  const customer = toMoney(input.agreedCustomerPrice);
  if (customer == null) return null;
  const included = new Set(input.includedAddOns ?? []);
  const allowance = toMoney(input.processingAllowance) ?? 0;
  if (!included.has('processingAllowance')) return round2(Math.max(0, customer - allowance));
  return customer;
}

export function yearToDateTotal(
  payments: ManualPaymentInput[],
  cleanerId: string,
  year: number
): number {
  let total = 0;
  const prefix = `${year}-`;
  for (const payment of payments) {
    if (payment.cleanerId !== cleanerId || !payment.date.startsWith(prefix)) continue;
    for (const allocation of payment.allocations) {
      const type = allocation.type ?? 'JOB';
      if (type === 'JOB' || type === 'ADVANCE') total += allocation.amount;
    }
  }
  return round2(total);
}

export function thresholdNotice(ytd: number, threshold = DEFAULT_1099_THRESHOLD) {
  const warnAt = round2(threshold * 0.8);
  return {
    ytd: round2(ytd),
    threshold: round2(threshold),
    warnAt,
    warning: round2(ytd) >= warnAt,
  };
}

export function reimbursementLines(payments: ManualPaymentInput[]): {
  paymentId: string;
  person: string;
  amount: number;
}[] {
  const lines: { paymentId: string; person: string; amount: number }[] = [];
  const seen = new Set<string>();
  for (const payment of payments) {
    if (payment.paidFromKind !== 'PERSONAL_FUNDS' || seen.has(payment.id)) continue;
    seen.add(payment.id);
    lines.push({
      paymentId: payment.id,
      person: (payment.paidFromLabel ?? '').trim() || 'Unknown',
      amount: round2(payment.amount),
    });
  }
  return lines;
}

function csvCell(value: string | number | null): string {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function cleanerPayCsv(
  rows: {
    cleaner: string;
    job: string;
    date: string;
    method: string;
    rate: string;
    hours: string;
    expected: string;
    paid: string;
    balance: string;
    status: string;
  }[]
): string {
  const header = [
    'Cleaner',
    'Job',
    'Date',
    'Method',
    'Rate',
    'Verified hours',
    'Expected',
    'Paid',
    'Balance',
    'Status',
  ];
  const lines = [
    header.join(','),
    ...rows.map((row) =>
      [row.cleaner, row.job, row.date, row.method, row.rate, row.hours, row.expected, row.paid, row.balance, row.status]
        .map(csvCell)
        .join(',')
    ),
  ];
  return lines.join('\n');
}

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

export const DOROTHY_SOLO_RATE = 65;
export const DOROTHY_ASSISTED_RATE = 30;

export type AgreementSnapshot = {
  method: CompensationMethod;
  /** 65 means 65 percent. 30 means $30 per verified hour, or a flat dollar amount. */
  rate: number;
  eligibleBase: number | null;
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
  agreement: AgreementSnapshot;
};

export type ManualPaymentInput = {
  id: string;
  cleanerId: string;
  date: string;
  amount: number;
  allocations: { jobId: string; amount: number }[];
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
  persisted: boolean;
};

export function isDorothyCleaner(name: string | null | undefined): boolean {
  return (name ?? '').trim().toLowerCase().includes('dorothy');
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
 * A frozen snapshot wins, so a later price edit cannot rewrite a finished job.
 * Tips are not a parameter of this amount.
 */
export function eligibleCleaningAmount(input: JobPayInput): number | null {
  const agreement = input.agreement;
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

function allocatedToJob(payments: ManualPaymentInput[], jobId: string, cleanerId: string): number {
  let total = 0;
  for (const payment of payments) {
    if (payment.cleanerId !== cleanerId) continue;
    for (const allocation of payment.allocations) {
      if (allocation.jobId === jobId) total += allocation.amount;
    }
  }
  return round2(total);
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
        persisted: true,
      });
      continue;
    }

    const paid = allocatedToJob(input.payments, job.jobId, job.cleanerId);
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

export type CleanerTerms = {
  soloMethod: CompensationMethod;
  soloRate: number;
  assistedMethod: CompensationMethod;
  assistedRate: number;
};

export type OfferChoice = 'solo' | 'assisted' | 'custom';

export function offerChoicesForCleaner(
  cleanerName: string | null | undefined,
  terms: CleanerTerms | null
): { id: 'solo' | 'assisted'; label: string; method: CompensationMethod; rate: number; assisted: boolean }[] {
  if (isDorothyCleaner(cleanerName)) {
    return [
      {
        id: 'solo',
        label: 'Solo (65%)',
        method: 'PERCENTAGE',
        rate: DOROTHY_SOLO_RATE,
        assisted: false,
      },
      {
        id: 'assisted',
        label: 'Assisted ($30/hr)',
        method: 'HOURLY',
        rate: DOROTHY_ASSISTED_RATE,
        assisted: true,
      },
    ];
  }
  if (!terms) return [];
  return [
    {
      id: 'solo',
      label: `Solo (${cleanerPayLabel(terms.soloMethod, terms.soloRate)})`,
      method: terms.soloMethod,
      rate: terms.soloRate,
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
}

export function resolveAssignmentAgreement(input: {
  cleanerName: string | null;
  choice: OfferChoice;
  storedTerms: CleanerTerms | null;
  custom?: {
    method: CompensationMethod;
    rate: number;
    assisted?: boolean;
    includedAddOns?: string[];
  };
  eligibleBase: number | null;
  note?: string | null;
}): {
  method: CompensationMethod;
  rate: number;
  assisted: boolean;
  includedAddOns: string[];
  eligibleBase: number | null;
  compensationAmount: number;
  compensationBasis: 'FLAT' | 'HOURLY' | 'OTHER';
  note: string | null;
} {
  const choices = offerChoicesForCleaner(input.cleanerName, input.storedTerms);
  let method: CompensationMethod;
  let rate: number;
  let assisted = false;
  let includedAddOns: string[] = [];

  if (input.choice === 'custom') {
    if (isDorothyCleaner(input.cleanerName)) {
      throw new Error('Dorothy uses Solo (65%) or Assisted ($30/hr).');
    }
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
    method = choice.method;
    rate = choice.rate;
    assisted = choice.assisted;
  }

  if (method === 'PERCENTAGE' && input.eligibleBase == null) {
    throw new Error('This job has no agreed cleaning price to apply the percentage to.');
  }

  const compensationAmount =
    method === 'PERCENTAGE'
      ? round2((input.eligibleBase ?? 0) * (rate / 100))
      : round2(rate);
  const compensationBasis = method === 'HOURLY' ? 'HOURLY' : method === 'FLAT' ? 'FLAT' : 'OTHER';

  return {
    method,
    rate: round2(rate),
    assisted,
    includedAddOns,
    eligibleBase: input.eligibleBase,
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

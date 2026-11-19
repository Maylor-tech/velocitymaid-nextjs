/**
 * Miami pilot payout cycle.
 *
 * The previous implementation is not in this tree. These signatures match
 * the workers and schedule route. They do not run a payout engine.
 */

export type WeekPeriod = {
  start: Date;
  end: Date;
  weekLabel: string;
};

export type WeeklyPayoutJobResult = {
  amount?: number | null;
  [key: string]: LooseAny;
};

export type WeeklyPayoutResult = {
  createdPayouts: number;
  skippedJobs: number;
  totalAmount: number;
  errors: string[];
  period: WeekPeriod;
  results: WeeklyPayoutJobResult[];
};

export function getLastWeekRange(): WeekPeriod {
  throw new Error("not implemented");
}

export async function getMiamiBranchId(): Promise<string | null> {
  throw new Error("not implemented");
}

export async function processWeeklyPayouts(
  _branchId: string,
  _period: WeekPeriod,
  _options?: {
    dryRun?: boolean;
    adminOverride?: {
      adminId: string;
      reason: string;
    };
  }
): Promise<WeeklyPayoutResult> {
  throw new Error("not implemented");
}

export async function getPayoutSummary(
  _branchId: string,
  _period: WeekPeriod
): Promise<LooseAny> {
  throw new Error("not implemented");
}

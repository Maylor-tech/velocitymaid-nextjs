/**
 * Public conversion destinations — labels and paths only.
 * Does not change pricing, estimate math, booking, or auth.
 */

export const FAST_ESTIMATE_PATH = '/estimate' as const;
export const FAST_ESTIMATE_CTA_LABEL = 'Get a Fast Estimate' as const;
export const VERMONT_HOST_INTAKE_PATH = '/vermont/host-intake' as const;
export const VERMONT_WORK_WITH_US_PATH = '/vermont/work-with-us' as const;
export const VERMONT_WORK_WITH_US_LABEL = 'Work with us' as const;
export const CLEANER_APPLY_VERMONT_PATH = '/cleaners/apply?market=vermont' as const;
export const NJ_WORK_WITH_US_PATH = '/new-jersey/work-with-us' as const;
export const CLEANER_APPLY_NJ_PATH = '/cleaners/apply?market=new-jersey' as const;

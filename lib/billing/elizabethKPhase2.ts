/**
 * Elizabeth K / VM-2026-0053 Phase 2 constants.
 * Production writes are not authorized from this module.
 */
export const ELIZABETH_K_PHASE2 = {
  jobId: '874c4802-8cc0-433e-af51-72baa78d58d9',
  invoiceId: 'cmuzcjuyy0006ic04rer9q3pr',
  invoiceNumber: 'VM-2026-0053',
  customerId: '528ae327-1257-49a3-b29c-77487dca2e46',
  payoutId: '30051886-30d6-4cc6-babc-4275c1b07d9e',
  paymentIntentId: 'pi_3UMZs9RqPKxN0h8W1cV0LYQg',
  preservedQuotedTotal: 425,
  depositAmount: 25,
  authorizedInvoiceTotal: 250,
  authorizedBalanceDueAfterCredit: 225,
  blockedCollectionAmounts: [400] as readonly number[],
  canonicalAddress: '60 Pleasant St, Ludlow, VT 05149',
  serviceType: 'Deep Clean',
  jobDate: '2026-10-04',
  lineDescription: 'Deep Clean — October 4, 2026',
} as const;

export const PHASE2A_APPLY_TOKEN = 'APPLY_ELIZABETH_K_PHASE2A';
export const PHASE2A_MUTATION_ENV = 'ELIZABETH_K_PHASE2A';

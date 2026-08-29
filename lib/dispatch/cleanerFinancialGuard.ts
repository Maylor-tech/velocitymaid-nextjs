export const FORBIDDEN_CUSTOMER_FINANCIAL_KEYS = [
  'quotedtotal',
  'totalprice',
  'amountpaid',
  'balancedue',
  'depositamount',
  'invoicetotal',
  'invoice',
  'operationaltotal',
  'operationalmargin',
  'platformfee',
  'platformmargin',
  'margin',
  'processingallowance',
  'processingallowanceestimated',
  'customertotal',
  'billedamount',
  'paymentstatus',
  'billingpolicy',
] as const;

export function assertNoCustomerFinancials(
  payload: unknown,
  context = 'cleaner payload'
): void {
  if (!payload || typeof payload !== 'object') return;
  const keys = collectKeys(payload);
  for (const forbidden of FORBIDDEN_CUSTOMER_FINANCIAL_KEYS) {
    if (keys.has(forbidden)) {
      throw new Error(`${context} leaked ${forbidden}`);
    }
  }
}

function collectKeys(value: unknown, into: Set<string> = new Set()): Set<string> {
  if (!value || typeof value !== 'object') return into;
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, into);
    return into;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    into.add(key.toLowerCase());
    collectKeys(child, into);
  }
  return into;
}

/** Pure URL construction shared by actual invoice email rendering and Preview diagnostics. */
export function buildInvoiceViewUrl(publicToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://velocitymaid.com';
  return `${base}/invoice/${publicToken}`;
}

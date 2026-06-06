/**
 * Server-side demo mode (payouts, admin tools).
 * Never enable in production.
 */
export const DEMO_MODE = process.env.DEMO_MODE === 'true';

export function isDemoModeServer(): boolean {
  return DEMO_MODE;
}

/**
 * Client-safe feature flags (must use NEXT_PUBLIC_ prefix).
 */
export const isPublicDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

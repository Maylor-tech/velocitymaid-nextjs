/**
 * Never expose Prisma, database, or stack traces to end users.
 * Use this for any user-facing error message from APIs.
 */
export function safeError(_message?: string): string {
  return 'Something went wrong. Please try again.';
}

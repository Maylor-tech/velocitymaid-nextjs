/** Client-safe customer list filter values (no Prisma imports). */
export type CustomerListFilter = 'active' | 'archived' | 'all' | 'system';

export const DELETE_BLOCKED_MESSAGE =
  'This customer cannot be permanently deleted because business records are linked. Archive the customer instead.';

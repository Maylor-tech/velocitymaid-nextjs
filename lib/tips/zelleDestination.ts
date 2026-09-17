/**
 * Zelle destination shown to guests after tip intent create.
 * Prefer server-returned values (no NEXT_PUBLIC requirement).
 */
export type ZelleDestination = {
  label: string;
  handle: string;
  instructions: string;
};

export function getVelocityMaidZelleDestination(): ZelleDestination {
  const handle =
    process.env.VELOCITYMAID_ZELLE_HANDLE?.trim() ||
    process.env.ZELLE_HANDLE?.trim() ||
    'hello@velocitymaid.com';
  const label =
    process.env.VELOCITYMAID_ZELLE_LABEL?.trim() || 'VelocityMaid';
  return {
    label,
    handle,
    instructions:
      'Send the exact tip amount via Zelle and include the tip reference in the memo. Your tip is confirmed after VelocityMaid verifies the transfer — do not reply to this page to confirm payment.',
  };
}

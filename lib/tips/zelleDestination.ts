/**
 * Zelle destination shown to guests after tip intent create,
 * and as a secondary (manual) option on service invoices.
 * Prefer server-returned values (no NEXT_PUBLIC requirement).
 */
export type ZelleDestination = {
  label: string;
  handle: string;
  instructions: string;
};

function resolveZelleHandleAndLabel(): { handle: string; label: string } {
  const handle =
    process.env.VELOCITYMAID_ZELLE_HANDLE?.trim() ||
    process.env.ZELLE_HANDLE?.trim() ||
    'hello@velocitymaid.com';
  const label =
    process.env.VELOCITYMAID_ZELLE_LABEL?.trim() || 'VelocityMaid';
  return { handle, label };
}

export function getVelocityMaidZelleDestination(): ZelleDestination {
  const { handle, label } = resolveZelleHandleAndLabel();
  return {
    label,
    handle,
    instructions:
      'Send the exact tip amount via Zelle and include the tip reference in the memo. Your tip is confirmed after VelocityMaid verifies the transfer — do not reply to this page to confirm payment.',
  };
}

/** Restrained secondary copy for service invoices (manual / off-platform). */
export const SERVICE_INVOICE_ZELLE_SECONDARY =
  'Prefer Zelle? Payment instructions are also available.';

export function getServiceInvoiceZelleDestination(): ZelleDestination {
  const { handle, label } = resolveZelleHandleAndLabel();
  return {
    label,
    handle,
    instructions:
      'Send the exact invoice amount via Zelle and include the invoice number in the memo. Payment is confirmed only after VelocityMaid verifies the transfer — displaying these instructions does not mark the invoice paid.',
  };
}

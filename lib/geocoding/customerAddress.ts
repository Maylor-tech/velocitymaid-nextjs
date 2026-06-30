interface AddressParts {
  defaultAddress?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}

/** Builds a geocodable address string from customer fields. */
export function formatCustomerAddress(parts: AddressParts): string | null {
  if (parts.defaultAddress?.trim()) {
    return parts.defaultAddress.trim();
  }

  const line = [parts.addressLine1, parts.addressLine2]
    .filter((s) => s?.trim())
    .join(', ');
  const locality = [parts.city, parts.state, parts.postalCode]
    .filter((s) => s?.trim())
    .join(', ');

  const full = [line, locality].filter(Boolean).join(', ');
  return full.trim() || null;
}

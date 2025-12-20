/**
 * Mask sensitive payment information
 * Keeps the last N characters visible, masks the rest
 * 
 * ⚠️ SECURITY: This handles both plaintext and encrypted values.
 * If value appears encrypted (has format iv.tag.encrypted), shows generic mask.
 */
export function maskKeepLast(value: string, keep = 4) {
  if (!value) return "";
  const clean = String(value);
  
  // If encrypted (has format iv.tag.encrypted), show generic mask
  if (clean.includes(".") && clean.split(".").length === 3) {
    return "*".repeat(8);
  }
  
  if (clean.length <= keep) return "*".repeat(clean.length);
  return "*".repeat(clean.length - keep) + clean.slice(-keep);
}


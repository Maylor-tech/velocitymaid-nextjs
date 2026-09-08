/**
 * Phone matching for cleaner login. Stored User.phone may include
 * spaces, dashes, or a leading country code; login input is free-typed.
 */

export function normalizePhoneDigits(raw: string | null | undefined): string {
  return (raw || '').replace(/\D/g, '');
}

export function nationalPhoneDigits(digits: string): string {
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

export function phonesMatch(
  stored: string | null | undefined,
  inputRaw: string | null | undefined
): boolean {
  const storedDigits = normalizePhoneDigits(stored);
  const inputDigits = normalizePhoneDigits(inputRaw);
  if (!storedDigits || !inputDigits) return false;
  if (storedDigits === inputDigits) return true;

  const storedNational = nationalPhoneDigits(storedDigits);
  const inputNational = nationalPhoneDigits(inputDigits);
  if (storedNational === inputNational) return true;

  if (storedNational.length >= 10 && inputNational.length >= 10) {
    return storedNational.slice(-10) === inputNational.slice(-10);
  }
  return false;
}

export function isEmailIdentifier(normalized: string): boolean {
  return normalized.includes('@');
}

const COOKIE_NAME = 'vm_customer_session';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const secret = process.env.CUSTOMER_PORTAL_SECRET || process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'Missing CUSTOMER_PORTAL_SECRET (or NEXTAUTH_SECRET/JWT_SECRET) in env. Please add one.'
    );
  }
  return secret;
}

export interface CustomerSessionPayload {
  customerId: string;
  email: string;
  issuedAt: number;
}

function base64url(input: string | Uint8Array) {
  let base64: string;
  
  if (typeof input === 'string') {
    // Convert string to UTF-8 bytes, then to base64
    const utf8Bytes = new TextEncoder().encode(input);
    let binary = '';
    for (let i = 0; i < utf8Bytes.length; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    base64 = btoa(binary);
  } else {
    // Convert Uint8Array to base64
    let binary = '';
    for (let i = 0; i < input.length; i++) {
      binary += String.fromCharCode(input[i]);
    }
    base64 = btoa(binary);
  }
  
  return base64
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function signHMAC(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return base64url(new Uint8Array(signature));
}

export async function createCustomerSessionToken(payload: CustomerSessionPayload): Promise<string> {
  const secret = getSecret();
  const header = { alg: 'HS256', typ: 'JWT' };

  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(payload));
  const data = `${headerPart}.${payloadPart}`;

  const signature = await signHMAC(data, secret);
  return `${data}.${signature}`;
}

export async function verifyCustomerSessionToken(token: string | undefined | null): Promise<CustomerSessionPayload | null> {
  if (!token) return null;
  const secret = getSecret();

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signature] = parts;
  const data = `${headerPart}.${payloadPart}`;

  const expectedSig = await signHMAC(data, secret);

  if (signature !== expectedSig) return null;

  try {
    // Decode base64url
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const payloadJson = binary;
    const payload = JSON.parse(payloadJson) as CustomerSessionPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get customer session from cookies (helper for API routes)
 */
export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? null;
  return await verifyCustomerSessionToken(token);
}

/**
 * Alias for getCustomerSession (for compatibility)
 */
export const readCustomerSession = getCustomerSession;

export async function clearCustomerSession(): Promise<void> {
  // This is a placeholder - actual clearing is done in the route handler
  // since we need access to NextResponse
}

export { COOKIE_NAME, COOKIE_MAX_AGE_SECONDS };

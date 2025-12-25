import crypto from "crypto";

const ALGO = "aes-256-gcm";

/**
 * Get encryption key from environment
 * Must be 64 hex characters (32 bytes)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.PAYMENT_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error(
      "PAYMENT_ENCRYPTION_KEY environment variable is required. " +
      "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  if (key.length !== 64) {
    throw new Error(
      "PAYMENT_ENCRYPTION_KEY must be 64 hex characters (32 bytes). " +
      "Current length: " + key.length
    );
  }

  return Buffer.from(key, "hex");
}

/**
 * Encrypt sensitive payment data
 * Uses AES-256-GCM for authenticated encryption
 * 
 * @param text - Plaintext to encrypt
 * @returns Encrypted payload in format: iv.tag.encrypted
 */
export function encryptPaymentData(text: string): string {
  if (!text) return "";
  
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Return format: iv.hex.tag.hex.encrypted.hex
    return `${iv.toString("hex")}.${tag.toString("hex")}.${encrypted.toString("hex")}`;
  } catch (error: any) {
    console.error("[ENCRYPT_PAYMENT_DATA] Error:", error);
    throw new Error("Failed to encrypt payment data");
  }
}

/**
 * Decrypt sensitive payment data
 * Only call this in secure contexts (payout execution)
 * 
 * @param payload - Encrypted payload from encryptPaymentData
 * @returns Decrypted plaintext
 */
export function decryptPaymentData(payload: string): string {
  if (!payload) return "";
  
  try {
    const key = getEncryptionKey();
    const parts = payload.split(".");
    
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted payload format");
    }
    
    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    
    return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
  } catch (error: any) {
    console.error("[DECRYPT_PAYMENT_DATA] Error:", error);
    throw new Error("Failed to decrypt payment data");
  }
}

/**
 * Check if a string is encrypted (has the encrypted format)
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(".");
  return parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part));
}
















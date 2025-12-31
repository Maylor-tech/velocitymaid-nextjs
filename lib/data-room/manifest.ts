/**
 * Phase 3H.16: Signed Checksum Manifest Utilities
 * 
 * Provides cryptographic integrity verification for data room exports
 */

import crypto from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface ManifestFile {
  path: string;
  sha256: string;
}

export interface Manifest {
  schemaVersion: string;
  platform: string;
  exportType: string;
  exportedAt: string;
  exportedBy: string;
  environment: string;
  hashAlgorithm: string;
  files: ManifestFile[];
  integrityStatement: string;
}

/**
 * Compute SHA-256 hash of a file
 */
export function sha256File(filePath: string): string {
  const hash = crypto.createHash("sha256");
  const data = readFileSync(filePath);
  hash.update(data);
  return hash.digest("hex");
}

/**
 * Compute SHA-256 hash of a buffer
 */
export function sha256Buffer(buffer: Buffer): string {
  const hash = crypto.createHash("sha256");
  hash.update(buffer);
  return hash.digest("hex");
}

/**
 * Sign manifest JSON using Ed25519 private key
 */
export function signManifest(manifestJson: string): string {
  const privateKeyBase64 = process.env.DATA_ROOM_SIGNING_PRIVATE_KEY_BASE64;
  
  if (!privateKeyBase64) {
    throw new Error(
      "DATA_ROOM_SIGNING_PRIVATE_KEY_BASE64 environment variable not set"
    );
  }

  try {
    const privateKey = Buffer.from(privateKeyBase64, "base64");
    
    // Sign using Ed25519
    const signature = crypto.sign(
      null, // Ed25519 doesn't use a digest algorithm
      Buffer.from(manifestJson, "utf8"),
      {
        key: privateKey,
        dsaEncoding: "ieee-p1363",
      }
    );

    return signature.toString("base64");
  } catch (error: any) {
    throw new Error(`Failed to sign manifest: ${error.message}`);
  }
}

/**
 * Get public key from environment or generate from private key
 */
export function getPublicKey(): string | null {
  // First, try to get public key directly from env (PEM format)
  const publicKeyPem = process.env.DATA_ROOM_SIGNING_PUBLIC_KEY_PEM;
  if (publicKeyPem) {
    return publicKeyPem;
  }

  // Try base64 encoded public key
  const publicKeyBase64 = process.env.DATA_ROOM_SIGNING_PUBLIC_KEY_BASE64;
  if (publicKeyBase64) {
    try {
      return Buffer.from(publicKeyBase64, "base64").toString("utf8");
    } catch {
      // If not valid UTF-8, treat as DER and convert
      try {
        const publicKeyBuffer = Buffer.from(publicKeyBase64, "base64");
        const keyObject = crypto.createPublicKey({
          key: publicKeyBuffer,
          format: "der",
          type: "spki",
        });
        return keyObject.export({
          type: "spki",
          format: "pem",
        }) as string;
      } catch {
        return null;
      }
    }
  }

  // Otherwise, derive from private key
  const privateKeyBase64 = process.env.DATA_ROOM_SIGNING_PRIVATE_KEY_BASE64;
  if (!privateKeyBase64) {
    return null;
  }

  try {
    // Try PEM format first
    let privateKey: Buffer | string;
    try {
      const pemString = Buffer.from(privateKeyBase64, "base64").toString("utf8");
      if (pemString.includes("BEGIN PRIVATE KEY")) {
        privateKey = pemString;
      } else {
        privateKey = Buffer.from(privateKeyBase64, "base64");
      }
    } catch {
      privateKey = Buffer.from(privateKeyBase64, "base64");
    }

    const keyObject = crypto.createPrivateKey({
      key: privateKey,
      format: typeof privateKey === "string" ? "pem" : "der",
      type: "pkcs8",
    });
    
    const publicKey = crypto.createPublicKey(keyObject);
    return publicKey.export({
      type: "spki",
      format: "pem",
    }) as string;
  } catch (error) {
    // If derivation fails, return null (optional feature)
    return null;
  }
}

/**
 * Create manifest file with checksums for all files
 */
export function createManifest(
  baseDir: string,
  files: string[],
  exportedBy: string = "SYSTEM"
): { manifest: Manifest; manifestJson: string; signature: string } {
  // Compute checksums for all files
  const entries: ManifestFile[] = files.map((filePath) => {
    const fullPath = join(baseDir, filePath);
    const sha256 = sha256File(fullPath);
    return {
      path: filePath,
      sha256,
    };
  });

  // Create manifest object
  const manifest: Manifest = {
    schemaVersion: "1.0",
    platform: "VelocityMaid",
    exportType: "Compliance Data Room",
    exportedAt: new Date().toISOString(),
    exportedBy,
    environment: process.env.NODE_ENV || "production",
    hashAlgorithm: "SHA-256",
    files: entries,
    integrityStatement:
      "Any modification to the listed files will invalidate this manifest.",
  };

  // Serialize to JSON
  const manifestJson = JSON.stringify(manifest, null, 2);

  // Sign manifest
  let signature: string;
  try {
    signature = signManifest(manifestJson);
  } catch (error: any) {
    // If signing fails, create unsigned manifest (still useful for checksums)
    console.warn(
      "[DATA_ROOM_MANIFEST] Signing failed, creating unsigned manifest:",
      error.message
    );
    signature = "";
  }

  return { manifest, manifestJson, signature };
}

/**
 * Write manifest files to directory
 */
export function writeManifestFiles(
  baseDir: string,
  manifestJson: string,
  signature: string
): void {
  // Write MANIFEST.json
  writeFileSync(join(baseDir, "MANIFEST.json"), manifestJson, "utf8");

  // Write MANIFEST.sig (if signature exists)
  if (signature) {
    writeFileSync(join(baseDir, "MANIFEST.sig"), signature, "utf8");
  }

  // Optionally write public key
  const publicKey = getPublicKey();
  if (publicKey) {
    writeFileSync(join(baseDir, "MANIFEST_PUBLIC_KEY.pem"), publicKey, "utf8");
  }
}


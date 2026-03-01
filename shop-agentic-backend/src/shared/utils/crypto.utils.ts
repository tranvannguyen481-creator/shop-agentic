/**
 * AES-256-GCM encryption utility for URL-safe token generation.
 *
 * Used to encrypt sensitive identifiers (e.g. groupId) before placing them
 * in share-link query parameters.
 *
 * Token format: base64url( iv[12] + authTag[16] + ciphertext )
 *
 * Security properties:
 *   – Confidentiality:  AES-256 encryption
 *   – Integrity:        GCM authentication tag (16 bytes)
 *   – Uniqueness:       Random IV per encryption
 *   – URL-safe:         base64url encoding (RFC 4648 §5)
 */

import { AppError } from "@/shared/exceptions/AppError";
import logger from "@/shared/utils/logger";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// ─── Constants ───────────────────────────────────────────────────────────────

const ALGORITHM = "aes-256-gcm" as const;
const IV_LENGTH = 12; // recommended for GCM
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

// ─── Key resolution ──────────────────────────────────────────────────────────

let _cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (_cachedKey) return _cachedKey;

  const secret = process.env.GROUP_LINK_SECRET;

  if (!secret || secret.length < 32) {
    logger.error(
      "GROUP_LINK_SECRET env variable is missing or too short (min 32 chars). " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
    throw new AppError("Encryption is not configured");
  }

  // If the secret is a 64-char hex string → decode to 32-byte buffer.
  // Otherwise, take the first 32 bytes of the UTF-8 representation.
  _cachedKey = /^[0-9a-f]{64}$/i.test(secret)
    ? Buffer.from(secret, "hex")
    : Buffer.from(secret.slice(0, KEY_LENGTH), "utf8");

  if (_cachedKey.length !== KEY_LENGTH) {
    throw new AppError("Derived encryption key has unexpected length");
  }

  return _cachedKey;
}

// ─── Base64url helpers ───────────────────────────────────────────────────────

function toBase64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(str: string): Buffer {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  base64 += "=".repeat(padLength);
  return Buffer.from(base64, "base64");
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string and return a URL-safe token.
 *
 * @param plaintext — the value to encrypt (e.g. a Firestore groupId)
 * @returns URL-safe base64url token
 */
export function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Token layout: iv (12) + authTag (16) + ciphertext (variable)
  const token = Buffer.concat([iv, authTag, encrypted]);
  return toBase64Url(token);
}

/**
 * Decrypt a URL-safe token back to the original plaintext.
 *
 * @param token — the base64url token produced by `encryptToken`
 * @returns the original plaintext string
 * @throws AppError if the token is invalid or tampered with
 */
export function decryptToken(token: string): string {
  try {
    const key = getEncryptionKey();
    const raw = fromBase64Url(token);

    if (raw.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
      throw new Error("Token too short");
    }

    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch {
    throw AppError.badRequest("Invalid or tampered share token");
  }
}

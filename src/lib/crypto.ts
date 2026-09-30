/**
 * @file src/lib/crypto.ts
 * @description Secure client-side password hashing using Web Crypto PBKDF2.
 */

/**
 * Converts an ArrayBuffer to a hex string.
 * @param buffer - The buffer to convert.
 * @returns Hexadecimal representation string.
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Converts a hex string back to a Uint8Array.
 * @param hex - Hexadecimal string.
 * @returns Uint8Array.
 */
function hexToBuffer(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}

/**
 * Generates a random 16-byte cryptographic salt as a hex string.
 * @returns 32-character hex salt string.
 */
export function generateSaltHex(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return bufferToHex(salt.buffer);
}

/**
 * Hashes a plaintext password with PBKDF2 using SHA-256 and 100,000 iterations.
 * @param password - Plaintext password to hash.
 * @param saltHex - Salt in hexadecimal string format.
 * @returns Hex string representing the derived key.
 */
export async function hashPasswordPbkdf2(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const saltBuffer = hexToBuffer(saltHex);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufferToHex(derivedKey);
}

/**
 * Verifies if a given password matches the stored hash for a given salt.
 * @param password - Candidate password.
 * @param saltHex - Salt in hexadecimal format.
 * @param storedHashHex - Target hash to verify against.
 * @returns Promise resolving to boolean.
 */
export async function verifyPassword(
  password: string,
  saltHex: string,
  storedHashHex: string
): Promise<boolean> {
  try {
    const computed = await hashPasswordPbkdf2(password, saltHex);
    return computed === storedHashHex;
  } catch {
    return false;
  }
}

/**
 * Client-side zero-knowledge encryption for the Vault (ADR-005, RF-08.2).
 * Master key is derived from master password via PBKDF2 and never sent to the server.
 * All vault entries are encrypted/decrypted entirely in the browser.
 */

const PBKDF2_ITERATIONS = 310_000
const SALT_LENGTH = 16
const IV_LENGTH = 12

export async function deriveKey(masterPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptPayload(plaintext: string, masterPassword: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const key = await deriveKey(masterPassword, salt)
  const enc = new TextEncoder()

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  )

  // Pack: salt (16) + iv (12) + ciphertext, encoded as base64
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

  return btoa(String.fromCharCode(...combined))
}

export async function decryptPayload(encoded: string, masterPassword: string): Promise<string> {
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
  const salt = combined.slice(0, SALT_LENGTH)
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)

  const key = await deriveKey(masterPassword, salt)

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  )

  return new TextDecoder().decode(plaintext)
}

export async function deriveVerifier(masterPassword: string, salt: Uint8Array): Promise<string> {
  const key = await deriveKey(masterPassword, salt)
  const exported = await crypto.subtle.exportKey('raw', key)
  const hash = await crypto.subtle.digest('SHA-256', exported)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
}

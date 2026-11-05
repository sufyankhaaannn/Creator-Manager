import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSha256 } from './backup';

// Test PBKDF2 key derivation and AES-GCM encrypt/decrypt logic directly
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

test('SHA-256 checksum calculation produces deterministic 64-char hex', async () => {
  const hash1 = await calculateSha256('{"materials":["MAT-001","MAT-002"]}');
  const hash2 = await calculateSha256('{"materials":["MAT-001","MAT-002"]}');
  assert.equal(hash1, hash2);
  assert.equal(hash1.length, 64);
});

test('AES-GCM 256-bit encryption and decryption with integrity verification', async () => {
  const payload = JSON.stringify({
    version: '1.2.0',
    materials: [{ id: 'MAT-001', title: 'The Mariana Bloop' }],
    accountViews: 678200,
  });

  const passphrase = 'SuperSecretPassphrase123!';
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 1. Encrypt
  const key = await deriveKey(passphrase, salt);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(payload)
  );

  assert.ok(ciphertextBuffer.byteLength > 0);

  // 2. Decrypt with correct passphrase
  const decryptKey = await deriveKey(passphrase, salt);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    decryptKey,
    ciphertextBuffer
  );

  const dec = new TextDecoder();
  const decryptedText = dec.decode(decryptedBuffer);
  assert.equal(decryptedText, payload);

  // 3. Decrypt with wrong passphrase must throw
  const wrongKey = await deriveKey('WrongPassword!', salt);
  await assert.rejects(
    async () => {
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, wrongKey, ciphertextBuffer);
    },
    (err: any) => err.name === 'OperationError'
  );
});

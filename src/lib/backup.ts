import { StorageService } from './storage';

export interface BackupLog {
  id: string;
  createdAt: string;
  fileName: string;
  sizeBytes: number;
  recordsCount: {
    materials: number;
    accountAnalytics: number;
    videoCheckpoints: number;
    schedules: number;
    goals: number;
  };
  sha256Checksum: string;
  status: 'verified' | 'restored' | 'failed';
}

const BACKUP_LOGS_KEY = 'abyssal_backup_logs_v1';

export function getBackupLogs(): BackupLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BACKUP_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBackupLog(log: BackupLog): void {
  if (typeof window === 'undefined') return;
  const logs = getBackupLogs();
  logs.unshift(log);
  // Keep latest 30 backups as required by spec
  const trimmed = logs.slice(0, 30);
  localStorage.setItem(BACKUP_LOGS_KEY, JSON.stringify(trimmed));
}

// Convert string to SHA-256 hex string
export async function calculateSha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Key derivation from passphrase using PBKDF2
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

/**
 * Creates an AES-GCM 256 encrypted backup envelope
 */
export async function createEncryptedBackup(passphrase: string): Promise<{
  blob: Blob;
  fileName: string;
  checksum: string;
  log: BackupLog;
}> {
  const payload = StorageService.exportFullDatabase();
  const jsonString = JSON.stringify(payload);
  const checksum = await calculateSha256(jsonString);

  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(jsonString)
  );

  // Bundle into format: header + salt + iv + ciphertext
  const backupObject = {
    header: 'ABYSSAL_ENCRYPTED_BACKUP_V1',
    timestamp: new Date().toISOString(),
    checksum,
    saltHex: Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join(''),
    ivHex: Array.from(iv).map((b) => b.toString(16).padStart(2, '0')).join(''),
    ciphertextBase64: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  };

  const backupText = JSON.stringify(backupObject, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `abyssalfacts-backup-${dateStr}.abyssalbackup`;
  const blob = new Blob([backupText], { type: 'application/json' });

  const log: BackupLog = {
    id: `bk_${Date.now()}`,
    createdAt: new Date().toISOString(),
    fileName,
    sizeBytes: blob.size,
    recordsCount: {
      materials: payload.materials.length,
      accountAnalytics: payload.accountAnalytics.length,
      videoCheckpoints: payload.videoCheckpoints.length,
      schedules: payload.schedules.length,
      goals: payload.goals.length,
    },
    sha256Checksum: checksum,
    status: 'verified',
  };

  saveBackupLog(log);

  return { blob, fileName, checksum, log };
}

/**
 * Decrypts an encrypted backup and verifies its SHA-256 integrity
 */
export async function decryptAndVerifyBackup(
  backupText: string,
  passphrase: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const envelope = JSON.parse(backupText);
    if (envelope.header !== 'ABYSSAL_ENCRYPTED_BACKUP_V1') {
      return { success: false, error: 'Unrecognized backup format.' };
    }

    const salt = new Uint8Array(
      (envelope.saltHex.match(/.{1,2}/g) || []).map((byte: string) => parseInt(byte, 16))
    );
    const iv = new Uint8Array(
      (envelope.ivHex.match(/.{1,2}/g) || []).map((byte: string) => parseInt(byte, 16))
    );

    const binaryString = atob(envelope.ciphertextBase64);
    const ciphertext = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      ciphertext[i] = binaryString.charCodeAt(i);
    }

    const key = await deriveKey(passphrase, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);

    // Verify SHA-256 checksum
    const calculatedChecksum = await calculateSha256(jsonString);
    if (calculatedChecksum !== envelope.checksum) {
      return {
        success: false,
        error: 'Integrity check failed: Checksum mismatch. Data may be corrupted.',
      };
    }

    const data = JSON.parse(jsonString);
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: 'Decryption failed: Incorrect password or invalid backup file.',
    };
  }
}

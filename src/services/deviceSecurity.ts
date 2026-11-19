// Browser Cryptographic Device Security Manager
// Uses Web Crypto API (SubtleCrypto) + IndexedDB to store a non-extractable ECDSA P-256 keypair.
// This guarantees that the private key cannot be extracted or copied via standard JS APIs.

const DB_NAME = 'ontap_device_security_v1';
const STORE_NAME = 'device_keys';
const KEY_RECORD_ID = 'primary_device_key';

interface StoredKeyRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  publicKeyBase64: string;
  keyPair: CryptoKeyPair;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function detectDeviceName(): string {
  const ua = navigator.userAgent;
  let browser = 'Trình duyệt Web';
  let os = 'Thiết bị';

  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';

  if (ua.includes('Windows NT 10.0')) os = 'Windows 10/11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return `${browser} trên ${os}`;
}

export async function getOrCreateDeviceKey(): Promise<{
  deviceId: string;
  deviceName: string;
  publicKeyBase64: string;
}> {
  const db = await openDB();

  // Try to load existing record
  const existing = await new Promise<StoredKeyRecord | null>((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(KEY_RECORD_ID);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });

  if (existing && existing.keyPair?.privateKey) {
    return {
      deviceId: existing.deviceId,
      deviceName: existing.deviceName,
      publicKeyBase64: existing.publicKeyBase64,
    };
  }

  // Generate new deviceId & non-extractable ECDSA keypair
  const deviceId = 'dev_' + crypto.randomUUID();
  const deviceName = detectDeviceName();

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false, // extractable: false => cannot be exported by script!
    ['sign', 'verify'],
  );

  // Export public key in SPKI format
  const spkiBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const bytes = new Uint8Array(spkiBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const publicKeyBase64 = btoa(binary);

  const record: StoredKeyRecord = {
    id: KEY_RECORD_ID,
    deviceId,
    deviceName,
    publicKeyBase64,
    keyPair,
    createdAt: new Date().toISOString(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Also store deviceId in localStorage for quick synchronous reference
  localStorage.setItem('ontap_device_id', deviceId);

  return {
    deviceId,
    deviceName,
    publicKeyBase64,
  };
}

export async function signChallenge(challenge: string): Promise<string> {
  const db = await openDB();
  const record = await new Promise<StoredKeyRecord | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(KEY_RECORD_ID);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });

  if (!record || !record.keyPair?.privateKey) {
    throw new Error('Chưa tìm thấy khóa mật mã của thiết bị trên trình duyệt này');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(challenge);

  const signatureBuffer = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' },
    },
    record.keyPair.privateKey,
    data,
  );

  const bytes = new Uint8Array(signatureBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function getCachedDeviceId(): string | null {
  return localStorage.getItem('ontap_device_id');
}


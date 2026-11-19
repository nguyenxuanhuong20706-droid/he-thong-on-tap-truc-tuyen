import * as crypto from 'crypto';

export function verifyDeviceSignature(
  publicKeyBase64: string,
  challenge: string,
  signatureBase64: string,
): boolean {
  try {
    const spkiDer = Buffer.from(publicKeyBase64, 'base64');
    const publicKey = crypto.createPublicKey({
      key: spkiDer,
      format: 'der',
      type: 'spki',
    });
    const sigBuffer = Buffer.from(signatureBase64, 'base64');
    const dataBuffer = Buffer.from(challenge, 'utf8');

    // 1. Thử chuẩn IEEE P1363 (Định dạng chữ ký chuẩn W3C Web Cryptography API trên Web Browsers: Chrome, Edge, Firefox, Safari)
    try {
      const isP1363Ok = crypto.verify(
        'SHA256',
        dataBuffer,
        {
          key: publicKey,
          dsaEncoding: 'ieee-p1363',
        },
        sigBuffer,
      );
      if (isP1363Ok) return true;
    } catch {
      // Bỏ qua lỗi định dạng để thử tiếp chuẩn DER
    }

    // 2. Thử chuẩn DER / ASN.1 (Định dạng mặc định của OpenSSL / Node.js crypto / Test suites)
    try {
      const isDerOk = crypto.verify(
        'SHA256',
        dataBuffer,
        {
          key: publicKey,
          dsaEncoding: 'der',
        },
        sigBuffer,
      );
      if (isDerOk) return true;
    } catch {
      // Bỏ qua lỗi định dạng nếu không khớp
    }

    return false;
  } catch (err) {
    return false;
  }
}

export function generateActivationCode(): string {
  // Generates e.g. ACT-4K9M-2P7X
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let part1 = '';
  let part2 = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 4; i++) {
    part1 += chars[bytes[i] % chars.length];
    part2 += chars[bytes[i + 4] % chars.length];
  }
  return `ACT-${part1}-${part2}`;
}


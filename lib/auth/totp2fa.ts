import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

export interface TotpSetupResult {
  secret: string;
  otpauth: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }
  return codes;
}

export async function generateTotpSetup(
  userEmail: string,
  serviceName = 'EduTrust OS'
): Promise<TotpSetupResult> {
  const secret = generateSecret();
  const otpauth = generateURI({
    secret,
    label: userEmail,
    issuer: serviceName,
  });
  const qrCodeUrl = await QRCode.toDataURL(otpauth);
  const backupCodes = generateBackupCodes(8);

  return {
    secret,
    otpauth,
    qrCodeUrl,
    backupCodes,
  };
}

export function verifyTotpToken(secret: string, token: string): boolean {
  try {
    const cleanToken = String(token || '').replace(/\s+/g, '');
    const result = verify({ token: cleanToken, secret });
    return Boolean(result);
  } catch (err) {
    return false;
  }
}

export function verifyBackupCode(
  storedCodes: string[],
  inputCode: string
): { valid: boolean; remainingCodes: string[] } {
  if (!Array.isArray(storedCodes) || storedCodes.length === 0) {
    return { valid: false, remainingCodes: [] };
  }

  const cleanInput = String(inputCode || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  const index = storedCodes.findIndex((c) => {
    const cleanStored = String(c).replace(/[^A-Z0-9]/g, '').toUpperCase();
    return cleanStored === cleanInput;
  });

  if (index === -1) {
    return { valid: false, remainingCodes: storedCodes };
  }

  const remainingCodes = [...storedCodes];
  remainingCodes.splice(index, 1);
  return { valid: true, remainingCodes };
}

import QRCode from 'qrcode';

export interface QRGenerationData {
  tokenId: string;
  studentId?: string;
  mealType?: string;
  date?: string;
  timestamp?: number;
}

/**
 * Generate QR code as data URL string
 */
export async function generateQRCodeDataUrl(data: QRGenerationData): Promise<string> {
  try {
    const jsonString = JSON.stringify({ tokenId: data.tokenId });
    const qrDataUrl = await QRCode.toDataURL(jsonString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('[v0] Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Generate QR code as buffer
 */
export async function generateQRCodeBuffer(data: QRGenerationData): Promise<Buffer> {
  try {
    const jsonString = JSON.stringify({ tokenId: data.tokenId });
    const buffer = await QRCode.toBuffer(jsonString, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    return buffer;
  } catch (error) {
    console.error('[v0] Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code buffer');
  }
}

/**
 * Create a unique QR code identifier
 */
export function createQRCodeId(studentId: string, mealType: string, timestamp: number): string {
  const data = `${studentId}-${mealType}-${timestamp}`;
  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `QR${Math.abs(hash).toString(36).toUpperCase()}`;
}

/**
 * Validate QR code data structure
 */
export function validateQRData(data: unknown): data is QRGenerationData {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const qrData = data as Record<string, unknown>;

  return (
    typeof qrData.tokenId === 'string'
  );
}

/**
 * Parse QR code string (assumes it's JSON)
 */
export function parseQRCodeString(qrString: string): QRGenerationData | null {
  try {
    const data = JSON.parse(qrString);
    if (validateQRData(data)) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('[v0] Error parsing QR code string:', error);
    return null;
  }
}

/**
 * Generate secure QR token for database storage
 */
export function generateSecureQRToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  const array = new Uint8Array(24);
  
  if (typeof window !== 'undefined' && crypto) {
    crypto.getRandomValues(array);
  } else {
    // Node.js environment
    const { randomBytes } = require('crypto');
    return randomBytes(24).toString('hex');
  }

  for (let i = 0; i < array.length; i++) {
    token += chars[array[i] % chars.length];
  }
  return token;
}

/**
 * Format token expiration time (24 hours from now)
 */
export function getTokenExpirationTime(hours = 24): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

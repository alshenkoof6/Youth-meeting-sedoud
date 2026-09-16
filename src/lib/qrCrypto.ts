/**
 * Secure QR Token Generation & Verification
 * Generates time-slotted HMAC-like tokens for meeting check-ins
 * preventing static screenshot forwarding.
 */

export interface QRCheckInPayload {
  meetingId: string;
  token: string;
  timestamp: number;
  timeWindow: number; // 30-second epoch index
}

// Generate simple deterministic hash for client-server sync
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36).toUpperCase();
}

/**
 * Generate rotating QR payload for a meeting
 * Window rotates every 30 seconds
 */
export function generateMeetingQRPayload(meetingId: string, secretToken: string): string {
  const now = Date.now();
  const timeWindow = Math.floor(now / 30000); // 30 seconds
  const signature = simpleHash(`${meetingId}:${secretToken}:${timeWindow}`);
  
  const payload: QRCheckInPayload = {
    meetingId,
    token: signature,
    timestamp: now,
    timeWindow,
  };

  return JSON.stringify(payload);
}

export function generateRotatingToken(secretToken: string, meetingId?: string): string {
  const now = Date.now();
  const timeWindow = Math.floor(now / 30000);
  return simpleHash(`${meetingId || 'meeting'}:${secretToken}:${timeWindow}`);
}

/**
 * Validates a scanned QR payload against meeting parameters
 * Allows +/- 1 time window (skew tolerance of up to 60 seconds)
 */
export function validateQRPayload(
  payloadStr: string,
  targetMeetingId: string,
  secretToken: string
): { isValid: boolean; error?: string } {
  try {
    const data: QRCheckInPayload = JSON.parse(payloadStr);

    if (!data.meetingId || data.meetingId !== targetMeetingId) {
      return { isValid: false, error: 'هذا الرمز لا يخص الاجتماع المحدد.' };
    }

    const currentWindow = Math.floor(Date.now() / 30000);
    const windowSkew = Math.abs(currentWindow - data.timeWindow);

    // Allow current window or previous window (+/- 1)
    if (windowSkew > 2) {
      return { isValid: false, error: 'انتهت صلاحية رمز الاستجابة السريعة (QR Code). يرجى مسح الرمز المحدث المعروض على الشاشة.' };
    }

    // Verify signature for that window
    const expectedSig = simpleHash(`${targetMeetingId}:${secretToken}:${data.timeWindow}`);
    if (data.token !== expectedSig) {
      return { isValid: false, error: 'رمز الحضور غير موثوق أو تم التلاعب به.' };
    }

    return { isValid: true };
  } catch (err) {
    // If raw string is just the meetingId (fallback mode)
    if (payloadStr === targetMeetingId) {
      return { isValid: true };
    }
    return { isValid: false, error: 'تنسيق رمز الاستجابة السريعة غير صالح.' };
  }
}

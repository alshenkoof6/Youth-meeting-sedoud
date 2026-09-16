import { UserProfile, UserRole } from '../types';

/**
 * Generates the next sequential Church Code based on user role.
 * e.g., YT-00125 for Youth, SRV-00042 for Servants.
 */
export function generateNextChurchCode(
  role: UserRole,
  existingUsers: UserProfile[],
  churchPrefix = 'STMARY'
): string {
  const isServantOrAdmin = role === 'servant' || role === 'admin' || role === 'supervisor';
  const prefix = isServantOrAdmin ? 'SRV' : 'YT';

  // Find all existing numeric values for this role prefix
  let maxNumber = 0;

  for (const user of existingUsers) {
    if (!user.userCode) continue;
    
    // Match codes like YT-00125, YT_000101, STMARY-00125, SRV-00012
    const cleanCode = user.userCode.toUpperCase().replace(/[_\s]/g, '-');
    const parts = cleanCode.split('-');
    
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const parsedNum = parseInt(lastPart, 10);
      if (!isNaN(parsedNum) && parsedNum > maxNumber) {
        // If it matches our prefix type
        if (cleanCode.startsWith(prefix) || cleanCode.includes(prefix)) {
          maxNumber = parsedNum;
        } else if (!isServantOrAdmin && cleanCode.startsWith('YT')) {
          maxNumber = Math.max(maxNumber, parsedNum);
        }
      }
    }
  }

  // If no existing high numbers, seed a realistic default sequence number
  // (e.g. 124 so next is 125, matching the user's example YT-00125)
  if (maxNumber < 100) {
    maxNumber = isServantOrAdmin ? 24 : 124;
  }

  const nextNumber = maxNumber + 1;
  const paddedNumber = String(nextNumber).padStart(5, '0');

  return `${prefix}-${paddedNumber}`;
}

/**
 * Generates a random, strong, readable temporary password.
 * e.g. 'X7mK92wQ' (8 characters, mixed case and numbers, no ambiguous characters).
 */
export function generateTemporaryPassword(length = 8): string {
  // Discard ambiguous characters like 0/O, 1/l/I
  const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowers = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const allChars = uppers + lowers + digits;

  // Guarantee at least 2 uppers, 2 lowers, 2 digits
  let result = '';
  result += uppers.charAt(Math.floor(Math.random() * uppers.length));
  result += uppers.charAt(Math.floor(Math.random() * uppers.length));
  result += digits.charAt(Math.floor(Math.random() * digits.length));
  result += lowers.charAt(Math.floor(Math.random() * lowers.length));
  result += lowers.charAt(Math.floor(Math.random() * lowers.length));
  result += digits.charAt(Math.floor(Math.random() * digits.length));

  for (let i = result.length; i < length; i++) {
    result += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the result
  return result
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

/**
 * Normalizes user code for case-insensitive and punctuation-tolerant lookup.
 */
export function normalizeChurchCode(code: string): string {
  return code.trim().toUpperCase().replace(/[_\s]/g, '-');
}

/**
 * Evaluates password strength for user-defined new passwords.
 */
export function evaluatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0 to 3
  feedback: string;
} {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      score: 0,
      feedback: 'يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام',
    };
  }

  let score = 1;
  const hasLetters = /[a-zA-Z\u0600-\u06FF]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9\u0600-\u06FF]/.test(password);

  if (password.length >= 8) score++;
  if (hasLetters && hasDigits) score++;
  if (hasSpecial && score < 3) score++;

  let feedback = 'كلمة مرور مقبولة';
  if (score === 3) feedback = 'كلمة مرور قوية وممتازة 👍';
  else if (score === 2) feedback = 'كلمة مرور جيدة';

  return {
    isValid: true,
    score,
    feedback,
  };
}

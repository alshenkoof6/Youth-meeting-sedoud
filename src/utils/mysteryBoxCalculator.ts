import { MysteryBoxReward, MysteryBoxConfig, UserProfile, MysteryBoxRedemptionRecord } from '../types';

/**
 * Validates that active rewards sum up to 100%
 */
export function validateProbabilities(rewards: MysteryBoxReward[]): {
  isValid: boolean;
  totalActiveProb: number;
  errorMessage?: string;
} {
  const activeRewards = rewards.filter((r) => r.isActive);
  if (activeRewards.length === 0) {
    return {
      isValid: false,
      totalActiveProb: 0,
      errorMessage: 'يجب أن يحتوي الصندوق على جائزة نشطة واحدة على الأقل.',
    };
  }

  const totalActiveProb = Math.round(activeRewards.reduce((sum, r) => sum + Number(r.probability || 0), 0) * 100) / 100;
  const isExact100 = Math.abs(totalActiveProb - 100) <= 0.05;

  if (!isExact100) {
    return {
      isValid: false,
      totalActiveProb,
      errorMessage: `مجموع نسب الاحتمالات الحالية هو ${totalActiveProb}%، يجب أن يكون المجموع 100% تماماً عند الحفظ.`,
    };
  }

  return { isValid: true, totalActiveProb };
}

/**
 * Calculates dynamically re-weighted probabilities for in-stock active rewards.
 * If reward B runs out of stock, its probability is automatically redistributed
 * proportionally across the remaining in-stock rewards.
 */
export function getRedistributedProbabilities(rewards: MysteryBoxReward[]): Array<{
  reward: MysteryBoxReward;
  originalProbability: number;
  effectiveProbability: number;
  isAvailable: boolean;
}> {
  const activeRewards = rewards.filter((r) => r.isActive);
  const availableRewards = activeRewards.filter((r) => r.stock > 0);
  const totalAvailableWeight = availableRewards.reduce((sum, r) => sum + Number(r.probability || 0), 0);

  return rewards.map((r) => {
    const isAvailable = r.isActive && r.stock > 0;
    let effectiveProbability = 0;
    if (isAvailable && totalAvailableWeight > 0) {
      effectiveProbability = Math.round((Number(r.probability) / totalAvailableWeight) * 1000) / 10;
    }

    return {
      reward: r,
      originalProbability: r.probability,
      effectiveProbability,
      isAvailable,
    };
  });
}

/**
 * Selects a winning reward based on proportional in-stock weights.
 * Can take a custom random number in [0, 1) e.g. from crypto random generator.
 */
export function pickWinningReward(
  rewards: MysteryBoxReward[],
  randomRoll: number = Math.random()
): {
  winningReward: MysteryBoxReward | null;
  error?: string;
} {
  const activeRewards = rewards.filter((r) => r.isActive);
  if (activeRewards.length === 0) {
    return { winningReward: null, error: 'لا توجد جوائز مفعلة في الصندوق حالياً.' };
  }

  const availableRewards = activeRewards.filter((r) => r.stock > 0);
  if (availableRewards.length === 0) {
    return { winningReward: null, error: 'عفواً، جميع جوائز الصندوق نفدت كمياتها حالياً من الكانتين.' };
  }

  const totalWeight = availableRewards.reduce((sum, r) => sum + Number(r.probability || 0), 0);
  if (totalWeight <= 0) {
    // If all available rewards have 0% probability, pick uniformly among available
    const uniformIndex = Math.floor(randomRoll * availableRewards.length);
    return { winningReward: availableRewards[uniformIndex] };
  }

  const target = randomRoll * totalWeight;
  let running = 0;

  for (const reward of availableRewards) {
    running += Number(reward.probability || 0);
    if (target <= running) {
      return { winningReward: reward };
    }
  }

  return { winningReward: availableRewards[availableRewards.length - 1] };
}

export interface BirthdayEligibility {
  isEligible: boolean;
  hasBirthDate: boolean;
  birthDate?: string;
  isToday: boolean;
  daysRemaining: number;
  birthdayYear: number;
  alreadyClaimed: boolean;
  claimedAt?: string;
  reason?: string;
}

/**
 * Checks whether a user is currently eligible for the Birthday Mystery Box.
 * Rule: exactly 1 per calendar year, available from birthday for durationDays (default 7 days).
 */
export function checkBirthdayMysteryBoxEligibility(
  user: UserProfile,
  redemptions: MysteryBoxRedemptionRecord[],
  durationDays: number = 7
): BirthdayEligibility {
  if (!user.birthDate) {
    return {
      isEligible: false,
      hasBirthDate: false,
      isToday: false,
      daysRemaining: 0,
      birthdayYear: new Date().getFullYear(),
      alreadyClaimed: false,
      reason: 'تاريخ الميلاد غير مسجل في الحساب.',
    };
  }

  const birthParts = user.birthDate.split('-');
  if (birthParts.length < 3) {
    return {
      isEligible: false,
      hasBirthDate: false,
      isToday: false,
      daysRemaining: 0,
      birthdayYear: new Date().getFullYear(),
      alreadyClaimed: false,
      reason: 'صيغة تاريخ الميلاد غير صالحة.',
    };
  }

  const birthMonth = parseInt(birthParts[1], 10) - 1; // 0-indexed
  const birthDay = parseInt(birthParts[2], 10);

  const now = new Date();
  const currentYear = now.getFullYear();

  // Create birthday date for current year
  const birthdayThisYear = new Date(currentYear, birthMonth, birthDay, 0, 0, 0, 0);

  // Check if birthday falls in previous year's rollover (e.g. late December / early January)
  let targetBirthday = birthdayThisYear;
  let targetYear = currentYear;

  // Calculate difference in days from the birthday
  // User is eligible if now is >= birthday and <= birthday + durationDays
  const msPerDay = 1000 * 60 * 60 * 24;
  let diffDays = Math.floor((now.getTime() - targetBirthday.getTime()) / msPerDay);

  // If diffDays is negative (birthday is in the future this year), check if recent birthday was last year within duration
  if (diffDays < 0) {
    const lastYearBirthday = new Date(currentYear - 1, birthMonth, birthDay, 0, 0, 0, 0);
    const lastYearDiff = Math.floor((now.getTime() - lastYearBirthday.getTime()) / msPerDay);
    if (lastYearDiff >= 0 && lastYearDiff <= durationDays) {
      targetBirthday = lastYearBirthday;
      targetYear = currentYear - 1;
      diffDays = lastYearDiff;
    }
  }

  const isToday = diffDays === 0;
  const isWithinWindow = diffDays >= 0 && diffDays <= durationDays;
  const daysRemaining = Math.max(0, durationDays - diffDays);

  // Check if already claimed for targetYear
  const existingClaim = redemptions.find(
    (r) => r.userId === user.userId && r.boxId === 'birthday_box' && (r.birthdayYear === targetYear || new Date(r.timestamp).getFullYear() === targetYear)
  );

  const alreadyClaimed = !!existingClaim;

  if (alreadyClaimed) {
    return {
      isEligible: false,
      hasBirthDate: true,
      birthDate: user.birthDate,
      isToday,
      daysRemaining,
      birthdayYear: targetYear,
      alreadyClaimed: true,
      claimedAt: existingClaim.timestamp,
      reason: `لقد حصلت بالفعل على صندوق عيد الميلاد لعام ${targetYear}! 🎉`,
    };
  }

  if (!isWithinWindow) {
    return {
      isEligible: false,
      hasBirthDate: true,
      birthDate: user.birthDate,
      isToday: false,
      daysRemaining: 0,
      birthdayYear: targetYear,
      alreadyClaimed: false,
      reason: diffDays < 0 ? 'عيد ميلادك لم يحن بعد.' : `انتهت فترة فتح صندوق عيد الميلاد لهذا العام (${durationDays} أيام).`,
    };
  }

  return {
    isEligible: true,
    hasBirthDate: true,
    birthDate: user.birthDate,
    isToday,
    daysRemaining,
    birthdayYear: targetYear,
    alreadyClaimed: false,
  };
}

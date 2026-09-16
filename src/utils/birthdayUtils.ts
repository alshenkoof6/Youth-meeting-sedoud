import { UserProfile } from '../types';

export interface BirthdayInfo {
  user: UserProfile;
  birthDateString: string;
  birthMonth: number; // 1-12
  birthDay: number; // 1-31
  currentAge: number; // dynamically calculated
  turningAge: number; // age they are turning this year
  daysUntilBirthday: number;
  isToday: boolean;
  isThisWeek: boolean;
  isThisMonth: boolean;
  formattedDateArabic: string;
}

/**
 * Calculates current age dynamically from a birthdate string (YYYY-MM-DD)
 */
export function calculateAge(birthDateStr?: string): number {
  if (!birthDateStr) return 0;
  const parts = birthDateStr.split('-');
  if (parts.length < 3) return 0;

  const bYear = parseInt(parts[0], 10);
  const bMonth = parseInt(parts[1], 10) - 1;
  const bDay = parseInt(parts[2], 10);

  const birthDate = new Date(bYear, bMonth, bDay);
  if (isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Parses user's birthDate and determines proximity to today
 */
export function getBirthdayInfo(user: UserProfile): BirthdayInfo | null {
  if (!user.birthDate) return null;

  const parts = user.birthDate.split('-');
  if (parts.length < 3) return null;

  const bYear = parseInt(parts[0], 10);
  const bMonth = parseInt(parts[1], 10); // 1-12
  const bDay = parseInt(parts[2], 10); // 1-31

  if (isNaN(bYear) || isNaN(bMonth) || isNaN(bDay)) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate();

  // Create this year's birthday date
  let nextBirthday = new Date(currentYear, bMonth - 1, bDay);
  
  // If birthday has already passed this year, look at next year's
  const todayAtMidnight = new Date(currentYear, today.getMonth(), today.getDate());
  if (nextBirthday < todayAtMidnight) {
    nextBirthday = new Date(currentYear + 1, bMonth - 1, bDay);
  }

  const diffTime = nextBirthday.getTime() - todayAtMidnight.getTime();
  const daysUntilBirthday = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const isToday = bMonth === currentMonth && bDay === currentDay;
  const isThisWeek = daysUntilBirthday >= 0 && daysUntilBirthday <= 7;
  const isThisMonth = bMonth === currentMonth;

  const currentAge = calculateAge(user.birthDate);
  const turningAge = isToday ? currentAge : currentAge + 1;

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const formattedDateArabic = `${bDay} ${monthNames[bMonth - 1]}`;

  return {
    user,
    birthDateString: user.birthDate,
    birthMonth: bMonth,
    birthDay: bDay,
    currentAge,
    turningAge,
    daysUntilBirthday,
    isToday,
    isThisWeek,
    isThisMonth,
    formattedDateArabic,
  };
}

/**
 * Filter and group users into today, this week, this month based on role and servant assignments
 */
export function getBirthdayGroups(
  allUsers: UserProfile[],
  currentUser: UserProfile | null
): {
  today: BirthdayInfo[];
  thisWeek: BirthdayInfo[];
  thisMonth: BirthdayInfo[];
  allUpcoming: BirthdayInfo[];
} {
  if (!currentUser) {
    return { today: [], thisWeek: [], thisMonth: [], allUpcoming: [] };
  }

  // Determine allowed users based on privacy rules
  let eligibleUsers: UserProfile[] = [];

  if (currentUser.role === 'admin' || currentUser.role === 'supervisor') {
    // Service Secretary sees all youth
    eligibleUsers = allUsers.filter((u) => u.role === 'youth');
  } else if (currentUser.role === 'servant') {
    // Servant sees only assigned youth
    eligibleUsers = allUsers.filter(
      (u) => u.role === 'youth' && u.assignedServantId === currentUser.userId
    );
  } else if (currentUser.role === 'youth') {
    // Youth only sees themselves
    eligibleUsers = allUsers.filter((u) => u.userId === currentUser.userId);
  } else {
    // Canteen servant or others: no birthdays
    return { today: [], thisWeek: [], thisMonth: [], allUpcoming: [] };
  }

  const infos = eligibleUsers
    .map(getBirthdayInfo)
    .filter((info): info is BirthdayInfo => info !== null);

  const today = infos.filter((i) => i.isToday);
  const thisWeek = infos
    .filter((i) => !i.isToday && i.isThisWeek)
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
  const thisMonth = infos
    .filter((i) => !i.isToday && !i.isThisWeek && i.isThisMonth)
    .sort((a, b) => a.birthDay - b.birthDay);

  const allUpcoming = [...infos].sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);

  return { today, thisWeek, thisMonth, allUpcoming };
}

import { Meeting, AttendanceRecord } from '../types';

export interface StreakMilestone {
  level: number;
  title: string;
  badge: string;
  minStreak: number;
  description: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { level: 1, title: 'بداية الالتزام', badge: '🌱', minStreak: 1, description: 'أول خطوة في طريق البركة والمواظبة' },
  { level: 2, title: 'شعلة الاستمرار', badge: '🔥', minStreak: 3, description: '3 اجتماعات متتالية بحضور مشجع' },
  { level: 3, title: 'المواظب الفضي', badge: '🥈', minStreak: 5, description: '5 اجتماعات متتالية من الثبات والنمو' },
  { level: 4, title: 'البطل الذهبي', badge: '🥇', minStreak: 10, description: '10 اجتماعات متتالية التزام استثنائي' },
  { level: 5, title: 'حجر الزاوية الماسي', badge: '💎', minStreak: 20, description: '20 اجتماعاً متتالياً قدوة حقيقية لإخوتك' },
  { level: 6, title: 'أيقونة الخدمة', badge: '👑', minStreak: 30, description: '30 اجتماعاً متتالياً أمانة مباركة في بيت الله' },
];

export interface MeetingTimelineItem {
  meetingId: string;
  title: string;
  date: string;
  displayDate: string;
  status: 'attended' | 'missed' | 'canceled' | 'active_pending' | 'upcoming';
  note?: string;
}

export interface YouthStreakCalculation {
  currentStreak: number;
  bestStreak: number;
  consecutiveAbsences: number;
  currentMilestone: StreakMilestone | null;
  nextMilestone: StreakMilestone | null;
  progressPercent: number;
  meetingsNeededForNext: number;
  recentTimeline: MeetingTimelineItem[];
  encouragementMessage: string;
  flameLevel: 'none' | 'spark' | 'flame' | 'fire' | 'super';
}

/**
 * Calculates youth attendance streak based on scheduled meetings.
 * Business Rules:
 * 1. Streak is calculated based on scheduled meetings chronologically, NOT calendar days.
 * 2. Canceled meetings (status === 'canceled') do NOT count as absences and do not break streaks.
 * 3. Active (in-progress) meetings: if attended, counted; if not yet attended, do not break past streak.
 * 4. Upcoming meetings are shown as pending/scheduled.
 */
export function calculateYouthStreak(
  userId: string,
  meetings: Meeting[],
  attendanceRecords: AttendanceRecord[]
): YouthStreakCalculation {
  if (!userId || !meetings || meetings.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      consecutiveAbsences: 0,
      currentMilestone: null,
      nextMilestone: STREAK_MILESTONES[0],
      progressPercent: 0,
      meetingsNeededForNext: 1,
      recentTimeline: [],
      encouragementMessage: 'كل أسبوع فرصة جديدة لبداية مباركة في بيت ربنا!',
      flameLevel: 'none',
    };
  }

  // Set of meeting IDs attended by the user
  const attendedMeetingIds = new Set(
    attendanceRecords
      .filter((a) => a.userId === userId)
      .map((a) => a.meetingId)
  );

  // Chronological sort (oldest to newest)
  const sortedMeetings = [...meetings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Build full chronological history of evaluated meetings (skipping canceled for streak math, but noting them)
  const nonCanceledMeetings = sortedMeetings.filter((m) => m.status !== 'canceled');

  // Compute bestStreak historically over all non-canceled past/completed meetings
  let maxStreak = 0;
  let runningStreak = 0;
  for (const m of nonCanceledMeetings) {
    if (m.status === 'completed' || attendedMeetingIds.has(m.meetingId)) {
      if (attendedMeetingIds.has(m.meetingId)) {
        runningStreak++;
        if (runningStreak > maxStreak) {
          maxStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
    }
  }

  // Determine current active meeting, if any
  const activeMeeting = sortedMeetings.find((m) => m.status === 'active');
  const userAttendedActive = activeMeeting ? attendedMeetingIds.has(activeMeeting.meetingId) : false;

  // Filter completed past meetings (in descending order: newest first)
  const completedPastMeetings = nonCanceledMeetings
    .filter((m) => m.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  let calculatedCurrentStreak = 0;

  // If there's an active meeting that user already attended, start streak with 1
  if (activeMeeting && userAttendedActive) {
    calculatedCurrentStreak++;
  }

  // Count backwards through completed past meetings
  for (const m of completedPastMeetings) {
    if (attendedMeetingIds.has(m.meetingId)) {
      calculatedCurrentStreak++;
    } else {
      // Streak breaks at first missed meeting
      break;
    }
  }

  // If currentStreak exceeds historical maxStreak, update it
  if (calculatedCurrentStreak > maxStreak) {
    maxStreak = calculatedCurrentStreak;
  }

  // Calculate consecutive absences (going backwards from most recent completed meeting)
  let calculatedAbsences = 0;
  for (const m of completedPastMeetings) {
    if (!attendedMeetingIds.has(m.meetingId)) {
      calculatedAbsences++;
    } else {
      break;
    }
  }

  // Find milestones
  let currentMilestone: StreakMilestone | null = null;
  let nextMilestone: StreakMilestone | null = null;

  for (let i = 0; i < STREAK_MILESTONES.length; i++) {
    if (calculatedCurrentStreak >= STREAK_MILESTONES[i].minStreak) {
      currentMilestone = STREAK_MILESTONES[i];
    } else {
      nextMilestone = STREAK_MILESTONES[i];
      break;
    }
  }

  // Progress to next milestone calculation
  let progressPercent = 0;
  let meetingsNeededForNext = 0;

  if (nextMilestone) {
    meetingsNeededForNext = Math.max(0, nextMilestone.minStreak - calculatedCurrentStreak);
    const prevMilestoneMin = currentMilestone ? currentMilestone.minStreak : 0;
    const range = nextMilestone.minStreak - prevMilestoneMin;
    const progressInRange = calculatedCurrentStreak - prevMilestoneMin;
    progressPercent = Math.min(100, Math.round((progressInRange / range) * 100));
  } else {
    progressPercent = 100;
    meetingsNeededForNext = 0;
  }

  // Build Recent Timeline (last 5-6 meetings in chronological order for display)
  // We include completed, active, and canceled meetings to demonstrate that canceled meetings did not harm streak
  const recentSlice = sortedMeetings
    .filter((m) => m.status !== 'scheduled') // exclude far future scheduled
    .slice(-6);

  const recentTimeline: MeetingTimelineItem[] = recentSlice.map((m) => {
    let status: MeetingTimelineItem['status'] = 'missed';
    let note: string | undefined;

    if (m.status === 'canceled') {
      status = 'canceled';
      note = 'اجتماع مُعلّق - لا يُحسب غياباً ولا يكسر المواظبة';
    } else if (attendedMeetingIds.has(m.meetingId)) {
      status = 'attended';
      note = 'حاضر ✓';
    } else if (m.status === 'active') {
      status = 'active_pending';
      note = 'جارٍ الآن - سجّل حضورك!';
    } else {
      status = 'missed';
      note = 'لم يحضر';
    }

    // Format Arabic date e.g. "١٠ سبتمبر"
    const dateObj = new Date(m.date);
    const day = dateObj.getDate();
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const displayDate = `${day} ${months[dateObj.getMonth()]}`;

    return {
      meetingId: m.meetingId,
      title: m.title,
      date: m.date,
      displayDate,
      status,
      note,
    };
  });

  // Encouragement copy
  let encouragementMessage = '';
  let flameLevel: YouthStreakCalculation['flameLevel'] = 'none';

  if (calculatedCurrentStreak >= 20) {
    flameLevel = 'super';
    encouragementMessage = 'أنت عمود من أعمدة الخدمة ونور مشجع لكل إخوتك! كمل ببركة ربنا 💎';
  } else if (calculatedCurrentStreak >= 10) {
    flameLevel = 'fire';
    encouragementMessage = 'عاش يا بطل! التزامك الذهبي نموذج حقيقي ومصدر فخر لاجتماعنا 🥇';
  } else if (calculatedCurrentStreak >= 5) {
    flameLevel = 'flame';
    encouragementMessage = 'استمرار رائع! واصل ثباتك ونموك الروحي، ربنا يبارك محبتك 🥈';
  } else if (calculatedCurrentStreak >= 3) {
    flameLevel = 'spark';
    encouragementMessage = 'شعلة الحماس منورة! ٣ أسابيع متتالية من البركة والشركة الروحية 🔥';
  } else if (calculatedCurrentStreak >= 1) {
    flameLevel = 'spark';
    encouragementMessage = 'بداية ممتازة! حضورك بيفرق وينور اجتماعنا، مستنيينك الأسبوع الجاي 🌱';
  } else {
    flameLevel = 'none';
    encouragementMessage = 'وحشتنا! كل أسبوع بداية جديدة للبركة، مستنيينك تنورنا في الاجتماع القادم ✨';
  }

  return {
    currentStreak: calculatedCurrentStreak,
    bestStreak: maxStreak,
    consecutiveAbsences: calculatedAbsences,
    currentMilestone,
    nextMilestone,
    progressPercent,
    meetingsNeededForNext,
    recentTimeline,
    encouragementMessage,
    flameLevel,
  };
}

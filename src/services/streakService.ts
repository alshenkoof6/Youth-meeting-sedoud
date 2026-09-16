import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../lib/firebase';
import { Meeting, AttendanceRecord } from '../types';
import { dataStore } from './dataStore';
import {
  StreakMilestone,
  STREAK_MILESTONES,
  MeetingTimelineItem,
  YouthStreakCalculation
} from '../utils/streakCalculator';

/**
 * Represents a single uninterrupted sequence of attendances across scheduled meetings.
 */
export interface ConsecutiveAttendanceSequence {
  count: number;
  meetings: Meeting[];
  attendanceRecords: AttendanceRecord[];
  startDate: string;
  endDate: string;
  isActive: boolean; // True if this sequence includes the most recently evaluated meeting
}

/**
 * Complete streak report including consecutive sequences, milestones, and timeline.
 */
export interface StreakCalculationResult extends YouthStreakCalculation {
  userId: string;
  totalAttended: number;
  totalEligibleMeetings: number;
  attendanceRate: number; // e.g. 80 (%)
  mostRecentSequence: ConsecutiveAttendanceSequence | null;
  longestSequence: ConsecutiveAttendanceSequence | null;
  allSequences: ConsecutiveAttendanceSequence[];
}

export class StreakService {
  private static instance: StreakService;

  public static getInstance(): StreakService {
    if (!StreakService.instance) {
      StreakService.instance = new StreakService();
    }
    return StreakService.instance;
  }

  /**
   * Fetches meeting and attendance records for a given user.
   * Prioritizes Firestore querying, with graceful fallback to local dataStore.
   */
  public async fetchUserMeetingAttendance(userId: string): Promise<{
    meetings: Meeting[];
    attendance: AttendanceRecord[];
  }> {
    if (!userId) {
      return { meetings: [], attendance: [] };
    }

    try {
      const db = getFirebaseDb();

      // Fetch all scheduled meetings ordered chronologically
      const meetingsColl = collection(db, 'meetings');
      const meetingsQuery = query(meetingsColl, orderBy('date', 'asc'));
      const meetingsSnap = await getDocs(meetingsQuery);

      const meetings: Meeting[] = !meetingsSnap.empty
        ? meetingsSnap.docs.map((d) => d.data() as Meeting)
        : dataStore.meetings;

      // Fetch user's attendance records
      const attendanceColl = collection(db, 'attendance');
      const attendanceQuery = query(attendanceColl, where('userId', '==', userId));
      const attendanceSnap = await getDocs(attendanceQuery);

      const attendance: AttendanceRecord[] = !attendanceSnap.empty
        ? attendanceSnap.docs.map((d) => d.data() as AttendanceRecord)
        : dataStore.attendance.filter((a) => a.userId === userId);

      return { meetings, attendance };
    } catch (err) {
      console.warn('[StreakService] Firestore fetch fallback to local cache:', err);
      return {
        meetings: dataStore.meetings,
        attendance: dataStore.attendance.filter((a) => a.userId === userId),
      };
    }
  }

  /**
   * Identifies all historical consecutive attendance sequences for a user,
   * accounting for meeting schedule chronology and excluding canceled meetings.
   */
  public identifyConsecutiveSequences(
    userId: string,
    meetings: Meeting[],
    attendanceRecords: AttendanceRecord[]
  ): {
    allSequences: ConsecutiveAttendanceSequence[];
    mostRecentSequence: ConsecutiveAttendanceSequence | null;
    longestSequence: ConsecutiveAttendanceSequence | null;
    currentStreakSequence: ConsecutiveAttendanceSequence | null;
  } {
    if (!userId || !meetings || meetings.length === 0) {
      return {
        allSequences: [],
        mostRecentSequence: null,
        longestSequence: null,
        currentStreakSequence: null,
      };
    }

    // Map attended meeting IDs and attendance records for this user
    const attendanceMap = new Map<string, AttendanceRecord>();
    attendanceRecords
      .filter((a) => a.userId === userId)
      .forEach((a) => attendanceMap.set(a.meetingId, a));

    // Sort meetings chronologically (oldest to newest)
    const sortedMeetings = [...meetings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Business rule: Canceled meetings do NOT break streaks and are excluded from attendance sequences
    const eligibleMeetings = sortedMeetings.filter((m) => m.status !== 'canceled');

    const allSequences: ConsecutiveAttendanceSequence[] = [];
    let currentBlockMeetings: Meeting[] = [];
    let currentBlockRecords: AttendanceRecord[] = [];

    // Find the latest completed or attended meeting
    const completedOrAttended = eligibleMeetings.filter(
      (m) => m.status === 'completed' || (m.status === 'active' && attendanceMap.has(m.meetingId))
    );
    const latestEvaluatedMeetingId = completedOrAttended.length > 0
      ? completedOrAttended[completedOrAttended.length - 1].meetingId
      : null;

    for (const m of eligibleMeetings) {
      // Future scheduled meetings not yet active/completed are skipped
      if (m.status === 'scheduled') {
        continue;
      }

      const isAttended = attendanceMap.has(m.meetingId);

      if (isAttended) {
        currentBlockMeetings.push(m);
        const rec = attendanceMap.get(m.meetingId)!;
        currentBlockRecords.push(rec);
      } else {
        // Active meeting that hasn't been attended yet is pending and doesn't break previous sequence immediately
        if (m.status === 'active') {
          continue;
        }

        // Meeting was missed (completed without attendance)
        if (currentBlockMeetings.length > 0) {
          const isBlockActive = latestEvaluatedMeetingId
            ? currentBlockMeetings.some((item) => item.meetingId === latestEvaluatedMeetingId)
            : false;

          allSequences.push({
            count: currentBlockMeetings.length,
            meetings: [...currentBlockMeetings],
            attendanceRecords: [...currentBlockRecords],
            startDate: currentBlockMeetings[0].date,
            endDate: currentBlockMeetings[currentBlockMeetings.length - 1].date,
            isActive: isBlockActive,
          });

          currentBlockMeetings = [];
          currentBlockRecords = [];
        }
      }
    }

    // Flush any remaining trailing sequence
    if (currentBlockMeetings.length > 0) {
      const isBlockActive = latestEvaluatedMeetingId
        ? currentBlockMeetings.some((item) => item.meetingId === latestEvaluatedMeetingId)
        : false;

      allSequences.push({
        count: currentBlockMeetings.length,
        meetings: [...currentBlockMeetings],
        attendanceRecords: [...currentBlockRecords],
        startDate: currentBlockMeetings[0].date,
        endDate: currentBlockMeetings[currentBlockMeetings.length - 1].date,
        isActive: isBlockActive,
      });
    }

    // Most recent sequence is the last sequence chronologically
    const mostRecentSequence = allSequences.length > 0
      ? allSequences[allSequences.length - 1]
      : null;

    // Longest sequence is the one with highest count
    let longestSequence: ConsecutiveAttendanceSequence | null = null;
    let maxCount = 0;
    for (const seq of allSequences) {
      if (seq.count > maxCount) {
        maxCount = seq.count;
        longestSequence = seq;
      }
    }

    // Currently active sequence
    const currentStreakSequence = allSequences.find((seq) => seq.isActive) || null;

    return {
      allSequences,
      mostRecentSequence,
      longestSequence,
      currentStreakSequence,
    };
  }

  /**
   * Calculates the current streak and complete report based on scheduled meetings.
   * Can be run synchronously with provided datasets or dynamically.
   */
  public calculateStreak(
    userId: string,
    meetingsInput?: Meeting[],
    attendanceInput?: AttendanceRecord[]
  ): StreakCalculationResult {
    const meetings = meetingsInput || dataStore.meetings;
    const attendanceRecords = attendanceInput || dataStore.attendance;

    if (!userId || !meetings || meetings.length === 0) {
      return {
        userId,
        currentStreak: 0,
        bestStreak: 0,
        consecutiveAbsences: 0,
        totalAttended: 0,
        totalEligibleMeetings: 0,
        attendanceRate: 0,
        currentMilestone: null,
        nextMilestone: STREAK_MILESTONES[0],
        progressPercent: 0,
        meetingsNeededForNext: 1,
        recentTimeline: [],
        encouragementMessage: 'كل أسبوع فرصة جديدة لبداية مباركة في بيت ربنا!',
        flameLevel: 'none',
        mostRecentSequence: null,
        longestSequence: null,
        allSequences: [],
      };
    }

    // Identify all consecutive sequences
    const { allSequences, mostRecentSequence, longestSequence, currentStreakSequence } =
      this.identifyConsecutiveSequences(userId, meetings, attendanceRecords);

    // Current streak value
    const currentStreak = currentStreakSequence ? currentStreakSequence.count : 0;
    const bestStreak = longestSequence ? longestSequence.count : currentStreak;

    // Map attended meeting IDs
    const attendedMeetingIds = new Set(
      attendanceRecords
        .filter((a) => a.userId === userId)
        .map((a) => a.meetingId)
    );

    // Chronologically sorted non-canceled meetings
    const nonCanceledMeetings = [...meetings]
      .filter((m) => m.status !== 'canceled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const completedMeetings = nonCanceledMeetings.filter((m) => m.status === 'completed');
    const totalEligibleMeetings = completedMeetings.length;
    const totalAttended = attendanceRecords.filter((a) => a.userId === userId).length;
    const attendanceRate = totalEligibleMeetings > 0
      ? Math.min(100, Math.round((totalAttended / totalEligibleMeetings) * 100))
      : 100;

    // Calculate consecutive absences (counting backwards from most recent completed meeting)
    const completedMeetingsDesc = [...completedMeetings].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let consecutiveAbsences = 0;
    for (const m of completedMeetingsDesc) {
      if (!attendedMeetingIds.has(m.meetingId)) {
        consecutiveAbsences++;
      } else {
        break;
      }
    }

    // Calculate milestones
    let currentMilestone: StreakMilestone | null = null;
    let nextMilestone: StreakMilestone | null = null;

    for (let i = 0; i < STREAK_MILESTONES.length; i++) {
      if (currentStreak >= STREAK_MILESTONES[i].minStreak) {
        currentMilestone = STREAK_MILESTONES[i];
      } else {
        nextMilestone = STREAK_MILESTONES[i];
        break;
      }
    }

    let progressPercent = 0;
    let meetingsNeededForNext = 0;

    if (nextMilestone) {
      meetingsNeededForNext = Math.max(0, nextMilestone.minStreak - currentStreak);
      const prevMilestoneMin = currentMilestone ? currentMilestone.minStreak : 0;
      const range = nextMilestone.minStreak - prevMilestoneMin;
      const progressInRange = currentStreak - prevMilestoneMin;
      progressPercent = Math.min(100, Math.round((progressInRange / range) * 100));
    } else {
      progressPercent = 100;
      meetingsNeededForNext = 0;
    }

    // Build timeline slice for the last 6 meetings
    const sortedAll = [...meetings].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const recentSlice = sortedAll
      .filter((m) => m.status !== 'scheduled')
      .slice(-6);

    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

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

      const dateObj = new Date(m.date);
      const displayDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]}`;

      return {
        meetingId: m.meetingId,
        title: m.title,
        date: m.date,
        displayDate,
        status,
        note,
      };
    });

    // Determine flame level & message
    let flameLevel: StreakCalculationResult['flameLevel'] = 'none';
    let encouragementMessage = '';

    if (currentStreak >= 20) {
      flameLevel = 'super';
      encouragementMessage = 'أنت عمود من أعمدة الخدمة ونور مشجع لكل إخوتك! كمل ببركة ربنا 💎';
    } else if (currentStreak >= 10) {
      flameLevel = 'fire';
      encouragementMessage = 'عاش يا بطل! التزامك الذهبي نموذج حقيقي ومصدر فخر لاجتماعنا 🥇';
    } else if (currentStreak >= 5) {
      flameLevel = 'flame';
      encouragementMessage = 'استمرار رائع! واصل ثباتك ونموك الروحي، ربنا يبارك محبتك 🥈';
    } else if (currentStreak >= 3) {
      flameLevel = 'spark';
      encouragementMessage = 'شعلة الحماس منورة! ٣ أسابيع متتالية من البركة والشركة الروحية 🔥';
    } else if (currentStreak >= 1) {
      flameLevel = 'spark';
      encouragementMessage = 'بداية ممتازة! حضورك بيفرق وينور اجتماعنا، مستنيينك الأسبوع الجاي 🌱';
    } else {
      flameLevel = 'none';
      encouragementMessage = 'وحشتنا! كل أسبوع بداية جديدة للبركة، مستنيينك تنورنا في الاجتماع القادم ✨';
    }

    return {
      userId,
      currentStreak,
      bestStreak,
      consecutiveAbsences,
      totalAttended,
      totalEligibleMeetings,
      attendanceRate,
      currentMilestone,
      nextMilestone,
      progressPercent,
      meetingsNeededForNext,
      recentTimeline,
      encouragementMessage,
      flameLevel,
      mostRecentSequence,
      longestSequence,
      allSequences,
    };
  }

  /**
   * Fetches records from Firestore (or fallback) and calculates the user streak.
   */
  public async getUserStreak(userId: string): Promise<StreakCalculationResult> {
    const { meetings, attendance } = await this.fetchUserMeetingAttendance(userId);
    return this.calculateStreak(userId, meetings, attendance);
  }

  /**
   * Recalculates and synchronizes streak in both dataStore and Firestore.
   */
  public async syncUserStreak(userId: string): Promise<StreakCalculationResult> {
    const result = await this.getUserStreak(userId);

    // Update in local dataStore
    const user = dataStore.users.find((u) => u.userId === userId);
    if (user) {
      user.currentStreak = result.currentStreak;
      user.bestStreak = Math.max(user.bestStreak || 0, result.bestStreak);
      user.consecutiveAbsences = result.consecutiveAbsences;
    }

    // Persist to Firestore if available
    try {
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        currentStreak: result.currentStreak,
        bestStreak: Math.max(user?.bestStreak || 0, result.bestStreak),
        consecutiveAbsences: result.consecutiveAbsences,
      });
    } catch (err) {
      console.warn('[StreakService] Firestore sync user streak skipped:', err);
    }

    return result;
  }
}

export const streakService = StreakService.getInstance();

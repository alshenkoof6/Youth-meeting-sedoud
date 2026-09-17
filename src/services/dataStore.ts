import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { getFirebaseDb } from '../lib/firebase';
import {
  UserProfile,
  Meeting,
  Trip,
  TripBooking,
  ChurchEvent,
  Announcement,
  RewardItem,
  Voucher,
  Coupon,
  PointTransaction,
  RewardRedemption,
  AttendanceRecord,
  FollowUpRecord,
  MeetingFeedback,
  SpiritualReminder,
  SystemSettings,
  AuditLog,
  MysteryBoxConfig,
  MysteryBoxRedemptionRecord
} from '../types';
import { calculateYouthStreak, YouthStreakCalculation } from '../utils/streakCalculator';
import {
  INITIAL_USERS,
  INITIAL_MEETINGS,
  INITIAL_TRIPS,
  INITIAL_EVENTS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_REWARDS,
  INITIAL_ATTENDANCE,
  INITIAL_FOLLOWUPS,
  INITIAL_SETTINGS,
  INITIAL_MYSTERY_BOXES
} from '../lib/initialData';

// Local storage key prefixes for fallback / offline sync
const STORAGE_PREFIX = 'ym_platform_';

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function saveStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch (err) {
    console.error('Storage error:', err);
  }
}

export class DataStore {
  private static instance: DataStore;
  
  public users: UserProfile[] = [];
  public meetings: Meeting[] = [];
  public trips: Trip[] = [];
  public tripBookings: TripBooking[] = [];
  public events: ChurchEvent[] = [];
  public announcements: Announcement[] = [];
  public rewards: RewardItem[] = [];
  public coupons: Coupon[] = [];
  public vouchers: Voucher[] = [];
  public pointTransactions: PointTransaction[] = [];
  public rewardRedemptions: RewardRedemption[] = [];
  public attendance: AttendanceRecord[] = [];
  public followups: FollowUpRecord[] = [];
  public get followUps(): FollowUpRecord[] { return this.followups; }
  public feedback: MeetingFeedback[] = [];
  public reminders: SpiritualReminder[] = [];
  public settings: SystemSettings = INITIAL_SETTINGS;
  public mysteryBoxConfigs: MysteryBoxConfig[] = [];
  public mysteryBoxRedemptions: MysteryBoxRedemptionRecord[] = [];
  public auditLogs: AuditLog[] = [
    {
      logId: 'log_1',
      actorId: 'usr_admin',
      actorName: 'د. مينا إسحق',
      actorRole: 'admin',
      action: 'جدولة اجتماع شباب جديد',
      targetCollection: 'meetings',
      targetId: 'mtg_001',
      timestamp: '2026-09-11T18:30:00Z',
      details: { title: 'أهمية الصلاة الفردية في حياة الشاب' }
    },
    {
      logId: 'log_2',
      actorId: 'usr_admin',
      actorName: 'د. مينا إسحق',
      actorRole: 'admin',
      action: 'إضافة رحلة دير الأنبا أنطونيوس',
      targetCollection: 'trips',
      targetId: 'trip_001',
      timestamp: '2026-09-12T10:15:00Z',
      details: { capacity: 50, price: 180 }
    },
    {
      logId: 'log_3',
      actorId: 'usr_servant1',
      actorName: 'بيتر عادل',
      actorRole: 'servant',
      action: 'تسجيل افتقاد ومتابعة مخدوم',
      targetCollection: 'followups',
      targetId: 'fol_001',
      timestamp: '2026-09-12T19:40:00Z',
      details: { youth: 'مينا كمال غبريال', status: 'study' }
    }
  ];

  private listeners: Set<() => void> = new Set();
  private initialized = false;

  private constructor() {
    this.loadLocal();
    this.initFirestoreSync();
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public notify() {
    this.listeners.forEach((fn) => fn());
  }

  private loadLocal() {
    this.users = getStored('users', INITIAL_USERS);
    
    // Ensure all seed accounts from INITIAL_USERS exist in users with latest credentials and names
    let usersUpdated = false;
    for (const initUser of INITIAL_USERS) {
      const idx = this.users.findIndex((u) => u.userId === initUser.userId);
      if (idx === -1) {
        this.users.push(initUser);
        usersUpdated = true;
      } else {
        if (!this.users[idx].password && initUser.password) {
          this.users[idx].password = initUser.password;
          usersUpdated = true;
        }
        if (initUser.userId === 'admin_abouna_01' && this.users[idx].displayName !== initUser.displayName) {
          this.users[idx] = { ...this.users[idx], displayName: initUser.displayName };
          usersUpdated = true;
        }
        if (initUser.role === 'canteen_servant' && this.users[idx].role !== 'canteen_servant') {
          this.users[idx] = { ...this.users[idx], role: 'canteen_servant', displayName: initUser.displayName };
          usersUpdated = true;
        }
      }
    }
    if (usersUpdated) {
      saveStored('users', this.users);
    }

    this.meetings = getStored('meetings', INITIAL_MEETINGS);
    // Ensure meetings reflect updated priest name
    let meetingsUpdated = false;
    for (const m of this.meetings) {
      if (m.speaker && (m.speaker.includes('يوحنا مرقس') || m.speaker.includes('يوحنا'))) {
        m.speaker = 'أبونا مكسيموس يوسف';
        meetingsUpdated = true;
      }
    }
    if (meetingsUpdated) {
      saveStored('meetings', this.meetings);
    }
    this.trips = getStored('trips', INITIAL_TRIPS);
    this.tripBookings = getStored('tripBookings', []);
    this.events = getStored('events', INITIAL_EVENTS);
    this.announcements = getStored('announcements', INITIAL_ANNOUNCEMENTS);
    this.rewards = getStored('rewards', INITIAL_REWARDS);
    this.coupons = getStored('coupons', []);
    this.vouchers = getStored('vouchers', []);
    this.pointTransactions = getStored('pointTransactions', []);
    this.rewardRedemptions = getStored('rewardRedemptions', []);
    this.attendance = getStored('attendance', INITIAL_ATTENDANCE);
    this.followups = getStored('followups', INITIAL_FOLLOWUPS);
    this.feedback = getStored('feedback', []);
    this.reminders = getStored('reminders', []);
    this.settings = getStored('settings', INITIAL_SETTINGS);
    this.mysteryBoxConfigs = getStored('mysteryBoxConfigs', INITIAL_MYSTERY_BOXES);
    this.mysteryBoxRedemptions = getStored('mysteryBoxRedemptions', []);
    this.auditLogs = getStored('auditLogs', this.auditLogs);

    // Auto migrate existing legacy coupons into vouchers if needed
    if (this.coupons.length > 0 && this.vouchers.length === 0) {
      this.vouchers = this.coupons.map((c: any) => ({
        voucherId: c.couponId || c.voucherId,
        voucherCode: c.couponId ? c.couponId.replace('COUPON-', 'VC-') : 'VC-1001',
        qrToken: `vtok_${c.couponId || c.voucherId}`,
        userId: c.userId,
        userNameSnapshot: c.userName || 'مخدوم',
        rewardId: c.rewardId,
        rewardNameSnapshot: c.rewardTitle || 'مكافأة الكانتين',
        pointsCost: 100,
        issuedAt: c.issuedAt || new Date().toISOString(),
        expiresAt: c.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: c.status || 'available',
        redeemedAt: c.redeemedAt,
        createdAt: c.issuedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      saveStored('vouchers', this.vouchers);
    }
  }

  private saveAllLocal() {
    saveStored('users', this.users);
    saveStored('meetings', this.meetings);
    saveStored('trips', this.trips);
    saveStored('tripBookings', this.tripBookings);
    saveStored('events', this.events);
    saveStored('announcements', this.announcements);
    saveStored('rewards', this.rewards);
    saveStored('coupons', this.coupons);
    saveStored('vouchers', this.vouchers);
    saveStored('pointTransactions', this.pointTransactions);
    saveStored('rewardRedemptions', this.rewardRedemptions);
    saveStored('attendance', this.attendance);
    saveStored('followups', this.followups);
    saveStored('feedback', this.feedback);
    saveStored('reminders', this.reminders);
    saveStored('settings', this.settings);
    saveStored('mysteryBoxConfigs', this.mysteryBoxConfigs);
    saveStored('mysteryBoxRedemptions', this.mysteryBoxRedemptions);
    saveStored('auditLogs', this.auditLogs);
    this.notify();
  }

  // Firestore sync initialization
  private async initFirestoreSync() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const db = getFirebaseDb();

      // Seed initial data to Firestore if empty (safely ignored if offline or unauthenticated)
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        if (usersSnap.empty) {
          for (const user of INITIAL_USERS) {
            await setDoc(doc(db, 'users', user.userId), user);
          }
          for (const meeting of INITIAL_MEETINGS) {
            await setDoc(doc(db, 'meetings', meeting.meetingId), meeting);
          }
          for (const trip of INITIAL_TRIPS) {
            await setDoc(doc(db, 'trips', trip.tripId), trip);
          }
          for (const evt of INITIAL_EVENTS) {
            await setDoc(doc(db, 'events', evt.eventId), evt);
          }
          for (const anc of INITIAL_ANNOUNCEMENTS) {
            await setDoc(doc(db, 'announcements', anc.announcementId), anc);
          }
          for (const rew of INITIAL_REWARDS) {
            await setDoc(doc(db, 'rewards', rew.rewardId), rew);
          }
          for (const att of INITIAL_ATTENDANCE) {
            await setDoc(doc(db, 'attendance', att.attendanceId), att);
          }
          for (const fup of INITIAL_FOLLOWUPS) {
            await setDoc(doc(db, 'followups', fup.followupId), fup);
          }
          await setDoc(doc(db, 'settings', 'general'), INITIAL_SETTINGS);
        }

        // Ensure seed users exist in Firestore
        for (const initUser of INITIAL_USERS) {
          getDoc(doc(db, 'users', initUser.userId)).then((snap) => {
            if (!snap.exists()) {
              setDoc(doc(db, 'users', initUser.userId), initUser).catch(() => {});
            }
          }).catch(() => {});
        }
      } catch (seedErr: any) {
        // Fallback gracefully to offline cache if backend is temporarily unavailable or waiting for auth
        console.warn('[Firestore] Seed/connectivity notice (operating in offline/local cache mode):', seedErr?.message || seedErr);
      }

      // Safe snapshot listener helper with error callback to prevent unhandled Firestore errors
      const attachListener = (collectionName: string, onUpdate: (snap: any) => void) => {
        try {
          return onSnapshot(
            collection(db, collectionName),
            (snap) => {
              try {
                onUpdate(snap);
              } catch (e) {
                console.warn(`[Firestore] Error processing update for ${collectionName}:`, e);
              }
            },
            (error) => {
              // Critical: handle error without throwing unhandled exceptions when offline or connecting
              console.warn(`[Firestore] ${collectionName} listener status (${error.code}): Operating with cached data.`);
            }
          );
        } catch (e) {
          console.warn(`[Firestore] Could not attach listener for ${collectionName}:`, e);
          return () => {};
        }
      };

      // Set up real-time listener for users
      attachListener('users', (snap) => {
        if (!snap.empty) {
          const remoteUsers = snap.docs.map((d: any) => d.data() as UserProfile);
          // Preserve locally created users (like newly added servants or youth)
          // so incoming snapshots don't inadvertently wipe out locally stored users
          const mergedUsers = [...remoteUsers];
          for (const localUser of this.users) {
            const remoteIdx = mergedUsers.findIndex((u) => u.userId === localUser.userId);
            if (remoteIdx === -1) {
              mergedUsers.push(localUser);
              // Backfill local user to Firestore in background
              setDoc(doc(db, 'users', localUser.userId), localUser).catch(() => {});
            } else {
              // If remote user has missing credentials but local has them, preserve local credentials
              if (!mergedUsers[remoteIdx].password && localUser.password) {
                mergedUsers[remoteIdx].password = localUser.password;
              }
              if (!mergedUsers[remoteIdx].temporaryPassword && localUser.temporaryPassword) {
                mergedUsers[remoteIdx].temporaryPassword = localUser.temporaryPassword;
              }
            }
          }
          for (const initUser of INITIAL_USERS) {
            if (!mergedUsers.some((u) => u.userId === initUser.userId)) {
              mergedUsers.push(initUser);
              setDoc(doc(db, 'users', initUser.userId), initUser).catch(() => {});
            }
          }
          this.users = mergedUsers;
          saveStored('users', this.users);
          this.notify();
        }
      });

      // Meetings listener
      attachListener('meetings', (snap) => {
        if (!snap.empty) {
          this.meetings = snap.docs.map((d: any) => d.data() as Meeting);
          saveStored('meetings', this.meetings);
          this.notify();
        }
      });

      // Attendance listener
      attachListener('attendance', (snap) => {
        if (!snap.empty) {
          this.attendance = snap.docs.map((d: any) => d.data() as AttendanceRecord);
          saveStored('attendance', this.attendance);
          this.notify();
        }
      });

      // Follow-ups listener
      attachListener('followups', (snap) => {
        if (!snap.empty) {
          this.followups = snap.docs.map((d: any) => d.data() as FollowUpRecord);
          saveStored('followups', this.followups);
          this.notify();
        }
      });

      // Trips listener
      attachListener('trips', (snap) => {
        if (!snap.empty) {
          this.trips = snap.docs.map((d: any) => d.data() as Trip);
          saveStored('trips', this.trips);
          this.notify();
        }
      });

      // Trip bookings listener
      attachListener('tripBookings', (snap) => {
        if (!snap.empty) {
          this.tripBookings = snap.docs.map((d: any) => d.data() as TripBooking);
          saveStored('tripBookings', this.tripBookings);
          this.notify();
        }
      });

      // Announcements listener
      attachListener('announcements', (snap) => {
        if (!snap.empty) {
          this.announcements = snap.docs.map((d: any) => d.data() as Announcement);
          saveStored('announcements', this.announcements);
          this.notify();
        }
      });

      // Rewards listener
      attachListener('rewards', (snap) => {
        if (!snap.empty) {
          this.rewards = snap.docs.map((d: any) => d.data() as RewardItem);
          saveStored('rewards', this.rewards);
          this.notify();
        }
      });

      // Coupons listener
      attachListener('coupons', (snap) => {
        if (!snap.empty) {
          this.coupons = snap.docs.map((d: any) => d.data() as Coupon);
          saveStored('coupons', this.coupons);
          this.notify();
        }
      });

      // Vouchers listener
      attachListener('vouchers', (snap) => {
        if (!snap.empty) {
          this.vouchers = snap.docs.map((d: any) => d.data() as Voucher);
          saveStored('vouchers', this.vouchers);
          this.notify();
        }
      });

      // Point Transactions listener
      attachListener('pointTransactions', (snap) => {
        if (!snap.empty) {
          this.pointTransactions = snap.docs.map((d: any) => d.data() as PointTransaction);
          saveStored('pointTransactions', this.pointTransactions);
          this.notify();
        }
      });

      // Feedback listener
      attachListener('feedback', (snap) => {
        if (!snap.empty) {
          this.feedback = snap.docs.map((d: any) => d.data() as MeetingFeedback);
          saveStored('feedback', this.feedback);
          this.notify();
        }
      });

      // Audit logs listener
      attachListener('auditLogs', (snap) => {
        if (!snap.empty) {
          this.auditLogs = snap.docs.map((d: any) => d.data() as AuditLog);
          saveStored('auditLogs', this.auditLogs);
          this.notify();
        }
      });

      // Mystery Box Configs listener
      attachListener('mysteryBoxConfigs', (snap) => {
        if (!snap.empty) {
          this.mysteryBoxConfigs = snap.docs.map((d: any) => d.data() as MysteryBoxConfig);
          saveStored('mysteryBoxConfigs', this.mysteryBoxConfigs);
          this.notify();
        }
      });

      // Mystery Box Redemptions listener
      attachListener('mysteryBoxRedemptions', (snap) => {
        if (!snap.empty) {
          this.mysteryBoxRedemptions = snap.docs.map((d: any) => d.data() as MysteryBoxRedemptionRecord);
          saveStored('mysteryBoxRedemptions', this.mysteryBoxRedemptions);
          this.notify();
        }
      });

    } catch (err) {
      console.warn('Firestore initial sync notice: Operating in high-speed local mode with background persistence', err);
    }
  }

  // User methods
  public async updateUser(user: UserProfile): Promise<void> {
    const idx = this.users.findIndex((u) => u.userId === user.userId);
    if (idx >= 0) {
      this.users[idx] = { ...user, updatedAt: new Date().toISOString() };
    } else {
      this.users.push(user);
    }
    this.saveAllLocal();

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'users', user.userId), user, { merge: true });
    } catch (e) {
      console.warn('Sync updateUser to Firestore:', e);
    }
  }

  // Attendance check-in with streak update and points ledger
  public async recordAttendance(
    userId: string,
    meetingId: string,
    method: 'qr_scan' | 'manual_admin' | 'manual_servant' = 'qr_scan',
    verifiedBy?: string
  ): Promise<{ success: boolean; message: string; pointsAwarded: number; streak: number }> {
    const meeting = this.meetings.find((m) => m.meetingId === meetingId);
    if (!meeting) {
      return { success: false, message: 'الاجتماع غير موجود.', pointsAwarded: 0, streak: 0 };
    }

    const attendanceId = `${meetingId}_${userId}`;
    const alreadyAttended = this.attendance.some((a) => a.attendanceId === attendanceId);
    if (alreadyAttended) {
      return { success: false, message: 'لقد تم تسجيل حضورك في هذا الاجتماع مسبقاً ✓', pointsAwarded: 0, streak: 0 };
    }

    const user = this.users.find((u) => u.userId === userId);
    if (!user) {
      return { success: false, message: 'ملف المستخدم غير موجود.', pointsAwarded: 0, streak: 0 };
    }

    const points = meeting.pointsAwarded || 10;

    const record: AttendanceRecord = {
      attendanceId,
      meetingId,
      meetingTitle: meeting.title,
      meetingDate: meeting.date,
      userId,
      userCode: user.userCode,
      userName: user.displayName,
      timestamp: new Date().toISOString(),
      method,
      verifiedBy,
      pointsAwarded: points,
    };

    this.attendance.push(record);

    // Calculate dynamic streak and best streak using meeting-based logic
    const streakResult = calculateYouthStreak(userId, this.meetings, this.attendance);
    const newStreak = streakResult.currentStreak;
    const bestStreak = Math.max(user.bestStreak || 0, streakResult.bestStreak, newStreak);

    // Update user stats
    user.totalAttendances = (user.totalAttendances || 0) + 1;
    user.currentStreak = newStreak;
    user.bestStreak = bestStreak;
    user.totalPoints = (user.totalPoints || 0) + points;
    user.lastAttendedAt = meeting.date;
    user.consecutiveAbsences = 0;
    user.followUpStatus = 'regular';
    user.updatedAt = new Date().toISOString();

    // Increment meeting attendance count
    meeting.attendanceCount = (meeting.attendanceCount || 0) + 1;

    // Record point ledger transaction
    const attendanceTxId = `ptx_att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const attendanceTx: PointTransaction = {
      transactionId: attendanceTxId,
      userId,
      type: 'attendance',
      sourceId: meetingId,
      referenceId: meeting.title,
      points,
      description: `حضور اجتماع: ${meeting.title} (${meeting.date})`,
      createdAt: new Date().toISOString(),
      createdBy: verifiedBy || userId
    };
    this.pointTransactions.unshift(attendanceTx);

    this.saveAllLocal();

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'attendance', attendanceId), record);
      await setDoc(doc(db, 'users', userId), user, { merge: true });
      await updateDoc(doc(db, 'meetings', meetingId), { attendanceCount: meeting.attendanceCount });
      await setDoc(doc(db, 'pointTransactions', attendanceTxId), attendanceTx);
    } catch (e) {
      console.warn('Sync recordAttendance to Firestore:', e);
    }

    return {
      success: true,
      message: 'تم تسجيل حضورك بنجاح ✓',
      pointsAwarded: points,
      streak: newStreak,
    };
  }

  // Meetings CRUD
  public async saveMeeting(meeting: Meeting): Promise<void> {
    const idx = this.meetings.findIndex((m) => m.meetingId === meeting.meetingId);
    if (idx >= 0) {
      this.meetings[idx] = meeting;
    } else {
      this.meetings.unshift(meeting);
    }
    this.saveAllLocal();

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'meetings', meeting.meetingId), meeting);
    } catch (e) {
      console.warn('Sync meeting to Firestore:', e);
    }
  }

  public async deleteMeeting(meetingId: string): Promise<void> {
    this.meetings = this.meetings.filter((m) => m.meetingId !== meetingId);
    this.saveAllLocal();

    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'meetings', meetingId));
    } catch (e) {
      console.warn('Sync delete meeting to Firestore:', e);
    }
  }

  // Follow-up logging
  public async addFollowUp(record: FollowUpRecord): Promise<void> {
    this.followups.unshift(record);

    // Update youth follow-up status if contacted
    const youth = this.users.find((u) => u.userId === record.youthId);
    if (youth) {
      // Mark next follow-up date
      youth.updatedAt = new Date().toISOString();
      if (record.status === 'contacted') {
        // If contacted, maintain or soften status
        if (youth.followUpStatus === 'urgent') {
          youth.followUpStatus = 'needs_followup';
        }
      }
    }

    this.saveAllLocal();

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'followups', record.followupId), record);
      if (youth) {
        await setDoc(doc(db, 'users', youth.userId), youth, { merge: true });
      }
    } catch (e) {
      console.warn('Sync follow-up to Firestore:', e);
    }
  }

  // Assign youth to servant
  public async assignServant(youthId: string, servantId: string, servantName: string): Promise<void> {
    const youth = this.users.find((u) => u.userId === youthId);
    if (youth) {
      youth.assignedServantId = servantId;
      youth.assignedServantName = servantName;
      youth.updatedAt = new Date().toISOString();
      this.saveAllLocal();

      try {
        const db = getFirebaseDb();
        await updateDoc(doc(db, 'users', youthId), {
          assignedServantId: servantId,
          assignedServantName: servantName,
        });
      } catch (e) {
        console.warn('Sync servant assignment to Firestore:', e);
      }
    }
  }

  // Trip booking
  public async bookTrip(tripId: string, user: UserProfile): Promise<{ success: boolean; message: string }> {
    const trip = this.trips.find((t) => t.tripId === tripId);
    if (!trip) return { success: false, message: 'الرحلة غير موجودة' };

    const existingBooking = this.tripBookings.find(
      (b) => b.tripId === tripId && b.userId === user.userId && b.status !== 'cancelled'
    );
    if (existingBooking) {
      return { success: false, message: 'أنت مسجل بالفعل في هذه الرحلة' };
    }

    const isFull = trip.bookedSeatsCount >= trip.capacity;
    const status = isFull ? 'waitlist' : 'pending';

    const booking: TripBooking = {
      bookingId: `book_${Date.now()}_${user.userId}`,
      tripId,
      tripTitle: trip.title,
      tripDate: trip.date,
      userId: user.userId,
      userCode: user.userCode,
      userName: user.displayName,
      userPhone: user.phoneNumber,
      status,
      paid: false,
      bookedAt: new Date().toISOString(),
    };

    if (!isFull) {
      trip.bookedSeatsCount += 1;
    }

    this.tripBookings.push(booking);
    this.saveAllLocal();

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'tripBookings', booking.bookingId), booking);
      await updateDoc(doc(db, 'trips', tripId), { bookedSeatsCount: trip.bookedSeatsCount });
    } catch (e) {
      console.warn('Sync booking to Firestore:', e);
    }

    return {
      success: true,
      message: isFull
        ? 'تمت إضافتك إلى قائمة الانتظار نظراً لاكتمال المقاعد ✓'
        : 'تم تأكيد حجز مقعدك بنجاح! برجاء التواصل مع مسؤول الحجز لدفع الاشتراك ✓',
    };
  }

  // Redeem reward
  public async redeemReward(rewardId: string, user: UserProfile): Promise<{ success: boolean; message: string; coupon?: Coupon }> {
    const reward = this.rewards.find((r) => r.rewardId === rewardId);
    if (!reward) return { success: false, message: 'المكافأة غير متوفرة' };

    if (user.totalPoints < reward.requiredPoints) {
      return { success: false, message: `نقاطك غير كافية. تحتاج إلى ${reward.requiredPoints} نقطة` };
    }

    if (reward.availableQuantity <= 0) {
      return { success: false, message: 'عفواً نفدت كمية هذه المكافأة حالياً' };
    }

    // Deduct points
    user.totalPoints -= reward.requiredPoints;
    reward.availableQuantity -= 1;

    const couponId = `COUPON-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const coupon: Coupon = {
      couponId,
      rewardId: reward.rewardId,
      rewardTitle: reward.title,
      userId: user.userId,
      userName: user.displayName,
      status: 'available',
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    this.coupons.unshift(coupon);
    this.saveAllLocal();

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'coupons', couponId), coupon);
      await setDoc(doc(db, 'users', user.userId), user, { merge: true });
      await updateDoc(doc(db, 'rewards', rewardId), { availableQuantity: reward.availableQuantity });
    } catch (e) {
      console.warn('Sync coupon redemption to Firestore:', e);
    }

    return {
      success: true,
      message: `مبروك! تم استبدال الكوبون بنجاح: ${couponId}`,
      coupon,
    };
  }

  // Redeem Coupon (by Admin or Canteen Servant)
  public async redeemCoupon(couponId: string): Promise<boolean> {
    const coupon = this.coupons.find((c) => c.couponId.toUpperCase() === couponId.toUpperCase());
    if (!coupon) return false;
    coupon.status = 'redeemed';
    coupon.redeemedAt = new Date().toISOString();
    this.saveAllLocal();
    try {
      const db = getFirebaseDb();
      await updateDoc(doc(db, 'coupons', coupon.couponId), {
        status: 'redeemed',
        redeemedAt: coupon.redeemedAt,
      });
    } catch (e) {
      console.warn('Sync redeem coupon to Firestore:', e);
    }
    return true;
  }

  // Submit Feedback
  public async submitFeedback(feedbackItem: MeetingFeedback): Promise<void> {
    this.feedback.unshift(feedbackItem);
    this.saveAllLocal();

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'feedback', feedbackItem.feedbackId), feedbackItem);
    } catch (e) {
      console.warn('Sync feedback to Firestore:', e);
    }
  }

  // Save Reminders
  public async saveReminder(reminder: SpiritualReminder): Promise<void> {
    const idx = this.reminders.findIndex((r) => r.reminderId === reminder.reminderId);
    if (idx >= 0) {
      this.reminders[idx] = reminder;
    } else {
      this.reminders.push(reminder);
    }
    this.saveAllLocal();

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'reminders', reminder.reminderId), reminder);
    } catch (e) {
      console.warn('Sync reminder to Firestore:', e);
    }
  }

  public async deleteReminder(reminderId: string): Promise<void> {
    this.reminders = this.reminders.filter((r) => r.reminderId !== reminderId);
    this.saveAllLocal();

    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'reminders', reminderId));
    } catch (e) {
      console.warn('Sync delete reminder to Firestore:', e);
    }
  }

  // Convenience methods
  public async saveVoucher(voucher: Voucher): Promise<void> {
    const idx = this.vouchers.findIndex((v) => v.voucherId === voucher.voucherId);
    if (idx >= 0) {
      this.vouchers[idx] = voucher;
    } else {
      this.vouchers.unshift(voucher);
    }
    this.saveAllLocal();

    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'vouchers', voucher.voucherId), voucher);
    } catch (e) {
      console.warn('Sync voucher to Firestore:', e);
    }
  }

  public async createVoucher(voucher: Voucher): Promise<void> {
    return this.saveVoucher(voucher);
  }

  public async createMeeting(meeting: Meeting): Promise<void> {
    return this.saveMeeting(meeting);
  }

  public async updateMeeting(meeting: Meeting): Promise<void> {
    return this.saveMeeting(meeting);
  }

  public async createAnnouncement(announcement: Announcement): Promise<void> {
    this.announcements.unshift(announcement);
    this.saveAllLocal();
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'announcements', announcement.announcementId), announcement);
    } catch (e) {
      console.warn('Sync create announcement:', e);
    }
  }

  public async deleteAnnouncement(announcementId: string): Promise<void> {
    this.announcements = this.announcements.filter((a) => a.announcementId !== announcementId);
    this.saveAllLocal();
    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'announcements', announcementId));
    } catch (e) {
      console.warn('Sync delete announcement:', e);
    }
  }

  public async createTrip(trip: Trip): Promise<void> {
    this.trips.unshift(trip);
    this.saveAllLocal();
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'trips', trip.tripId), trip);
    } catch (e) {
      console.warn('Sync create trip:', e);
    }
  }

  public async saveEvent(event: ChurchEvent): Promise<void> {
    const idx = this.events.findIndex((e) => e.eventId === event.eventId);
    if (idx >= 0) {
      this.events[idx] = event;
    } else {
      this.events.unshift(event);
    }
    this.saveAllLocal();
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'events', event.eventId), event);
    } catch (e) {
      console.warn('Sync save event:', e);
    }
  }

  public async createEvent(event: ChurchEvent): Promise<void> {
    return this.saveEvent(event);
  }

  public async deleteEvent(eventId: string): Promise<void> {
    this.events = this.events.filter((e) => e.eventId !== eventId);
    this.saveAllLocal();
    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'events', eventId));
    } catch (e) {
      console.warn('Sync delete event:', e);
    }
  }

  public async createReward(reward: RewardItem): Promise<void> {
    this.rewards.unshift(reward);
    this.saveAllLocal();
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'rewards', reward.rewardId), reward);
    } catch (e) {
      console.warn('Sync create reward:', e);
    }
  }

  public async updateReward(reward: RewardItem): Promise<void> {
    const idx = this.rewards.findIndex((r) => r.rewardId === reward.rewardId);
    if (idx >= 0) {
      this.rewards[idx] = { ...reward, updatedAt: new Date().toISOString() };
    } else {
      this.rewards.unshift(reward);
    }
    this.saveAllLocal();
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'rewards', reward.rewardId), reward, { merge: true });
    } catch (e) {
      console.warn('Sync update reward:', e);
    }
  }

  public async deleteReward(rewardId: string): Promise<void> {
    this.rewards = this.rewards.filter((r) => r.rewardId !== rewardId);
    this.saveAllLocal();
    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, 'rewards', rewardId));
    } catch (e) {
      console.warn('Sync delete reward:', e);
    }
  }

  public async addPointTransaction(tx: PointTransaction): Promise<void> {
    this.pointTransactions.unshift(tx);
    this.saveAllLocal();
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'pointTransactions', tx.transactionId), tx);
    } catch (e) {
      console.warn('Sync point transaction:', e);
    }
  }

  public async logFollowUp(record: FollowUpRecord): Promise<void> {
    return this.addFollowUp(record);
  }

  public async updateSettings(newSettings: SystemSettings): Promise<void> {
    this.settings = newSettings;
    saveStored('settings', this.settings);
    this.notify();
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'settings', 'general'), newSettings);
    } catch (e) {
      console.warn('Sync settings:', e);
    }
  }

  public getYouthStreak(userId: string): YouthStreakCalculation {
    return calculateYouthStreak(userId, this.meetings, this.attendance);
  }

  public async logAudit(entry: Omit<AuditLog, 'logId' | 'timestamp'>): Promise<void> {
    const fullLog: AuditLog = {
      ...entry,
      logId: `log_${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(fullLog);
    this.notify();
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'auditLogs', fullLog.logId), fullLog);
    } catch (e) {
      console.warn('Sync audit log:', e);
    }
  }

  public getMysteryBoxConfig(boxId: 'points_box' | 'birthday_box'): MysteryBoxConfig | undefined {
    return this.mysteryBoxConfigs.find((b) => b.boxId === boxId);
  }

  public async saveMysteryBoxConfig(config: MysteryBoxConfig): Promise<void> {
    const idx = this.mysteryBoxConfigs.findIndex((b) => b.boxId === config.boxId);
    const updated = { ...config, updatedAt: new Date().toISOString() };
    if (idx !== -1) {
      this.mysteryBoxConfigs[idx] = updated;
    } else {
      this.mysteryBoxConfigs.push(updated);
    }
    saveStored('mysteryBoxConfigs', this.mysteryBoxConfigs);
    this.notify();
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'mysteryBoxConfigs', config.boxId), updated);
    } catch (e) {
      console.warn('Sync mystery box config error:', e);
    }
  }

  public async recordMysteryBoxRedemption(rec: MysteryBoxRedemptionRecord): Promise<void> {
    this.mysteryBoxRedemptions.unshift(rec);
    saveStored('mysteryBoxRedemptions', this.mysteryBoxRedemptions);
    this.notify();
    try {
      const db = getFirebaseDb();
      await setDoc(doc(db, 'mysteryBoxRedemptions', rec.redemptionId), rec);
    } catch (e) {
      console.warn('Sync mystery box redemption error:', e);
    }
  }
}

export const dataStore = DataStore.getInstance();

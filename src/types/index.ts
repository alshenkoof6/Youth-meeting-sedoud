export type UserRole = 'youth' | 'servant' | 'admin' | 'supervisor' | 'canteen_servant';

export type FollowUpStatus = 'regular' | 'irregular' | 'needs_followup' | 'urgent';
export type FollowUpType = FollowUpStatus;

export type EducationStage = 'middle_school' | 'secondary' | 'university' | 'graduate' | 'high_school' | 'graduated';

export type ScheduleDay = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri';
export type ScheduleActivity = 'study' | 'work' | 'available' | 'other';

export interface UserProfile {
  userId: string;
  userCode: string; // e.g. YT_000123
  displayName: string;
  nickname?: string;
  phoneNumber: string;
  whatsappNumber?: string;
  role: UserRole;
  gender: 'male' | 'female';
  birthDate?: string;
  educationStage: EducationStage;
  faculty?: string;
  academicYear?: string;
  jobTitle?: string;
  workplace?: string;
  scheduleType: 'regular' | 'variable';
  weeklySchedule: Record<ScheduleDay, ScheduleActivity>;
  assignedServantId?: string;
  assignedServantName?: string;
  totalAttendances: number;
  currentStreak: number;
  bestStreak: number;
  totalPoints: number;
  lastAttendedAt?: string;
  lastAttendedMeetingDate?: string;
  consecutiveAbsences: number;
  followUpStatus: FollowUpStatus;
  password?: string;
  temporaryPassword?: string;
  mustChangePassword?: boolean;
  passwordChangedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  meetingId: string;
  title: string;
  description: string;
  speaker?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  status: 'scheduled' | 'active' | 'completed' | 'canceled';
  qrSecretToken: string;
  qrValidFrom: string;
  qrValidUntil: string;
  qrExpiryMinutes?: number;
  attendanceCount: number;
  pointsAwarded: number;
  createdBy: string;
  createdAt: string;
}

export interface AttendanceRecord {
  attendanceId: string; // ${meetingId}_${userId}
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  userId: string;
  userCode: string;
  userName: string;
  timestamp: string;
  method: 'qr_scan' | 'manual_admin' | 'manual_servant';
  verifiedBy?: string;
  verifiedByServantName?: string;
  pointsAwarded: number;
  pointsEarned?: number;
}

export interface FollowUpRecord {
  followupId: string;
  recordId?: string;
  userId?: string;
  userName?: string;
  youthId?: string;
  youthName?: string;
  youthCode?: string;
  servantId: string;
  servantName: string;
  date: string;
  contactMethod?: 'phone' | 'whatsapp' | 'in_person' | 'other';
  status?: 'contacted' | 'no_answer' | 'traveling' | 'study' | 'work' | 'family' | 'health' | 'other';
  type?: any;
  outcome?: any;
  notes?: string;
  generalNotes?: string;
  nextFollowupDate?: string;
  isConfidential?: boolean;
  createdAt?: string;
}

export interface Trip {
  tripId: string;
  title: string;
  description: string;
  imageUrl?: string;
  date: string;
  time: string;
  meetingPoint: string;
  destinations: string[];
  price: number;
  capacity: number;
  bookedSeatsCount: number;
  bookingDeadline?: string;
  coordinatorName: string;
  coordinatorWhatsapp: string;
  status: 'open' | 'closed' | 'completed' | 'canceled';
  createdAt: string;
}

export interface TripBooking {
  bookingId: string;
  tripId: string;
  tripTitle: string;
  tripDate: string;
  userId: string;
  userCode: string;
  userName: string;
  userPhone: string;
  phoneNumber?: string;
  status: 'pending' | 'confirmed' | 'waitlist' | 'cancelled';
  paid: boolean;
  bookedAt: string;
  confirmedAt?: string;
  confirmedBy?: string;
  updatedAt?: string;
}

export interface ChurchEvent {
  eventId: string;
  title: string;
  type: 'spiritual_day' | 'conference' | 'retreat' | 'sports' | 'competition' | 'special_meeting';
  description: string;
  imageUrl?: string;
  date: string;
  time: string;
  location: string;
  price: number;
  capacity?: number;
  registrationRequired: boolean;
  registrationDeadline?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'canceled';
  createdAt: string;
}

export interface Announcement {
  announcementId: string;
  title: string;
  body: string;
  imageUrl?: string;
  priority: 'normal' | 'important' | 'urgent';
  publishedAt?: string;
  createdAt?: string;
  expiresAt: string;
  status: 'active' | 'archived';
  createdBy?: string;
}

export interface PointTransaction {
  transactionId: string;
  userId: string;
  type: 'attendance' | 'event' | 'competition' | 'reward_redemption' | 'redemption' | 'manual_adjustment' | 'refund';
  sourceId?: string;
  points: number; // positive or negative
  description: string;
  referenceId?: string;
  reversalOf?: string;
  createdAt: string;
  createdBy: string;
}

export interface RewardItem {
  rewardId: string;
  title: string;
  description: string;
  requiredPoints: number;
  availableQuantity: number;
  active?: boolean;
  status?: 'draft' | 'active' | 'inactive' | 'out_of_stock' | 'archived';
  category?: string;
  imageUrl?: string;
  expiryDaysRule?: number; // e.g. 7, 30, or undefined (no expiry)
  totalRedeemedCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Voucher {
  voucherId: string;
  voucherCode: string; // e.g. "VC-8924K"
  qrToken: string; // Secure random token without PII
  userId: string;
  userNameSnapshot: string;
  rewardId: string;
  rewardNameSnapshot: string;
  pointsCost: number;
  issuedAt: string;
  expiresAt: string;
  status: 'available' | 'redeemed' | 'expired' | 'cancelled';
  redeemedAt?: string;
  redeemedBy?: string; // Canteen Servant user ID
  redeemedByName?: string;
  redemptionLocation?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RewardRedemption {
  redemptionId: string;
  voucherId: string;
  voucherCode: string;
  rewardId: string;
  rewardNameSnapshot: string;
  userId: string;
  userNameSnapshot: string;
  pointsCost: number;
  redeemedBy: string;
  redeemedByName?: string;
  redeemedAt: string;
  status: 'success' | 'cancelled';
}

export interface Coupon {
  couponId: string;
  rewardId: string;
  rewardTitle: string;
  userId: string;
  userName: string;
  status: 'available' | 'redeemed' | 'expired';
  issuedAt: string;
  expiresAt: string;
  redeemedAt?: string;
  redeemedBy?: string;
}

export interface MeetingFeedback {
  feedbackId: string;
  meetingId: string;
  meetingTitle: string;
  rating: number; // 1-5
  likedAspects?: string;
  improvements?: string;
  suggestions?: string;
  isAnonymous: boolean;
  userId?: string;
  userName?: string;
  submittedAt: string;
}

export interface SpiritualReminder {
  reminderId: string;
  userId: string;
  title: string;
  frequencyDays: number;
  lastCompletedDate: string;
  nextDueDate: string;
  notes?: string;
  createdAt: string;
}

export interface SystemSettings {
  followUpThresholds: {
    yellowAbsences: number; // 2
    orangeAbsences: number; // 3
    redAbsences: number; // 4
  };
  pointRules: {
    meetingAttendance: number; // 10
    spiritualDay: number; // 20
    conference: number; // 30
    activity: number; // 20
  };
  ageGroups: Array<{ id: string; nameAr: string }>;
}

export interface AuditLog {
  logId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetCollection: string;
  targetId: string;
  timestamp: string;
  details?: Record<string, any>;
}

import { Meeting, ChurchEvent, Trip, UserProfile, GeneralEvent } from '../types';
import { CalendarEvent, UnifiedEventType } from '../types/calendar';

export function mapMeetingToCalendarEvent(meeting: Meeting): CalendarEvent {
  return {
    id: `meeting_${meeting.meetingId}`,
    type: 'meeting',
    sourceType: 'meeting',
    eventType: 'meeting',
    sourceId: meeting.meetingId,
    title: meeting.title || 'اجتماع الشباب الأسبوعي',
    description: meeting.description || (meeting.topic ? `الموضوع: ${meeting.topic}${meeting.speaker ? ` - المتكلم: ${meeting.speaker}` : ''}` : meeting.notes),
    startDate: meeting.date,
    endDate: meeting.date,
    date: meeting.date,
    startTime: meeting.startTime || '19:30',
    endTime: meeting.endTime || '21:30',
    location: meeting.location || 'قاعة الاجتماعات الكبرى',
    createdBy: meeting.createdBy || 'admin',
    createdAt: meeting.createdAt || new Date().toISOString(),
    targetStages: meeting.targetStages || 'all',
    targetAudienceLabel: getTargetAudienceLabel(meeting.targetStages),
    speakerOrLeader: meeting.speaker,
    status: meeting.status === 'canceled' ? 'cancelled' : meeting.status === 'completed' ? 'completed' : 'upcoming',
    requiresRegistration: false,
  };
}

export function mapChurchEventToCalendarEvent(event: ChurchEvent): CalendarEvent {
  const capacity = event.capacity || 0;
  const booked = event.registeredCount || 0;
  const available = capacity > 0 ? Math.max(0, capacity - booked) : undefined;

  return {
    id: `activity_${event.eventId}`,
    type: 'activity',
    sourceType: 'event',
    eventType: 'activity',
    sourceId: event.eventId,
    title: event.title,
    description: event.description,
    startDate: event.date,
    endDate: event.date,
    date: event.date,
    startTime: event.time || '18:00',
    endTime: event.time ? `${parseInt(event.time.slice(0, 2)) + 2 || 20}:00` : '20:00',
    location: event.location || 'مبنى الخدمات',
    createdBy: event.createdAt ? 'admin' : 'admin',
    createdAt: event.createdAt || new Date().toISOString(),
    targetStages: event.targetStages || 'all',
    targetAudienceLabel: getTargetAudienceLabel(event.targetStages),
    capacity: capacity > 0 ? capacity : undefined,
    bookedCount: booked,
    availableSeats: available,
    speakerOrLeader: event.speaker,
    price: event.price,
    status: event.status === 'canceled' ? 'cancelled' : event.status === 'completed' ? 'completed' : 'upcoming',
    requiresRegistration: !!event.capacity,
  };
}

export function mapTripToCalendarEvent(trip: Trip): CalendarEvent {
  const capacity = trip.capacity || 50;
  const booked = trip.bookedSeatsCount || 0;
  const available = Math.max(0, capacity - booked);
  const destStr = trip.destination || (trip.destinations && trip.destinations.join(' - ')) || 'وجهة الرحلة';

  return {
    id: `trip_${trip.tripId}`,
    type: 'trip',
    sourceType: 'trip',
    eventType: 'trip',
    sourceId: trip.tripId,
    title: trip.title,
    description: trip.description || `رحلة إلى ${destStr}`,
    startDate: trip.date,
    endDate: trip.returnDate || trip.date,
    date: trip.date,
    startTime: trip.departureTime || trip.time || '07:00',
    endTime: trip.returnTime || '21:00',
    location: `${destStr} (التجمع: ${trip.meetingPoint || 'الكنيسة'})`,
    createdBy: 'admin',
    createdAt: trip.createdAt || new Date().toISOString(),
    targetStages: trip.targetStages || 'all',
    targetAudienceLabel: getTargetAudienceLabel(trip.targetStages),
    capacity,
    bookedCount: booked,
    availableSeats: available,
    price: trip.price,
    contactName: trip.coordinatorName,
    contactPhone: trip.coordinatorWhatsapp,
    status: trip.status === 'canceled' ? 'cancelled' : trip.status === 'completed' ? 'completed' : 'upcoming',
    requiresRegistration: true,
  };
}

export function mapGeneralEventToCalendarEvent(gen: GeneralEvent): CalendarEvent {
  return {
    id: `general_${gen.id}`,
    type: 'general',
    sourceType: 'general',
    eventType: 'general',
    sourceId: gen.id,
    title: gen.title,
    description: gen.description,
    startDate: gen.startDate,
    endDate: gen.endDate || gen.startDate,
    date: gen.startDate,
    startTime: gen.startTime || '18:00',
    endTime: gen.endTime || '20:00',
    location: gen.location || 'الكنيسة',
    createdBy: gen.createdBy || 'admin',
    createdAt: gen.createdAt || new Date().toISOString(),
    updatedAt: gen.updatedAt,
    targetStages: (gen.targetStages as any) || 'all',
    targetAudienceLabel: getTargetAudienceLabel(gen.targetStages as any),
    status: gen.status || 'upcoming',
    requiresRegistration: false,
  };
}

export function getTargetAudienceLabel(targetStages?: string[] | 'all'): string {
  if (!targetStages || targetStages === 'all' || (Array.isArray(targetStages) && targetStages.length === 0)) {
    return 'متاح لجميع مراحل الشباب';
  }
  const stageLabels: Record<string, string> = {
    middle_school: 'إعدادي',
    prep: 'إعدادي',
    secondary: 'ثانوي',
    high_school: 'ثانوي',
    sec: 'ثانوي',
    university: 'جامعيين',
    univ: 'جامعيين',
    graduate: 'خريجين',
    graduated: 'خريجين',
    grad: 'خريجين',
  };
  return targetStages.map((s) => stageLabels[s] || s).join(' • ');
}

export function isEventVisibleToUser(event: CalendarEvent, user: UserProfile | null): boolean {
  if (!user) return true;
  // Admins, servants, and canteen servants can see all calendar events
  if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'servant' || user.role === 'canteen_servant') {
    return true;
  }
  // For youth, filter by stage if defined
  if (user.role === 'youth') {
    if (!event.targetStages || event.targetStages === 'all') {
      return true;
    }
    if (Array.isArray(event.targetStages) && user.educationStage) {
      return event.targetStages.includes(user.educationStage);
    }
  }
  return true;
}

export function getUnifiedEvents(
  meetings: Meeting[] = [],
  events: ChurchEvent[] = [],
  trips: Trip[] = [],
  generalEventsOrUser?: GeneralEvent[] | UserProfile | null,
  userProfile?: UserProfile | null
): CalendarEvent[] {
  let generalEvents: GeneralEvent[] = [];
  let user: UserProfile | null = null;

  if (Array.isArray(generalEventsOrUser)) {
    generalEvents = generalEventsOrUser;
    user = userProfile || null;
  } else if (
    generalEventsOrUser &&
    typeof generalEventsOrUser === 'object' &&
    ('userId' in generalEventsOrUser || 'role' in generalEventsOrUser)
  ) {
    user = generalEventsOrUser as UserProfile;
    generalEvents = [];
  } else {
    user = userProfile || null;
  }

  const safeMeetings = Array.isArray(meetings) ? meetings : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const safeTrips = Array.isArray(trips) ? trips : [];
  const safeGeneralEvents = Array.isArray(generalEvents) ? generalEvents : [];

  const unified: CalendarEvent[] = [
    ...safeMeetings.map(mapMeetingToCalendarEvent),
    ...safeEvents.map(mapChurchEventToCalendarEvent),
    ...safeTrips.map(mapTripToCalendarEvent),
    ...safeGeneralEvents.map(mapGeneralEventToCalendarEvent),
  ];

  // Filter based on user role and target audience
  const filtered = unified.filter((e) => isEventVisibleToUser(e, user));

  // Sort by date and startTime ascending
  return filtered.sort((a, b) => {
    const dateA = a.startDate || a.date;
    const dateB = b.startDate || b.date;
    const dateComp = dateA.localeCompare(dateB);
    if (dateComp !== 0) return dateComp;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });
}

export function getUpcomingEvents(events: CalendarEvent[], limit = 3): CalendarEvent[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  return events
    .filter((e) => e.status !== 'cancelled' && (e.startDate || e.date) >= todayStr)
    .sort((a, b) => {
      const dComp = (a.startDate || a.date).localeCompare(b.startDate || b.date);
      if (dComp !== 0) return dComp;
      return (a.startTime || '').localeCompare(b.startTime || '');
    })
    .slice(0, limit);
}

export const EVENT_TYPE_METADATA: Record<
  UnifiedEventType,
  { label: string; bgClass: string; textClass: string; borderClass: string; dotClass: string; iconBg: string }
> = {
  meeting: {
    label: 'اجتماع شباب',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    textClass: 'text-indigo-700 dark:text-indigo-300',
    borderClass: 'border-indigo-200 dark:border-indigo-800',
    dotClass: 'bg-indigo-500',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/60',
  },
  activity: {
    label: 'نشاط / يوم روحي',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
  },
  trip: {
    label: 'رحلة كنسية',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-800 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60',
  },
  general: {
    label: 'حدث عام بالتقويم',
    bgClass: 'bg-sky-50 dark:bg-sky-950/40',
    textClass: 'text-sky-700 dark:text-sky-300',
    borderClass: 'border-sky-200 dark:border-sky-800',
    dotClass: 'bg-sky-500',
    iconBg: 'bg-sky-100 dark:bg-sky-900/60',
  },
};


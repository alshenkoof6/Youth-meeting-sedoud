import { Meeting, ChurchEvent, Trip, UserProfile } from '../types';
import { CalendarEvent, UnifiedEventType } from '../types/calendar';

export function mapMeetingToCalendarEvent(meeting: Meeting): CalendarEvent {
  return {
    id: `meeting_${meeting.meetingId}`,
    sourceType: 'meeting',
    eventType: 'meeting',
    title: meeting.title || 'اجتماع الشباب الأسبوعي',
    description: meeting.description || (meeting.topic ? `الموضوع: ${meeting.topic}${meeting.speaker ? ` - المتكلم: ${meeting.speaker}` : ''}` : meeting.notes),
    date: meeting.date,
    startTime: meeting.startTime || '19:00',
    endTime: meeting.endTime || '21:00',
    location: meeting.location || 'قاعة الاجتماعات الكبرى',
    targetStages: meeting.targetStages || 'all',
    targetAudienceLabel: getTargetAudienceLabel(meeting.targetStages),
    speakerOrLeader: meeting.speaker,
    status: meeting.status === 'canceled' ? 'cancelled' : meeting.status === 'completed' ? 'completed' : 'upcoming',
    requiresRegistration: false,
  };
}

export function mapChurchEventToCalendarEvent(event: ChurchEvent): CalendarEvent {
  let eventType: UnifiedEventType = 'activity';
  const rawType = (event.type || '').toLowerCase();
  
  if (rawType.includes('spiritual') || rawType.includes('روحي') || rawType.includes('نهضة') || rawType.includes('قداس')) {
    eventType = 'spiritual_day';
  } else if (rawType.includes('conf') || rawType.includes('مؤتمر')) {
    eventType = 'conference';
  } else if (rawType.includes('important') || rawType.includes('عام') || rawType.includes('celebration') || rawType.includes('عيد')) {
    eventType = 'important_event';
  } else if (rawType.includes('meeting') || rawType.includes('اجتماع')) {
    eventType = 'meeting';
  } else {
    eventType = 'activity';
  }

  const capacity = event.capacity || 0;
  const booked = event.registeredCount || 0;
  const available = capacity > 0 ? Math.max(0, capacity - booked) : undefined;

  return {
    id: `event_${event.eventId}`,
    sourceType: 'event',
    eventType,
    title: event.title,
    description: event.description,
    date: event.date,
    startTime: event.time || '18:00',
    location: event.location || 'مبنى الخدمات',
    targetStages: event.targetStages || 'all',
    targetAudienceLabel: getTargetAudienceLabel(event.targetStages),
    capacity: capacity > 0 ? capacity : undefined,
    bookedCount: booked,
    availableSeats: available,
    speakerOrLeader: event.speaker,
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
    sourceType: 'trip',
    eventType: 'trip',
    title: trip.title,
    description: trip.description || `رحلة إلى ${destStr}`,
    date: trip.date,
    endDate: trip.returnDate,
    startTime: trip.departureTime || trip.time || '07:00',
    endTime: trip.returnTime || '21:00',
    location: `${destStr} (التجمع: ${trip.meetingPoint || 'الكنيسة'})`,
    targetStages: trip.targetStages || 'all',
    targetAudienceLabel: getTargetAudienceLabel(trip.targetStages),
    capacity,
    bookedCount: booked,
    availableSeats: available,
    price: trip.price,
    status: trip.status === 'canceled' ? 'cancelled' : trip.status === 'completed' ? 'completed' : 'upcoming',
    requiresRegistration: true,
  };
}

export function getTargetAudienceLabel(targetStages?: string[] | 'all'): string {
  if (!targetStages || targetStages === 'all' || (Array.isArray(targetStages) && targetStages.length === 0)) {
    return 'متاح لجميع مراحل الشباب';
  }
  const stageLabels: Record<string, string> = {
    prep: 'إعدادي',
    sec: 'ثانوي',
    univ: 'جامعيين',
    grad: 'خريجين',
    graduate: 'خريجين',
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
  meetings: Meeting[],
  events: ChurchEvent[],
  trips: Trip[],
  user: UserProfile | null
): CalendarEvent[] {
  const unified: CalendarEvent[] = [
    ...meetings.map(mapMeetingToCalendarEvent),
    ...events.map(mapChurchEventToCalendarEvent),
    ...trips.map(mapTripToCalendarEvent),
  ];

  // Filter based on user role and target audience
  const filtered = unified.filter((e) => isEventVisibleToUser(e, user));

  // Sort by date and startTime ascending
  return filtered.sort((a, b) => {
    const dateComp = a.date.localeCompare(b.date);
    if (dateComp !== 0) return dateComp;
    return a.startTime.localeCompare(b.startTime);
  });
}

export function getUpcomingEvents(events: CalendarEvent[], limit = 3): CalendarEvent[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  return events
    .filter((e) => e.status !== 'cancelled' && e.date >= todayStr)
    .sort((a, b) => {
      const dComp = a.date.localeCompare(b.date);
      if (dComp !== 0) return dComp;
      return a.startTime.localeCompare(b.startTime);
    })
    .slice(0, limit);
}

export const EVENT_TYPE_METADATA: Record<
  UnifiedEventType,
  { label: string; bgClass: string; textClass: string; borderClass: string; dotClass: string }
> = {
  meeting: {
    label: 'اجتماع شباب',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    textClass: 'text-blue-700 dark:text-blue-300',
    borderClass: 'border-blue-200 dark:border-blue-800',
    dotClass: 'bg-blue-500',
  },
  activity: {
    label: 'نشاط / مسابقة',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    textClass: 'text-emerald-700 dark:text-emerald-300',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  },
  trip: {
    label: 'رحلة كنسية',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    textClass: 'text-amber-800 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800',
    dotClass: 'bg-amber-500',
  },
  conference: {
    label: 'مؤتمر شباب',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    textClass: 'text-purple-700 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-800',
    dotClass: 'bg-purple-500',
  },
  spiritual_day: {
    label: 'يوم روحي / قداس',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    textClass: 'text-rose-700 dark:text-rose-300',
    borderClass: 'border-rose-200 dark:border-rose-800',
    dotClass: 'bg-rose-500',
  },
  important_event: {
    label: 'حدث عام مهم',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    textClass: 'text-indigo-700 dark:text-indigo-300',
    borderClass: 'border-indigo-200 dark:border-indigo-800',
    dotClass: 'bg-indigo-500',
  },
};

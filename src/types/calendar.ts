import { EducationStage, GeneralEvent } from './index';

export type UnifiedEventType = 'meeting' | 'activity' | 'trip' | 'general';

export interface CalendarEvent {
  id: string;
  type: UnifiedEventType; // meeting | activity | trip | general
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  location: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  sourceId: string; // references source record (meetingId, eventId, tripId, or generalEventId)

  // Compatibility & rich display fields
  date: string; // YYYY-MM-DD (matches startDate)
  sourceType?: 'meeting' | 'event' | 'trip' | 'general';
  eventType?: UnifiedEventType;
  targetStages?: EducationStage[] | 'all';
  targetAudienceLabel?: string;
  capacity?: number;
  bookedCount?: number;
  availableSeats?: number;
  price?: number;
  speakerOrLeader?: string;
  contactName?: string;
  contactPhone?: string;
  whatsappLink?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  requiresRegistration?: boolean;
  registrationDeadline?: string;
}

export type { GeneralEvent };

export type CalendarViewMode = 'month' | 'week' | 'agenda';

export interface CalendarFilterState {
  searchQuery: string;
  selectedTypes: UnifiedEventType[];
  stageFilter: EducationStage | 'all';
}


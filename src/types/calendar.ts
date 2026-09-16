import { EducationStage } from './index';

export type UnifiedEventType = 
  | 'meeting'
  | 'activity'
  | 'trip'
  | 'conference'
  | 'spiritual_day'
  | 'important_event';

export interface CalendarEvent {
  id: string;
  sourceType: 'meeting' | 'event' | 'trip';
  eventType: UnifiedEventType;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  endDate?: string; // For multi-day events or trips
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  location: string;
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

export type CalendarViewMode = 'month' | 'week' | 'agenda';

export interface CalendarFilterState {
  searchQuery: string;
  selectedTypes: UnifiedEventType[];
  stageFilter: EducationStage | 'all';
}

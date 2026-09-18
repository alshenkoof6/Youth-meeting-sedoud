import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { CalendarEvent, UnifiedEventType, CalendarViewMode } from '../../types/calendar';
import { getUnifiedEvents, EVENT_TYPE_METADATA } from '../../utils/calendarUtils';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  MapPin, 
  Users, 
  Filter, 
  Search, 
  Plus, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Ticket,
  Share2,
  CalendarDays,
  List,
  Sparkles,
  Layers,
  RefreshCw,
  Trash2,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface UnifiedCalendarProps {
  onNavigateToMeetings?: () => void;
  onNavigateToEvents?: () => void;
  onNavigateToTrips?: () => void;
}

export const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({
  onNavigateToMeetings,
  onNavigateToEvents,
  onNavigateToTrips,
}) => {
  const { currentUser, role } = useAuth();
  const isAdmin = role === 'admin' || role === 'supervisor';

  // Store synchronization version
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Navigation & View state
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<UnifiedEventType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Selected event for modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Create new event modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventType, setNewEventType] = useState<UnifiedEventType>('activity');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newEventTime, setNewEventTime] = useState('18:00');
  const [newEventEndTime, setNewEventEndTime] = useState('20:30');
  const [newEventLocation, setNewEventLocation] = useState('كنيسة السيدة العذراء مريم بسدود');
  const [newEventSpeaker, setNewEventSpeaker] = useState('أبونا مكسيموس يوسف');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventCapacity, setNewEventCapacity] = useState('50');
  const [newEventTargetStage, setNewEventTargetStage] = useState<'all' | 'prep' | 'sec' | 'univ' | 'grad'>('all');

  // Submission & Deletion status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Unified events extracted dynamically from all actual collections
  const allEvents = useMemo(() => {
    return getUnifiedEvents(
      dataStore.meetings,
      dataStore.events,
      dataStore.trips,
      dataStore.generalEvents,
      currentUser
    );
  }, [currentUser, storeVersion]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      // Type filter
      if (selectedTypes.length > 0 && !selectedTypes.includes(ev.eventType)) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesDesc = (ev.description || '').toLowerCase().includes(q);
        const matchesLoc = ev.location.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc) return false;
      }
      return true;
    });
  }, [allEvents, selectedTypes, searchQuery]);

  // Calendar calculations (Month View)
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayOfMonthIndex = useMemo(() => {
    // Saturday is day 6 in JS (0 is Sunday). In Egypt / Church context, Saturday is typically the start of church week
    // Let's standardise on Saturday (السبت) as first day of column
    const jsDay = new Date(year, month, 1).getDay(); // 0: Sun, 1: Mon, ... 6: Sat
    return (jsDay + 1) % 7; // 6 (Sat) -> 0, 0 (Sun) -> 1, ...
  }, [year, month]);

  const monthNameArabic = useMemo(() => {
    return currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Week View dates
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    const curr = new Date(currentDate);
    const day = (curr.getDay() + 1) % 7; // Sat = 0
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - day);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [currentDate]);

  // Handlers for month navigation
  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - 1);
      setCurrentDate(d);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + 1);
      setCurrentDate(d);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleTypeFilter = (type: UnifiedEventType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!newEventTitle.trim()) {
      setSubmitError('برجاء كتابة عنوان الحدث بشكل صحيح');
      return;
    }
    if (!newEventDate) {
      setSubmitError('برجاء تحديد تاريخ الحدث');
      return;
    }

    setIsSubmitting(true);

    try {
      const stageTargets = newEventTargetStage === 'all' ? 'all' : [newEventTargetStage];

      if (newEventType === 'meeting') {
        const newMeetingId = `meet_${Date.now()}`;
        await dataStore.createMeeting({
          meetingId: newMeetingId,
          title: newEventTitle.trim(),
          speaker: newEventSpeaker.trim() || 'أبونا مكسيموس يوسف',
          description: newEventDescription.trim() || 'اجتماع شباب أسبوعي',
          date: newEventDate,
          startTime: newEventTime,
          endTime: newEventEndTime || '21:00',
          location: newEventLocation.trim() || 'كنيسة السيدة العذراء مريم بسدود',
          targetStages: stageTargets as any,
          notes: newEventDescription.trim(),
          status: 'scheduled',
          qrSecretToken: Math.random().toString(36).substring(2, 10),
          qrValidFrom: newEventDate,
          qrValidUntil: newEventDate,
          attendanceCount: 0,
          pointsAwarded: 10,
          createdBy: currentUser?.userId || 'admin',
          createdAt: new Date().toISOString(),
        });
      } else if (newEventType === 'trip') {
        const newTripId = `trip_${Date.now()}`;
        await dataStore.createTrip({
          tripId: newTripId,
          title: newEventTitle.trim(),
          destination: newEventLocation.trim() || 'وجهة الرحلة',
          destinations: [newEventLocation.trim() || 'وجهة الرحلة'],
          description: newEventDescription.trim(),
          date: newEventDate,
          returnDate: newEventDate,
          time: newEventTime,
          departureTime: newEventTime,
          returnTime: newEventEndTime || '21:00',
          meetingPoint: 'فناء الكنيسة',
          price: 0,
          capacity: parseInt(newEventCapacity) || 50,
          bookedSeatsCount: 0,
          targetStages: stageTargets as any,
          status: 'open',
          coordinatorName: currentUser?.displayName || 'مسؤول الخدمة',
          coordinatorWhatsapp: '',
          createdAt: new Date().toISOString(),
        });
      } else if (newEventType === 'general' || newEventType === 'important_event') {
        const newGenId = `gen_${Date.now()}`;
        await dataStore.createGeneralEvent({
          id: newGenId,
          type: 'general',
          title: newEventTitle.trim(),
          description: newEventDescription.trim(),
          startDate: newEventDate,
          endDate: newEventDate,
          startTime: newEventTime,
          endTime: newEventEndTime || '20:00',
          location: newEventLocation.trim() || 'الكنيسة',
          targetStages: stageTargets as any,
          status: 'upcoming',
          createdBy: currentUser?.userId || 'admin',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newEventId = `evt_${Date.now()}`;
        const mappedType =
          newEventType === 'spiritual_day'
            ? 'spiritual_day'
            : newEventType === 'conference'
            ? 'conference'
            : 'special_meeting';

        await dataStore.createEvent({
          eventId: newEventId,
          title: newEventTitle.trim(),
          type: mappedType,
          date: newEventDate,
          time: newEventTime,
          location: newEventLocation.trim() || 'الكنيسة',
          description: newEventDescription.trim(),
          speaker: newEventSpeaker.trim() || undefined,
          targetStages: stageTargets as any,
          price: 0,
          capacity: parseInt(newEventCapacity) || 50,
          registeredCount: 0,
          registrationRequired: false,
          status: 'upcoming',
          createdAt: new Date().toISOString(),
        });
      }

      setSubmitSuccess('تم حفظ الحدث بنجاح وإدراجه في التقويم!');
      setTimeout(() => {
        setNewEventTitle('');
        setNewEventDescription('');
        setSubmitSuccess(null);
        setShowCreateModal(false);
      }, 800);
    } catch (err: any) {
      console.error('Error creating event:', err);
      setSubmitError(err?.message || 'فشل حفظ الحدث. برجاء التحقق من الاتصال والمحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (!isAdmin) return;
    setIsDeleting(true);
    try {
      if (event.sourceType === 'meeting') {
        await dataStore.deleteMeeting(event.sourceId);
      } else if (event.sourceType === 'event') {
        await dataStore.deleteEvent(event.sourceId);
      } else if (event.sourceType === 'trip') {
        await dataStore.deleteTrip(event.sourceId);
      } else if (event.sourceType === 'general') {
        await dataStore.deleteGeneralEvent(event.sourceId);
      }
      setSelectedEvent(null);
      setShowDeleteConfirm(false);
    } catch (err: any) {
      console.error('Error deleting event:', err);
      alert(`فشل حذف الحدث: ${err?.message || 'حدث خطأ غير متوقع'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const dayNamesArabic = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                التقويم الموحد لأحداث الخدمة
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                عرض موحد للاجتماعات، الأنشطة، الرحلات، الأيام الروحية، والمؤتمرات
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Switcher + Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>شهر</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>أسبوع</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>أجندة</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition ${
              showFilters || selectedTypes.length > 0
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 text-indigo-600 dark:text-indigo-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>تصفية</span>
            {selectedTypes.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center">
                {selectedTypes.length}
              </span>
            )}
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة حدث</span>
            </button>
          )}
        </div>
      </div>

      {/* Cloud Sync Status Banner */}
      {dataStore.syncError && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>تنبيه مزامنة:</strong> تعذر الاتصال اللحظي بقاعدة البيانات ({dataStore.syncError}). يتم عرض البيانات المتاحة محلياً.
            </span>
          </div>
          <button
            type="button"
            onClick={() => dataStore.retrySync()}
            disabled={dataStore.isSyncing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 hover:bg-amber-300 font-bold transition shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${dataStore.isSyncing ? 'animate-spin' : ''}`} />
            <span>إعادة المزامنة</span>
          </button>
        </div>
      )}

      {/* Filter Panel (Collapsible) */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في أسماء وتفاصيل الأحداث..."
                className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 text-slate-800 dark:text-slate-100"
              />
            </div>

            {selectedTypes.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedTypes([])}
                className="text-xs text-rose-600 hover:underline font-bold"
              >
                إلغاء كل الفلاتر
              </button>
            )}
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-2">نوع الحدث:</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(EVENT_TYPE_METADATA) as UnifiedEventType[]).map((type) => {
                const meta = EVENT_TYPE_METADATA[type];
                const isSelected = selectedTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleTypeFilter(type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                      isSelected
                        ? `${meta.bgClass} ${meta.textClass} ${meta.borderClass} ring-2 ring-indigo-500/20`
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${meta.dotClass}`} />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Navigation Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevPeriod}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextPeriod}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
          >
            اليوم
          </button>
        </div>

        <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
          {viewMode === 'week'
            ? `أسبوع ${weekDates[0].toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })} - ${weekDates[6].toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}`
            : monthNameArabic}
        </h2>

        <div className="text-xs text-slate-400 font-bold">
          {filteredEvents.length} حدث
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
            {dayNamesArabic.map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-2 text-xs font-black rounded-xl ${
                  idx === 0 || idx === 1
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Grid of Days */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Blank filler days before first day */}
            {Array.from({ length: firstDayOfMonthIndex }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-20 sm:min-h-28 rounded-2xl bg-slate-50/40 dark:bg-slate-900/20 border border-dashed border-slate-100 dark:border-slate-800/40 p-1"
              />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = filteredEvents.filter((e) => e.date === dateStr);
              
              const isToday =
                new Date().toISOString().slice(0, 10) === dateStr;

              return (
                <div
                  key={dateStr}
                  className={`min-h-20 sm:min-h-28 rounded-2xl border p-1.5 flex flex-col transition ${
                    isToday
                      ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 shadow-xs'
                      : 'border-slate-100 dark:border-slate-700/60 bg-slate-50/30 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 overflow-y-auto max-h-20 sm:max-h-24">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const meta = EVENT_TYPE_METADATA[ev.eventType];
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setSelectedEvent(ev)}
                          className={`w-full text-start px-1.5 py-0.5 rounded-lg border text-[10px] sm:text-[11px] font-bold truncate block transition hover:scale-[1.02] ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                          title={`${ev.startTime} - ${ev.title}`}
                        >
                          <span className="font-mono ml-1">{ev.startTime}</span>
                          <span className="truncate">{ev.title}</span>
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(dayEvents[3])}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block text-center hover:underline"
                      >
                        +{dayEvents.length - 3} المزيد
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {weekDates.map((wDate) => {
              const dateStr = wDate.toISOString().slice(0, 10);
              const dayEvents = filteredEvents.filter((e) => e.date === dateStr);
              const isToday = new Date().toISOString().slice(0, 10) === dateStr;
              const dayName = wDate.toLocaleDateString('ar-EG', { weekday: 'short' });

              return (
                <div
                  key={dateStr}
                  className={`rounded-2xl border p-3 min-h-[300px] flex flex-col ${
                    isToday
                      ? 'border-indigo-400 bg-indigo-50/20 dark:bg-indigo-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="text-center pb-2 border-b border-slate-200 dark:border-slate-700 mb-2">
                    <span className="text-xs font-bold text-slate-500 block">{dayName}</span>
                    <span
                      className={`inline-block text-sm font-black mt-0.5 px-2 py-0.5 rounded-full ${
                        isToday ? 'bg-indigo-600 text-white' : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {wDate.getDate()}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayEvents.length === 0 ? (
                      <span className="text-[11px] text-slate-400 block text-center pt-8">
                        لا توجد أحداث
                      </span>
                    ) : (
                      dayEvents.map((ev) => {
                        const meta = EVENT_TYPE_METADATA[ev.eventType];
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => setSelectedEvent(ev)}
                            className={`w-full text-start p-2 rounded-xl border text-xs font-bold transition hover:shadow-sm ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}
                          >
                            <div className="flex items-center justify-between text-[10px] mb-1">
                              <span className="font-mono">{ev.startTime}</span>
                              <span className="px-1 rounded bg-white/60 dark:bg-black/20">
                                {meta.label}
                              </span>
                            </div>
                            <div className="font-bold line-clamp-2">{ev.title}</div>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA / LIST VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                لا توجد أحداث مطابقة لشروط البحث أو الفلترة
              </p>
              <p className="text-xs text-slate-400 mt-1">
                جرب تغيير نوع الحدث أو البحث بكلمات أخرى
              </p>
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const meta = EVENT_TYPE_METADATA[ev.eventType];
              const eventDate = new Date(ev.date + 'T00:00:00');
              const isUpcoming = ev.date >= new Date().toISOString().slice(0, 10);

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className={`p-4 rounded-2xl border transition cursor-pointer hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isUpcoming
                      ? 'bg-slate-50/60 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100/40 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Date badge */}
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-xs flex flex-col items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-slate-400">
                        {eventDate.toLocaleDateString('ar-EG', { month: 'short' })}
                      </span>
                      <span className="text-lg font-black text-slate-800 dark:text-slate-100 leading-none">
                        {eventDate.getDate()}
                      </span>
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                          {meta.label}
                        </span>
                        {ev.targetAudienceLabel && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {ev.targetAudienceLabel}
                          </span>
                        )}
                        {ev.status === 'cancelled' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                            ملغي
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        {ev.title}
                      </h3>

                      {ev.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {ev.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {ev.startTime} {ev.endTime ? ` - ${ev.endTime}` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {ev.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status / Capacity */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
                    {ev.capacity && ev.availableSeats !== undefined && (
                      <div className="text-start sm:text-end">
                        <span className="text-[10px] text-slate-400 block font-bold">المقاعد المتاحة</span>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {ev.availableSeats} من {ev.capacity}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40 text-xs font-bold hover:bg-indigo-100 transition"
                    >
                      التفاصيل
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute left-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${EVENT_TYPE_METADATA[selectedEvent.eventType].bgClass} ${EVENT_TYPE_METADATA[selectedEvent.eventType].textClass} ${EVENT_TYPE_METADATA[selectedEvent.eventType].borderClass}`}>
                  {EVENT_TYPE_METADATA[selectedEvent.eventType].label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                  {selectedEvent.targetAudienceLabel || 'عام'}
                </span>
                {selectedEvent.status === 'cancelled' ? (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold">
                    ملغي
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                    مؤكد
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {selectedEvent.title}
              </h2>
            </div>

            {/* Description */}
            {selectedEvent.description && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60 leading-relaxed">
                {selectedEvent.description}
              </p>
            )}

            {/* Grid of Key Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">التاريخ</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('ar-EG', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">التوقيت</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">
                  {selectedEvent.startTime} {selectedEvent.endTime ? ` - ${selectedEvent.endTime}` : ''}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">الموقع</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedEvent.location}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">السعة والحجز</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedEvent.capacity
                    ? `متاح ${selectedEvent.availableSeats} من أصل ${selectedEvent.capacity}`
                    : 'حضور مباشر بدون حجز'}
                </span>
              </div>
            </div>

            {/* Admin Delete Action */}
            {isAdmin && selectedEvent && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                {showDeleteConfirm ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/60 space-y-2">
                    <p className="text-xs text-rose-700 dark:text-rose-300 font-bold">
                      هل أنت متأكد من حذف هذا الحدث نهائياً من التقويم وقاعدة البيانات؟
                    </p>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(selectedEvent)}
                        disabled={isDeleting}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1 transition"
                      >
                        {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        <span>تأكيد الحذف</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold py-1.5 px-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition w-full justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الحدث من قاعدة البيانات</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`تذكير من إجتماع الشباب بكنيسة السيدة العذراء مريم بسدود: ${selectedEvent.title} يوم ${selectedEvent.date} في ${selectedEvent.location}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة عبر واتساب</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setSelectedEvent(null);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE EVENT MODAL (Service Secretary Only) */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setSubmitError(null);
                setSubmitSuccess(null);
              }}
              className="absolute left-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  إضافة حدث جديد للتقويم
                </h3>
                <p className="text-xs text-slate-400">
                  سيتم حفظه في قاعدة البيانات ويظهر مباشرة للخدام والمخدومين
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            {submitError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">تعذر حفظ الحدث:</strong>
                  <span>{submitError}</span>
                </div>
              </div>
            )}

            {/* Success Message Box */}
            {submitSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{submitSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    نوع الحدث
                  </label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as UnifiedEventType)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="meeting">اجتماع شباب أسبوعي</option>
                    <option value="activity">نشاط / مسابقة</option>
                    <option value="spiritual_day">يوم روحي / قداس</option>
                    <option value="conference">مؤتمر شباب</option>
                    <option value="trip">رحلة شبابية</option>
                    <option value="general">حدث عام / مناسبة كنسية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    الفئة والمرحلة المستهدفة
                  </label>
                  <select
                    value={newEventTargetStage}
                    onChange={(e) => setNewEventTargetStage(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">متاح لجميع مراحل الشباب</option>
                    <option value="prep">مرحلة إعدادي فقط</option>
                    <option value="sec">مرحلة ثانوي فقط</option>
                    <option value="univ">مرحلة جامعيين فقط</option>
                    <option value="grad">مرحلة خريجين فقط</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  عنوان الحدث *
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="مثال: اجتماع الشباب الأسبوعي، نهضة السيدة العذراء..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    التاريخ *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    وقت البدء *
                  </label>
                  <input
                    type="time"
                    required
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    وقت الانتهاء
                  </label>
                  <input
                    type="time"
                    value={newEventEndTime}
                    onChange={(e) => setNewEventEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    الموقع / القاعة
                  </label>
                  <input
                    type="text"
                    value={newEventLocation}
                    onChange={(e) => setNewEventLocation(e.target.value)}
                    placeholder="مثال: قاعة الكنيسة الكبرى، مسرح الخدمات..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    المتكلم / المسؤول
                  </label>
                  <input
                    type="text"
                    value={newEventSpeaker}
                    onChange={(e) => setNewEventSpeaker(e.target.value)}
                    placeholder="مثال: أبونا مكسيموس يوسف..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  الوصف والملاحظات
                </label>
                <textarea
                  rows={2}
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="موضوع اللقاء أو الكلمة الروحية، ملاحظات الحضور..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>حفظ وإدراج في التقويم</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

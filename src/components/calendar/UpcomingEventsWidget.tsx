import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { getUnifiedEvents, getUpcomingEvents, EVENT_TYPE_METADATA } from '../../utils/calendarUtils';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronLeft, ArrowLeft } from 'lucide-react';

interface UpcomingEventsWidgetProps {
  onViewCalendar?: () => void;
  maxItems?: number;
}

export const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({
  onViewCalendar,
  maxItems = 3,
}) => {
  const { currentUser } = useAuth();

  const upcoming = React.useMemo(() => {
    const unified = getUnifiedEvents(dataStore.meetings, dataStore.events, dataStore.trips, currentUser);
    return getUpcomingEvents(unified, maxItems);
  }, [currentUser, maxItems]);

  const getDayLabel = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    if (dateStr === today) return 'اليوم';
    if (dateStr === tomorrow) return 'غداً';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('ar-EG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-3.5" dir="rtl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              الأحداث القادمة (Upcoming Events)
            </h3>
            <span className="text-[11px] text-slate-400 block">
              أقرب المواعيد والأنشطة المجدولة
            </span>
          </div>
        </div>

        {onViewCalendar && (
          <button
            type="button"
            onClick={onViewCalendar}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>عرض التقويم</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">
          لا توجد أحداث قادمة مجدولة حالياً
        </div>
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((ev) => {
            const meta = EVENT_TYPE_METADATA[ev.eventType];
            const dayLabel = getDayLabel(ev.date);

            return (
              <div
                key={ev.id}
                onClick={onViewCalendar}
                className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                      {dayLabel}
                    </span>
                    <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-100">
                      {ev.startTime}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${meta.bgClass} ${meta.textClass} ${meta.borderClass}`}>
                        {meta.label}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                      {ev.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{ev.location}</span>
                    </span>
                  </div>
                </div>

                <div className="text-slate-400 shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

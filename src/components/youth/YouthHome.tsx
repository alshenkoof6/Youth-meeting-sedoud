import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { streakService } from '../../services/streakService';
import { formatArabicDate, formatArabicTime } from '../../lib/utils';
import { YouthStreakCard } from './YouthStreakCard';
import { 
  Flame, 
  Star, 
  Calendar, 
  MapPin, 
  QrCode, 
  Bus, 
  Sparkles, 
  Megaphone, 
  CheckCircle2, 
  ArrowLeft,
  Clock,
  ChevronRight,
  Heart,
  MessageSquare
} from 'lucide-react';

interface YouthHomeProps {
  onOpenScan: () => void;
  setActiveView: (view: string) => void;
}

export const YouthHome: React.FC<YouthHomeProps> = ({ onOpenScan, setActiveView }) => {
  const { currentUser } = useAuth();
  const streakData = streakService.calculateStreak(currentUser?.userId || '');
  const nextMeeting = dataStore.meetings.find((m) => m.status === 'active' || m.status === 'scheduled') || dataStore.meetings[0];
  const activeAnnouncements = dataStore.announcements.filter((a) => a.status === 'active');
  const upcomingTrips = dataStore.trips.filter((t) => t.status === 'open').slice(0, 2);
  const upcomingEvents = dataStore.events.filter((e) => e.status === 'upcoming').slice(0, 2);

  const [absenceReasonSubmitted, setAbsenceReasonSubmitted] = useState(false);
  const [selectedAbsenceReason, setSelectedAbsenceReason] = useState<string | null>(null);

  const handleAbsenceFeedback = async (reason: string) => {
    setSelectedAbsenceReason(reason);
    setAbsenceReasonSubmitted(true);
    if (currentUser) {
      await dataStore.logFollowUp({
        followupId: `abs_${Date.now()}`,
        userId: currentUser.userId,
        userName: currentUser.displayName,
        servantId: currentUser.assignedServantId || 'system',
        servantName: currentUser.assignedServantName || 'متابعة تلقائية',
        date: new Date().toISOString().split('T')[0],
        contactMethod: 'other',
        status: reason === 'دراسة' ? 'study' : reason === 'شغل' ? 'work' : reason === 'سفر' ? 'traveling' : 'contacted',
        generalNotes: `المخدوم شارك سبب عدم تمكنه من الحضور: ${reason}`,
        isConfidential: false,
        createdAt: new Date().toISOString()
      });
    }
  };

  // Check if current user already attended the next meeting
  const alreadyAttendedNext = nextMeeting && dataStore.attendance.some(
    (a) => a.meetingId === nextMeeting.meetingId && a.userId === currentUser?.userId
  );

  return (
    <div id="youth-home-view" className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      
      {/* 1. Welcoming Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            أهلاً يا {currentUser?.nickname || currentUser?.displayName.split(' ')[0] || 'مينا'} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            كودك الكنسي: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{currentUser?.userCode}</span>
          </p>
        </div>

        {/* Floating Quick Scan Button on Header */}
        <button
          onClick={onOpenScan}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-200 dark:shadow-none transition transform active:scale-95"
        >
          <QrCode className="w-5 h-5" />
          <span className="hidden sm:inline">سجّل الحضور</span>
        </button>
      </div>

      {/* 2. Key Metrics Cards (Attendance, Streak, Points) */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        
        {/* Attendance Counter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">إجمالي الحضور</span>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {currentUser?.totalAttendances || 0}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">اجتماع</span>
        </div>

        {/* Current Streak */}
        <div className="bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200/80 dark:border-amber-900/60 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          <span className="text-xs text-amber-800 dark:text-amber-300 mb-1 font-medium flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            المواظبة
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-900 dark:text-amber-200 font-mono">
            {streakData.currentStreak}
          </span>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">متتالية 🔥</span>
        </div>

        {/* Points */}
        <div 
          onClick={() => setActiveView('youth-rewards')}
          className="cursor-pointer bg-gradient-to-b from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20 border border-indigo-200/80 dark:border-indigo-900/60 rounded-3xl p-4 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition"
        >
          <span className="text-xs text-indigo-800 dark:text-indigo-300 mb-1 font-medium flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
            النقاط
          </span>
          <span className="text-2xl sm:text-3xl font-black text-indigo-900 dark:text-indigo-200">
            {currentUser?.totalPoints || 0}
          </span>
          <span className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-0.5">استبدل هدية</span>
        </div>

      </div>

      {/* 2.5 Detailed Interactive Streak Progress Component */}
      <YouthStreakCard 
        streakData={streakData} 
        onOpenScan={onOpenScan} 
      />

      {/* 3. Next Meeting Card */}
      {nextMeeting && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          {/* Background subtle light */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                الاجتماع القادم
              </span>

              {alreadyAttendedNext ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم تسجيل حضورك بنجاح ✓
                </span>
              ) : nextMeeting.status === 'active' ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold animate-pulse">
                  الآن بالقاعة • مفتوح للتسجيل
                </span>
              ) : null}
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {nextMeeting.title}
              </h2>
              {nextMeeting.speaker && (
                <p className="text-sm text-indigo-200 mt-1">
                  المتحدث: <span className="font-semibold text-white">{nextMeeting.speaker}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-300 pt-1 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>{formatArabicDate(nextMeeting.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>{formatArabicTime(nextMeeting.startTime)} - {formatArabicTime(nextMeeting.endTime)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>{nextMeeting.location}</span>
              </div>
            </div>

            {/* Attendance CTA */}
            <div className="pt-2">
              {!alreadyAttendedNext ? (
                <button
                  onClick={onOpenScan}
                  className="w-full py-3.5 bg-white hover:bg-slate-100 text-indigo-950 font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg transition transform active:scale-98"
                >
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  <span>مسح كود الحضور (+{nextMeeting.pointsAwarded || 10} نقاط)</span>
                </button>
              ) : (
                <div className="flex items-center justify-between bg-white/10 rounded-2xl px-4 py-3 text-xs text-emerald-200">
                  <span>تم تسجيل حضورك في هذا الاجتماع مسبقاً!</span>
                  <button 
                    onClick={() => setActiveView('youth-meetings')}
                    className="text-white underline font-bold"
                  >
                    شاركنا رأيك في الاجتماع
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 3.5 Optional Youth Absence Feedback - Requirement 17 */}
      {(currentUser?.consecutiveAbsences || 0) > 0 && (
        <div className="bg-gradient-to-br from-rose-50/90 via-pink-50/70 to-indigo-50/50 dark:from-rose-950/40 dark:via-pink-950/30 dark:to-indigo-950/20 border border-rose-200/80 dark:border-rose-900/60 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">❤️</span>
            <div>
              <h3 className="text-sm font-black text-rose-950 dark:text-rose-200">
                وحشتنا في الاجتماع اللي فات!
              </h3>
              <p className="text-xs text-rose-800/80 dark:text-rose-300">
                لو حابب تطمنا عليك وتقولنا إيه منعك من الحضور، اختار السبب الأقرب (اختياري تماماً):
              </p>
            </div>
          </div>

          {!absenceReasonSubmitted ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { id: 'دراسة', label: 'دراسة وامتحانات 📚' },
                { id: 'شغل', label: 'ظروف عمل أو وردية 💼' },
                { id: 'سفر', label: 'سفر خارج البلد ✈️' },
                { id: 'ظروف عائلية', label: 'ظروف أسرية 👨‍👩‍👦' },
                { id: 'مواصلات', label: 'مواصلات وصعوبة طريق 🚌' },
                { id: 'الوقت غير مناسب', label: 'الميعاد مش مناسب ⏰' },
                { id: 'سبب آخر', label: 'سبب آخر' },
              ].map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => handleAbsenceFeedback(reason.id)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-xs font-semibold transition shadow-2xs hover:scale-102"
                >
                  {reason.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-rose-200/60 text-xs text-rose-900 dark:text-rose-200 flex items-center justify-between animate-in fade-in">
              <span className="font-bold">
                شكراً لمشاركتك ({selectedAbsenceReason}) ❤️ صلواتنا معاك ومستنيينك تنورنا الاجتماع القادم!
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
          )}
        </div>
      )}

      {/* 4. Urgent & Active Announcements */}
      {activeAnnouncements.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              إعلانات هامة
            </h3>
          </div>

          <div className="space-y-2">
            {activeAnnouncements.map((anc) => (
              <div
                key={anc.announcementId}
                className={`p-4 rounded-2xl border transition ${
                  anc.priority === 'urgent'
                    ? 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 text-rose-950 dark:text-rose-200'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {anc.priority === 'urgent' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">عاجل</span>
                  )}
                  <h4 className="font-bold text-sm">{anc.title}</h4>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {anc.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Upcoming Trips Section */}
      {upcomingTrips.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Bus className="w-4 h-4 text-indigo-600" />
              الرحلات القادمة
            </h3>
            <button
              onClick={() => setActiveView('youth-activities')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              عرض الكل
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upcomingTrips.map((trip) => {
              const remaining = trip.capacity - trip.bookedSeatsCount;
              return (
                <div
                  key={trip.tripId}
                  onClick={() => setActiveView('youth-activities')}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {trip.price} ج.م
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        remaining <= 15 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        متبقي {remaining} مقعد
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">
                      {trip.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {trip.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{trip.date}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      تفاصيل الحجز
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Servant Care & Reminders Quick Box */}
      <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-3xl p-5 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300">الخادم المتابع لك</span>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {currentUser?.assignedServantName || 'خادم أسرة الشباب'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            يمكنك دائماً مراجعة مواعيد فراغك ودراستك في الملف الشخصي
          </p>
        </div>

        <button
          onClick={() => setActiveView('youth-profile')}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold hover:bg-indigo-50 transition shrink-0"
        >
          ملفي وجدولي
        </button>
      </div>

    </div>
  );
};

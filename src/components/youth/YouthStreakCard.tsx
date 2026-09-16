import React, { useState } from 'react';
import { 
  Flame, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Award, 
  Info,
  CalendarCheck2
} from 'lucide-react';
import { YouthStreakCalculation, STREAK_MILESTONES } from '../../utils/streakCalculator';
import { StreakCalculationResult } from '../../services/streakService';

interface YouthStreakCardProps {
  streakData: YouthStreakCalculation | StreakCalculationResult;
  onOpenScan?: () => void;
}

export const YouthStreakCard: React.FC<YouthStreakCardProps> = ({ 
  streakData, 
  onOpenScan 
}) => {
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);

  const {
    currentStreak,
    bestStreak,
    currentMilestone,
    nextMilestone,
    progressPercent,
    meetingsNeededForNext,
    recentTimeline,
    encouragementMessage,
    flameLevel
  } = streakData;

  // Flame color and styling based on intensity
  const getFlameStyles = () => {
    switch (flameLevel) {
      case 'super':
        return 'text-amber-500 fill-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse';
      case 'fire':
        return 'text-orange-500 fill-orange-500 filter drop-shadow-[0_0_6px_rgba(249,115,22,0.4)] animate-pulse';
      case 'flame':
        return 'text-amber-500 fill-amber-500';
      case 'spark':
        return 'text-amber-600 fill-amber-500';
      default:
        return 'text-slate-400 fill-slate-300';
    }
  };

  return (
    <div 
      id="youth-streak-card"
      className="bg-white dark:bg-slate-900 border border-amber-200/90 dark:border-amber-900/50 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all duration-300 hover:shadow-md"
    >
      {/* Decorative Warm Ambient Glow in corner */}
      <div 
        className="absolute top-0 left-0 w-52 h-52 bg-gradient-to-br from-amber-400/10 via-orange-400/5 to-transparent rounded-full blur-2xl pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Header Row: Title & Historical Best */}
      <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center shrink-0">
            <Flame className={`w-5 h-5 ${getFlameStyles()}`} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              مواظبة الحضور المتتالي
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-mono">
                Streak
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              تُحسب بالاجتماعات المجدولة تلقائياً (الاجتماعات المعلّقة لا تؤثر)
            </p>
          </div>
        </div>

        {/* Best Streak Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold shrink-0">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>الرقم القياسي:</span>
          <span className="font-mono text-amber-600 dark:text-amber-400">{bestStreak}</span>
        </div>
      </div>

      {/* Main Counter & Current Badge Section */}
      <div className="bg-gradient-to-b from-amber-50/70 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200/70 dark:border-amber-900/40 rounded-2xl p-4 sm:p-5 mb-5 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Big Streak Counter */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black text-amber-950 dark:text-amber-100 font-mono tracking-tight">
              {currentStreak}
            </span>
            <div>
              <span className="text-sm sm:text-base font-extrabold text-amber-900 dark:text-amber-200 block">
                {currentStreak === 1 ? 'اجتماع متتالي' : currentStreak === 2 ? 'اجتماعان متتاليان' : 'اجتماعات متتالية'}
              </span>
              <span className="text-xs text-amber-700/80 dark:text-amber-300/80 font-medium">
                {currentStreak > 0 ? 'مواظبتك مستمرة بنجاح 🔥' : 'سجّل حضورك لبدء السلسلة!'}
              </span>
            </div>
          </div>

          {/* Current Milestone Pill & Modal Trigger */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {currentMilestone ? (
              <div className="px-3.5 py-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/70 shadow-2xs flex items-center gap-2">
                <span className="text-lg">{currentMilestone.badge}</span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-bold leading-none">الشارة الحالية</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {currentMilestone.title}
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400">
                🌱 مستعد للانطلاق
              </div>
            )}

            <button
              onClick={() => setShowMilestonesModal(!showMilestonesModal)}
              className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 border border-amber-200 dark:border-amber-800/60 text-slate-600 dark:text-slate-300 transition text-xs font-semibold flex items-center gap-1"
              title="عرض كل شارات المواظبة"
            >
              <Award className="w-4 h-4 text-amber-600" />
              <span className="text-[11px] hidden sm:inline">كل الشارات</span>
              {showMilestonesModal ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

        </div>

        {/* Progress Towards Next Milestone Bar */}
        {nextMilestone && (
          <div className="mt-4 pt-3.5 border-t border-amber-200/60 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                المحطة القادمة: <span className="text-amber-900 dark:text-amber-300">{nextMilestone.title} {nextMilestone.badge}</span>
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {meetingsNeededForNext === 1 
                  ? 'متبقي اجتماع واحد' 
                  : `متبقي ${meetingsNeededForNext} اجتماعات`} ({progressPercent}%)
              </span>
            </div>

            {/* Visual Progress Track */}
            <div className="w-full h-3 bg-amber-100/90 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-amber-200/80 dark:border-amber-900/50">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-full transition-all duration-700 ease-out shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Most Recent Consecutive Sequence Details (from StreakService) */}
        {'mostRecentSequence' in streakData && streakData.mostRecentSequence && (
          <div className="mt-3.5 pt-3 border-t border-amber-200/50 dark:border-amber-900/30 flex flex-wrap items-center justify-between gap-2 text-[11px] text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-1.5 font-semibold">
              <CalendarCheck2 className="w-3.5 h-3.5 text-amber-600" />
              {streakData.mostRecentSequence.isActive ? 'تتابع الحضور الحالي المستمر:' : 'آخر تتابع حضور متصل:'}
              <span className="font-bold underline decoration-amber-400">
                {streakData.mostRecentSequence.count} اجتماعات مجدولة
              </span>
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              ({streakData.mostRecentSequence.startDate} ⟵ {streakData.mostRecentSequence.endDate})
            </span>
          </div>
        )}
      </div>

      {/* Expandable Milestones Drawer */}
      {showMilestonesModal && (
        <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              مستويات وشارات المواظبة بالخدمة:
            </span>
            <span className="text-[11px] text-slate-400">تفتح تلقائياً عند ثبات الحضور</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {STREAK_MILESTONES.map((milestone) => {
              const isUnlocked = currentStreak >= milestone.minStreak;
              return (
                <div 
                  key={milestone.level}
                  className={`p-2.5 rounded-xl border transition ${
                    isUnlocked
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xl">{milestone.badge}</span>
                    {isUnlocked && (
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-md">
                        مفتوح ✓
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white leading-snug">
                    {milestone.title}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {milestone.minStreak} اجتماعات متتالية
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visual Timeline of Recent Meetings (Track Record) */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <CalendarCheck2 className="w-4 h-4 text-indigo-600" />
            سجل الاجتماعات الأخيرة (Timeline):
          </span>
          <span className="text-[11px] text-slate-400">من الأقدم للأحدث</span>
        </div>

        {recentTimeline.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {recentTimeline.map((item) => {
              const isAttended = item.status === 'attended';
              const isCanceled = item.status === 'canceled';
              const isActivePending = item.status === 'active_pending';
              const isMissed = item.status === 'missed';

              return (
                <div 
                  key={item.meetingId}
                  className={`p-2 rounded-2xl border text-center flex flex-col items-center justify-between min-h-[82px] transition ${
                    isAttended 
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60' 
                      : isCanceled 
                      ? 'bg-slate-100/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-500'
                      : isActivePending
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800 animate-pulse'
                      : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-slate-600'
                  }`}
                  title={item.note || item.title}
                >
                  <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    {item.displayDate}
                  </span>

                  {/* Status Indicator Icon */}
                  <div className="my-1">
                    {isAttended && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {isCanceled && (
                      <div className="flex flex-col items-center">
                        <MinusCircle className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    {isActivePending && (
                      <Clock className="w-5 h-5 text-indigo-600 animate-spin" style={{ animationDuration: '4s' }} />
                    )}
                    {isMissed && (
                      <XCircle className="w-5 h-5 text-rose-400" />
                    )}
                  </div>

                  {/* Status Text / Badge */}
                  <span className={`text-[10px] font-bold leading-tight ${
                    isAttended 
                      ? 'text-emerald-700 dark:text-emerald-300' 
                      : isCanceled 
                      ? 'text-slate-500' 
                      : isActivePending
                      ? 'text-indigo-700 dark:text-indigo-300 font-extrabold'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {isAttended ? 'حاضر ✓' : isCanceled ? 'مُعلّق' : isActivePending ? 'جارٍ الآن' : 'غياب'}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400">
            لا توجد اجتماعات مسجلة بعد في السجل
          </div>
        )}

        {/* Note on Canceled Meetings */}
        {recentTimeline.some((t) => t.status === 'canceled') && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>الاجتماعات المُعلّقة رسمياً تم استثناؤها تلقائياً ولا تكسر سلسلة مواظبتك.</span>
          </div>
        )}
      </div>

      {/* Encouragement Footer with Scripture / Warm Message */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <span>❤️</span>
          <span>{encouragementMessage}</span>
        </p>

        {onOpenScan && (
          <button
            onClick={onOpenScan}
            className="self-end sm:self-auto text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 hover:underline"
          >
            <span>مسح كود الحضور</span>
            <span>←</span>
          </button>
        )}
      </div>

    </div>
  );
};

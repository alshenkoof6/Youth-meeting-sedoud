import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getBirthdayInfo } from '../../utils/birthdayUtils';
import { Cake, Sparkles } from 'lucide-react';

export const YouthBirthdayWidget: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser || !currentUser.birthDate) return null;

  const info = getBirthdayInfo(currentUser);
  if (!info) return null;

  // Show only if today or within next 7 days
  if (!info.isToday && info.daysUntilBirthday > 7) return null;

  return (
    <div
      className={`rounded-3xl p-5 border transition relative overflow-hidden ${
        info.isToday
          ? 'bg-gradient-to-l from-rose-500/15 via-pink-500/10 to-amber-500/10 dark:from-rose-950/40 dark:to-slate-800 border-rose-300 dark:border-rose-800 shadow-md'
          : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 shadow-xs'
      }`}
      dir="rtl"
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            info.isToday
              ? 'bg-rose-500 text-white shadow-sm ring-4 ring-rose-200 dark:ring-rose-950'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <Cake className="w-6 h-6" />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {info.isToday ? 'عيد ميلادك اليوم! 🎉' : `عيد ميلادك بعد ${info.daysUntilBirthday} أيام`}
            </span>
          </div>

          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            {info.isToday
              ? `كل سنة وأنت طيب ومبارك يا ${currentUser.displayName}! 🎂`
              : `كل سنة وأنت طيب مقدماً يا ${currentUser.displayName}!`}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {info.isToday
              ? `أسرة خدمة الشباب تتمنى لك سنة جديدة مباركة مملوءة بنعمة وبركة ربنا يسوع المسيح.`
              : `يوافق عيد ميلادك يوم ${info.formattedDateArabic}. سنة جديدة سعيدة في حضن الكنيسة.`}
          </p>
        </div>
      </div>
    </div>
  );
};

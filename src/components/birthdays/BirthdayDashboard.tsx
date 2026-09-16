import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { getBirthdayGroups, BirthdayInfo } from '../../utils/birthdayUtils';
import { 
  Cake, 
  Calendar, 
  Sparkles, 
  Search, 
  Share2, 
  UserCheck, 
  HeartHandshake, 
  ChevronLeft,
  Clock,
  Gift
} from 'lucide-react';

export const BirthdayDashboard: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month' | 'all'>('today');

  const groups = useMemo(() => {
    return getBirthdayGroups(dataStore.users, currentUser);
  }, [currentUser]);

  // Servant name lookup helper
  const getServantName = (servantId?: string) => {
    if (!servantId) return 'غير محدد';
    const servant = dataStore.users.find((u) => u.userId === servantId);
    return servant ? servant.displayName : 'غير محدد';
  };

  const filterList = (list: BirthdayInfo[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter((item) => item.user.displayName.toLowerCase().includes(q));
  };

  const todayList = filterList(groups.today);
  const weekList = filterList(groups.thisWeek);
  const monthList = filterList(groups.thisMonth);
  const allList = filterList(groups.allUpcoming);

  const getActiveList = () => {
    switch (activeTab) {
      case 'today':
        return todayList;
      case 'week':
        return weekList;
      case 'month':
        return monthList;
      case 'all':
        return allList;
      default:
        return todayList;
    }
  };

  const currentDisplayList = getActiveList();

  const getWhatsAppMessage = (item: BirthdayInfo) => {
    const isToday = item.isToday;
    const text = isToday
      ? `كل سنة وأنت طيب يا ${item.user.displayName} بمناسبة عيد ميلادك 🎉! كنيستك وخدمة الشباب بتتمنالك سنة مباركة ومملوءة ببركة ونعمة ربنا يسوع المسيح 🎂✝️`
      : `كل سنة وأنت طيب مقدماً يا ${item.user.displayName} بمناسبة قرب عيد ميلادك يوم ${item.formattedDateArabic} 🎉! سنة جديدة ممتلئة بالسلام والبركة ✝️`;
    return encodeURIComponent(text);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-rose-500/10 via-pink-500/5 to-transparent bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-rose-200/60 dark:border-rose-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Cake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>أعياد ميلاد الشباب</span>
              {groups.today.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  {groups.today.length} اليوم 🎉
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {role === 'servant'
                ? 'متابعة وتفقد أعياد ميلاد الشباب في أسرتك الخدمية لتقديم التهنئة'
                : 'لوحة تفقدية شاملة لأعياد ميلاد شباب الخدمة مع حساب العمر ديناميكياً'}
            </p>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الشاب..."
            className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 text-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'today'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Cake className="w-4 h-4" />
          <span>اليوم</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'today' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700'
          }`}>
            {groups.today.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('week')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'week'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>خلال الأسبوع (7 أيام)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'week' ? 'bg-indigo-800 text-white' : 'bg-indigo-100 text-indigo-700'
          }`}>
            {groups.thisWeek.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('month')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'month'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>خلال هذا الشهر</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            activeTab === 'month' ? 'bg-indigo-800 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {groups.thisMonth.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'all'
              ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>جميع القادمين</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600">
            {groups.allUpcoming.length}
          </span>
        </button>
      </div>

      {/* Cards Grid */}
      {currentDisplayList.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <Cake className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">
            لا توجد أعياد ميلاد مسجلة في هذا التصنيف
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === 'today'
              ? 'لا يوجد شباب يوافق عيد ميلادهم اليوم. تفقد أعياد ميلاد الأسبوع أو الشهر القادمين!'
              : 'تفقد الفئات الأخرى للاطلاع على التواريخ القادمة.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentDisplayList.map((item) => {
            const isToday = item.isToday;
            const targetPhone = item.user.whatsappNumber || item.user.phoneNumber;

            return (
              <div
                key={item.user.userId}
                className={`rounded-3xl p-5 border transition flex flex-col justify-between shadow-xs hover:shadow-md ${
                  isToday
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80 ring-2 ring-rose-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm ${
                          isToday
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        <Cake className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          {item.user.displayName}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-mono block">
                          كود الخدمة: {item.user.userCode}
                        </span>
                      </div>
                    </div>

                    {isToday ? (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white">
                        اليوم 🎉
                      </span>
                    ) : item.daysUntilBirthday <= 7 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        خلال {item.daysUntilBirthday} أيام
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        {item.formattedDateArabic}
                      </span>
                    )}
                  </div>

                  {/* Birthday details */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-slate-100 dark:border-slate-700/60 mb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">العمر المحسوب:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                        {isToday ? `${item.currentAge} سنة` : `يتم ${item.turningAge} سنة`}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">الخادم المسؤول:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                        {getServantName(item.user.assignedServantId)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Congratulate Button */}
                <div className="pt-1">
                  {targetPhone ? (
                    <a
                      href={`https://wa.me/2${targetPhone.replace(/^0+/, '')}?text=${getWhatsAppMessage(item)}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                        isToday
                          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{isToday ? 'إرسال تهنئة اليوم عبر واتساب' : 'إرسال تهنئة عبر واتساب'}</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400 block text-center py-1">
                      لا يوجد رقم هاتف مسجل
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { getEducationStageLabel } from '../../lib/utils';
import { 
  User, 
  Phone, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  Bell, 
  Check, 
  Plus, 
  Trash2, 
  Clock, 
  HeartHandshake,
  Save,
  CheckCircle2
} from 'lucide-react';
import { ScheduleDay, ScheduleActivity, SpiritualReminder } from '../../types';

const DAYS_OF_WEEK: Array<{ key: ScheduleDay; label: string }> = [
  { key: 'sat', label: 'السبت' },
  { key: 'sun', label: 'الأحد' },
  { key: 'mon', label: 'الإثنين' },
  { key: 'tue', label: 'الثلاثاء' },
  { key: 'wed', label: 'الأربعاء' },
  { key: 'thu', label: 'الخميس' },
  { key: 'fri', label: 'الجمعة' },
];

const ACTIVITY_OPTIONS: Array<{ key: ScheduleActivity; label: string; color: string }> = [
  { key: 'available', label: 'متاح', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { key: 'study', label: 'دراسة / امتحانات', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { key: 'work', label: 'عمل / دوام', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { key: 'other', label: 'ظروف أخرى', color: 'bg-slate-200 text-slate-800 border-slate-300' },
];

export const YouthProfile: React.FC = () => {
  const { currentUser, updateCurrentUserProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [whatsappNumber, setWhatsappNumber] = useState(currentUser?.whatsappNumber || '');
  const [faculty, setFaculty] = useState(currentUser?.faculty || '');
  const [academicYear, setAcademicYear] = useState(currentUser?.academicYear || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || '');
  const [workplace, setWorkplace] = useState(currentUser?.workplace || '');
  const [schedule, setSchedule] = useState(
    currentUser?.weeklySchedule || {
      sat: 'available',
      sun: 'study',
      mon: 'study',
      tue: 'study',
      wed: 'study',
      thu: 'available',
      fri: 'available',
    }
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Reminders state
  const [reminders, setReminders] = useState<SpiritualReminder[]>(() => 
    dataStore.reminders.filter((r) => r.userId === currentUser?.userId)
  );
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderFreq, setNewReminderFreq] = useState(30);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCurrentUserProfile({
      displayName,
      nickname,
      whatsappNumber,
      faculty,
      academicYear,
      jobTitle,
      workplace,
      weeklySchedule: schedule,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleActivityChange = (day: ScheduleDay, act: ScheduleActivity) => {
    setSchedule((prev) => ({ ...prev, [day]: act }));
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim() || !currentUser) return;

    const reminder: SpiritualReminder = {
      reminderId: `rem_${Date.now()}`,
      userId: currentUser.userId,
      title: newReminderTitle.trim(),
      frequencyDays: Number(newReminderFreq),
      lastCompletedDate: new Date().toISOString().split('T')[0],
      nextDueDate: new Date(Date.now() + Number(newReminderFreq) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      createdAt: new Date().toISOString(),
    };

    await dataStore.saveReminder(reminder);
    setReminders([reminder, ...reminders]);
    setNewReminderTitle('');
  };

  const handleDeleteReminder = async (id: string) => {
    await dataStore.deleteReminder(id);
    setReminders(reminders.filter((r) => r.reminderId !== id));
  };

  return (
    <div id="youth-profile-view" className="space-y-6 pb-28 max-w-4xl mx-auto px-4 pt-4">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">الملف الشخصي والجدول</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          بياناتك الشخصية ومواعيد فراغك لمساعدة الخدام في تنظيم الافتقاد والتواصل
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>تم حفظ التعديلات بنجاح ✓</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
        
        {/* User Key Info Card */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-black">
            {currentUser?.displayName.charAt(0) || 'ش'}
          </div>
          <div className="text-center sm:text-start flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {currentUser?.displayName}
            </h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1 text-xs text-slate-500">
              <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {currentUser?.userCode}
              </span>
              <span>• المرحلة: {currentUser ? getEducationStageLabel(currentUser.educationStage) : ''}</span>
              <span>• الهاتف: {currentUser?.phoneNumber}</span>
            </div>
          </div>
        </div>

        {/* Basic Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              الاسم الكامل (كما ترغب في ظهوره)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              اسم الشهرة / النداء
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="مثال: مينا، بيشو"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              رقم الواتساب
            </label>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="01xxxxxxxxx"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              الكلية / التخصص الدراسي
            </label>
            <input
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              placeholder="مثال: هندسة، صيدلة، تجارة..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              الفرقة الدراسية
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="مثال: الثالثة، الرابعة..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              الوظيفة / جهة العمل (إن وجدت)
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="مثال: مهندس، محاسب..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

        </div>

        {/* 15. STUDY / WORK SCHEDULE WEEKLY MATRIX */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              جدول الأسبوع (أوقات الفراغ والالتزامات)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              حدد حالتك المعتادة في كل يوم لمساعدة الخادم في التواصل معك بالوقت المناسب
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {DAYS_OF_WEEK.map((day) => {
              const currentVal = schedule[day.key] || 'available';

              return (
                <div
                  key={day.key}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2"
                >
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                    يوم {day.label}
                  </span>
                  <select
                    value={currentVal}
                    onChange={(e) => handleActivityChange(day.key, e.target.value as ScheduleActivity)}
                    className="w-full p-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {ACTIVITY_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition"
          >
            <Save className="w-4 h-4" />
            <span>حفظ التعديلات</span>
          </button>
        </div>

      </form>

      {/* 31. PERSONAL SPIRITUAL REMINDERS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            تذكيراتك الروحية الخاصة
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            تذكيرات خاصة بك بالكامل (مثل: الاستعداد للاعتراف، جلسة هدوء). لا يمكن لأحد الاطلاع على تفاصيلها.
          </p>
        </div>

        {/* Add reminder form */}
        <form onSubmit={handleAddReminder} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newReminderTitle}
            onChange={(e) => setNewReminderTitle(e.target.value)}
            placeholder="عنوان التذكير (مثال: الاستعداد للاعتراف)"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />
          <select
            value={newReminderFreq}
            onChange={(e) => setNewReminderFreq(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value={15}>كل 15 يوماً</option>
            <option value={30}>كل 30 يوماً</option>
            <option value={45}>كل 45 يوماً</option>
            <option value={60}>كل شهرين</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة</span>
          </button>
        </form>

        {/* Reminders List */}
        <div className="space-y-2 pt-2">
          {reminders.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">
              لا توجد تذكيرات مسجلة حتى الآن. يمكنك إضافة تذكير لمتابعة أهدافك الروحية.
            </p>
          ) : (
            reminders.map((rem) => (
              <div
                key={rem.reminderId}
                className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span className="font-bold text-slate-900 dark:text-white">{rem.title}</span>
                  <span className="text-slate-500">• يتكرر كل {rem.frequencyDays} يوماً</span>
                </div>
                <button
                  onClick={() => handleDeleteReminder(rem.reminderId)}
                  className="text-slate-400 hover:text-rose-600 p-1 transition"
                  title="حذف التذكير"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};

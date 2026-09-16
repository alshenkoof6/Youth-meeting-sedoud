import React from 'react';
import { dataStore } from '../../services/dataStore';
import { downloadCSV, getEducationStageLabel } from '../../lib/utils';
import { FileSpreadsheet, Download, CheckCircle2, Users, ClipboardCheck, HeartHandshake } from 'lucide-react';

export const AdminReports: React.FC = () => {
  const exportAllYouth = () => {
    const youth = dataStore.users.filter((u) => u.role === 'youth');
    const rows = youth.map((y, idx) => ({
      الرقم: idx + 1,
      'الكود الكنسي': y.userCode,
      'الاسم الكامل': y.displayName,
      'رقم الهاتف': y.phoneNumber,
      'المرحلة الدراسية': getEducationStageLabel(y.educationStage),
      'الكلية / العمل': y.faculty || y.jobTitle || '-',
      'الخادم المتابع': y.assignedServantName || 'غير مسند',
      'إجمالي مرات الحضور': y.totalAttendances,
      'المواظبة الحالية (Streak)': y.currentStreak,
      'الغياب المتتالي': y.consecutiveAbsences,
      'حالة الافتقاد': y.followUpStatus,
      'رصيد النقاط': y.totalPoints,
    }));
    downloadCSV(rows, 'تقرير_الشباب_الشامل.csv');
  };

  const exportUrgentFollowUp = () => {
    const urgent = dataStore.users.filter((u) => u.role === 'youth' && u.consecutiveAbsences >= 3);
    const rows = urgent.map((y, idx) => ({
      الرقم: idx + 1,
      'الكود الكنسي': y.userCode,
      'الاسم الكامل': y.displayName,
      'رقم الهاتف': y.phoneNumber,
      'مرات الغياب المتتالي': y.consecutiveAbsences,
      'الخادم المسؤول': y.assignedServantName || 'غير مسند',
      'آخر حضور مسجل': y.lastAttendedMeetingDate || 'لم يسجل',
    }));
    downloadCSV(rows, 'كشف_الافتقاد_العاجل.csv');
  };

  const exportAttendanceHistory = () => {
    const rows = dataStore.attendance.map((a, idx) => ({
      الرقم: idx + 1,
      'كود الشاب': a.userCode,
      'اسم الشاب': a.userName,
      'معرف الاجتماع': a.meetingId,
      'وقت التسجيل': a.timestamp,
      'طريقة الحضور': a.method === 'qr_scan' ? 'مسح الكود (QR)' : 'تسجيل يدوي بواسطة خادم',
      'الموثق': a.verifiedByServantName || 'تلقائي',
      'النقاط': a.pointsEarned,
    }));
    downloadCSV(rows, 'سجل_الحضور_التاريخي_الكامل.csv');
  };

  const exportTripBookings = () => {
    const rows = dataStore.tripBookings.map((b, idx) => ({
      الرقم: idx + 1,
      'الرحلة': b.tripTitle,
      'الكود الكنسي': b.userCode,
      'اسم الراكب': b.userName,
      'رقم الهاتف': b.phoneNumber,
      'حالة الاشتراك': b.status === 'confirmed' ? 'مدفوع ومؤكد' : b.status === 'waitlist' ? 'قائمة انتظار' : 'معلق',
      'تاريخ الحجز': b.bookedAt,
    }));
    downloadCSV(rows, 'كشف_حجوزات_الرحلات.csv');
  };

  return (
    <div id="admin-reports-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
          مركز التقارير وتصدير البيانات
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          تصدير ملفات Excel و CSV معتمدة للأمانة العامة، كشوف الأتوبيسات، وتقارير الغياب
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Report 1: Full Youth Directory */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-600">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">الدليل الشامل للشباب</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              يشمل بيانات التواصل، الكود الكنسي، المراحل الدراسية، الخادم المتابع، ورصيد النقاط والمواظبة.
            </p>
          </div>

          <button
            onClick={exportAllYouth}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow"
          >
            <Download className="w-4 h-4" />
            <span>تصدير دليل الشباب (CSV)</span>
          </button>
        </div>

        {/* Report 2: Urgent Follow-up */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-rose-600">
              <HeartHandshake className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">كشف حالات الافتقاد العاجل</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              قائمة الشباب المتغيبين 3 مرات متتالية أو أكثر مع أرقام هواتفهم وأسماء الخدام المسؤولين عنهم.
            </p>
          </div>

          <button
            onClick={exportUrgentFollowUp}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow"
          >
            <Download className="w-4 h-4" />
            <span>تصدير كشف الافتقاد العاجل (CSV)</span>
          </button>
        </div>

        {/* Report 3: Historical Attendance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-blue-600">
              <ClipboardCheck className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">سجل الحضور التاريخي الكامل</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              جميع عمليات مسح الـ QR والتوثيق اليدوي مع التوقيت الدقيق وهوية الخادم الموثق.
            </p>
          </div>

          <button
            onClick={exportAttendanceHistory}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow"
          >
            <Download className="w-4 h-4" />
            <span>تصدير سجل الحضور (CSV)</span>
          </button>
        </div>

        {/* Report 4: Trips Bookings Manifest */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-amber-600">
              <FileSpreadsheet className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">كشف حجوزات الرحلات والأتوبيسات</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              قوائم الركاب المعتمدة لكل رحلة مع حالة سداد الاشتراك وقوائم الانتظار.
            </p>
          </div>

          <button
            onClick={exportTripBookings}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow"
          >
            <Download className="w-4 h-4" />
            <span>تصدير كشف الرحلات (CSV)</span>
          </button>
        </div>

      </div>

    </div>
  );
};

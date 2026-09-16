import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { formatArabicDate, formatArabicTime, downloadCSV } from '../../lib/utils';
import { 
  ClipboardCheck, 
  Search, 
  Download, 
  CheckCircle2, 
  UserPlus, 
  Filter, 
  RefreshCw,
  QrCode,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { AttendanceRecord, Meeting, UserProfile } from '../../types';

export const AdminAttendance: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(
    dataStore.meetings.find((m) => m.status === 'active')?.meetingId || dataStore.meetings[0]?.meetingId || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'qr_scan' | 'manual_servant'>('all');
  
  // Manual check-in modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectedMeeting = dataStore.meetings.find((m) => m.meetingId === selectedMeetingId);

  // Filter attendance records for chosen meeting
  const records = dataStore.attendance.filter((a) => a.meetingId === selectedMeetingId);

  const filteredRecords = records.filter((r) => {
    const matchesSearch = 
      r.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = methodFilter === 'all' || r.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  // Manual Check-in candidate list
  const youthCandidates = dataStore.users.filter((u) => {
    if (u.role !== 'youth') return false;
    const alreadyAttended = records.some((r) => r.userId === u.userId);
    if (alreadyAttended) return false;
    if (!manualSearch.trim()) return true;
    return (
      u.displayName.toLowerCase().includes(manualSearch.toLowerCase()) ||
      u.userCode.toLowerCase().includes(manualSearch.toLowerCase()) ||
      u.phoneNumber.includes(manualSearch)
    );
  });

  const handleManualCheckIn = async (user: UserProfile) => {
    if (!selectedMeeting) return;

    const res = await dataStore.recordAttendance(
      user.userId,
      selectedMeeting.meetingId,
      'manual_servant',
      currentUser?.displayName || 'خادم معتمد'
    );

    if (res.success) {
      setActionNotice(`تم تسجيل حضور ${user.displayName} بنجاح (+10 نقاط)`);
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleExportAttendanceCSV = () => {
    if (!selectedMeeting) return;

    const rows = filteredRecords.map((r, index) => ({
      الرقم: index + 1,
      'كود الشاب': r.userCode,
      'الاسم': r.userName,
      'وقت التسجيل': formatArabicTime(r.timestamp.split('T')[1]?.slice(0, 5) || '19:30'),
      'طريقة التحقق': r.method === 'qr_scan' ? 'مسح الكود (QR)' : 'تسجيل يدوي بواسطة خادم',
      'الموثق': r.verifiedByServantName || 'النظام الذكي',
      'النقاط الممنوحة': r.pointsEarned,
    }));

    downloadCSV(rows, `حضور_${selectedMeeting.title}_${selectedMeeting.date}.csv`);
  };

  return (
    <div id="admin-attendance-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">سجل الحضور المباشر</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            مراقبة وتوثيق الحضور اللحظي، التحقق اليدوي للحالات الخاصة، وتصدير الكشوف
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>تسجيل يدوي لخادم</span>
          </button>

          <button
            onClick={handleExportAttendanceCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير كشف الحضور (Excel / CSV)</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Meeting Select Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Meeting Dropdown */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
            اختر الاجتماع:
          </span>
          <select
            value={selectedMeetingId}
            onChange={(e) => setSelectedMeetingId(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
          >
            {dataStore.meetings.map((m) => (
              <option key={m.meetingId} value={m.meetingId}>
                {m.title} ({m.date}) - {m.attendanceCount} حاضر
              </option>
            ))}
          </select>
        </div>

        {/* Search & Method filters */}
        <div className="w-full md:w-auto flex flex-1 max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الكود..."
              className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
            />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
          >
            <option value="all">كل الطرق</option>
            <option value="qr_scan">مسح الكود (QR)</option>
            <option value="manual_servant">تسجيل يدوي</option>
          </select>
        </div>

      </div>

      {/* Attendance Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              قائمة الحضور المسجل ({filteredRecords.length})
            </h3>
          </div>
          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
            تحديث لحظي مفعل ✓
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-start">الكود الكنسي</th>
                <th className="py-3.5 px-4 text-start">اسم الشاب</th>
                <th className="py-3.5 px-4 text-start">وقت الحضور</th>
                <th className="py-3.5 px-4 text-start">طريقة التسجيل</th>
                <th className="py-3.5 px-4 text-start">النقاط</th>
                <th className="py-3.5 px-4 text-start">التوثيق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    لا توجد سجلات حضور مطابقة لهذا الاجتماع حتى الآن.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec, idx) => (
                  <tr key={rec.attendanceId || `${rec.meetingId}_${rec.userId}_${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {rec.userCode}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {rec.userName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {formatArabicTime(rec.timestamp.split('T')[1]?.slice(0, 5) || '19:30')}
                    </td>
                    <td className="py-3.5 px-4">
                      {rec.method === 'qr_scan' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                          <QrCode className="w-3 h-3" />
                          مسح الكود (QR)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3 h-3" />
                          تسجيل يدوي بواسطة خادم
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">
                      +{rec.pointsEarned ?? rec.pointsAwarded ?? 10} نقطة
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {rec.verifiedByServantName || 'النظام الذكي'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MANUAL CHECK-IN MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  تسجيل حضور يدوي (استثناء خادم)
                </h3>
                <p className="text-xs text-slate-500">
                  للحالات التي تعذر فيها مسح الكود (نفاد بطارية الهاتف، هاتف معطل...)
                </p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>

            {/* Search Youth in Modal */}
            <div className="py-3">
              <input
                type="text"
                value={manualSearch}
                onChange={(e) => setManualSearch(e.target.value)}
                placeholder="ابحث بالاسم أو رقم الهاتف أو الكود..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                autoFocus
              />
            </div>

            {/* Candidate List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
              {youthCandidates.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  لا يوجد شباب غير حاضرين يطابقون هذا البحث.
                </p>
              ) : (
                youthCandidates.slice(0, 8).map((user) => (
                  <div
                    key={user.userId}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {user.displayName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {user.userCode} • {user.phoneNumber}
                      </span>
                    </div>

                    <button
                      onClick={() => handleManualCheckIn(user)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-sm"
                    >
                      تسجيل الحضور
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

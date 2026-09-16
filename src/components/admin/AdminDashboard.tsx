import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { 
  Users, 
  UserCheck, 
  ClipboardCheck, 
  HeartHandshake, 
  Bus, 
  MessageSquare, 
  Star, 
  QrCode, 
  AlertTriangle, 
  ArrowUpRight,
  Sparkles,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface AdminDashboardProps {
  setActiveView: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setActiveView }) => {
  const { role, currentUser } = useAuth();
  
  const totalYouth = dataStore.users.filter((u) => u.role === 'youth').length;
  const activeYouth = dataStore.users.filter((u) => u.role === 'youth' && u.consecutiveAbsences < 3).length;
  const activeMeeting = dataStore.meetings.find((m) => m.status === 'active') || dataStore.meetings[0];
  const totalAttendance = activeMeeting ? activeMeeting.attendanceCount : 97;
  
  // Follow-up breakdown
  const urgentRed = dataStore.users.filter((u) => u.role === 'youth' && u.followUpStatus === 'urgent').length;
  const needsOrange = dataStore.users.filter((u) => u.role === 'youth' && u.followUpStatus === 'needs_followup').length;
  const irregularYellow = dataStore.users.filter((u) => u.role === 'youth' && u.followUpStatus === 'irregular').length;
  const totalFollowUpNeeded = urgentRed + needsOrange + irregularYellow;

  // Servant scoped youth count
  const myAssignedYouth = currentUser?.role === 'servant'
    ? dataStore.users.filter((u) => u.assignedServantId === currentUser.userId)
    : [];

  // Attendance Chart Mock Data
  const attendanceTrends = [
    { meeting: '15 أغسطس', count: 78 },
    { meeting: '22 أغسطس', count: 85 },
    { meeting: '29 أغسطس', count: 91 },
    { meeting: '5 سبتمبر', count: 94 },
    { meeting: '10 سبتمبر', count: 97 },
    { meeting: '17 سبتمبر (اليوم)', count: 104 },
  ];

  const followUpChartData = [
    { name: 'عاجل (4+ غياب)', count: urgentRed, color: '#f43f5e' },
    { name: 'يحتاج افتقاد (3)', count: needsOrange, color: '#f97316' },
    { name: 'غير منتظم (2)', count: irregularYellow, color: '#eab308' },
    { name: 'منتظم', count: totalYouth - totalFollowUpNeeded, color: '#10b981' },
  ];

  return (
    <div id="admin-dashboard-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-400/20">
              {role === 'admin' ? 'لوحة تحكم الأمانة العامة' : 'لوحة متابعة وافتقاد الخادم'}
            </span>
            <span className="text-xs text-slate-400">• متابعة مباشرة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            لوحة متابعة الخدمة والاجتماع
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            نظرة شاملة على الحضور اللحظي، مؤشرات الغياب المبكر، وتنظيم لجان الرحلات والأنشطة.
          </p>
        </div>

        {/* Live Projector Screen Shortcut */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveView('admin-meetings')}
            className="flex items-center gap-2 px-4 py-3 bg-white text-indigo-950 font-black rounded-2xl text-xs hover:bg-slate-100 shadow-md transition"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>عرض كود الحضور (بروجكتور)</span>
          </button>
          
          <button
            onClick={() => setActiveView('admin-followup')}
            className="flex items-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs shadow-md transition"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>قائمة الافتقاد العاجل ({urgentRed})</span>
          </button>
        </div>
      </div>

      {/* Servant Specific Notice (if role === servant) */}
      {role === 'servant' && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-blue-900 dark:text-blue-200">
              أنت تتابع حالياً {myAssignedYouth.length} مخدوماً في أسرتك
            </span>
          </div>
          <button 
            onClick={() => setActiveView('admin-youth')}
            className="text-blue-700 font-bold underline"
          >
            عرض مخدوميك فقط
          </button>
        </div>
      )}

      {/* Primary KPI Metric Cards (Prompt #32 Exact Figures) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Total Youth */}
        <div 
          onClick={() => setActiveView('admin-youth')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm cursor-pointer hover:border-indigo-300 transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">إجمالي الشباب</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{totalYouth}</span>
          <span className="text-[10px] text-emerald-600 block mt-1">مسجلين بالنظام</span>
        </div>

        {/* Active Youth */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">الشباب المتفاعل</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{activeYouth}</span>
          <span className="text-[10px] text-slate-500 block mt-1">حضروا مؤخراً</span>
        </div>

        {/* Meeting Attendance */}
        <div 
          onClick={() => setActiveView('admin-attendance')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm cursor-pointer hover:border-indigo-300 transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">حضور الاجتماع</span>
            <ClipboardCheck className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{totalAttendance}</span>
          <span className="text-[10px] text-indigo-600 block mt-1">مسجل إلكترونياً</span>
        </div>

        {/* Follow-up needed */}
        <div 
          onClick={() => setActiveView('admin-followup')}
          className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 p-4 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition"
        >
          <div className="flex items-center justify-between text-rose-500 mb-2">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300">بحاجة لافتقاد</span>
            <HeartHandshake className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-black text-rose-900 dark:text-rose-200">{totalFollowUpNeeded}</span>
          <span className="text-[10px] text-rose-700 dark:text-rose-400 block mt-1">منهم {urgentRed} عاجل</span>
        </div>

        {/* Upcoming Trips */}
        <div 
          onClick={() => setActiveView('admin-trips')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm cursor-pointer hover:border-indigo-300 transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">الرحلات القادمة</span>
            <Bus className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">2</span>
          <span className="text-[10px] text-slate-500 block mt-1">الحجز مفتوح</span>
        </div>

        {/* Points Distributed */}
        <div 
          onClick={() => setActiveView('admin-rewards')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm cursor-pointer hover:border-indigo-300 transition"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">نقاط التشجيع</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">8,420</span>
          <span className="text-[10px] text-indigo-600 block mt-1">تم توزيعها</span>
        </div>

      </div>

      {/* Analytics Visualizers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Attendance Trends Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                معدل نمو الحضور عبر الاجتماعات
              </h2>
              <p className="text-xs text-slate-500">مؤشر الالتزام والمواظبة في آخر 6 أسابيع</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              +14% هذا الشهر
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="meeting" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    color: '#fff', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    border: 'none'
                  }} 
                />
                <Area type="monotone" dataKey="count" name="عدد الحاضرين" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#attendanceColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Follow-up Urgency Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              توزيع حالات المتابعة والغياب
            </h2>
            <p className="text-xs text-slate-500">حسب عدد مرات الغياب المتتالية</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-600" />
                <span className="text-xs font-bold text-rose-950 dark:text-rose-200">افتقاد عاجل (4+ غياب)</span>
              </div>
              <span className="text-sm font-black text-rose-900 dark:text-rose-200">{urgentRed} شباب</span>
            </div>

            <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-xs font-bold text-orange-950 dark:text-orange-200">يحتاج متابعة (3 غياب)</span>
              </div>
              <span className="text-sm font-black text-orange-900 dark:text-orange-200">{needsOrange} شباب</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200">غياب مرتين متتاليتين</span>
              </div>
              <span className="text-sm font-black text-amber-900 dark:text-amber-200">{irregularYellow} شباب</span>
            </div>

            <button
              onClick={() => setActiveView('admin-followup')}
              className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>فتح لوحة الافتقاد الكاملة</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

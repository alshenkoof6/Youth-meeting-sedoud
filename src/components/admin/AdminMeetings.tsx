import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { generateRotatingToken } from '../../lib/qrCrypto';
import { formatArabicDate, formatArabicTime } from '../../lib/utils';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  QrCode, 
  Maximize2, 
  Minimize2, 
  Users, 
  RefreshCw, 
  Play, 
  Square, 
  Plus, 
  CheckCircle2, 
  Download,
  AlertCircle,
  Eye,
  KeyRound
} from 'lucide-react';
import { Meeting } from '../../types';

export const AdminMeetings: React.FC = () => {
  const { role } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>(dataStore.meetings);
  const [activeMeeting, setActiveMeeting] = useState<Meeting>(
    dataStore.meetings.find((m) => m.status === 'active') || dataStore.meetings[0]
  );
  
  // Fullscreen / Projector Mode
  const [isProjectorMode, setIsProjectorMode] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [liveAttendanceCount, setLiveAttendanceCount] = useState<number>(activeMeeting?.attendanceCount || 0);

  // New Meeting Modal
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSpeaker, setNewSpeaker] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('19:30');
  const [newEndTime, setNewEndTime] = useState('21:30');
  const [newLocation, setNewLocation] = useState('قاعة مارمرقس الكبرى');

  // Rotate QR code every 30 seconds
  useEffect(() => {
    if (!activeMeeting) return;

    const updateQRCode = async () => {
      const epochSeconds = Math.floor(Date.now() / 1000);
      const remaining = 30 - (epochSeconds % 30);
      setSecondsRemaining(remaining);

      // Generate dynamic encrypted/hashed token for current 30-sec window
      const token = generateRotatingToken(activeMeeting.meetingId, activeMeeting.qrSecretToken);
      const payload = JSON.stringify({
        m: activeMeeting.meetingId,
        t: token,
        e: Math.floor(epochSeconds / 30),
      });

      try {
        const url = await QRCode.toDataURL(payload, {
          width: 480,
          margin: 1,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code', err);
      }
    };

    updateQRCode();
    const interval = setInterval(updateQRCode, 1000);

    // Subscribe to live attendance updates
    const unsub = dataStore.subscribe(() => {
      setMeetings([...dataStore.meetings]);
      const current = dataStore.meetings.find((m) => m.meetingId === activeMeeting.meetingId);
      if (current) {
        setLiveAttendanceCount(current.attendanceCount);
      }
    });

    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [activeMeeting]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsProjectorMode(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsProjectorMode(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const meeting: Meeting = {
      meetingId: `mtg_${Date.now()}`,
      title: newTitle.trim(),
      description: 'اجتماع شباب أسبوعي',
      speaker: newSpeaker.trim() || undefined,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      location: newLocation,
      status: 'scheduled',
      qrSecretToken: `SEC_${Math.floor(100000 + Math.random() * 900000)}`,
      qrValidFrom: newStartTime,
      qrValidUntil: newEndTime,
      qrExpiryMinutes: 120,
      pointsAwarded: 10,
      attendanceCount: 0,
      createdBy: 'admin',
      createdAt: new Date().toISOString(),
    };

    await dataStore.createMeeting(meeting);
    setMeetings([...dataStore.meetings]);
    setShowNewMeetingModal(false);
    setNewTitle('');
    setNewSpeaker('');
  };

  const handleToggleMeetingStatus = async (meeting: Meeting) => {
    const nextStatus: 'active' | 'completed' = meeting.status === 'active' ? 'completed' : 'active';
    const updated: Meeting = { ...meeting, status: nextStatus };
    await dataStore.updateMeeting(updated);
    setMeetings([...dataStore.meetings]);
    if (nextStatus === 'active') {
      setActiveMeeting(updated);
    }
  };

  // -------------------------------------------------------------
  // FULLSCREEN / PROJECTOR MODE VIEW
  // -------------------------------------------------------------
  if (isProjectorMode) {
    return (
      <div 
        id="projector-fullscreen-view"
        className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-between p-8 sm:p-12 select-none overflow-hidden"
      >
        {/* Top Header */}
        <div className="w-full max-w-6xl flex items-center justify-between border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <span className="text-sm font-bold text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/50 inline-block">
              اجتماع الشباب • كود الحضور التفاعلي
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {activeMeeting.title}
            </h1>
            {activeMeeting.speaker && (
              <p className="text-lg text-slate-300">
                المتحدث: <strong className="text-white">{activeMeeting.speaker}</strong>
              </p>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Real-time live counter pill */}
            <div className="bg-emerald-950/80 border-2 border-emerald-500/60 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-lg shadow-emerald-950">
              <div className="w-4 h-4 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <span className="text-xs font-semibold text-emerald-300 block">الحاضرين الآن بالقاعة</span>
                <span className="text-3xl font-black text-emerald-100">{liveAttendanceCount}</span>
              </div>
            </div>

            {/* Exit button */}
            <button
              onClick={toggleFullscreen}
              className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition"
              title="الخروج من وضع البروجكتور"
            >
              <Minimize2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Center: Large High-Contrast QR Display */}
        <div className="flex flex-col items-center justify-center my-auto space-y-6">
          <div className="p-6 bg-white rounded-3xl shadow-[0_0_80px_rgba(99,102,241,0.25)] border-4 border-indigo-400 relative">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="كود الحضور"
                className="w-72 h-72 sm:w-96 sm:h-96 rounded-2xl"
              />
            ) : (
              <div className="w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center text-slate-400">
                جاري توليد الكود...
              </div>
            )}

            {/* Corner Indicators */}
            <div className="absolute -top-3 -right-3 px-3 py-1 bg-indigo-600 text-white font-mono font-bold text-xs rounded-full shadow">
              كود ديناميكي متجدد
            </div>
          </div>

          {/* Countdown timer & Instructions */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 text-sm font-semibold bg-indigo-950/70 px-4 py-2 rounded-full border border-indigo-800/40">
              <RefreshCw className={`w-4 h-4 ${secondsRemaining < 5 ? 'animate-spin text-amber-400' : ''}`} />
              <span>يتجدد الكود بعد: <strong className="text-white font-mono text-base">{secondsRemaining}</strong> ثانية</span>
            </div>

            <p className="text-xl font-bold text-slate-200">
              افتح تطبيق اجتماع الشباب ووجّه كاميرا الموبايل نحو الكود لتسجيل الحضور فوراً
            </p>

            <p className="text-xs text-slate-400 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" />
              <span>كود الإدخال اليدوي للطوارئ: <strong className="font-mono text-white text-sm">ATTEND2026</strong></span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500">
          منصة اجتماع الشباب • نظام الحضور الذكي المانع لمشاركة الصور
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STANDARD ADMIN VIEW
  // -------------------------------------------------------------
  return (
    <div id="admin-meetings-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">إدارة الاجتماعات وكود الشاشة</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            عرض كود البروجكتور عالي التباين، جدولة الاجتماعات الجديدة، ورصد الحضور اللحظي
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {role === 'admin' ? (
            <button
              onClick={() => setShowNewMeetingModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>جدولة اجتماع جديد (أمين الخدمة)</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl font-medium">
              صلاحية إنشاء الاجتماعات لأمين الخدمة فقط
            </span>
          )}
        </div>
      </div>

      {/* Active Meeting Projector Preview Box */}
      {activeMeeting && (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/30">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            
            <div className="space-y-3 flex-1 text-center lg:text-start">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  الاجتماع المختار للعرض
                </span>
                <span className="text-xs text-slate-400">
                  {formatArabicDate(activeMeeting.date)}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {activeMeeting.title}
              </h2>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  {formatArabicTime(activeMeeting.startTime)} - {formatArabicTime(activeMeeting.endTime)}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  {activeMeeting.location}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <Users className="w-4 h-4" />
                  {liveAttendanceCount} حاضرين الآن
                </span>
              </div>

              <p className="text-xs text-slate-400 max-w-xl">
                يتم تجديد كود الاستجابة السريعة كل 30 ثانية بتشفير متزامن لمنع تصوير الشاشة وتمريرها.
              </p>

              {/* Big Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-2 px-5 py-3 bg-white text-indigo-950 font-black rounded-2xl text-xs hover:bg-slate-100 shadow-md transition transform active:scale-95"
                >
                  <Maximize2 className="w-4 h-4 text-indigo-600" />
                  <span>فتح وضع البروجكتور والشاشة الكبيرة</span>
                </button>

                <button
                  onClick={() => handleToggleMeetingStatus(activeMeeting)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold transition ${
                    activeMeeting.status === 'active'
                      ? 'bg-rose-600/80 hover:bg-rose-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {activeMeeting.status === 'active' ? (
                    <>
                      <Square className="w-4 h-4" />
                      <span>إنهاء جلسة الحضور</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>تفعيل الحضور الآن</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* QR Preview Mini Card */}
            <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 text-center shrink-0">
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="كود الحضور"
                  className="w-44 h-44 rounded-xl mx-auto"
                />
              )}
              <div className="mt-2 text-[11px] font-semibold text-slate-600 flex items-center justify-center gap-1">
                <RefreshCw className="w-3 h-3 text-indigo-600 animate-spin" />
                <span>يتجدد بعد {secondsRemaining}ث</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Meetings History & Management Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            سجل الاجتماعات والمواعيد
          </h3>
          <span className="text-xs text-slate-400">إجمالي {meetings.length} اجتماع</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-start">عنوان الاجتماع</th>
                <th className="py-3.5 px-4 text-start">التاريخ والوقت</th>
                <th className="py-3.5 px-4 text-start">المتحدث</th>
                <th className="py-3.5 px-4 text-start">الحاضرين</th>
                <th className="py-3.5 px-4 text-start">الحالة</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {meetings.map((m, idx) => (
                <tr key={m.meetingId || `mtg_${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {m.title}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {m.date} ({m.startTime})
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {m.speaker || '-'}
                  </td>
                  <td className="py-3.5 px-4 font-black text-indigo-600 dark:text-indigo-400">
                    {m.attendanceCount} حاضر
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                      m.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : m.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {m.status === 'active' ? 'مفتوح الآن' : m.status === 'scheduled' ? 'مجدول' : 'منتهي'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => {
                        setActiveMeeting(m);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3 py-1 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-[11px] transition"
                    >
                      اختيار للعرض
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW MEETING MODAL */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              جدولة اجتماع جديد
            </h3>

            <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">عنوان الاجتماع</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: كيف أكتشف دعوتي ورسالتي؟"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">المتحدث</label>
                <input
                  type="text"
                  value={newSpeaker}
                  onChange={(e) => setNewSpeaker(e.target.value)}
                  placeholder="مثال: القس يوحنا ميخائيل"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">التاريخ</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">المكان</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">وقت البدء</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">وقت الانتهاء</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewMeetingModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  إنشاء الاجتماع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

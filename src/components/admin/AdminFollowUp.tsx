import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { formatArabicDate } from '../../lib/utils';
import { 
  HeartHandshake, 
  Phone, 
  MessageCircle, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  User, 
  Plus, 
  Search, 
  Filter,
  Lock,
  ChevronDown
} from 'lucide-react';
import { FollowUpRecord, FollowUpStatus, FollowUpType, UserProfile } from '../../types';

export const AdminFollowUp: React.FC = () => {
  const { currentUser, role } = useAuth();
  
  const [statusFilter, setStatusFilter] = useState<string>('all_urgent');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMyAssigned, setOnlyMyAssigned] = useState(role === 'servant');
  
  // Follow-up logging modal
  const [selectedYouth, setSelectedYouth] = useState<UserProfile | null>(null);
  const [logType, setLogType] = useState<FollowUpType>('phone_call');
  const [logOutcome, setLogOutcome] = useState('reached_encouraged');
  const [logNotes, setLogNotes] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Youth list
  const youthList = dataStore.users.filter((u) => {
    if (u.role !== 'youth') return false;
    
    // Scoped to servant if toggled
    if (onlyMyAssigned && currentUser) {
      if (u.assignedServantId !== currentUser.userId) return false;
    }

    // Status filter
    if (statusFilter === 'all_urgent') {
      if (u.consecutiveAbsences < 2) return false;
    } else if (statusFilter === 'urgent') {
      if (u.followUpStatus !== 'urgent') return false;
    } else if (statusFilter === 'needs_followup') {
      if (u.followUpStatus !== 'needs_followup') return false;
    } else if (statusFilter === 'irregular') {
      if (u.followUpStatus !== 'irregular') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        u.displayName.toLowerCase().includes(q) ||
        u.userCode.toLowerCase().includes(q) ||
        u.phoneNumber.includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Recent logs
  const followUpLogs = dataStore.followUps;

  const handleOpenLogModal = (youth: UserProfile) => {
    setSelectedYouth(youth);
    setLogType('phone_call');
    setLogOutcome('reached_encouraged');
    setLogNotes('');
    setIsConfidential(false);
  };

  const handleSaveFollowUpLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYouth || !currentUser) return;

    const recordId = `flw_${Date.now()}`;
    const record: FollowUpRecord = {
      followupId: recordId,
      recordId,
      userId: selectedYouth.userId,
      userName: selectedYouth.displayName,
      servantId: currentUser.userId,
      servantName: currentUser.displayName,
      date: new Date().toISOString().split('T')[0],
      type: logType,
      outcome: logOutcome,
      notes: logNotes.trim() || undefined,
      isConfidential,
      createdAt: new Date().toISOString(),
    };

    await dataStore.logFollowUp(record);
    setActionNotice(`تم توثيق افتقاد ${selectedYouth.displayName} بنجاح`);
    setSelectedYouth(null);
    setTimeout(() => setActionNotice(null), 3000);
  };

  return (
    <div id="admin-followup-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-rose-600" />
            نظام الافتقاد ومتابعة الغياب
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            رصد الغياب المبكر، الاطلاع على مواعيد فراغ المخدوم، وتوثيق نتائج الافتقاد بسرية
          </p>
        </div>

        {/* Quick status counters */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-200">
            أحمر: 4+ غياب
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 font-bold border border-orange-200">
            برتقالي: 3 غياب
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200">
            أصفر: 2 غياب
          </span>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Toggle Scope: My assigned vs All */}
        {role === 'servant' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyMyAssigned}
                onChange={(e) => setOnlyMyAssigned(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span>عرض مخدوميني المسندين لي فقط</span>
            </label>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all_urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === 'all_urgent'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            كل الغائبين (2+ غياب)
          </button>
          <button
            onClick={() => setStatusFilter('urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === 'urgent'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            عاجل (4+ غياب)
          </button>
          <button
            onClick={() => setStatusFilter('needs_followup')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === 'needs_followup'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            يحتاج متابعة (3)
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الهاتف..."
            className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
          />
        </div>

      </div>

      {/* Youth Follow-up Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {youthList.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <HeartHandshake className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold">نشكر الله، لا يوجد شباب غائبون وفقاً لهذه الفلاتر</p>
          </div>
        ) : (
          youthList.map((youth) => {
            const isUrgent = youth.consecutiveAbsences >= 4;
            const isNeeds = youth.consecutiveAbsences === 3;
            const badgeColor = isUrgent 
              ? 'bg-rose-100 text-rose-800 border-rose-300' 
              : isNeeds 
              ? 'bg-orange-100 text-orange-800 border-orange-300' 
              : 'bg-amber-100 text-amber-800 border-amber-300';

            const whatsappMessage = encodeURIComponent(
              `سلام ونعمة يا ${youth.nickname || youth.displayName.split(' ')[0]}، بنطمن عليك وافتقدناك جداً في إجتماع الشباب بكنيسة السيدة العذراء مريم بسدود. يارب تكون بألف خير!`
            );

            return (
              <div
                key={youth.userId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {youth.displayName}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500">
                        {youth.userCode} • {youth.phoneNumber}
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badgeColor}`}>
                      غياب {youth.consecutiveAbsences} متتالي
                    </span>
                  </div>

                  {/* Assigned Servant & Faculty */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
                    <p>
                      الخادم المتابع: <strong className="text-slate-900 dark:text-white">{youth.assignedServantName || 'غير مسند'}</strong>
                    </p>
                    {youth.faculty && (
                      <p>الدراسة: {youth.faculty} {youth.academicYear ? `(${youth.academicYear})` : ''}</p>
                    )}
                    {youth.lastAttendedMeetingDate && (
                      <p className="text-[11px] text-slate-400">
                        آخر حضور: {formatArabicDate(youth.lastAttendedMeetingDate)}
                      </p>
                    )}
                  </div>

                  {/* Weekly Schedule Sneak Peek (best time to call) */}
                  {youth.weeklySchedule && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                        أفضل أيام التفرغ:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(youth.weeklySchedule)
                          .filter(([_, status]) => status === 'available')
                          .map(([day]) => (
                            <span
                              key={day}
                              className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200"
                            >
                              {day === 'sat' ? 'السبت' : day === 'sun' ? 'الأحد' : day === 'mon' ? 'الإثنين' : day === 'tue' ? 'الثلاثاء' : day === 'wed' ? 'الأربعاء' : day === 'thu' ? 'الخميس' : 'الجمعة'}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Communication & Log Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Direct Call */}
                    <a
                      href={`tel:${youth.phoneNumber}`}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition"
                      title="اتصال هاتفي"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </a>

                    {/* Pre-composed WhatsApp */}
                    <a
                      href={`https://wa.me/${youth.whatsappNumber || youth.phoneNumber}?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 transition"
                      title="مراسلة واتساب دافئة"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                    </a>
                  </div>

                  {/* Log Follow-up Button */}
                  <button
                    onClick={() => handleOpenLogModal(youth)}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>توثيق الافتقاد</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recent Follow-up Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm pt-2">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            سجل الافتقادات الموثقة مؤخراً ({followUpLogs.length})
          </h3>
          <span className="text-xs text-slate-400">محفوظة ومؤمنة سحابياً</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 text-start">الشاب المفتقد</th>
                <th className="py-3 px-4 text-start">الخادم القائم بالافتقاد</th>
                <th className="py-3 px-4 text-start">التاريخ</th>
                <th className="py-3 px-4 text-start">الوسيلة</th>
                <th className="py-3 px-4 text-start">النتيجة</th>
                <th className="py-3 px-4 text-start">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {followUpLogs.map((log, index) => {
                const uniqueKey = log.followupId || log.recordId || `log_${log.youthId || log.userId || 'item'}_${log.date || ''}_${index}`;
                const name = log.userName || log.youthName || 'مخدوم';
                const methodLabel = 
                  log.type === 'phone_call' || log.contactMethod === 'phone' ? 'مكالمة هاتفية' :
                  log.type === 'whatsapp' || log.contactMethod === 'whatsapp' ? 'واتساب' :
                  log.type === 'visit' || log.contactMethod === 'in_person' ? 'زيارة منزلية' :
                  'مقابلة بالكنيسة';
                const outcomeLabel = log.outcome || (
                  log.status === 'study' ? 'مشغول بالدراسة' :
                  log.status === 'work' ? 'ظروف عمل' :
                  log.status === 'traveling' ? 'سفر' :
                  log.status === 'contacted' ? 'تم التواصل' :
                  log.status === 'health' ? 'ظروف صحية' :
                  'تم الافتقاد'
                );
                const notesContent = log.notes || log.generalNotes || '-';

                return (
                  <tr key={uniqueKey} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {log.servantName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {log.date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {methodLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-emerald-700 dark:text-emerald-400 font-medium">
                      {outcomeLabel}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {log.isConfidential ? (
                        role === 'admin' || log.servantId === currentUser?.userId ? (
                          <span className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{notesContent || 'ملاحظة سرية'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                            <Lock className="w-3 h-3" />
                            سري ومحمي (خاص بأمين الخدمة والخادم)
                          </span>
                        )
                      ) : (
                        notesContent
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG FOLLOW-UP MODAL */}
      {selectedYouth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                توثيق افتقاد: {selectedYouth.displayName}
              </h3>
              <button
                onClick={() => setSelectedYouth(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>

            <form onSubmit={handleSaveFollowUpLog} className="space-y-4 text-xs">
              
              {/* Type */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">طريقة الافتقاد</label>
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value as FollowUpType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="phone_call">مكالمة هاتفية</option>
                  <option value="whatsapp">محادثة واتساب</option>
                  <option value="visit">افتفاد منزلي / زيارة</option>
                  <option value="church_encounter">مقابلة في الكنيسة / القداس</option>
                </select>
              </div>

              {/* Outcome */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">النتيجة والرد</label>
                <select
                  value={logOutcome}
                  onChange={(e) => setLogOutcome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="تم الاطمئنان ووعد بالحضور القادم">تم الاطمئنان ووعد بالحضور القادم</option>
                  <option value="مشغول بالامتحانات والمذاكرة">مشغول بالامتحانات والمذاكرة</option>
                  <option value="ظروف عمل ودوام متأخر">ظروف عمل ودوام متأخر</option>
                  <option value="مسافر خارج المحافظة / البلد">مسافر خارج المحافظة / البلد</option>
                  <option value="وعكة صحية / يحتاج صلاة">وعكة صحية / يحتاج صلاة</option>
                  <option value="لم يتم الرد (إعادة المحاولة لاحقاً)">لم يتم الرد (إعادة المحاولة لاحقاً)</option>
                  <option value="ظروف نفسية أو شخصية خاصة">ظروف نفسية أو شخصية خاصة</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">ملاحظات الافتقاد</label>
                <textarea
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="اكتب خلاصة المكالمة أو ما تم الاتفاق عليه..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none focus:outline-none"
                />
              </div>

              {/* Confidential checkbox */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 dark:text-slate-400">تعليم كملاحظة سرية (تظهر للأمين والكاهن فقط)</span>
                <input
                  type="checkbox"
                  checked={isConfidential}
                  onChange={(e) => setIsConfidential(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedYouth(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  حفظ وتوثيق
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

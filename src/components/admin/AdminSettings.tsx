import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { 
  Sliders, 
  ShieldCheck, 
  Award, 
  History, 
  CheckCircle2, 
  Save, 
  AlertCircle,
  Database,
  Lock
} from 'lucide-react';
import { SystemSettings, AuditLog } from '../../types';

export const AdminSettings: React.FC = () => {
  const { currentUser, role } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>(dataStore.settings);
  const [auditLogs] = useState<AuditLog[]>(dataStore.auditLogs);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'thresholds' | 'points' | 'audit'>('thresholds');

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await dataStore.updateSettings(settings);
    if (currentUser) {
      await dataStore.logAudit({
        actorId: currentUser.userId,
        actorName: currentUser.displayName,
        actorRole: role,
        action: 'تحديث معايير الافتقاد ونظام النقاط بالخدمة',
        targetCollection: 'settings',
        targetId: 'general',
        details: settings
      });
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div id="admin-settings-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-600" />
            إعدادات الخدمة وسجل التدقيق
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ضبط معايير تنبيهات الغياب، وتوزيع نقاط التحفيز، ومراقبة سجل العمليات الإدارية (Audit Logs)
          </p>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>تم حفظ المعايير بنجاح وتفعيلها في محرك المتابعة!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('thresholds')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'thresholds'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>حدود ومستويات الافتقاد التلقائي</span>
        </button>

        <button
          onClick={() => setActiveTab('points')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'points'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>قواعد نقاط التحفيز (Points)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل التدقيق الإداري (Audit Logs)</span>
        </button>
      </div>

      {/* Tab 1: Follow-up Thresholds */}
      {activeTab === 'thresholds' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              تحديد حدود تصنيف غياب الشباب
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              يستخدم النظام هذه الأرقام لتحويل المخدومين تلقائياً بين مستويات المتابعة بعد كل اجتماع.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-200 block">
                  الإنذار الأولي (أصفر - غير منتظم)
                </span>
                <span className="text-[11px] text-amber-700/80 dark:text-amber-400">
                  تنبيه هادئ للخادم بأن المخدوم بدأ يتغيب
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={settings.followUpThresholds.yellowAbsences}
                  onChange={(e) => setSettings({
                    ...settings,
                    followUpThresholds: {
                      ...settings.followUpThresholds,
                      yellowAbsences: parseInt(e.target.value) || 2
                    }
                  })}
                  className="w-16 px-2 py-1.5 rounded-xl border border-amber-300 font-bold text-center bg-white dark:bg-slate-800"
                />
                <span className="text-slate-500 font-semibold">غيابات</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-orange-900 dark:text-orange-200 block">
                  متابعة موصى بها (برتقالي - يحتاج افتقاد)
                </span>
                <span className="text-[11px] text-orange-700/80 dark:text-orange-400">
                  إدراج المخدوم في كشف الاتصال الأسبوعي الإلزامي
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={2}
                  max={6}
                  value={settings.followUpThresholds.orangeAbsences}
                  onChange={(e) => setSettings({
                    ...settings,
                    followUpThresholds: {
                      ...settings.followUpThresholds,
                      orangeAbsences: parseInt(e.target.value) || 3
                    }
                  })}
                  className="w-16 px-2 py-1.5 rounded-xl border border-orange-300 font-bold text-center bg-white dark:bg-slate-800"
                />
                <span className="text-slate-500 font-semibold">غيابات</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-rose-900 dark:text-rose-200 block">
                  افتقاد عاجل (أحمر - تدخل أمانة الخدمة)
                </span>
                <span className="text-[11px] text-rose-700/80 dark:text-rose-400">
                  إشعار مباشر لأمين الخدمة والأب الكاهن لسرعة الافتقاد
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={settings.followUpThresholds.redAbsences}
                  onChange={(e) => setSettings({
                    ...settings,
                    followUpThresholds: {
                      ...settings.followUpThresholds,
                      redAbsences: parseInt(e.target.value) || 4
                    }
                  })}
                  className="w-16 px-2 py-1.5 rounded-xl border border-rose-300 font-bold text-center bg-white dark:bg-slate-800"
                />
                <span className="text-slate-500 font-semibold">غيابات</span>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>حفظ معايير الافتقاد</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Gamification Points */}
      {activeTab === 'points' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              قواعد احتساب نقاط التفاعل والتشجيع
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              النقاط تمنح تلقائياً في سجل الـ Ledger عند مسح الـ QR أو تسجيل الحضور في الأنشطة.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="font-bold text-slate-900 dark:text-white block">حضور اجتماع الشباب الأسبوعي</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={settings.pointRules.meetingAttendance}
                    onChange={(e) => setSettings({
                      ...settings,
                      pointRules: { ...settings.pointRules, meetingAttendance: parseInt(e.target.value) || 10 }
                    })}
                    className="w-20 px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center bg-white dark:bg-slate-800"
                  />
                  <span className="text-slate-500 font-semibold">نقطة</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="font-bold text-slate-900 dark:text-white block">حضور اليوم الروحي (Spiritual Day)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={settings.pointRules.spiritualDay}
                    onChange={(e) => setSettings({
                      ...settings,
                      pointRules: { ...settings.pointRules, spiritualDay: parseInt(e.target.value) || 20 }
                    })}
                    className="w-20 px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center bg-white dark:bg-slate-800"
                  />
                  <span className="text-slate-500 font-semibold">نقطة</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="font-bold text-slate-900 dark:text-white block">المشاركة في المؤتمر السنوي</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={settings.pointRules.conference}
                    onChange={(e) => setSettings({
                      ...settings,
                      pointRules: { ...settings.pointRules, conference: parseInt(e.target.value) || 30 }
                    })}
                    className="w-20 px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center bg-white dark:bg-slate-800"
                  />
                  <span className="text-slate-500 font-semibold">نقطة</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="font-bold text-slate-900 dark:text-white block">النشاط الرياضي أو الثقافي</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={settings.pointRules.activity}
                    onChange={(e) => setSettings({
                      ...settings,
                      pointRules: { ...settings.pointRules, activity: parseInt(e.target.value) || 20 }
                    })}
                    className="w-20 px-2 py-1.5 rounded-xl border border-slate-300 font-bold text-center bg-white dark:bg-slate-800"
                  />
                  <span className="text-slate-500 font-semibold">نقطة</span>
                </div>
              </div>

            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow"
            >
              <Save className="w-4 h-4" />
              <span>تحديث وتطبيق قيم النقاط</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm space-y-4 p-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              سجل التدقيق والحركات الإدارية (Audit Trail)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              توثيق آلي وغير قابل للتعديل لكافة الإجراءات المهمة لحماية بيانات الخدمة وضمان المساءلة
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">الوقت والتاريخ</th>
                  <th className="py-3 px-4 text-start">القائم بالعملية</th>
                  <th className="py-3 px-4 text-start">الدور</th>
                  <th className="py-3 px-4 text-start">الإجراء المنفذ</th>
                  <th className="py-3 px-4 text-start">الهدف</th>
                  <th className="py-3 px-4 text-start">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log, idx) => (
                  <tr key={log.logId || `audit_${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {log.timestamp.replace('T', ' ').slice(0, 19)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {log.actorName}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        log.actorRole === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {log.actorRole === 'admin' ? 'أمين خدمة' : 'خادم'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {log.targetCollection}/{log.targetId}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

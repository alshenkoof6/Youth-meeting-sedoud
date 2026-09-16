import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { AuditLog } from '../../types';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Clock, 
  User, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  ShieldCheck, 
  Layers, 
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';

export const AuditLogDashboard: React.FC = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin' || role === 'supervisor';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedTargetType, setSelectedTargetType] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const allLogs: AuditLog[] = dataStore.auditLogs || [];

  // Filter logs
  const filteredLogs = useMemo(() => {
    return allLogs.filter((log) => {
      // Role filter
      if (selectedRole !== 'all' && log.actorRole !== selectedRole) {
        return false;
      }
      // Target filter
      const target = log.targetType || log.targetCollection || '';
      if (selectedTargetType !== 'all' && target.toLowerCase() !== selectedTargetType.toLowerCase()) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesActor = (log.actorName || '').toLowerCase().includes(q);
        const matchesAction = (log.action || '').toLowerCase().includes(q);
        const matchesTargetId = (log.targetId || '').toLowerCase().includes(q);
        const detailsStr = typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {});
        const matchesDetails = detailsStr.toLowerCase().includes(q);

        if (!matchesActor && !matchesAction && !matchesTargetId && !matchesDetails) {
          return false;
        }
      }
      return true;
    });
  }, [allLogs, selectedRole, selectedTargetType, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  if (!isAdmin) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 border border-slate-200 dark:border-slate-700 text-center" dir="rtl">
        <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          صلاحية الوصول غير متاحة
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          سجل التدقيق والمحاسبة (Audit Logs) متاح حصرياً لأمين الخدمة والإدارة.
        </p>
      </div>
    );
  }

  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'admin':
      case 'supervisor':
        return { label: 'أمين الخدمة', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'servant':
        return { label: 'خادم', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'canteen_servant':
        return { label: 'مسؤول كانتين', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'youth':
        return { label: 'مخدوم', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      default:
        return { label: roleName, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return {
        date: d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }),
        time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { date: ts, time: '' };
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>سجل التدقيق والمحاسبة (Audit Logs)</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                {allLogs.length} سجل
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              سجل غير قابل للتعديل أو الحذف (Append-Only) لتوثيق كافة العمليات الحساسة في المنظومة
            </p>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-[10px] text-slate-400 block font-bold">العمليات المعروضة</span>
            <span className="font-black text-slate-800 dark:text-slate-100 font-mono">
              {filteredLogs.length}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
            <span className="text-[10px] text-indigo-500 block font-bold">الصفحة الحالية</span>
            <span className="font-black text-indigo-700 dark:text-indigo-300 font-mono">
              {currentPage} من {totalPages}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleFilterChange();
              }}
              placeholder="بحث باسم المستخدم أو العملية أو الكود..."
              className="w-full pr-10 pl-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold"
            >
              <option value="all">كل الأدوار (Roles)</option>
              <option value="admin">أمين الخدمة (Admin)</option>
              <option value="servant">خادم (Servant)</option>
              <option value="canteen_servant">مسؤول الكانتين (Canteen)</option>
              <option value="youth">مخدوم (Youth)</option>
            </select>
          </div>

          {/* Target Type Filter */}
          <div>
            <select
              value={selectedTargetType}
              onChange={(e) => {
                setSelectedTargetType(e.target.value);
                handleFilterChange();
              }}
              className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold"
            >
              <option value="all">كل المجموعات (Targets)</option>
              <option value="vouchers">القسائم والكانتين (Vouchers)</option>
              <option value="pointTransactions">سجل النقاط (Points)</option>
              <option value="attendance">الحضور والغياب (Attendance)</option>
              <option value="meetings">اجتماعات الشباب (Meetings)</option>
              <option value="trips">الرحلات (Trips)</option>
              <option value="users">حسابات المستخدمين (Users)</option>
              <option value="followups">الافتقاد والمتابعة (Followups)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-bold">
              <tr>
                <th className="py-3.5 px-4">التوقيت والتاريخ</th>
                <th className="py-3.5 px-4">الفاعل (Actor)</th>
                <th className="py-3.5 px-4">الدور (Role)</th>
                <th className="py-3.5 px-4">الإجراء والعملية (Action)</th>
                <th className="py-3.5 px-4">الهدف (Target)</th>
                <th className="py-3.5 px-4 text-center">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    لا توجد سجلات تدقيق مطابقة لبحثك
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const ts = formatTimestamp(log.timestamp);
                  const roleBadge = getRoleBadge(log.actorRole);
                  const targetLabel = log.targetType || log.targetCollection || 'system';

                  return (
                    <tr
                      key={log.logId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                          {ts.time}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {ts.date}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        {log.actorName}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleBadge.color}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">
                          {log.action}
                        </span>
                        {log.details && typeof log.details === 'string' && (
                          <span className="text-[11px] text-slate-400 line-clamp-1">
                            {log.details}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                          {targetLabel}:{log.targetId ? log.targetId.slice(0, 10) : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="px-2.5 py-1 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-bold text-[11px] transition"
                        >
                          عرض
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
            عرض {paginatedLogs.length} من أصل {filteredLogs.length} سجل
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              className="absolute left-4 top-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  تفاصيل سجل التدقيق
                </h3>
                <span className="text-[11px] font-mono text-slate-400 block">
                  {selectedLog.logId}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">الإجراء:</span>
                  <span className="font-black text-slate-800 dark:text-slate-100">{selectedLog.action}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الفاعل (Actor):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {selectedLog.actorName} ({selectedLog.actorRole})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">معرف الفاعل (Actor ID):</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{selectedLog.actorId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">التوقيت:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedLog.timestamp}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المجموعة المستهدفة:</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    {selectedLog.targetType || selectedLog.targetCollection}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">معرف الهدف (Target ID):</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300">
                    {selectedLog.targetId}
                  </span>
                </div>
              </div>

              {/* Metadata or Details */}
              {(selectedLog.details || selectedLog.metadata) && (
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    البيانات التوضيحية (Metadata):
                  </span>
                  <pre className="p-3 rounded-2xl bg-slate-950 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800">
                    {JSON.stringify(selectedLog.metadata || selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

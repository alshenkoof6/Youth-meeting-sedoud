import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { 
  UserCheck, 
  Users, 
  HeartHandshake, 
  Plus, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ShieldCheck,
  X
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { generateNextChurchCode, generateTemporaryPassword } from '../../utils/churchAuthUtils';
import { AccountCreationSuccessModal } from './AccountCreationSuccessModal';

export const AdminServants: React.FC = () => {
  const { role, currentUser } = useAuth();
  const isAdmin = role === 'admin' || role === 'supervisor';
  const servants = dataStore.users.filter((u) => u.role === 'servant' || u.role === 'admin' || u.role === 'canteen_servant');
  const youthList = dataStore.users.filter((u) => u.role === 'youth');

  const [selectedServant, setSelectedServant] = useState<UserProfile | null>(null);
  
  // Add servant modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newServantRole, setNewServantRole] = useState<UserRole>('servant');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [newNotes, setNewNotes] = useState('');

  // Account creation success modal state
  const [createdSuccessData, setCreatedSuccessData] = useState<{ user: UserProfile; temporaryPassword: string } | null>(null);

  // Compute stats for each servant
  const servantStats = servants.map((s) => {
    const assignedYouth = youthList.filter((y) => y.assignedServantId === s.userId);
    const urgentAbsentees = assignedYouth.filter((y) => y.consecutiveAbsences >= 3);
    const regularYouth = assignedYouth.filter((y) => y.consecutiveAbsences < 2);
    
    return {
      servant: s,
      assignedCount: assignedYouth.length,
      urgentCount: urgentAbsentees.length,
      regularCount: regularYouth.length,
      assignedYouth,
    };
  });

  const handleCreateServant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('عذراً، صلاحية إضافة خادم جديد مخصصة لأمين الخدمة فقط.');
      return;
    }
    if (!newName.trim() || !newPhone.trim()) return;

    // Generate Church Code sequentially (e.g. SRV-00025) and strong random temporary password
    const userCode = generateNextChurchCode(newServantRole, dataStore.users);
    const tempPassword = generateTemporaryPassword(8);

    const newServant: UserProfile = {
      userId: `user_srv_${Date.now()}`,
      userCode,
      displayName: newName.trim(),
      phoneNumber: newPhone.trim(),
      role: newServantRole,
      gender: newGender,
      educationStage: 'graduate',
      scheduleType: 'regular',
      weeklySchedule: {
        sat: 'available',
        sun: 'available',
        mon: 'available',
        tue: 'available',
        wed: 'available',
        thu: 'available',
        fri: 'available',
      },
      temporaryPassword: tempPassword,
      mustChangePassword: true,
      notes: newNotes.trim() || undefined,
      totalAttendances: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalPoints: 100,
      consecutiveAbsences: 0,
      followUpStatus: 'regular',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dataStore.updateUser(newServant);

    if (currentUser) {
      await dataStore.logAudit({
        actorId: currentUser.userId,
        actorName: currentUser.displayName,
        actorRole: role,
        action: `إضافة خادم جديد في الخدمة: ${newName.trim()} (${newServantRole === 'admin' ? 'أمين خدمة' : newServantRole === 'canteen_servant' ? 'مسؤول كانتين' : 'خادم'})`,
        targetCollection: 'users',
        targetId: newServant.userId,
        details: {
          userCode,
          servantName: newName.trim(),
          role: newServantRole,
          phoneNumber: newPhone.trim(),
        },
      });
    }

    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewNotes('');

    // Open AccountCreationSuccessModal with Church Code and Temporary Password
    setCreatedSuccessData({
      user: newServant,
      temporaryPassword: tempPassword,
    });
  };

  return (
    <div id="admin-servants-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-600" />
            هيئة الخدام وتوزيع أسر المتابعة
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            توزيع دوائر الخدمة، متابعة أحمال الافتقاد لكل خادم، ومعدلات التواصل
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200">
            {servants.length} خدام وأمناء
          </span>
          {isAdmin ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة خادم جديد</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
              إضافة الخدام مقتصرة على أمين الخدمة
            </span>
          )}
        </div>
      </div>

      {/* Servants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {servantStats.map((item, idx) => (
          <div
            key={item.servant.userId || `srv_${idx}`}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {item.servant.displayName}
                    </h3>
                    {item.servant.role === 'admin' && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                        أمين خدمة
                      </span>
                    )}
                    {item.servant.role === 'canteen_servant' && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">
                        مسؤول كانتين
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {item.servant.phoneNumber}
                  </span>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  {item.servant.displayName.charAt(0)}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-slate-50 dark:bg-slate-800/60 rounded-2xl">
                <div>
                  <span className="text-slate-400 block text-[10px]">المخدومين</span>
                  <strong className="text-slate-900 dark:text-white text-sm font-black">
                    {item.assignedCount}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">منتظمين</span>
                  <strong className="text-emerald-600 text-sm font-black">
                    {item.regularCount}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">بحاجة لافتقاد</span>
                  <strong className="text-rose-600 text-sm font-black">
                    {item.urgentCount}
                  </strong>
                </div>
              </div>

              {/* Sample Youth Names */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block">
                  عينة من أسرته:
                </span>
                <div className="flex flex-wrap gap-1">
                  {item.assignedYouth.slice(0, 4).map((y) => (
                    <span
                      key={y.userId}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {y.displayName.split(' ')[0]} {y.displayName.split(' ')[1] || ''}
                    </span>
                  ))}
                  {item.assignedCount > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 text-slate-400">
                      +{item.assignedCount - 4} آخرين
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedServant(item.servant)}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition"
            >
              عرض قائمة مخدوميه بالكامل
            </button>
          </div>
        ))}
      </div>

      {/* SERVANT YOUTH MODAL */}
      {selectedServant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  مخدومين الخادم: {selectedServant.displayName}
                </h3>
                <p className="text-xs text-slate-500">
                  قائمة الشباب المسندين له للمتابعة والافتقاد الدوري
                </p>
              </div>
              <button
                onClick={() => setSelectedServant(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 py-2">
              {youthList
                .filter((y) => y.assignedServantId === selectedServant.userId)
                .map((youth) => (
                  <div key={youth.userId} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {youth.displayName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {youth.userCode} • {youth.phoneNumber}
                      </span>
                    </div>

                    <div className="text-start">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        youth.consecutiveAbsences >= 3
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {youth.consecutiveAbsences >= 3
                          ? `غياب ${youth.consecutiveAbsences} مرات`
                          : 'منتظم بالحضور'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD SERVANT MODAL */}
      {showAddModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                إضافة خادم جديد
              </h3>
              <p className="text-xs text-slate-500">
                أدخل البيانات الأساسية، وسيقوم النظام بتوليد الكود الكنسي وكلمة المرور المؤقتة تلقائياً.
              </p>
            </div>

            <form onSubmit={handleCreateServant} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">الاسم ثلاثي أو ثنائي *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: بيشوي مرقس"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">رقم الهاتف المحمول *</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  dir="ltr"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">النوع</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as 'male' | 'female')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
                  >
                    <option value="male">خادم</option>
                    <option value="female">خادمة</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">الدور والمسؤولية</label>
                  <select
                    value={newServantRole}
                    onChange={(e) => setNewServantRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
                  >
                    <option value="servant">خادم متابعة</option>
                    <option value="canteen_servant">مسؤول كانتين</option>
                    <option value="admin">أمين خدمة / مسؤول</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">ملاحظات أو أسرة الخدمة (اختياري)</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="مثال: مسؤول أسرة ثانوية عامة"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  تسجيل الخادم وتوليد الكود
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Creation Success Modal with Church Code & Temporary Password */}
      {createdSuccessData && (
        <AccountCreationSuccessModal
          user={createdSuccessData.user}
          temporaryPassword={createdSuccessData.temporaryPassword}
          onClose={() => setCreatedSuccessData(null)}
        />
      )}

    </div>
  );
};

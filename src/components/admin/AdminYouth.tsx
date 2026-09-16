import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { getEducationStageLabel, downloadCSV } from '../../lib/utils';
import { 
  Users, 
  Search, 
  UserPlus, 
  Download, 
  UserCheck, 
  Filter, 
  Phone, 
  Edit3, 
  CheckCircle2,
  Calendar,
  Flame,
  Star
} from 'lucide-react';
import { UserProfile, EducationStage } from '../../types';
import { generateNextChurchCode, generateTemporaryPassword } from '../../utils/churchAuthUtils';
import { AccountCreationSuccessModal } from './AccountCreationSuccessModal';

export const AdminYouth: React.FC = () => {
  const { role, currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  
  // Assignment modal
  const [assigningYouth, setAssigningYouth] = useState<UserProfile | null>(null);
  const [selectedServantId, setSelectedServantId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Add Youth modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [newStage, setNewStage] = useState<EducationStage>('university');
  const [newFaculty, setNewFaculty] = useState('');
  
  // Success modal for created account credentials
  const [createdSuccessData, setCreatedSuccessData] = useState<{ user: UserProfile; temporaryPassword: string } | null>(null);

  const servants = dataStore.users.filter((u) => u.role === 'servant' || u.role === 'admin');

  const youthList = dataStore.users.filter((u) => {
    if (u.role !== 'youth') return false;
    // For servants, show only their assigned youth
    if (role === 'servant' && u.assignedServantId !== currentUser?.userId) return false;
    if (stageFilter !== 'all' && u.educationStage !== stageFilter) return false;
    if (genderFilter !== 'all' && u.gender !== genderFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.userCode.toLowerCase().includes(q) ||
        u.phoneNumber.includes(q)
      );
    }
    return true;
  });

  const handleAssignServant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningYouth || !selectedServantId) return;

    const servant = servants.find((s) => s.userId === selectedServantId);
    if (!servant) return;

    const updated: UserProfile = {
      ...assigningYouth,
      assignedServantId: servant.userId,
      assignedServantName: servant.displayName,
      updatedAt: new Date().toISOString(),
    };

    await dataStore.updateUser(updated);
    setNotice(`تم إسناد الشاب ${assigningYouth.displayName} للخادم ${servant.displayName} بنجاح`);
    setAssigningYouth(null);
    setTimeout(() => setNotice(null), 3000);
  };

  const handleCreateYouth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisplayName.trim() || !newPhone.trim()) return;

    // Generate Church Code sequentially (e.g. YT-00125) and strong random temporary password
    const userCode = generateNextChurchCode('youth', dataStore.users);
    const tempPassword = generateTemporaryPassword(8);

    const newUser: UserProfile = {
      userId: `user_${Date.now()}`,
      userCode,
      displayName: newDisplayName.trim(),
      phoneNumber: newPhone.trim(),
      role: 'youth',
      gender: newGender,
      educationStage: newStage,
      faculty: newFaculty.trim() || undefined,
      assignedServantId: role === 'servant' ? currentUser?.userId : undefined,
      assignedServantName: role === 'servant' ? currentUser?.displayName : undefined,
      scheduleType: 'regular',
      temporaryPassword: tempPassword,
      mustChangePassword: true,
      weeklySchedule: {
        sat: 'available',
        sun: 'available',
        mon: 'available',
        tue: 'available',
        wed: 'available',
        thu: 'available',
        fri: 'available',
      },
      totalAttendances: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalPoints: 50,
      consecutiveAbsences: 0,
      followUpStatus: 'regular',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dataStore.updateUser(newUser);
    setShowAddModal(false);
    setNewDisplayName('');
    setNewPhone('');
    setNewFaculty('');
    
    // Open AccountCreationSuccessModal with Church Code and Temporary Password
    setCreatedSuccessData({
      user: newUser,
      temporaryPassword: tempPassword,
    });
  };

  const handleExportCSV = () => {
    const rows = youthList.map((y, idx) => ({
      الرقم: idx + 1,
      'الكود الكنسي': y.userCode,
      'الاسم': y.displayName,
      'رقم الهاتف': y.phoneNumber,
      'النوع': y.gender === 'male' ? 'شاب' : 'شابة',
      'المرحلة': getEducationStageLabel(y.educationStage),
      'الكلية': y.faculty || '-',
      'الخادم المتابع': y.assignedServantName || 'غير مسند',
      'إجمالي الحضور': y.totalAttendances,
      'المواظبة': y.currentStreak,
      'مرات الغياب المتتالية': y.consecutiveAbsences,
      'النقاط': y.totalPoints,
    }));

    downloadCSV(rows, 'دليل_شباب_الاجتماع.csv');
  };

  return (
    <div id="admin-youth-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            سجل الشباب والمخدومين
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            إدارة بيانات المخدومين، إسناد وتوزيع الخدمة على الخدام، واستخراج الكشوف
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة شاب جديد</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>تصدير الدليل (CSV)</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">كل المراحل</option>
            <option value="high_school">ثانوي</option>
            <option value="university">جامعة</option>
            <option value="graduated">خريجين</option>
          </select>

          {/* Gender Filter */}
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">الكل (شباب وشابات)</option>
            <option value="male">شباب</option>
            <option value="female">شابات</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الكود الكنسي أو الهاتف..."
            className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none"
          />
        </div>

      </div>

      {/* Youth Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            قائمة الشباب المسجلين ({youthList.length})
          </h3>
          <span className="text-xs text-slate-400">مرتبة أبجدياً</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 text-start">الكود</th>
                <th className="py-3.5 px-4 text-start">الاسم</th>
                <th className="py-3.5 px-4 text-start">المرحلة والكلية</th>
                <th className="py-3.5 px-4 text-start">الخادم المتابع</th>
                <th className="py-3.5 px-4 text-start">الحضور</th>
                <th className="py-3.5 px-4 text-start">المواظبة</th>
                <th className="py-3.5 px-4 text-start">حالة الافتقاد</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {youthList.map((youth, idx) => {
                const isUrgent = youth.consecutiveAbsences >= 4;
                const isNeeds = youth.consecutiveAbsences === 3;
                const isIrregular = youth.consecutiveAbsences === 2;

                return (
                  <tr key={youth.userId || `y_${youth.userCode}_${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600 dark:text-slate-400">
                      {youth.userCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white block">{youth.displayName}</span>
                      <span className="text-[11px] text-slate-500">{youth.phoneNumber}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      <span>{getEducationStageLabel(youth.educationStage)}</span>
                      {youth.faculty && <span className="block text-[11px] text-slate-400">{youth.faculty}</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {youth.assignedServantName || 'غير مسند'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {youth.totalAttendances} اجتماع
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        {youth.currentStreak}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {isUrgent ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                          عاجل (4+ غياب)
                        </span>
                      ) : isNeeds ? (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">
                          يحتاج متابعة (3)
                        </span>
                      ) : isIrregular ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          غير منتظم (2)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          منتظم
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          setAssigningYouth(youth);
                          setSelectedServantId(youth.assignedServantId || servants[0]?.userId || '');
                        }}
                        className="px-3 py-1 rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold text-[11px] transition inline-flex items-center gap-1"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>تعديل الخادم</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASSIGN SERVANT MODAL */}
      {assigningYouth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              إسناد خادم للمخدوم
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              اختر الخادم المسؤول عن افتقاد ومتابعة الشاب: <strong>{assigningYouth.displayName}</strong>
            </p>

            <form onSubmit={handleAssignServant} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">الخادم المسؤول</label>
                <select
                  value={selectedServantId}
                  onChange={(e) => setSelectedServantId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:outline-none"
                >
                  {servants.map((s) => (
                    <option key={s.userId} value={s.userId}>
                      {s.displayName} ({s.role === 'admin' ? 'أمين خدمة' : 'خادم'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningYouth(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  حفظ التعيين
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW YOUTH MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              إضافة شاب جديد للاجتماع
            </h3>

            <form onSubmit={handleCreateYouth} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">الاسم الكامل</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="مثال: يوسف ماجد سامي"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">رقم الهاتف</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">المرحلة</label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value as EducationStage)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="high_school">ثانوي</option>
                    <option value="university">جامعة</option>
                    <option value="graduated">خريجين</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">النوع</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="male">شاب</option>
                    <option value="female">شابة</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">الكلية أو التخصص</label>
                <input
                  type="text"
                  value={newFaculty}
                  onChange={(e) => setNewFaculty(e.target.value)}
                  placeholder="مثال: هندسة عين شمس"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  تسجيل الشاب
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

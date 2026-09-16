import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { 
  Gift, 
  Star, 
  CheckCircle2, 
  Ticket, 
  Search, 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  AlertTriangle,
  Lock,
  Layers,
  Coffee,
  BookOpen,
  Filter
} from 'lucide-react';
import { RewardItem, Coupon } from '../../types';

export const AdminRewards: React.FC = () => {
  const { role, currentUser } = useAuth();
  const canManageRewards = role === 'admin' || role === 'supervisor' || role === 'canteen_servant';

  const [rewards, setRewards] = useState<RewardItem[]>(dataStore.rewards);
  const [coupons, setCoupons] = useState<Coupon[]>(dataStore.coupons);
  const [verifyCode, setVerifyCode] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const [verificationResult, setVerificationResult] = useState<{
    msg: string;
    isSuccess: boolean;
    coupon?: Coupon;
  } | null>(null);

  // New reward item form state
  const [newTitle, setNewTitle] = useState('');
  const [newPoints, setNewPoints] = useState(150);
  const [newQty, setNewQty] = useState(20);
  const [newCategory, setNewCategory] = useState<'spiritual' | 'canteen' | 'beverage' | 'snack' | 'voucher'>('spiritual');
  const [newDesc, setNewDesc] = useState('');

  // Edit reward state
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPoints, setEditPoints] = useState(100);
  const [editQty, setEditQty] = useState(10);
  const [editCategory, setEditCategory] = useState<'spiritual' | 'canteen' | 'beverage' | 'snack' | 'voucher'>('spiritual');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'archived'>('active');
  const [editDesc, setEditDesc] = useState('');

  // Subscribe to real-time changes
  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setRewards([...dataStore.rewards]);
      setCoupons([...dataStore.coupons]);
    });
    return unsub;
  }, []);

  // Check role authorization
  if (!canManageRewards) {
    return (
      <div id="admin-rewards-unauthorized" className="p-6 max-w-2xl mx-auto my-12" dir="rtl">
        <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-8 text-center shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            صلاحية الوصول غير متاحة
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            نظام المكافآت والتعديل على كتالوج الهدايا وصرف الكوبونات متاح حصرياً لـ <strong className="text-rose-600 dark:text-rose-400">أمين الخدمة</strong> و<strong className="text-rose-600 dark:text-rose-400">خادم الكانتين</strong> فقط.
          </p>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
            رتبتك الحالية: {role === 'servant' ? 'خادم متابعة' : role === 'youth' ? 'شاب مخدوم' : role}
          </div>
        </div>
      </div>
    );
  }

  const handleVerifyAndRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verifyCode.trim().toUpperCase();
    if (!code) return;

    const coupon = coupons.find((c) => c.couponId.toUpperCase() === code);
    if (!coupon) {
      setVerificationResult({
        msg: 'الكود غير موجود في النظام. يرجى التأكد من الرمز المدخل.',
        isSuccess: false,
      });
      return;
    }

    if (coupon.status === 'redeemed') {
      setVerificationResult({
        msg: `هذا الكوبون تم صرفه مسبقاً بتاريخ ${coupon.redeemedAt?.split('T')[0] || ''}`,
        isSuccess: false,
        coupon,
      });
      return;
    }

    await dataStore.redeemCoupon(coupon.couponId);
    setCoupons([...dataStore.coupons]);

    if (currentUser) {
      await dataStore.logAudit({
        actorId: currentUser.userId,
        actorName: currentUser.displayName,
        actorRole: role,
        action: `صرف وتسليم كوبون مكافأة: ${coupon.rewardTitle}`,
        targetCollection: 'coupons',
        targetId: coupon.couponId,
        details: {
          recipientName: coupon.userName,
          couponId: coupon.couponId,
          rewardTitle: coupon.rewardTitle,
          redeemedAt: coupon.redeemedAt,
        }
      });
    }

    setVerificationResult({
      msg: `تم تأكيد وصرف الكوبون بنجاح: (${coupon.rewardTitle}) للشاب ${coupon.userName}`,
      isSuccess: true,
      coupon,
    });
    setVerifyCode('');
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const item: RewardItem = {
      rewardId: `rew_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'هدية تشجيعية لشباب الاجتماع',
      requiredPoints: Number(newPoints) || 50,
      availableQuantity: Number(newQty) || 0,
      status: 'active',
      category: newCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dataStore.createReward(item);

    if (currentUser) {
      await dataStore.logAudit({
        actorId: currentUser.userId,
        actorName: currentUser.displayName,
        actorRole: role,
        action: `إضافة مكافأة جديدة للكتالوج: ${item.title} (${item.requiredPoints} نقطة)`,
        targetCollection: 'rewards',
        targetId: item.rewardId,
        details: item,
      });
    }

    setNewTitle('');
    setNewDesc('');
  };

  const openEditReward = (reward: RewardItem) => {
    setEditingReward(reward);
    setEditTitle(reward.title);
    setEditPoints(reward.requiredPoints);
    setEditQty(reward.availableQuantity);
    setEditCategory((reward.category as any) || 'spiritual');
    setEditStatus(reward.status || 'active');
    setEditDesc(reward.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward || !editTitle.trim()) return;

    const updated: RewardItem = {
      ...editingReward,
      title: editTitle.trim(),
      description: editDesc.trim(),
      requiredPoints: Number(editPoints) || 50,
      availableQuantity: Number(editQty) || 0,
      category: editCategory,
      status: editStatus,
      updatedAt: new Date().toISOString(),
    };

    await dataStore.updateReward(updated);

    if (currentUser) {
      await dataStore.logAudit({
        actorId: currentUser.userId,
        actorName: currentUser.displayName,
        actorRole: role,
        action: `تعديل صنف مكافأة: ${updated.title}`,
        targetCollection: 'rewards',
        targetId: updated.rewardId,
        details: updated,
      });
    }

    setEditingReward(null);
  };

  const handleDeleteReward = async (rewardId: string, rewardTitle: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف المكافأة "${rewardTitle}" من النظام؟`)) {
      return;
    }

    await dataStore.deleteReward(rewardId);

    if (currentUser) {
      await dataStore.logAudit({
        actorId: currentUser.userId,
        actorName: currentUser.displayName,
        actorRole: role,
        action: `حذف مكافأة من الكتالوج: ${rewardTitle}`,
        targetCollection: 'rewards',
        targetId: rewardId,
        details: { rewardId, title: rewardTitle },
      });
    }
  };

  const filteredRewards = rewards.filter((r) => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return r.title.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div id="admin-rewards-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto" dir="rtl">
      
      {/* Header with Role Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              نظام النقاط والمكافآت والكوبونات
            </h1>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              {role === 'canteen_servant' ? 'صلاحية: خادم الكانتين' : 'صلاحية: أمين الخدمة'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            إدارة وتعديل كتالوج الهدايا التشجيعية، ومخزون الكانتين، والتحقق الفوري من قسائم الشباب
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
            {rewards.length} مكافآت مسجلة
          </span>
        </div>
      </div>

      {/* Instant Coupon Verification Tool */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/20 inline-block mb-1">
            صندوق استلام الكوبونات (المكتبة / الكانتين)
          </span>
          <h2 className="text-xl font-bold">التحقق الفوري وصرف كوبون شاب</h2>
          <p className="text-xs text-indigo-200 mt-0.5">
            أدخل الكود المعروض على هاتف الشاب لتسجيل استلام الهدية ومنع الصرف المتكرر
          </p>
        </div>

        <form onSubmit={handleVerifyAndRedeem} className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Ticket className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="مثال: COUPON-8X29K"
              className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-mono font-bold tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition shadow-md shrink-0"
          >
            التحقق وصرف الهدية
          </button>
        </form>

        {verificationResult && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
            verificationResult.isSuccess
              ? 'bg-emerald-950/80 border border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-500 text-rose-200'
          }`}>
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>{verificationResult.msg}</span>
          </div>
        )}
      </div>

      {/* Catalog & Create Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create new reward */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">إضافة مكافأة جديدة</h3>
              <p className="text-[11px] text-slate-400">إدراج عنصر جديد في كتالوج الكانتين والجوائز</p>
            </div>
          </div>

          <form onSubmit={handleCreateReward} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">اسم المكافأة / المنتج *</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: نوت بوك روحي فاخر أو ساندوتش"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">النقاط المطلوبة *</label>
                <input
                  type="number"
                  min="1"
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">الكمية المتاحة *</label>
                <input
                  type="number"
                  min="0"
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">التصنيف</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="spiritual">روحية وثقافية (كتب، صلبان، نوت بوك)</option>
                <option value="canteen">منتجات الكانتين العامة</option>
                <option value="beverage">مشروبات وعصائر</option>
                <option value="snack">وجبات وسناكس</option>
                <option value="voucher">قسائم شراء وخصم</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">الوصف</label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="تفاصيل الهدية أو مواصفاتها..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow"
            >
              إضافة المكافأة للكتالوج
            </button>
          </form>
        </div>

        {/* Existing Rewards & Management */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Search and Category Filters */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="بحث في المكافآت..."
                className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  categoryFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                الكل ({rewards.length})
              </button>
              <button
                onClick={() => setCategoryFilter('spiritual')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  categoryFilter === 'spiritual'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                روحية
              </button>
              <button
                onClick={() => setCategoryFilter('canteen')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  categoryFilter === 'canteen'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                كانتين
              </button>
              <button
                onClick={() => setCategoryFilter('beverage')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  categoryFilter === 'beverage'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                مشروبات
              </button>
              <button
                onClick={() => setCategoryFilter('snack')}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition ${
                  categoryFilter === 'snack'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                سناكس
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredRewards.length === 0 ? (
              <div className="col-span-full text-center py-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-slate-400 text-xs">
                لا توجد مكافآت تطابق البحث أو التصنيف المحدد.
              </div>
            ) : (
              filteredRewards.map((reward, idx) => (
                <div
                  key={reward.rewardId || `rew_${idx}`}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {reward.requiredPoints} نقطة
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        reward.availableQuantity > 5
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : reward.availableQuantity > 0
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}>
                        {reward.availableQuantity > 0 ? `متبقي ${reward.availableQuantity}` : 'نفذت الكمية'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{reward.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {reward.description}
                    </p>
                  </div>

                  {/* Actions & Meta */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {reward.rewardId}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditReward(reward)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px] flex items-center gap-1 transition"
                        title="تعديل المكافأة"
                      >
                        <Edit3 className="w-3 h-3 text-indigo-500" />
                        <span>تعديل</span>
                      </button>
                      <button
                        onClick={() => handleDeleteReward(reward.rewardId, reward.title)}
                        className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-500 transition"
                        title="حذف المكافأة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* EDIT REWARD MODAL */}
      {editingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setEditingReward(null)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                تعديل بيانات المكافأة
              </h3>
              <p className="text-xs text-slate-500">
                تعديل الاسم، النقاط المطلوبة، ومخزون الكمية المتاحة للشراء
              </p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">اسم المكافأة</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">النقاط المطلوبة</label>
                  <input
                    type="number"
                    min="1"
                    value={editPoints}
                    onChange={(e) => setEditPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">الكمية المتاحة</label>
                  <input
                    type="number"
                    min="0"
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">التصنيف</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="spiritual">روحية وثقافية</option>
                    <option value="canteen">كانتين عام</option>
                    <option value="beverage">مشروبات وعصائر</option>
                    <option value="snack">وجبات وسناكس</option>
                    <option value="voucher">قسائم شراء</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">الحالة</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="active">نشطة ومتاحة</option>
                    <option value="inactive">غير نشطة (مخفية)</option>
                    <option value="archived">مؤرشفة</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">الوصف</label>
                <textarea
                  rows={2}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white resize-none focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingReward(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

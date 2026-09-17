import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gift,
  Cake,
  TrendingUp,
  History,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  Package,
  Coins,
  Users,
  DollarSign,
  Sparkles,
  Info,
  Calendar,
  Save,
  Check,
  Search,
  Filter
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  MysteryBoxConfig,
  MysteryBoxReward,
  MysteryBoxRedemptionRecord,
  UserProfile
} from '../../types';
import { dataStore } from '../../services/dataStore';
import { mysteryBoxService } from '../../services/mysteryBoxService';
import {
  validateProbabilities,
  getRedistributedProbabilities
} from '../../utils/mysteryBoxCalculator';

interface CanteenMysteryBoxesProps {
  currentUser: UserProfile;
}

type TabType = 'boxes' | 'stats' | 'history';
type BoxTabType = 'points_box' | 'birthday_box';

const EMOJI_OPTIONS = ['🍪', '🥤', '🍟', '🖊️', '🎲', '🎁', '🍫', '🧃', '🧁', '📖', '📿', '🎨', '🧩', '🏷️'];

export const CanteenMysteryBoxes: React.FC<CanteenMysteryBoxesProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<TabType>('boxes');
  const [selectedBoxTab, setSelectedBoxTab] = useState<BoxTabType>('points_box');

  // Local configs state for editing
  const [configs, setConfigs] = useState<MysteryBoxConfig[]>(() => {
    return JSON.parse(JSON.stringify(dataStore.mysteryBoxConfigs));
  });

  // Modal for adding / editing a reward
  const [editingReward, setEditingReward] = useState<{
    reward: Partial<MysteryBoxReward>;
    boxId: 'points_box' | 'birthday_box';
    isNew: boolean;
  } | null>(null);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // History search and filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'points' | 'birthday'>('all');

  const activeConfig = useMemo(() => {
    return configs.find((c) => c.boxId === selectedBoxTab) || configs[0];
  }, [configs, selectedBoxTab]);

  // Validation of probabilities for currently selected box
  const validation = useMemo(() => {
    if (!activeConfig) return { isValid: true, totalActiveProb: 100 };
    return validateProbabilities(activeConfig.rewards || []);
  }, [activeConfig]);

  // Re-weighted probabilities calculation (shows dynamic stock-aware chances)
  const redistributedChances = useMemo(() => {
    if (!activeConfig) return [];
    return getRedistributedProbabilities(activeConfig.rewards || []);
  }, [activeConfig]);

  // Statistics calculation
  const stats = useMemo(() => {
    return mysteryBoxService.getStats();
  }, [dataStore.mysteryBoxRedemptions, configs]);

  // Save current box config
  const handleSaveBoxConfig = async () => {
    setSaveError(null);
    setSaveMessage(null);

    if (!validation.isValid) {
      setSaveError(validation.errorMessage || 'يرجى التأكد من أن مجموع نسب الاحتمالات للجوائز النشطة يساوي 100%.');
      return;
    }

    try {
      await dataStore.saveMysteryBoxConfig(activeConfig);
      await dataStore.logAudit({
        actorId: currentUser.userId,
        actorName: currentUser.displayName,
        actorRole: currentUser.role,
        action: 'تعديل إعدادات صندوق المفاجآت',
        targetCollection: 'mysteryBoxConfigs',
        targetId: activeConfig.boxId,
        details: {
          boxId: activeConfig.boxId,
          costInPoints: activeConfig.costInPoints,
          rewardsCount: activeConfig.rewards.length
        }
      });

      setSaveMessage('تم حفظ إعدادات الصندوق بنجاح! تم تحديث النظام.');
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (e: any) {
      setSaveError(e.message || 'فشل في حفظ التعديلات.');
    }
  };

  // Update box level properties (e.g. costInPoints, isActive, birthdayAvailabilityDays)
  const handleUpdateBoxProperty = (field: keyof MysteryBoxConfig, value: any) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.boxId === selectedBoxTab) {
          return { ...c, [field]: value };
        }
        return c;
      })
    );
  };

  // Toggle reward active state
  const handleToggleRewardActive = (rewardId: string) => {
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.boxId === selectedBoxTab) {
          return {
            ...c,
            rewards: c.rewards.map((r) =>
              r.rewardId === rewardId ? { ...r, isActive: !r.isActive } : r
            )
          };
        }
        return c;
      })
    );
  };

  // Delete reward
  const handleDeleteReward = (rewardId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الجائزة من الصندوق؟')) return;
    setConfigs((prev) =>
      prev.map((c) => {
        if (c.boxId === selectedBoxTab) {
          return {
            ...c,
            rewards: c.rewards.filter((r) => r.rewardId !== rewardId)
          };
        }
        return c;
      })
    );
  };

  // Save edited or new reward
  const handleSaveEditingReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;

    const { reward, boxId, isNew } = editingReward;
    if (!reward.name?.trim()) {
      alert('يرجى كتابة اسم الجائزة');
      return;
    }

    const newRewardObj: MysteryBoxReward = {
      rewardId: reward.rewardId || `r_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: reward.name.trim(),
      icon: reward.icon || '🎁',
      approximateValue: Number(reward.approximateValue || 10),
      probability: Number(reward.probability || 10),
      stock: Number(reward.stock ?? 20),
      isActive: reward.isActive ?? true,
      timesWon: reward.timesWon || 0
    };

    setConfigs((prev) =>
      prev.map((c) => {
        if (c.boxId === boxId) {
          let updatedRewards: MysteryBoxReward[];
          if (isNew) {
            updatedRewards = [...c.rewards, newRewardObj];
          } else {
            updatedRewards = c.rewards.map((r) =>
              r.rewardId === newRewardObj.rewardId ? newRewardObj : r
            );
          }
          return { ...c, rewards: updatedRewards };
        }
        return c;
      })
    );

    setEditingReward(null);
  };

  // Filtered redemptions history
  const filteredRedemptions = useMemo(() => {
    const list = dataStore.mysteryBoxRedemptions || [];
    return list.filter((r) => {
      const matchSearch =
        !historySearch ||
        r.userName.toLowerCase().includes(historySearch.toLowerCase()) ||
        r.rewardName.toLowerCase().includes(historySearch.toLowerCase()) ||
        r.voucherCode.toLowerCase().includes(historySearch.toLowerCase());

      const matchType =
        historyTypeFilter === 'all' || r.boxType === historyTypeFilter;

      return matchSearch && matchType;
    });
  }, [dataStore.mysteryBoxRedemptions, historySearch, historyTypeFilter]);

  // Chart data for distribution
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of dataStore.mysteryBoxRedemptions || []) {
      map.set(r.rewardName, (map.get(r.rewardName) || 0) + 1);
    }
    return Array.from(map.entries()).map(([name, count]) => ({
      name,
      count
    }));
  }, [dataStore.mysteryBoxRedemptions]);

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#6366f1'];

  return (
    <div id="canteen-mystery-boxes-container" className="space-y-6 text-right" dir="rtl">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-2">
            <Gift className="w-4 h-4" />
            <span>نظام المفاجآت والجوائز للكانتين</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">إدارة صناديق المفاجآت (Mystery Boxes) 🎁</h2>
          <p className="mt-1 text-sm text-white/90 max-w-2xl">
            تحكم كامل في صندوق النقاط وصندوق عيد الميلاد، ضبط احتمالات الفوز، مراقبة المخزون الفعلي، وإحصائيات التكلفة والاستهلاك.
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md p-3 rounded-2xl text-xs sm:text-sm">
          <div className="text-center px-2">
            <span className="block opacity-80">تم فتحها</span>
            <span className="font-bold text-lg">{stats.totalBoxesOpened}</span>
          </div>
          <div className="w-px h-8 bg-white/30" />
          <div className="text-center px-2">
            <span className="block opacity-80">نقاط مستهلكة</span>
            <span className="font-bold text-lg">{stats.totalPointsSpent}</span>
          </div>
          <div className="w-px h-8 bg-white/30" />
          <div className="text-center px-2">
            <span className="block opacity-80">أعياد ميلاد</span>
            <span className="font-bold text-lg">{stats.totalBirthdayBoxesGiven}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 w-fit">
        <button
          id="tab-box-management"
          onClick={() => setActiveTab('boxes')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'boxes'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>إدارة الصناديق والجوائز</span>
        </button>

        <button
          id="tab-box-stats"
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'stats'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>الإحصائيات والتحليلات</span>
        </button>

        <button
          id="tab-box-history"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل الاستبدالات ({dataStore.mysteryBoxRedemptions?.length || 0})</span>
        </button>
      </div>

      {/* Notifications */}
      {saveMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-bold flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>{saveMessage}</span>
        </motion.div>
      )}

      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm font-bold flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </motion.div>
      )}

      {/* TAB 1: BOXES MANAGEMENT */}
      {activeTab === 'boxes' && activeConfig && (
        <div className="space-y-6">
          {/* Box Type Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              id="subtab-points-box"
              onClick={() => setSelectedBoxTab('points_box')}
              className={`p-5 rounded-3xl border text-right transition-all flex items-center justify-between ${
                selectedBoxTab === 'points_box'
                  ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/20 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-2xl">
                  🎁
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    صندوق النقاط (Points Box)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    يستبدله الشاب بنقاطه • التكلفة الافتراضية 200 نقطة
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                configs.find(c => c.boxId === 'points_box')?.isActive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {configs.find(c => c.boxId === 'points_box')?.isActive ? 'مفعل' : 'معطل'}
              </span>
            </button>

            <button
              id="subtab-birthday-box"
              onClick={() => setSelectedBoxTab('birthday_box')}
              className={`p-5 rounded-3xl border text-right transition-all flex items-center justify-between ${
                selectedBoxTab === 'birthday_box'
                  ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-400 dark:border-rose-600 ring-2 ring-rose-400/20 shadow-md'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-2xl">
                  🎂
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    صندوق عيد الميلاد (Birthday Box)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    هدية مجانية مرة واحدة سنوياً للشاب في عيد ميلاده
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                configs.find(c => c.boxId === 'birthday_box')?.isActive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {configs.find(c => c.boxId === 'birthday_box')?.isActive ? 'مفعل' : 'معطل'}
              </span>
            </button>
          </div>

          {/* Box Configuration Controls Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>إعدادات {activeConfig.title}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  قم بضبط معايير الصندوق والجوائز المتاحة بداخله
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  id="btn-save-box-settings"
                  onClick={handleSaveBoxConfig}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ التعديلات</span>
                </button>

                <button
                  id="btn-add-reward-to-box"
                  onClick={() =>
                    setEditingReward({
                      boxId: selectedBoxTab,
                      isNew: true,
                      reward: {
                        name: '',
                        icon: '🍪',
                        approximateValue: 15,
                        probability: 10,
                        stock: 25,
                        isActive: true
                      }
                    })
                  }
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 font-bold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة جائزة جديدة</span>
                </button>
              </div>
            </div>

            {/* Config Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Active Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">حالة الصندوق</span>
                  <span className="text-xs text-slate-500">إتاحة الفتح للمخدومين</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeConfig.isActive}
                    onChange={(e) => handleUpdateBoxProperty('isActive', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {/* Points Cost (Points Box only) */}
              {selectedBoxTab === 'points_box' ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تكلفة الاستبدال بالنقاط:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={activeConfig.costInPoints}
                      onChange={(e) =>
                        handleUpdateBoxProperty('costInPoints', Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-sm"
                    />
                    <span className="text-xs text-slate-500 font-bold shrink-0">نقطة</span>
                  </div>
                </div>
              ) : (
                /* Birthday Box Availability Window */
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    فترة الإتاحة بعد عيد الميلاد:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={activeConfig.birthdayAvailabilityDays || 7}
                      onChange={(e) =>
                        handleUpdateBoxProperty('birthdayAvailabilityDays', Math.max(1, parseInt(e.target.value, 10) || 7))
                      }
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-sm"
                    />
                    <span className="text-xs text-slate-500 font-bold shrink-0">أيام</span>
                  </div>
                </div>
              )}

              {/* Total Probabilities Balance Pill */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                validation.isValid
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}>
                <div>
                  <span className="block text-xs font-bold">مجموع احتمالات الجوائز النشطة:</span>
                  <span className="text-xs opacity-90">
                    {validation.isValid ? 'النسب متزنة (100% تماماً) ✓' : 'غير متزنة! يجب أن تساوي 100%'}
                  </span>
                </div>
                <span className="text-xl font-black">{validation.totalActiveProb}%</span>
              </div>
            </div>

            {/* Stock Redistribution Informational Notice */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
              <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong className="font-bold">نظام إعادة توزيع الاحتمالات الذكي (Stock Auto Re-weighting):</strong>{' '}
                إذا وصل مخزون أي جائزة إلى 0، يستبعدها النظام تلقائياً على السيرفر ويعيد توزيع نسبتها على باقي الجوائز المتوفرة تناسبياً. يمكنك رؤية "الاحتمال الفعلي الحالي" في الجدول أدناه.
              </div>
            </div>

            {/* Rewards Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold">
                    <th className="py-3 px-3">الجائزة</th>
                    <th className="py-3 px-3">القيمة التقديرية</th>
                    <th className="py-3 px-3">نسبة الاحتمال الأصلية</th>
                    <th className="py-3 px-3">الاحتمال الفعلي (Stock)</th>
                    <th className="py-3 px-3">المخزون المتبقي</th>
                    <th className="py-3 px-3">مرات الفوز</th>
                    <th className="py-3 px-3">الحالة</th>
                    <th className="py-3 px-3 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeConfig.rewards.map((reward) => {
                    const redist = redistributedChances.find((c) => c.reward.rewardId === reward.rewardId);
                    const isOutOfStock = reward.stock <= 0;

                    return (
                      <tr
                        key={reward.rewardId}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          !reward.isActive ? 'opacity-50' : ''
                        }`}
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
                              {reward.icon}
                            </span>
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-100 block">
                                {reward.name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                #{reward.rewardId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {reward.approximateValue} ج.م
                        </td>

                        <td className="py-3.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                          {reward.probability}%
                        </td>

                        <td className="py-3.5 px-3">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                              مستبعد (0 مخزون)
                            </span>
                          ) : (
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                              {redist?.effectiveProbability ?? reward.probability}%
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                              reward.stock > 15
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : reward.stock > 0
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-black'
                            }`}
                          >
                            {reward.stock} قطعة
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400 font-medium">
                          {reward.timesWon || 0} مرة
                        </td>

                        <td className="py-3.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleToggleRewardActive(reward.rewardId)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                              reward.isActive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-300'
                            }`}
                          >
                            {reward.isActive ? 'مفعلة' : 'معطلة'}
                          </button>
                        </td>

                        <td className="py-3.5 px-3 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setEditingReward({
                                  boxId: selectedBoxTab,
                                  isNew: false,
                                  reward: { ...reward }
                                })
                              }
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="تعديل الجائزة"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteReward(reward.rewardId)}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="حذف الجائزة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATISTICS DASHBOARD */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Boxes */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block">إجمالي الصناديق المفتوحة</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {stats.totalBoxesOpened}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  ({stats.totalPointsBoxesOpened} نقاط + {stats.totalBirthdayBoxesGiven} ميلاد)
                </span>
              </div>
            </div>

            {/* Total Points Spent */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center text-2xl shrink-0">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block">إجمالي النقاط المستهلكة</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {stats.totalPointsSpent}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">نقطة تم استبدالها بالصناديق</span>
              </div>
            </div>

            {/* Estimated Total Cost */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block">التكلفة التقديرية الموزعة</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {stats.estimatedTotalCost} ج.م
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  متوسط {stats.estimatedAverageCost} ج.م / صندوق
                </span>
              </div>
            </div>

            {/* Unique Users */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-2xl shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold block">الشباب الذين شاركوا</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                  {stats.uniqueUsersCount}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">مخدوم فتح صندوقاً واحداً أو أكثر</span>
              </div>
            </div>
          </div>

          {/* Highlights Cards (Most vs Least Common, Stock Remaining) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-1">
                الجائزة الأكثر فوزاً 🏆
              </span>
              {stats.mostCommonReward ? (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl">{stats.mostCommonReward.icon}</span>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {stats.mostCommonReward.name}
                    </h5>
                    <span className="text-xs text-slate-500">تم الحصول عليها {stats.mostCommonReward.count} مرة</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-2">لا توجد استبدالات بعد.</p>
              )}
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                الجائزة الأقل فوزاً 🎯
              </span>
              {stats.leastCommonReward ? (
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-3xl">{stats.leastCommonReward.icon}</span>
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {stats.leastCommonReward.name}
                    </h5>
                    <span className="text-xs text-slate-500">تم الحصول عليها {stats.leastCommonReward.count} مرة</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-2">لا توجد استبدالات بعد.</p>
              )}
            </div>

            <div className="p-5 rounded-3xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300 block mb-1">
                إجمالي المخزون المتبقي 📦
              </span>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl">📦</span>
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-100 text-xl">
                    {stats.totalStockRemaining} قطعة
                  </h5>
                  <span className="text-xs text-slate-500">جاهزة للتوزيع في الكانتين</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Distribution Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">
              توزيع الجوائز التي فاز بها الشباب فعلياً 📊
            </h4>

            {chartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} interval={0} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        border: 'none',
                        fontSize: '12px',
                        direction: 'rtl'
                      }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">
                لم يتم تسجيل استبدالات حتى الآن لعرض الرسم البياني.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REDEMPTIONS HISTORY */}
      {activeTab === 'history' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                سجل استبدالات صناديق المفاجآت (Audit Trail)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                سجل تاريخي موثق ومحمى لكل صندوق تم فتحه مع تفاصيل القسيمة والجائزة
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث باسم المخدوم أو الجائزة..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pr-9 pl-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 w-52"
                />
              </div>

              <select
                value={historyTypeFilter}
                onChange={(e: any) => setHistoryTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 font-bold"
              >
                <option value="all">كل الأنواع</option>
                <option value="points">صناديق النقاط فقط</option>
                <option value="birthday">صناديق أعياد الميلاد فقط</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-bold">
                  <th className="py-3 px-3">المخدوم</th>
                  <th className="py-3 px-3">نوع الصندوق</th>
                  <th className="py-3 px-3">الجائزة التي حصل عليها</th>
                  <th className="py-3 px-3">التكلفة</th>
                  <th className="py-3 px-3">كود القسيمة</th>
                  <th className="py-3 px-3">التاريخ والوقت</th>
                  <th className="py-3 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRedemptions.length > 0 ? (
                  filteredRedemptions.map((item) => (
                    <tr key={item.redemptionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100">
                        {item.userName}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          item.boxType === 'birthday'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {item.boxType === 'birthday' ? '🎂 عيد ميلاد' : '🎁 نقاط'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{item.rewardIcon}</span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">{item.rewardName}</span>
                          <span className="text-xs text-slate-400">({item.rewardValue} ج.م)</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                        {item.costInPoints > 0 ? `${item.costInPoints} نقطة` : 'مجاناً ❤️'}
                      </td>

                      <td className="py-3 px-3 font-mono text-xs text-amber-600 dark:text-amber-400 font-bold">
                        {item.voucherCode}
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-500">
                        {new Date(item.timestamp).toLocaleString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          تم بنجاح ✓
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                      لا توجد سجلات استبدال مطابقة للبحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REWARD ADD/EDIT MODAL */}
      {editingReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                {editingReward.isNew ? 'إضافة جائزة جديدة للصندوق' : 'تعديل بيانات الجائزة'}
              </h3>
              <button
                onClick={() => setEditingReward(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditingReward} className="space-y-4">
              {/* Icon selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  أيقونة أو إيموجي الجائزة:
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setEditingReward((prev) =>
                          prev ? { ...prev, reward: { ...prev.reward, icon: emoji } } : null
                        )
                      }
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-all ${
                        editingReward.reward.icon === emoji
                          ? 'bg-amber-500 text-white ring-2 ring-amber-400 scale-110'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={editingReward.reward.icon || '🎁'}
                  onChange={(e) =>
                    setEditingReward((prev) =>
                      prev ? { ...prev, reward: { ...prev.reward, icon: e.target.value } } : null
                    )
                  }
                  placeholder="أو اكتب إيموجي مخصص..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الجائزة:
                </label>
                <input
                  type="text"
                  required
                  value={editingReward.reward.name || ''}
                  onChange={(e) =>
                    setEditingReward((prev) =>
                      prev ? { ...prev, reward: { ...prev.reward, name: e.target.value } } : null
                    )
                  }
                  placeholder="مثال: شيبسي مقرمش عائلي"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Approximate Value */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    القيمة التقديرية (ج.م):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingReward.reward.approximateValue ?? 15}
                    onChange={(e) =>
                      setEditingReward((prev) =>
                        prev
                          ? { ...prev, reward: { ...prev.reward, approximateValue: Number(e.target.value) } }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                  />
                </div>

                {/* Probability */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نسبة الفوز (%):
                  </label>
                  <input
                    type="number"
                    min={0.1}
                    max={100}
                    step={0.1}
                    value={editingReward.reward.probability ?? 10}
                    onChange={(e) =>
                      setEditingReward((prev) =>
                        prev
                          ? { ...prev, reward: { ...prev.reward, probability: Number(e.target.value) } }
                          : null
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المخزون (القطع):
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingReward.reward.stock ?? 20}
                    onChange={(e) =>
                      setEditingReward((prev) =>
                        prev ? { ...prev, reward: { ...prev.reward, stock: Number(e.target.value) } } : null
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  تفعيل هذه الجائزة في السحب
                </span>
                <input
                  type="checkbox"
                  checked={editingReward.reward.isActive ?? true}
                  onChange={(e) =>
                    setEditingReward((prev) =>
                      prev ? { ...prev, reward: { ...prev.reward, isActive: e.target.checked } } : null
                    )
                  }
                  className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingReward(null)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm shadow-md transition-all"
                >
                  حفظ الجائزة
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

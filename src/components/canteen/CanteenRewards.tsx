import React, { useState, useEffect } from 'react';
import { dataStore } from '../../services/dataStore';
import { RewardItem } from '../../types';
import {
  Coffee,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';

export const CanteenRewards: React.FC<{ setActiveView: (view: string) => void }> = ({ setActiveView }) => {
  const [rewards, setRewards] = useState<RewardItem[]>(dataStore.rewards);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<RewardItem | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredPoints, setRequiredPoints] = useState(100);
  const [availableQuantity, setAvailableQuantity] = useState(10);
  const [category, setCategory] = useState<'beverage' | 'snack' | 'spiritual' | 'voucher' | 'canteen'>('canteen');
  const [status, setStatus] = useState<'active' | 'inactive' | 'archived'>('active');

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setRewards([...dataStore.rewards]);
    });
    return unsub;
  }, []);

  const openCreateModal = () => {
    setEditingReward(null);
    setTitle('');
    setDescription('');
    setRequiredPoints(100);
    setAvailableQuantity(20);
    setCategory('canteen');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (reward: RewardItem) => {
    setEditingReward(reward);
    setTitle(reward.title);
    setDescription(reward.description || '');
    setRequiredPoints(reward.requiredPoints);
    setAvailableQuantity(reward.availableQuantity);
    setCategory((reward.category as any) || 'canteen');
    setStatus(reward.status || 'active');
    setIsModalOpen(true);
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingReward) {
      const updated: RewardItem = {
        ...editingReward,
        title: title.trim(),
        description: description.trim(),
        requiredPoints: Number(requiredPoints) || 50,
        availableQuantity: Number(availableQuantity) || 0,
        category,
        status,
        updatedAt: new Date().toISOString(),
      };
      await dataStore.updateReward(updated);
    } else {
      const newReward: RewardItem = {
        rewardId: `rwd_${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        requiredPoints: Number(requiredPoints) || 50,
        availableQuantity: Number(availableQuantity) || 0,
        category,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await dataStore.createReward(newReward);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (rewardId: string) => {
    if (window.confirm('هل تريد بالتأكيد حذف هذا الصنف من الكانتين؟')) {
      await dataStore.deleteReward(rewardId);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Coffee className="w-6 h-6 text-amber-600" />
            <span>منتجات ومخزون الكانتين</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة المشروبات والوجبات وتحديث الكميات المتوفرة وتكلفة النقاط
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('canteen-dashboard')}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            العودة لمكتب الصرف
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((reward) => {
          const isOutOfStock = reward.availableQuantity <= 0;
          const isLowStock = reward.availableQuantity <= 5 && !isOutOfStock;

          return (
            <div
              key={reward.rewardId}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : isLowStock
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {isOutOfStock ? 'نفد المخزون' : isLowStock ? 'كمية محدودة' : 'متوفر للطلب'}
                  </span>
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg">
                    {reward.requiredPoints} نقطة
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                  {reward.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {reward.description || 'صنف مقدم من كانتين الاجتماع.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-slate-400">الكمية بالمخزن: </span>
                  <span className={`font-bold ${isOutOfStock ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                    {reward.availableQuantity} قطعة
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(reward)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="تعديل المنتج"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(reward.rewardId)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    title="حذف المنتج"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Reward Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-600" />
                <span>{editingReward ? 'تعديل صنف الكانتين' : 'إضافة صنف جديد للكانتين'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الصنف / الهدية *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مشروب قهوة مثلجة، ساندوتش، شيكولاتة"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الوصف</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر للمنتج أو الحجم"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">النقاط المطلوبة *</label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={requiredPoints}
                    onChange={(e) => setRequiredPoints(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الكمية بالمخزن *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={availableQuantity}
                    onChange={(e) => setAvailableQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">التصنيف</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="canteen">كانتين عام</option>
                    <option value="beverage">مشروبات</option>
                    <option value="snack">وجبات وسناكس</option>
                    <option value="spiritual">كتب وهدايا روحية</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">حالة الصنف</label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="active">نشط ومتاح</option>
                    <option value="inactive">موقف مؤقتاً</option>
                    <option value="archived">مؤرشف</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ المنتج</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
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

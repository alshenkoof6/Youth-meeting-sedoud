import React, { useState } from 'react';
import { dataStore } from '../../services/dataStore';
import { Gift, Star, CheckCircle2, Ticket, Search, ShieldCheck } from 'lucide-react';
import { RewardItem, Coupon } from '../../types';

export const AdminRewards: React.FC = () => {
  const [rewards, setRewards] = useState<RewardItem[]>(dataStore.rewards);
  const [coupons, setCoupons] = useState<Coupon[]>(dataStore.coupons);
  const [verifyCode, setVerifyCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    msg: string;
    isSuccess: boolean;
    coupon?: Coupon;
  } | null>(null);

  // New reward item form
  const [newTitle, setNewTitle] = useState('');
  const [newPoints, setNewPoints] = useState(150);
  const [newQty, setNewQty] = useState(20);
  const [newDesc, setNewDesc] = useState('');

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

    coupon.status = 'redeemed';
    coupon.redeemedAt = new Date().toISOString();
    setCoupons([...dataStore.coupons]);
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
      requiredPoints: Number(newPoints),
      availableQuantity: Number(newQty),
      status: 'active',
      category: 'spiritual',
      createdAt: new Date().toISOString(),
    };

    await dataStore.createReward(item);
    setRewards([...dataStore.rewards]);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div id="admin-rewards-view" className="space-y-6 pb-20 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Gift className="w-6 h-6 text-indigo-600" />
          نظام النقاط والمكافآت والكوبونات
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          إدارة كتالوج الهدايا التشجيعية، وصرف كوبونات الشباب بالباركود أو الكود الرمزي
        </p>
      </div>

      {/* Instant Coupon Verification Tool */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/20 inline-block mb-1">
            صندوق استلام الكوبونات (المكتبة / الكانتين)
          </span>
          <h2 className="text-xl font-bold">التحقق الفوري وصرف كوبون شاب</h2>
          <p className="text-xs text-indigo-200 mt-0.5">
            أدخل الكود المعروض على هاتف الشاب لتسجيل استلام الهدية ومنع التكرار
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
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition shadow-md"
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
          <h3 className="font-bold text-base text-slate-900 dark:text-white">إضافة مكافأة جديدة</h3>

          <form onSubmit={handleCreateReward} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">اسم المكافأة</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثال: نوت بوك روحي فاخر"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">النقاط المطلوبة</label>
                <input
                  type="number"
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">الكمية المتاحة</label>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">الوصف</label>
              <textarea
                rows={2}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow"
            >
              إضافة للكتالوج
            </button>
          </form>
        </div>

        {/* Existing Rewards */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            المكافآت الحالية بالكتالوج ({rewards.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rewards.map((reward, idx) => (
              <div
                key={reward.rewardId || `rew_${idx}`}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-indigo-600 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {reward.requiredPoints} نقطة
                    </span>
                    <span className="text-slate-400 text-[11px]">متبقي {reward.availableQuantity}</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{reward.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{reward.description}</p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  كود الهدية: {reward.rewardId}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

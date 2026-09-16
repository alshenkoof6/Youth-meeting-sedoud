import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { VoucherService } from '../../services/voucherService';
import { 
  Award, 
  Star, 
  Gift, 
  Ticket, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Copy,
  Sparkles,
  QrCode,
  Coffee
} from 'lucide-react';
import { RewardItem, Voucher } from '../../types';
import { VoucherQRModal } from './VoucherQRModal';

export const YouthRewards: React.FC = () => {
  const { currentUser, updateCurrentUserProfile } = useAuth();
  const [rewards, setRewards] = useState<RewardItem[]>(dataStore.rewards);
  const [vouchers, setVouchers] = useState<Voucher[]>(() => 
    dataStore.vouchers.filter((v) => v.userId === currentUser?.userId)
  );
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ msg: string; isSuccess: boolean; code?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setRewards([...dataStore.rewards]);
      setVouchers(dataStore.vouchers.filter((v) => v.userId === currentUser?.userId));
    });
    return unsub;
  }, [currentUser]);

  const handleRedeem = async (rewardId: string) => {
    if (!currentUser) return;

    setIsProcessing(true);
    const res = await VoucherService.redeemReward(rewardId, currentUser);
    setIsProcessing(false);

    if (res.success && res.voucher) {
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}

      setSelectedVoucher(res.voucher);
      setIsQRModalOpen(true);

      setRedeemResult({
        msg: res.message,
        isSuccess: true,
        code: res.voucher.voucherCode,
      });
    } else {
      setRedeemResult({
        msg: res.message,
        isSuccess: false,
      });
    }

    setTimeout(() => {
      setRedeemResult(null);
    }, 6000);
  };

  return (
    <div id="youth-rewards-view" className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4">
      
      {/* Header & Balance Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-indigo-100 inline-block mb-2">
            رصيدك من نقاط التشجيع
          </span>
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
            <span className="text-3xl sm:text-4xl font-black">{currentUser?.totalPoints || 0}</span>
            <span className="text-sm text-indigo-200">نقطة متاحة</span>
          </div>
          <p className="text-xs text-indigo-200 mt-2">
            تكسب +10 نقاط عند كل حضور، ونقاط إضافية في الأيام الروحية والمسابقات!
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs space-y-1.5 shrink-0">
          <span className="font-bold text-white block">كيف تجمع نقاطاً أكثر؟</span>
          <div className="flex items-center gap-1.5 text-indigo-100">
            <span>✓ حضور الاجتماع:</span>
            <strong className="text-amber-300">+10 نقاط</strong>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-100">
            <span>✓ اليوم الروحي:</span>
            <strong className="text-amber-300">+20 نقطة</strong>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-100">
            <span>✓ المؤتمر السنوي:</span>
            <strong className="text-amber-300">+30 نقطة</strong>
          </div>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {redeemResult && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm ${
          redeemResult.isSuccess
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{redeemResult.msg}</span>
          </div>
          {redeemResult.code && (
            <span className="font-mono bg-white px-2 py-1 rounded border border-emerald-300 font-black">
              {redeemResult.code}
            </span>
          )}
        </div>
      )}

      {/* Rewards Catalog */}
      <div className="space-y-3">
        <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Gift className="w-5 h-5 text-indigo-600" />
          كتالوج الهدايا والكوبونات
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rewards.map((reward) => {
            const canAfford = (currentUser?.totalPoints || 0) >= reward.requiredPoints;

            return (
              <div
                key={reward.rewardId}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {reward.requiredPoints} نقطة
                    </span>
                    <span className="text-[11px] text-slate-400">
                      متبقي {reward.availableQuantity} قطعة
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {reward.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {reward.description}
                  </p>
                </div>

                <button
                  onClick={() => handleRedeem(reward.rewardId)}
                  disabled={!canAfford || reward.availableQuantity <= 0}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                    canAfford && reward.availableQuantity > 0
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {reward.availableQuantity <= 0
                    ? 'نفدت الكمية مؤقتاً'
                    : canAfford
                    ? 'استبدال الآن'
                    : `تحتاج ${reward.requiredPoints - (currentUser?.totalPoints || 0)} نقطة إضافية`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Vouchers Section */}
      {vouchers.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-600" />
              <span>قسائمي وهدايا الكانتين ({vouchers.length})</span>
            </h2>
            <span className="text-xs text-slate-400">انقر على القسيمة لعرض الـ QR</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vouchers.map((voucher) => {
              const isAvailable = voucher.status === 'available';
              const isExpired = new Date(voucher.expiresAt) < new Date();

              return (
                <div
                  key={voucher.voucherId}
                  onClick={() => {
                    setSelectedVoucher(voucher);
                    setIsQRModalOpen(true);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 rounded-2xl p-4 space-y-3 relative cursor-pointer shadow-sm hover:shadow-md transition group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs text-slate-400 block mb-0.5">صنف الكانتين:</span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Coffee className="w-4 h-4 text-amber-600" />
                        {voucher.rewardNameSnapshot}
                      </h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isAvailable && !isExpired
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : voucher.status === 'redeemed'
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {isAvailable && !isExpired
                        ? 'جاهزة للصرف ✓'
                        : voucher.status === 'redeemed'
                        ? 'تم الصرف'
                        : 'منتهية'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-mono font-black tracking-widest text-slate-900 dark:text-white text-xs">
                      {voucher.voucherCode}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVoucher(voucher);
                        setIsQRModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>عرض الـ QR</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>التكلفة: {voucher.pointsCost} نقطة</span>
                    <span>تنتهي: {new Date(voucher.expiresAt).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Voucher QR Modal */}
      <VoucherQRModal
        isOpen={isQRModalOpen}
        voucher={selectedVoucher}
        onClose={() => setIsQRModalOpen(false)}
      />

    </div>
  );
};

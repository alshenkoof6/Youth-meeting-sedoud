import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { dataStore } from '../../services/dataStore';
import { VoucherService } from '../../services/voucherService';
import { 
  Star, 
  Gift, 
  Ticket, 
  CheckCircle2, 
  QrCode,
  Coffee,
  Sparkles,
  History,
  Cake,
  ArrowRight
} from 'lucide-react';
import { RewardItem, Voucher, MysteryBoxConfig, MysteryBoxReward, MysteryBoxRedemptionRecord } from '../../types';
import { VoucherQRModal } from './VoucherQRModal';
import { MysteryBoxModal } from './MysteryBoxModal';
import { YouthBirthdayMysteryBanner } from './YouthBirthdayMysteryBanner';

export const YouthRewards: React.FC = () => {
  const { currentUser } = useAuth();
  const [rewards, setRewards] = useState<RewardItem[]>(dataStore.rewards);
  const [vouchers, setVouchers] = useState<Voucher[]>(() => 
    dataStore.vouchers.filter((v) => v.userId === currentUser?.userId)
  );
  const [redemptions, setRedemptions] = useState<MysteryBoxRedemptionRecord[]>(() =>
    dataStore.mysteryBoxRedemptions.filter((r) => r.userId === currentUser?.userId)
  );
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{ msg: string; isSuccess: boolean; code?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mystery Box Modal State
  const [isMysteryBoxOpen, setIsMysteryBoxOpen] = useState(false);

  // Tab switcher
  const [activeTab, setActiveTab] = useState<'catalog' | 'vouchers' | 'history'>('catalog');

  const pointsBoxConfig = dataStore.mysteryBoxConfigs.find((b) => b.boxId === 'points_box');

  useEffect(() => {
    const unsub = dataStore.subscribe(() => {
      setRewards([...dataStore.rewards]);
      setVouchers(dataStore.vouchers.filter((v) => v.userId === currentUser?.userId));
      setRedemptions(dataStore.mysteryBoxRedemptions.filter((r) => r.userId === currentUser?.userId));
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

  const handleMysteryBoxSuccess = (voucher: Voucher) => {
    setSelectedVoucher(voucher);
    setIsQRModalOpen(true);
  };

  const canAffordPointsBox = (currentUser?.totalPoints || 0) >= (pointsBoxConfig?.costInPoints || 200);

  return (
    <div id="youth-rewards-view" className="space-y-6 pb-24 max-w-4xl mx-auto px-4 pt-4 text-right" dir="rtl">
      {/* Birthday Mystery Box Celebration Banner (Auto appears when eligible) */}
      {currentUser && (
        <YouthBirthdayMysteryBanner
          currentUser={currentUser}
          onVoucherCreated={(v) => {
            setSelectedVoucher(v);
            setIsQRModalOpen(true);
          }}
        />
      )}

      {/* Header & Balance Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-900 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-indigo-100 inline-block mb-2">
            رصيدك من نقاط التشجيع
          </span>
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
            <span className="text-3xl sm:text-4xl font-black">{currentUser?.totalPoints || 0}</span>
            <span className="text-sm text-indigo-200 font-bold">نقطة متاحة</span>
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

      {/* FEATURED: POINTS MYSTERY BOX HERO CARD */}
      {pointsBoxConfig && pointsBoxConfig.isActive && (
        <div
          id="featured-points-mystery-box"
          className="relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white shadow-xl shadow-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-4xl shadow-inner shrink-0">
              🎁
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>جرّب حظك اليوم • سحب فوري عشوائي</span>
              </div>
              <h3 className="text-2xl font-black">صندوق المفاجآت (Mystery Box) 🎁</h3>
              <p className="text-xs sm:text-sm text-white/90 max-w-lg leading-relaxed">
                استبدل {pointsBoxConfig.costInPoints} نقطة واحصل على هدية فورية مفاجئة من الكانتين!
              </p>

              {/* Sample Prizes Preview */}
              <div className="pt-2 flex items-center gap-2 text-xs text-white/90">
                <span className="opacity-80">بعض الجوائز المتاحة:</span>
                <div className="flex items-center gap-1.5 font-bold">
                  {pointsBoxConfig.rewards?.slice(0, 5).map((r) => (
                    <span
                      key={r.rewardId}
                      className="px-2 py-0.5 rounded-lg bg-black/20 text-sm backdrop-blur-sm"
                      title={r.name}
                    >
                      {r.icon}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full md:w-auto shrink-0 flex flex-col items-end gap-2">
            <button
              id="btn-open-points-mystery-box-hero"
              onClick={() => setIsMysteryBoxOpen(true)}
              className={`w-full md:w-auto px-7 py-4 rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2.5 ${
                canAffordPointsBox
                  ? 'bg-white text-amber-700 hover:bg-white/90 active:scale-95 shadow-amber-900/20'
                  : 'bg-white/40 text-amber-950 cursor-pointer hover:bg-white/50'
              }`}
            >
              <Gift className="w-5 h-5 text-amber-600" />
              <span>REDEEM / افتح الصندوق ({pointsBoxConfig.costInPoints} نقطة)</span>
            </button>
            <span className="text-xs text-white/80 font-medium">
              لديك {currentUser?.totalPoints || 0} نقطة • التكلفة: {pointsBoxConfig.costInPoints} نقطة
            </span>
          </div>
        </div>
      )}

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

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 w-fit">
        <button
          id="tab-rewards-catalog"
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'catalog'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>كتالوج الهدايا</span>
        </button>

        <button
          id="tab-rewards-vouchers"
          onClick={() => setActiveTab('vouchers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'vouchers'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>قسائمي الحالية ({vouchers.length})</span>
        </button>

        <button
          id="tab-rewards-history"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>سجل الاستبدالات ({redemptions.length})</span>
        </button>
      </div>

      {/* TAB 1: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Gift className="w-5 h-5 text-indigo-600" />
            <span>منتجات وهدايا الكانتين المباشرة</span>
          </h3>

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

                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      {reward.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {reward.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward.rewardId)}
                    disabled={!canAfford || reward.availableQuantity <= 0 || isProcessing}
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
      )}

      {/* TAB 2: ACTIVE VOUCHERS */}
      {activeTab === 'vouchers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-5 h-5 text-amber-600" />
              <span>قسائم الاستلام الإلكترونية ({vouchers.length})</span>
            </h3>
            <span className="text-xs text-slate-400">انقر على القسيمة لعرض الـ QR</span>
          </div>

          {vouchers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vouchers.map((voucher) => {
                const isAvailable = voucher.status === 'available';
                const isExpired = new Date(voucher.expiresAt) < new Date();
                const isMysteryBoxVoucher = voucher.source === 'points_mystery_box' || voucher.source === 'birthday_mystery_box';

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
                        <div className="flex items-center gap-1.5 mb-1">
                          {isMysteryBoxVoucher ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              {voucher.boxType === 'birthday' ? '🎂 هدية عيد ميلاد' : '🎁 صندوق مفاجآت'}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">صنف الكانتين:</span>
                          )}
                        </div>
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
                      <span>{voucher.pointsCost > 0 ? `التكلفة: ${voucher.pointsCost} نقطة` : 'هدية مجانية ❤️'}</span>
                      <span>تنتهي: {new Date(voucher.expiresAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
              ليس لديك أي قسائم حالياً. افتح صندوق المفاجآت أو استبدل نقاطك من الكتالوج!
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REDEMPTIONS HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>سجل استبدالاتك وهداياك السابقة</span>
          </h3>

          {redemptions.length > 0 ? (
            <div className="space-y-3">
              {redemptions.map((item) => (
                <div
                  key={item.redemptionId}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-2xl shrink-0">
                      {item.rewardIcon || '🎁'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                          {item.boxType === 'birthday' ? 'صندوق عيد الميلاد 🎂' : 'صندوق المفاجآت 🎁'}
                        </span>
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                          حصلت على: {item.rewardName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{item.costInPoints > 0 ? `${item.costInPoints} نقطة` : 'هدية مجانية ❤️'}</span>
                        <span>•</span>
                        <span>
                          {new Date(item.timestamp).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">كود: {item.voucherCode}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const v = vouchers.find((vch) => vch.voucherCode === item.voucherCode);
                      if (v) {
                        setSelectedVoucher(v);
                        setIsQRModalOpen(true);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    عرض القسيمة
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
              لم تسجل أي استبدالات حتى الآن.
            </div>
          )}
        </div>
      )}

      {/* Points Mystery Box Modal */}
      {pointsBoxConfig && currentUser && (
        <MysteryBoxModal
          isOpen={isMysteryBoxOpen}
          onClose={() => setIsMysteryBoxOpen(false)}
          config={pointsBoxConfig}
          user={currentUser}
          onSuccess={handleMysteryBoxSuccess}
        />
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
